//! Retained positive research component. The adopted v2.2 policy is unchanged.
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
    let base = recommend_generic_action_with_model(
        GenericSolverVersion::ExternalReferenceV22,
        recipe,
        crafter,
        state,
        objective,
        risk,
        context,
        mask,
    )?;
    if context.last_action == Some(CraftActionId::Reflect) && state.buffs.manipulation == 0 {
        let proposal = artisan_continuation::improve_opening(
            recipe, crafter, state, objective, context, mask, base,
        );
        if proposal.action == CraftActionId::Manipulation {
            return Some(proposal);
        }
    }
    Some(base)
}
