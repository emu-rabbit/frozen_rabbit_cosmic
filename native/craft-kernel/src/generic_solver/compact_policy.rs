//! Historical combined experiment: certified finish plus sampled paid recovery.
//! Sampled quality estimates are not full-quality guarantees. No mission clock,
//! evaluator weights, real RNG seed, or recipe/equipment identity is read.
use super::*;

#[derive(Clone, Copy, Default)]
struct Outcome {
    completed: bool,
    full: bool,
    utility: f64,
    actions: u32,
}

#[derive(Clone, Copy)]
struct Input<'a> {
    recipe: &'a RecipeProfile,
    crafter: &'a CrafterProfile,
    state: &'a CraftState,
    objective: GenericObjective,
    context: &'a PlannerContext,
    mask: Option<u16>,
}

fn decision(action: CraftActionId) -> GenericDecision {
    GenericDecision {
        route: None,
        action,
        persona: PlannerPersona::LegacyContinuation,
        option: match action_definition(action).category {
            ActionCategory::Progress => PlannerOption::ProgressWindow,
            ActionCategory::Quality => PlannerOption::QualityCycle,
            ActionCategory::Repair => PlannerOption::Recovery,
            _ => PlannerOption::ResourceRecovery,
        },
    }
}

fn evaluate(
    input: Input<'_>,
    root: GenericDecision,
    offset: u32,
    samples: u32,
    scarce: bool,
) -> Vec<Outcome> {
    let mut weights = [0.0; MATERIAL_CONDITION_COUNT];
    for condition in declared_next_conditions(input.mask) {
        weights[condition.index()] = 1.0;
    }
    if scarce && weights[0] > 0.0 {
        weights[0] = (weights.iter().sum::<f64>() - 1.0).max(1.0) * 2.0;
    }
    (offset..offset + samples)
        .map(|sample| {
            let mut random = EpisodeRandomStream::new(
                0x3b72_5f19_u32.wrapping_add(sample.wrapping_mul(0x9e37_79b9)),
            );
            let mut cursor = RandomDrawCursor {
                condition_draws: 0,
                success_draws: 0,
            };
            let mut state = input.state.clone();
            let mut context = input.context.clone();
            let mut next = Some(root);
            let mut outcome = Outcome::default();
            let remaining = context
                .action_limit
                .saturating_sub(context.action_uses)
                .min(80);
            for _ in 0..remaining {
                let Some(action) = next else { break };
                let preview = preview_action(input.recipe, input.crafter, &state, action.action);
                if !preview.legal {
                    break;
                }
                let draw =
                    draw_simulated_action_outcome(&preview, &state, &weights, &mut random, cursor);
                let Ok(after) = apply_observed_outcome(
                    input.recipe,
                    input.crafter,
                    &state,
                    action.action,
                    draw.observed,
                ) else {
                    break;
                };
                advance_planner_context(
                    &mut context,
                    GenericSolverVersion::ArtisanExpertReference,
                    action,
                    &state,
                    &after.next_state,
                );
                state = after.next_state;
                cursor = draw.cursor_after;
                outcome.actions += 1;
                if state.terminal != CraftTerminal::None {
                    break;
                }
                next = crate::artisan_expert::recommend(
                    input.recipe,
                    input.crafter,
                    &state,
                    input.objective,
                    &context,
                    input.mask,
                );
            }
            outcome.completed = state.terminal == CraftTerminal::Completed;
            outcome.full = outcome.completed && state.quality >= input.recipe.quality_max;
            if outcome.completed {
                outcome.utility =
                    crate::ts_migration_port::quality_utility(input.objective, state.quality);
            }
            outcome
        })
        .collect()
}

// Compare only paired completed crafts for action savings: early failures
// never earn speed credit. Marginal completion, full quality and utility must
// all be no worse under EACH planning assumption. This is sampled evidence.
fn improvement(base: &[Outcome], proposal: &[Outcome]) -> Option<f64> {
    let count = |xs: &[Outcome], full: bool| {
        xs.iter()
            .filter(|x| if full { x.full } else { x.completed })
            .count()
    };
    if count(proposal, false) < count(base, false)
        || count(proposal, true) < count(base, true)
        || proposal.iter().map(|x| x.utility).sum::<f64>() + 1e-9
            < base.iter().map(|x| x.utility).sum::<f64>()
    {
        return None;
    }
    let paired: Vec<_> = base
        .iter()
        .zip(proposal)
        .filter(|(a, b)| a.completed && b.completed)
        .collect();
    if paired.is_empty() {
        return None;
    }
    let saved = paired
        .iter()
        .map(|(a, b)| f64::from(a.actions) - f64::from(b.actions))
        .sum::<f64>()
        / paired.len() as f64;
    if saved < 1.0 {
        return None;
    }
    Some(saved + 4.0 * (count(proposal, true) - count(base, true)) as f64)
}

pub(super) fn recommend(
    recipe: &RecipeProfile,
    crafter: &CrafterProfile,
    state: &CraftState,
    objective: GenericObjective,
    risk: RiskPreference,
    context: &PlannerContext,
    mask: Option<u16>,
) -> Option<GenericDecision> {
    let base = opening_recovery::recommend(recipe, crafter, state, objective, risk, context, mask)?;
    if let Some(short) = short_certified_finish::choose(recipe, crafter, state, context, mask, base)
    {
        return Some(short);
    }
    paid_recovery(recipe, crafter, state, objective, context, mask, base, None)
}

pub(super) fn recommend_with_time_budget(
    recipe: &RecipeProfile,
    crafter: &CrafterProfile,
    state: &CraftState,
    objective: GenericObjective,
    risk: RiskPreference,
    context: &PlannerContext,
    mask: Option<u16>,
    budget: CraftTimeBudget,
) -> Option<GenericDecision> {
    let base =
        short_certified_finish::recommend(recipe, crafter, state, objective, risk, context, mask)?;
    paid_recovery(
        recipe,
        crafter,
        state,
        objective,
        context,
        mask,
        base,
        Some(budget.available_actions()),
    )
}

// A completed-route upper quartile estimates time pressure. No completed
// pilot is evidence of uncertainty, not evidence that there is ample time.
fn pilot_exceeds_budget(outcomes: &[Outcome], available_actions: u32) -> bool {
    let mut actions: Vec<_> = outcomes
        .iter()
        .filter(|x| x.completed)
        .map(|x| x.actions)
        .collect();
    if actions.is_empty() {
        return true;
    }
    actions.sort_unstable();
    actions[(actions.len() * 3).div_ceil(4) - 1] > available_actions
}

fn paid_recovery(
    recipe: &RecipeProfile,
    crafter: &CrafterProfile,
    state: &CraftState,
    objective: GenericObjective,
    context: &PlannerContext,
    mask: Option<u16>,
    base: GenericDecision,
    available_actions: Option<u32>,
) -> Option<GenericDecision> {
    // Even the entire remaining action allowance fits: an uncertain pilot
    // must not manufacture time pressure when the caller supplied ample time.
    if available_actions.is_some_and(|budget| budget >= context.action_limit.saturating_sub(context.action_uses)) {
        return Some(base);
    }
    if state.quality >= recipe.quality_max
        || base.option == PlannerOption::CertifiedSuffix
        || declared_next_conditions(mask).next().is_none()
    {
        return Some(base);
    }
    if base.action != CraftActionId::Observe
        || state.durability > 25
        || state.buffs.manipulation > 0
    {
        return Some(base);
    }
    let actions = [
        CraftActionId::Manipulation,
        CraftActionId::MastersMend,
        CraftActionId::ImmaculateMend,
    ];
    let proposals: Vec<_> = actions
        .iter()
        .copied()
        .filter(|&a| a != base.action)
        .filter(|&a| {
            let p = preview_action(recipe, crafter, state, a);
            p.legal
                && p.success_rate == 1.0
                && branch_state(recipe, crafter, state, a, true)
                    .is_some_and(|s| s.terminal != CraftTerminal::Failed)
        })
        .map(decision)
        .collect();
    if proposals.is_empty() {
        return Some(base);
    }
    let input = Input {
        recipe,
        crafter,
        state,
        objective,
        context,
        mask,
    };
    let pilot = [
        evaluate(input, base, 0, 4, false),
        evaluate(input, base, 0, 4, true),
    ];
    if available_actions
        .is_some_and(|budget| pilot.iter().all(|xs| !pilot_exceeds_budget(xs, budget)))
    {
        return Some(base);
    }
    let mut candidates: Vec<_> = proposals
        .into_iter()
        .filter_map(|proposal| {
            let a = improvement(&pilot[0], &evaluate(input, proposal, 0, 4, false))?;
            let b = improvement(&pilot[1], &evaluate(input, proposal, 0, 4, true))?;
            Some((proposal, a + b))
        })
        .collect();
    candidates.sort_by(|a, b| {
        b.1.total_cmp(&a.1)
            .then_with(|| a.0.action.cmp(&b.0.action))
    });
    if candidates.is_empty() {
        return Some(base);
    }
    let confirm = [
        evaluate(input, base, 103, 16, false),
        evaluate(input, base, 103, 16, true),
    ];
    for (proposal, _) in candidates.into_iter().take(2) {
        if improvement(&confirm[0], &evaluate(input, proposal, 103, 16, false)).is_some()
            && improvement(&confirm[1], &evaluate(input, proposal, 103, 16, true)).is_some()
        {
            return Some(proposal);
        }
    }
    Some(base)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn time_pressure_uses_completed_route_tail_and_keeps_unknown_distinct() {
        let outcomes: Vec<_> = [10, 20, 30, 40]
            .map(|actions| Outcome {
                completed: true,
                actions,
                ..Outcome::default()
            })
            .into();
        assert!(!pilot_exceeds_budget(&outcomes, 30));
        assert!(pilot_exceeds_budget(&outcomes, 29));
        assert!(pilot_exceeds_budget(&[], 30));
        assert!(pilot_exceeds_budget(
            &[Outcome {
                actions: 1,
                ..Outcome::default()
            }],
            30
        ));
    }
    #[test]
    fn short_finish_keeps_full_quality_and_ignores_recipe_identity() {
        let mut recipe = super::super::tests::hard_quality_recipe();
        let crafter = super::super::tests::five_meld_buffed_crafter();
        let mut state = CraftState::initial(&recipe, &crafter);
        state.inner_quiet = 10;
        let gain = preview_action(&recipe, &crafter, &state, CraftActionId::DelicateSynthesis);
        state.progress = recipe.progress_required - gain.progress_gain;
        state.quality = recipe.quality_max - gain.quality_gain;
        let objective = GenericObjective {
            quality_maximum: recipe.quality_max,
            protected_quality_floor: recipe.quality_max,
            adaptive_completion: false,
            quality_utility_kind: QualityUtilityKind::HardQualityMaximum,
            quality_milestone_count: 1,
            quality_milestones: [recipe.quality_max, 0, 0, 0],
        };
        let context = PlannerContext::default();
        let chosen = recommend(
            &recipe,
            &crafter,
            &state,
            objective,
            RiskPreference::Balanced,
            &context,
            Some(0x1ff),
        )
        .unwrap();
        assert_eq!(chosen.action, CraftActionId::DelicateSynthesis);
        for condition in declared_next_conditions(Some(0x1ff)) {
            let after = apply_observed_outcome(
                &recipe,
                &crafter,
                &state,
                chosen.action,
                ObservedActionOutcome {
                    success: true,
                    next_condition: condition,
                },
            )
            .unwrap()
            .next_state;
            assert_eq!(after.terminal, CraftTerminal::Completed);
            assert_eq!(after.quality, recipe.quality_max);
        }
        recipe.canonical_recipe_id = 999999;
        assert_eq!(
            chosen,
            recommend(
                &recipe,
                &crafter,
                &state,
                objective,
                RiskPreference::Balanced,
                &context,
                Some(0x1ff)
            )
            .unwrap()
        );
    }
    #[test]
    fn failed_short_routes_never_count_as_action_savings() {
        let full = Outcome {
            completed: true,
            full: true,
            utility: 1.0,
            actions: 20,
        };
        let fast_failure = Outcome {
            actions: 1,
            ..Outcome::default()
        };
        assert!(improvement(&[full], &[fast_failure]).is_none());
        assert!(
            improvement(
                &[full],
                &[Outcome {
                    full: false,
                    actions: 10,
                    ..full
                }]
            )
            .is_none()
        );
        assert!(
            improvement(
                &[full],
                &[Outcome {
                    actions: 18,
                    ..full
                }]
            )
            .is_some()
        );
    }
}
