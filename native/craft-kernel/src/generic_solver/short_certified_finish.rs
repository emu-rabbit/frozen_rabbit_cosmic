//! Shorter full-quality completion, independent of time-pressure recovery.
use super::*;

pub(super) fn choose(
    recipe: &RecipeProfile,
    crafter: &CrafterProfile,
    state: &CraftState,
    context: &PlannerContext,
    mask: Option<u16>,
    base: GenericDecision,
) -> Option<GenericDecision> {
    if base.option != PlannerOption::CertifiedSuffix && state.quality < recipe.quality_max {
        return None;
    }
    // The first successful depth is the shortest certified horizon among
    // these proposals. This is not a globally optimal route claim.
    (1..=3).find_map(|depth| {
        full_quality_certificate_decision(recipe, crafter, state, context, mask, depth)
    })
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
    Some(choose(recipe, crafter, state, context, mask, base).unwrap_or(base))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn objective(recipe: &RecipeProfile) -> GenericObjective {
        GenericObjective {
            quality_maximum: recipe.quality_max,
            protected_quality_floor: recipe.quality_max,
            adaptive_completion: false,
            quality_utility_kind: QualityUtilityKind::HardQualityMaximum,
            quality_milestone_count: 1,
            quality_milestones: [recipe.quality_max, 0, 0, 0],
        }
    }

    #[test]
    fn one_action_finish_completes_at_full_quality_for_every_declared_color() {
        let recipe = super::super::tests::hard_quality_recipe();
        let crafter = super::super::tests::five_meld_buffed_crafter();
        let mut state = CraftState::initial(&recipe, &crafter);
        state.inner_quiet = 10;
        let gain = preview_action(&recipe, &crafter, &state, CraftActionId::DelicateSynthesis);
        state.progress = recipe.progress_required - gain.progress_gain;
        state.quality = recipe.quality_max - gain.quality_gain;
        let context = PlannerContext::default();
        let selected = recommend(
            &recipe,
            &crafter,
            &state,
            objective(&recipe),
            RiskPreference::Balanced,
            &context,
            Some(0x1ff),
        )
        .unwrap();
        assert_eq!(selected.action, CraftActionId::DelicateSynthesis);
        for next_condition in declared_next_conditions(Some(0x1ff)) {
            let result = apply_observed_outcome(
                &recipe,
                &crafter,
                &state,
                selected.action,
                ObservedActionOutcome {
                    success: true,
                    next_condition,
                },
            )
            .unwrap();
            assert_eq!(result.next_state.terminal, CraftTerminal::Completed);
            assert_eq!(result.next_state.quality, recipe.quality_max);
        }
    }

    #[test]
    fn unfinished_early_states_preserve_v23_without_sampled_recovery() {
        let recipe = super::super::tests::hard_quality_recipe();
        let crafter = super::super::tests::five_meld_buffed_crafter();
        let context = PlannerContext::default();
        for durability in [5, 10, 25] {
            let mut state = CraftState::initial(&recipe, &crafter);
            state.durability = durability;
            let base = opening_recovery::recommend(
                &recipe,
                &crafter,
                &state,
                objective(&recipe),
                RiskPreference::Balanced,
                &context,
                Some(0x1ff),
            )
            .unwrap();
            assert!(choose(&recipe, &crafter, &state, &context, Some(0x1ff), base).is_none());
            assert_eq!(
                recommend(
                    &recipe,
                    &crafter,
                    &state,
                    objective(&recipe),
                    RiskPreference::Balanced,
                    &context,
                    Some(0x1ff)
                ),
                Some(base)
            );
        }
    }
}
