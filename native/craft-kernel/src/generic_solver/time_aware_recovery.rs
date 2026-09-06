//! Retained development candidate: pay for recovery instead of indefinitely
//! fishing for Pliant. Uses observable resources, not the mission countdown.
use super::*;

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
    Some(replace_wait(recipe, crafter, state, base))
}

fn replace_wait(
    recipe: &RecipeProfile,
    crafter: &CrafterProfile,
    state: &CraftState,
    base: GenericDecision,
) -> GenericDecision {
    if base.action != CraftActionId::Observe
        || state.buffs.manipulation > 0
        || state.durability > 10
        || state.quality >= recipe.quality_max
    {
        return base;
    }
    // Leave CP for a quality cashout and a Careful Synthesis. This is only a
    // spending guard, not a proof of eventual completion or full quality.
    let cashout = if state.inner_quiet > 0 {
        action_definition(CraftActionId::ByregotsBlessing).cp_cost
    } else {
        0
    };
    let reserve = cashout + action_definition(CraftActionId::CarefulSynthesis).cp_cost;
    let preview = preview_action(recipe, crafter, state, CraftActionId::Manipulation);
    if !preview.legal || state.cp < action_definition(CraftActionId::Manipulation).cp_cost + reserve
    {
        return base;
    }
    GenericDecision {
        route: None,
        action: CraftActionId::Manipulation,
        persona: PlannerPersona::LegacyContinuation,
        option: PlannerOption::Recovery,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn stalled_low_iq_recovery_preserves_useful_waits_and_cp_reserve() {
        let recipe = super::super::tests::hard_quality_recipe();
        let crafter = super::super::tests::five_meld_buffed_crafter();
        let mut state = CraftState::initial(&recipe, &crafter);
        state.step = 34;
        state.durability = 5;
        state.cp = 600;
        state.inner_quiet = 4;
        let base = GenericDecision {
            action: CraftActionId::Observe,
            route: None,
            persona: PlannerPersona::LegacyContinuation,
            option: PlannerOption::ResourceRecovery,
        };
        assert_eq!(
            replace_wait(&recipe, &crafter, &state, base).action,
            CraftActionId::Manipulation
        );
        state.buffs.manipulation = 2;
        assert_eq!(
            replace_wait(&recipe, &crafter, &state, base).action,
            CraftActionId::Observe
        );
        state.buffs.manipulation = 0;
        state.cp = 100;
        assert_eq!(
            replace_wait(&recipe, &crafter, &state, base).action,
            CraftActionId::Observe
        );
    }
}
