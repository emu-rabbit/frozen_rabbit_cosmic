//! A Normal-route proposal is never a guarantee. Only a full-quality suffix
//! proved over every declared color may be retained and executed. Each actual
//! observation advances the suffix; resuming revalidates the observed state.
use super::*;
use std::collections::HashSet;

const MAX_TRANSITIONS: usize = 4096;
const MAX_FRONTIER: usize = 512;

fn verifies(
    recipe: &RecipeProfile,
    crafter: &CrafterProfile,
    state: &CraftState,
    actions: &[CraftActionId],
    mask: Option<u16>,
) -> bool {
    if actions.is_empty() || declared_next_conditions(mask).next().is_none() {
        return false;
    }
    let mut frontier = HashSet::from([state.clone()]);
    let mut work = 0;
    for &action in actions {
        let mut next = HashSet::new();
        for state in frontier {
            if work == MAX_TRANSITIONS {
                return false;
            }
            work += 1;
            let preview = preview_action(recipe, crafter, &state, action);
            if !preview.legal || preview.success_rate != 1.0 {
                return false;
            }
            let Some(after) = branch_state(recipe, crafter, &state, action, true) else {
                return false;
            };
            if after.terminal != CraftTerminal::None {
                if after.terminal != CraftTerminal::Completed || after.quality < recipe.quality_max
                {
                    return false;
                }
                continue;
            }
            let forced = (preview.action.no_step && !preview.action.rerolls_condition)
                || state.condition.forced_next().is_some();
            if forced {
                next.insert(after);
            } else {
                for condition in declared_next_conditions(mask) {
                    next.insert(CraftState {
                        condition,
                        ..after.clone()
                    });
                }
            }
            if next.len() > MAX_FRONTIER {
                return false;
            }
        }
        if next.is_empty() {
            return true;
        }
        frontier = next;
    }
    false
}

fn decision(actions: &[CraftActionId]) -> GenericDecision {
    let mut stored = CertifiedActions {
        actions: [CraftActionId::BasicSynthesis; 12],
        len: actions.len() as u8,
    };
    stored.actions[..actions.len()].copy_from_slice(actions);
    GenericDecision {
        action: actions[0],
        option: PlannerOption::CertifiedSuffix,
        persona: PlannerPersona::LegacyContinuation,
        route: Some(RoutePlan {
            intent: RouteIntent::Finish,
            engine: ContinuationEngine::Semantic,
            setup: None,
            consumer: None,
            interrupt: false,
            certified_actions: Some(stored),
            normal_actions: None,
        }),
    }
}

pub(super) fn resume(
    recipe: &RecipeProfile,
    crafter: &CrafterProfile,
    state: &CraftState,
    context: &PlannerContext,
    mask: Option<u16>,
) -> Option<GenericDecision> {
    if !context.route_memory.matches(state) {
        return None;
    }
    let stored = context.route_memory.active?.certified_actions?;
    if stored.len == 0
        || usize::from(stored.len) > stored.actions.len()
        || u32::from(stored.len) > context.action_limit.saturating_sub(context.action_uses)
    {
        return None;
    }
    verifies(recipe, crafter, state, stored.as_slice(), mask).then(|| decision(stored.as_slice()))
}

pub(super) fn plan(
    recipe: &RecipeProfile,
    crafter: &CrafterProfile,
    state: &CraftState,
    context: &PlannerContext,
    mask: Option<u16>,
) -> Option<GenericDecision> {
    let actions = portfolio::certificate_proposal(recipe, crafter, state, context, mask)?;
    if actions.len() > 12
        || actions.len() as u32 > context.action_limit.saturating_sub(context.action_uses)
    {
        return None;
    }
    verifies(recipe, crafter, state, &actions, mask).then(|| decision(&actions))
}

#[cfg(test)]
mod tests {
    use super::*;
    fn fixture() -> (RecipeProfile, CrafterProfile, CraftState) {
        let recipe = super::super::tests::hard_quality_recipe();
        let crafter = super::super::tests::five_meld_buffed_crafter();
        let mut state = CraftState::initial(&recipe, &crafter);
        state.step = 20;
        state.inner_quiet = 10;
        state.quality = recipe.quality_max - 1000;
        state.progress = recipe.progress_required
            - preview_action(&recipe, &crafter, &state, CraftActionId::BasicSynthesis)
                .progress_gain;
        state.cp = 24;
        state.durability = 10;
        (recipe, crafter, state)
    }

    #[test]
    fn only_full_quality_all_condition_routes_are_certificates() {
        let (recipe, crafter, state) = fixture();
        let actions = [
            CraftActionId::TrainedPerfection,
            CraftActionId::ByregotsBlessing,
            CraftActionId::BasicSynthesis,
        ];
        assert!(verifies(&recipe, &crafter, &state, &actions, Some(0x1ff)));
        assert!(!verifies(
            &recipe,
            &crafter,
            &state,
            &actions[1..],
            Some(0x1ff)
        ));
        assert!(!verifies(
            &recipe,
            &crafter,
            &state,
            &[CraftActionId::BasicSynthesis],
            Some(0x1ff)
        ));
        assert!(!verifies(
            &recipe,
            &crafter,
            &state,
            &[CraftActionId::RapidSynthesis],
            Some(0x1ff)
        ));
        assert!(!verifies(&recipe, &crafter, &state, &actions, Some(0)));
    }

    fn follow_every_condition(
        recipe: &RecipeProfile,
        crafter: &CrafterProfile,
        state: CraftState,
        context: PlannerContext,
        decision: GenericDecision,
    ) {
        for &condition in MaterialCondition::ALL {
            let after = apply_observed_outcome(
                recipe,
                crafter,
                &state,
                decision.action,
                ObservedActionOutcome {
                    success: true,
                    next_condition: condition,
                },
            )
            .unwrap()
            .next_state;
            let mut context = context.clone();
            advance_planner_context(
                &mut context,
                GenericSolverVersion::CertifiedRoute,
                decision,
                &state,
                &after,
            );
            if after.terminal == CraftTerminal::Completed {
                assert_eq!(after.quality, recipe.quality_max);
                assert!(context.route_memory.active.is_none());
            } else {
                let next = resume(recipe, crafter, &after, &context, Some(0x1ff))
                    .expect("certified suffix survives every actual observation");
                assert_eq!(
                    next.route.unwrap().certified_actions.unwrap().len + 1,
                    decision.route.unwrap().certified_actions.unwrap().len
                );
                follow_every_condition(recipe, crafter, after, context, next);
            }
        }
    }

    #[test]
    fn persists_suffix_and_rejects_changed_state_or_insufficient_runway() {
        let (recipe, crafter, state) = fixture();
        let first = decision(&[
            CraftActionId::TrainedPerfection,
            CraftActionId::ByregotsBlessing,
            CraftActionId::BasicSynthesis,
        ]);
        follow_every_condition(
            &recipe,
            &crafter,
            state.clone(),
            PlannerContext::default(),
            first,
        );
        let after = branch_state(&recipe, &crafter, &state, first.action, true).unwrap();
        let mut context = PlannerContext::default();
        advance_planner_context(
            &mut context,
            GenericSolverVersion::CertifiedRoute,
            first,
            &state,
            &after,
        );
        let mut changed = after.clone();
        changed.cp = 0;
        assert!(resume(&recipe, &crafter, &changed, &context, Some(0x1ff)).is_none());
        context.action_limit = context.action_uses + 1;
        assert!(resume(&recipe, &crafter, &after, &context, Some(0x1ff)).is_none());
    }

    #[test]
    fn historical_route_debug_identity_remains_unchanged() {
        let route = RoutePlan {
            intent: RouteIntent::Finish,
            engine: ContinuationEngine::Semantic,
            setup: None,
            consumer: None,
            interrupt: false,
            certified_actions: None,
            normal_actions: None,
        };
        assert_eq!(
            format!("{route:?}"),
            "RoutePlan { intent: Finish, engine: Semantic, setup: None, consumer: None, interrupt: false }"
        );
        assert_eq!(
            CERTIFIED_ROUTE_EXPERIMENT_VERSION
                .parse::<GenericSolverVersion>()
                .unwrap(),
            GenericSolverVersion::CertifiedRoute
        );
    }
}
