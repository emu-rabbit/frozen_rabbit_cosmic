//! Research-only exhaustive four-action AND/OR proof. Resource setup and
//! multi-action progress remain searchable after full quality. No sampled
//! continuation, recipe identity, or private condition probabilities are used.
use super::*;
use std::collections::HashMap;

const DEPTH: u8 = 4;
const RESOURCES: &[CraftActionId] = &[
    CraftActionId::QuickInnovation,
    CraftActionId::TrainedPerfection,
    CraftActionId::Veneration,
    CraftActionId::MastersMend,
    CraftActionId::ImmaculateMend,
    CraftActionId::Manipulation,
    CraftActionId::WasteNot,
    CraftActionId::HeartAndSoul,
    CraftActionId::TricksOfTheTrade,
];

struct Search<'a> {
    recipe: &'a RecipeProfile,
    crafter: &'a CrafterProfile,
    mask: Option<u16>,
    // Scoped to one complete recipe/crafter/mask query. Full state and depth
    // are keys; no lossy resource projection or persistent cross-craft cache.
    memo: HashMap<(CraftState, u8), Option<CraftActionId>>,
}

impl Search<'_> {
    fn find(&mut self, state: &CraftState, depth: u8) -> Option<CraftActionId> {
        if depth == 0 || state.terminal != CraftTerminal::None {
            return None;
        }
        let key = (state.clone(), depth);
        if let Some(action) = self.memo.get(&key) {
            return *action;
        }
        let action = CERTIFIED_FULL_QUALITY_ACTIONS
            .iter()
            .chain(CERTIFIED_FULL_QUALITY_SETUP_ACTIONS)
            .chain(CERTIFIED_PROGRESS_FINISH_ACTIONS)
            .chain(RESOURCES)
            .copied()
            .find(|&action| self.proves(state, action, depth));
        self.memo.insert(key, action);
        action
    }

    fn proves(&mut self, state: &CraftState, action: CraftActionId, depth: u8) -> bool {
        let preview = preview_action(self.recipe, self.crafter, state, action);
        if !preview.legal || preview.success_rate != 1.0 {
            return false;
        }
        if state.quality >= self.recipe.quality_max
            && (preview.action.category == ActionCategory::Quality
                || matches!(
                    action,
                    CraftActionId::Innovation
                        | CraftActionId::GreatStrides
                        | CraftActionId::QuickInnovation
                ))
        {
            return false;
        }
        let Some(after) = branch_state(self.recipe, self.crafter, state, action, true) else {
            return false;
        };
        if after.terminal != CraftTerminal::None {
            return after.terminal == CraftTerminal::Completed
                && after.quality >= self.recipe.quality_max;
        }
        if depth == 1 {
            return false;
        }
        // Do not refresh a buff without extending it or repair a full bar.
        let useful = match action {
            CraftActionId::Innovation => after.buffs.innovation > state.buffs.innovation,
            CraftActionId::GreatStrides => after.buffs.great_strides > state.buffs.great_strides,
            CraftActionId::Veneration => after.buffs.veneration > state.buffs.veneration,
            CraftActionId::Manipulation => after.buffs.manipulation > state.buffs.manipulation,
            CraftActionId::WasteNot => after.buffs.waste_not > state.buffs.waste_not,
            CraftActionId::MastersMend | CraftActionId::ImmaculateMend => {
                after.durability > state.durability
            }
            CraftActionId::TricksOfTheTrade => after.cp > state.cp,
            _ => true,
        };
        if !useful {
            return false;
        }
        // The transition owns forced colors and no-step behavior. Expanding
        // their duplicate states again would multiply work, not information.
        let forced = (preview.action.no_step && !preview.action.rerolls_condition)
            || (!preview.action.no_step
                && matches!(
                    state.condition,
                    MaterialCondition::GoodOmen | MaterialCondition::Robust
                ));
        if forced {
            return self.find(&after, depth - 1).is_some();
        }
        declared_next_conditions(self.mask).all(|condition| {
            self.find(
                &CraftState {
                    condition,
                    ..after.clone()
                },
                depth - 1,
            )
            .is_some()
        })
    }
}

pub(super) fn decide(
    recipe: &RecipeProfile,
    crafter: &CrafterProfile,
    state: &CraftState,
    context: &PlannerContext,
    mask: Option<u16>,
) -> Option<GenericDecision> {
    if recipe.quality_max <= 0 || declared_next_conditions(mask).next().is_none() {
        return None;
    }
    let depth = context
        .action_limit
        .saturating_sub(context.action_uses)
        .min(u32::from(DEPTH)) as u8;
    Search {
        recipe,
        crafter,
        mask,
        memo: HashMap::new(),
    }
    .find(state, depth)
    .map(|action| GenericDecision {
        route: None,
        action,
        option: PlannerOption::CertifiedSuffix,
        persona: PlannerPersona::LegacyContinuation,
    })
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
        state.quality = recipe.quality_max;
        state.cp = 0;
        state.durability = 20;
        state.trained_perfection_available = false;
        let gain =
            preview_action(&recipe, &crafter, &state, CraftActionId::BasicSynthesis).progress_gain;
        state.progress = recipe.progress_required - 2 * gain;
        (recipe, crafter, state)
    }

    fn verify_closed_loop(
        recipe: &RecipeProfile,
        crafter: &CrafterProfile,
        state: &CraftState,
        remaining: u32,
    ) {
        if state.terminal == CraftTerminal::Completed {
            assert_eq!(state.quality, recipe.quality_max);
            return;
        }
        assert!(remaining > 0, "certificate must actually finish");
        let context = PlannerContext {
            action_limit: remaining,
            ..PlannerContext::default()
        };
        let action = decide(recipe, crafter, state, &context, Some(0x1ff))
            .expect("actual state must retain a certificate")
            .action;
        assert_eq!(
            preview_action(recipe, crafter, state, action).success_rate,
            1.0
        );
        for &condition in MaterialCondition::ALL {
            let next = apply_observed_outcome(
                recipe,
                crafter,
                state,
                action,
                ObservedActionOutcome {
                    success: true,
                    next_condition: condition,
                },
            )
            .unwrap()
            .next_state;
            assert_ne!(next.terminal, CraftTerminal::Failed);
            verify_closed_loop(recipe, crafter, &next, remaining - 1);
        }
    }

    #[test]
    fn full_quality_can_finish_with_two_syntheses() {
        let (recipe, crafter, state) = fixture();
        assert!(
            full_quality_certificate_decision(
                &recipe,
                &crafter,
                &state,
                &PlannerContext::default(),
                Some(0x1ff),
                4
            )
            .is_none()
        );
        verify_closed_loop(&recipe, &crafter, &state, 2);
        assert!(
            decide(
                &recipe,
                &crafter,
                &state,
                &PlannerContext {
                    action_limit: 1,
                    ..PlannerContext::default()
                },
                Some(0x1ff)
            )
            .is_none()
        );
    }

    #[test]
    fn trained_perfection_funds_quality_then_progress_without_changing_condition() {
        let (recipe, crafter, mut state) = fixture();
        state.progress +=
            preview_action(&recipe, &crafter, &state, CraftActionId::BasicSynthesis).progress_gain;
        state.quality -= 1000;
        state.cp = 24;
        state.durability = 10;
        state.trained_perfection_available = true;
        for condition in [
            MaterialCondition::Normal,
            MaterialCondition::GoodOmen,
            MaterialCondition::Robust,
        ] {
            state.condition = condition;
            assert!(
                condition == MaterialCondition::Robust
                    || full_quality_certificate_decision(
                        &recipe,
                        &crafter,
                        &state,
                        &PlannerContext::default(),
                        Some(0x1ff),
                        4
                    )
                    .is_none()
            );
            verify_closed_loop(&recipe, &crafter, &state, 3);
        }
    }

    #[test]
    fn rejects_empty_mask_exhausted_budget_and_unfunded_routes() {
        let (recipe, crafter, mut state) = fixture();
        assert!(
            decide(
                &recipe,
                &crafter,
                &state,
                &PlannerContext::default(),
                Some(0)
            )
            .is_none()
        );
        assert!(
            decide(
                &recipe,
                &crafter,
                &state,
                &PlannerContext {
                    action_limit: 80,
                    action_uses: 80,
                    ..PlannerContext::default()
                },
                None
            )
            .is_none()
        );
        state.durability = 10;
        assert!(
            decide(
                &recipe,
                &crafter,
                &state,
                &PlannerContext::default(),
                Some(0x1ff)
            )
            .is_none()
        );
        state.quality = 0;
        assert!(
            decide(
                &recipe,
                &crafter,
                &state,
                &PlannerContext::default(),
                Some(0x1ff)
            )
            .is_none()
        );
    }

    #[test]
    fn identity_is_separate_and_recipe_id_is_not_a_selector_input() {
        assert_eq!(
            RESOURCE_CERTIFICATE_EXPERIMENT_VERSION
                .parse::<GenericSolverVersion>()
                .unwrap(),
            GenericSolverVersion::ResourceCertificate
        );
        assert_eq!(
            GenericSolverVersion::ResourceCertificate.as_str(),
            RESOURCE_CERTIFICATE_EXPERIMENT_VERSION
        );
        let (mut recipe, crafter, state) = fixture();
        let context = PlannerContext::default();
        let before = decide(&recipe, &crafter, &state, &context, Some(0x1ff))
            .unwrap()
            .action;
        recipe.canonical_recipe_id = 999999;
        assert_eq!(
            decide(&recipe, &crafter, &state, &context, Some(0x1ff))
                .unwrap()
                .action,
            before
        );
    }
}
