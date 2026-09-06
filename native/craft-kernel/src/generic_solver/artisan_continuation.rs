//! Research policy improvement over the fixed Artisan continuation. These
//! samples estimate a policy, never certify it. Evaluation RNG and private
//! transition weights are not inputs. Only hard-quality waiting/risk states
//! are eligible, and two declared-mask planning assumptions must agree.
use super::*;

#[derive(Clone, Copy)]
struct Input<'a> {
    recipe: &'a RecipeProfile,
    crafter: &'a CrafterProfile,
    state: &'a CraftState,
    objective: GenericObjective,
    context: &'a PlannerContext,
    mask: Option<u16>,
}

#[derive(Clone, Copy, Default)]
struct Value {
    full: u32,
    completed: u32,
    utility: f64,
    actions: u32,
}
impl Value {
    fn score(self) -> f64 {
        4.0 * f64::from(self.full) + f64::from(self.completed) + self.utility
    }
}

fn action_decision(action: CraftActionId) -> GenericDecision {
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
) -> Value {
    let mut weights = [0.0; MATERIAL_CONDITION_COUNT];
    for condition in declared_next_conditions(input.mask) {
        weights[condition.index()] = 1.0;
    }
    // Fixed internal stress assumption, not a fitted or evaluator-supplied
    // transition model. If Normal is not declared, both models are uniform.
    if scarce && weights[0] > 0.0 {
        weights[0] = (weights.iter().sum::<f64>() - 1.0).max(1.0) * 2.0;
    }
    let mut value = Value::default();
    for sample in offset..offset + samples {
        // Identical draws for every proposal and both models, independent of
        // the real craft seed, recipe/equipment identity and future outcomes.
        let mut random = EpisodeRandomStream::new(
            0x61c8_d793_u32.wrapping_add(sample.wrapping_mul(0x9e37_79b9)),
        );
        let mut cursor = RandomDrawCursor {
            condition_draws: 0,
            success_draws: 0,
        };
        let mut state = input.state.clone();
        let mut context = input.context.clone();
        let mut decision = Some(root);
        let remaining = context
            .action_limit
            .saturating_sub(context.action_uses)
            .min(80);
        for _ in 0..remaining {
            let Some(next) = decision else {
                break;
            };
            let preview = preview_action(input.recipe, input.crafter, &state, next.action);
            if !preview.legal {
                break;
            }
            let draw =
                draw_simulated_action_outcome(&preview, &state, &weights, &mut random, cursor);
            let Ok(after) = apply_observed_outcome(
                input.recipe,
                input.crafter,
                &state,
                next.action,
                draw.observed,
            ) else {
                break;
            };
            advance_planner_context(
                &mut context,
                GenericSolverVersion::ArtisanExpertReference,
                next,
                &state,
                &after.next_state,
            );
            state = after.next_state;
            cursor = draw.cursor_after;
            value.actions += 1;
            if state.terminal != CraftTerminal::None {
                break;
            }
            decision = crate::artisan_expert::recommend(
                input.recipe,
                input.crafter,
                &state,
                input.objective,
                &context,
                input.mask,
            );
        }
        if state.terminal == CraftTerminal::Completed {
            value.completed += 1;
            value.full += u32::from(state.quality >= input.recipe.quality_max);
            value.utility +=
                crate::ts_migration_port::quality_utility(input.objective, state.quality);
        }
    }
    value
}

pub(super) fn improve(
    recipe: &RecipeProfile,
    crafter: &CrafterProfile,
    state: &CraftState,
    objective: GenericObjective,
    context: &PlannerContext,
    mask: Option<u16>,
    reference: GenericDecision,
) -> GenericDecision {
    improve_with_minimum_iq(
        recipe, crafter, state, objective, context, mask, reference, 6,
    )
}

pub(super) fn improve_opening(
    recipe: &RecipeProfile,
    crafter: &CrafterProfile,
    state: &CraftState,
    objective: GenericObjective,
    context: &PlannerContext,
    mask: Option<u16>,
    reference: GenericDecision,
) -> GenericDecision {
    improve_with_minimum_iq(
        recipe, crafter, state, objective, context, mask, reference, 1,
    )
}

fn improve_with_minimum_iq(
    recipe: &RecipeProfile,
    crafter: &CrafterProfile,
    state: &CraftState,
    objective: GenericObjective,
    context: &PlannerContext,
    mask: Option<u16>,
    reference: GenericDecision,
    minimum_iq: i32,
) -> GenericDecision {
    let preview = preview_action(recipe, crafter, state, reference.action);
    if recipe.required_quality <= 0
        || state.quality >= recipe.quality_max
        || state.inner_quiet < minimum_iq
        || declared_next_conditions(mask).next().is_none()
        || !(preview.success_rate < 1.0
            || matches!(
                reference.action,
                CraftActionId::Observe | CraftActionId::CarefulObservation
            ))
    {
        return reference;
    }
    let input = Input {
        recipe,
        crafter,
        state,
        objective,
        context,
        mask,
    };
    let baseline = [
        evaluate(input, reference, 0, 4, false),
        evaluate(input, reference, 0, 4, true),
    ];
    let base_score = baseline[0].score() + baseline[1].score();
    let mut proposed = Vec::new();
    for &action in CraftActionId::ALL {
        if action == reference.action
            || matches!(
                action,
                CraftActionId::Observe
                    | CraftActionId::CarefulObservation
                    | CraftActionId::FinalAppraisal
                    | CraftActionId::RapidSynthesis
                    | CraftActionId::HastyTouch
                    | CraftActionId::DaringTouch
            )
        {
            continue;
        }
        let p = preview_action(recipe, crafter, state, action);
        if !p.legal || p.success_rate != 1.0 {
            continue;
        }
        let Some(after) = branch_state(recipe, crafter, state, action, true) else {
            continue;
        };
        if after.terminal == CraftTerminal::Failed {
            continue;
        }
        let useful = match action {
            CraftActionId::Innovation => state.buffs.innovation == 0,
            CraftActionId::GreatStrides => state.buffs.great_strides == 0,
            CraftActionId::Veneration => state.buffs.veneration == 0,
            CraftActionId::Manipulation => state.buffs.manipulation == 0,
            CraftActionId::WasteNot | CraftActionId::WasteNot2 => state.buffs.waste_not == 0,
            CraftActionId::MastersMend | CraftActionId::ImmaculateMend => {
                after.durability > state.durability
            }
            CraftActionId::TricksOfTheTrade => after.cp > state.cp,
            _ => true,
        };
        if !useful {
            continue;
        }
        let proposal = action_decision(action);
        let a = evaluate(input, proposal, 0, 4, false);
        let b = evaluate(input, proposal, 0, 4, true);
        if a.completed >= baseline[0].completed
            && b.completed >= baseline[1].completed
            && a.score() + b.score() > base_score
        {
            proposed.push((proposal, a.score() + b.score()));
        }
    }
    proposed.sort_by(|a, b| {
        b.1.total_cmp(&a.1)
            .then_with(|| a.0.action.cmp(&b.0.action))
    });
    if proposed.is_empty() {
        return reference;
    }
    // Independent confirmation tapes reduce selection bias from the pilot.
    let baseline = [
        evaluate(input, reference, 101, 16, false),
        evaluate(input, reference, 101, 16, true),
    ];
    for (proposal, _) in proposed.into_iter().take(2) {
        let a = evaluate(input, proposal, 101, 16, false);
        let b = evaluate(input, proposal, 101, 16, true);
        if a.completed >= baseline[0].completed
            && b.completed >= baseline[1].completed
            && a.full >= baseline[0].full
            && b.full >= baseline[1].full
            && a.full + b.full >= baseline[0].full + baseline[1].full + 4
        {
            return proposal;
        }
    }
    reference
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn candidate_is_legal_and_does_not_read_recipe_identity() {
        let mut recipe = super::super::tests::hard_quality_recipe();
        let crafter = super::super::tests::five_meld_buffed_crafter();
        let mut state = CraftState::initial(&recipe, &crafter);
        state.step = 20;
        state.inner_quiet = 10;
        state.progress = 5000;
        state.quality = 12000;
        state.cp = 180;
        state.durability = 30;
        let objective = GenericObjective {
            quality_maximum: recipe.quality_max,
            protected_quality_floor: recipe.quality_max,
            adaptive_completion: false,
            quality_utility_kind: QualityUtilityKind::HardQualityMaximum,
            quality_milestone_count: 1,
            quality_milestones: [recipe.quality_max, 0, 0, 0],
        };
        let context = PlannerContext::default();
        let reference = action_decision(CraftActionId::Observe);
        let a = improve(
            &recipe,
            &crafter,
            &state,
            objective,
            &context,
            Some(0x1ff),
            reference,
        );
        recipe.canonical_recipe_id = 999999;
        let b = improve(
            &recipe,
            &crafter,
            &state,
            objective,
            &context,
            Some(0x1ff),
            reference,
        );
        assert_eq!(a, b);
        assert!(preview_action(&recipe, &crafter, &state, a.action).legal);
        recipe.required_quality = 0;
        assert_eq!(
            improve(
                &recipe,
                &crafter,
                &state,
                objective,
                &context,
                Some(0x1ff),
                reference
            ),
            reference
        );
    }
}
