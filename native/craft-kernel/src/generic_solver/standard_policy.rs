//! Ordinary-condition policy informed by Artisan StandardSolver's color,
//! combo and repair priorities. Uses our mechanics and a bounded completion
//! witness before spending resources on quality; not an Artisan parity port.
use super::*;

pub(super) fn supports(mask: Option<u16>) -> bool {
    let ordinary = (1 << MaterialCondition::Normal.index())
        | (1 << MaterialCondition::Good.index())
        | (1 << MaterialCondition::Excellent.index())
        | (1 << MaterialCondition::Poor.index());
    mask.is_some_and(|m| m & (1 << MaterialCondition::Excellent.index()) != 0 && m & !ordinary == 0)
}

fn next(
    recipe: &RecipeProfile,
    crafter: &CrafterProfile,
    state: &CraftState,
    action: CraftActionId,
) -> Option<CraftState> {
    let p = preview_action(recipe, crafter, state, action);
    if !p.legal || p.success_rate < 1.0 {
        return None;
    }
    apply_observed_outcome(
        recipe,
        crafter,
        state,
        action,
        ObservedActionOutcome {
            success: true,
            next_condition: MaterialCondition::Normal,
        },
    )
    .ok()
    .map(|r| r.next_state)
    .filter(|s| s.terminal != CraftTerminal::Failed)
}

// Progress effects do not get worse on ordinary colors. This witness reserves
// completion resources, but never claims that future quality is guaranteed.
fn finish(
    recipe: &RecipeProfile,
    crafter: &CrafterProfile,
    state: &CraftState,
    limit: u32,
) -> Option<(CraftActionId, u32)> {
    use CraftActionId::*;
    let progress_recipe = RecipeProfile {
        required_quality: 0,
        ..recipe.clone()
    };
    let recipe = &progress_recipe;
    let mut best = None;
    for synth in [
        BasicSynthesis,
        CarefulSynthesis,
        Groundwork,
        PrudentSynthesis,
    ] {
        for buffs in [false, true] {
            let mut current = state.clone();
            let mut first = None;
            for count in 1..=limit.min(80) {
                let p = preview_action(recipe, crafter, &current, synth);
                if !p.legal {
                    break;
                }
                let mut action = synth;
                if current.progress + p.progress_gain < recipe.progress_required {
                    if buffs
                        && current.step == 1
                        && next(recipe, crafter, &current, MuscleMemory).is_some()
                    {
                        action = MuscleMemory;
                    } else if buffs
                        && p.durability_cost >= 20
                        && current.trained_perfection_available
                    {
                        action = TrainedPerfection;
                    } else if buffs
                        && synth == Groundwork
                        && current.buffs.waste_not == 0
                        && current.progress + p.progress_gain * 2 < recipe.progress_required
                        && next(recipe, crafter, &current, WasteNot).is_some()
                    {
                        action = WasteNot;
                    } else if buffs
                        && current.buffs.veneration == 0
                        && current.progress + p.progress_gain * 2 < recipe.progress_required
                        && next(recipe, crafter, &current, Veneration).is_some()
                    {
                        action = Veneration;
                    } else if next(recipe, crafter, &current, synth).is_none() {
                        action = if recipe.durability_max - current.durability >= 40
                            && next(recipe, crafter, &current, ImmaculateMend).is_some()
                        {
                            ImmaculateMend
                        } else {
                            MastersMend
                        };
                    }
                }
                let Some(after) = next(recipe, crafter, &current, action) else {
                    break;
                };
                first.get_or_insert(action);
                current = after;
                if current.terminal == CraftTerminal::Completed {
                    let score = current.cp + current.durability * 2;
                    if best.is_none_or(|(_, _, prior)| score > prior) {
                        best = Some((first.unwrap(), count, score));
                    }
                    break;
                }
            }
        }
    }
    best.map(|(a, n, _)| (a, n))
}

pub(super) fn recommend(
    recipe: &RecipeProfile,
    crafter: &CrafterProfile,
    state: &CraftState,
    objective: GenericObjective,
    context: &PlannerContext,
) -> Option<GenericDecision> {
    use CraftActionId::*;
    if state.terminal != CraftTerminal::None {
        return None;
    }
    let remaining = context.action_limit.saturating_sub(context.action_uses);
    if remaining == 0 {
        return None;
    }
    let target = objective.quality_maximum.min(recipe.quality_max);
    let safe = |a| {
        next(recipe, crafter, state, a).filter(|s| {
            if s.terminal == CraftTerminal::Completed {
                return s.quality >= target;
            }
            finish(recipe, crafter, s, remaining.saturating_sub(1)).is_some()
        })
    };
    let mut candidates = Vec::new();
    if state.quality < target {
        // Color opportunity precedes buffs: Excellent must be spent now.
        if matches!(
            state.condition,
            MaterialCondition::Good | MaterialCondition::Excellent
        ) {
            candidates.extend([
                ByregotsBlessing,
                PreciseTouch,
                AdvancedTouch,
                StandardTouch,
                BasicTouch,
            ]);
            candidates.sort_by_key(|a| {
                std::cmp::Reverse(preview_action(recipe, crafter, state, *a).quality_gain)
            });
            candidates.retain(|a| {
                *a != ByregotsBlessing
                    || preview_action(recipe, crafter, state, *a).quality_gain + state.quality
                        >= target
            });
        } else if state.condition == MaterialCondition::Poor {
            candidates.extend([Observe]);
        } else {
            candidates.push(Reflect);
            if preview_action(recipe, crafter, state, ByregotsBlessing).quality_gain + state.quality
                >= target
            {
                candidates.push(ByregotsBlessing);
            }
            // Buffs must fit both a following quality action and a finish.
            for buff in [Innovation, GreatStrides] {
                if (buff == Innovation && state.buffs.innovation > 0)
                    || (buff == GreatStrides && state.buffs.great_strides > 0)
                {
                    continue;
                }
                if let Some(after) = safe(buff) {
                    let touch = if buff == GreatStrides {
                        ByregotsBlessing
                    } else {
                        BasicTouch
                    };
                    if let Some(after_touch) = next(recipe, crafter, &after, touch) {
                        if after_touch.quality > after.quality
                            && finish(recipe, crafter, &after_touch, remaining.saturating_sub(2))
                                .is_some()
                            && (buff != GreatStrides || after_touch.quality >= target)
                        {
                            candidates.push(buff);
                        }
                    }
                }
            }
            if state.buffs.great_strides > 0 {
                candidates.push(ByregotsBlessing);
            }
            if state.combo_from == Some(BasicTouch) {
                candidates.extend([RefinedTouch, StandardTouch]);
            }
            if matches!(state.combo_from, Some(StandardTouch | Observe)) {
                candidates.push(AdvancedTouch);
            }
            candidates.extend([PrudentTouch, BasicTouch, TrainedFinesse, ByregotsBlessing]);
        }
    }
    if state.quality < target {
        for repair in [ImmaculateMend, MastersMend] {
            if let Some(after) = safe(repair) {
                if after.durability <= state.durability {
                    continue;
                }
                if let Some(touched) = next(recipe, crafter, &after, BasicTouch) {
                    if finish(recipe, crafter, &touched, remaining.saturating_sub(2)).is_some() {
                        candidates.push(repair);
                    }
                }
            }
        }
    }
    let action = candidates
        .into_iter()
        .find(|a| safe(*a).is_some())
        .or_else(|| {
            // Restore CP on an opportunity only when it increases resources.
            if crafter.max_cp - state.cp >= 20 && safe(TricksOfTheTrade).is_some() {
                return Some(TricksOfTheTrade);
            }
            finish(recipe, crafter, state, remaining).map(|(a, _)| a)
        })
        .or_else(|| {
            // Honest best effort when no deterministic completion witness exists.
            legal_actions(recipe, crafter, state)
                .into_iter()
                .max_by_key(|a| {
                    let p = preview_action(recipe, crafter, state, *a);
                    (p.progress_gain, p.quality_gain)
                })
        })?;
    Some(GenericDecision {
        route: None,
        action,
        persona: PlannerPersona::LegacyContinuation,
        option: match action_definition(action).category {
            ActionCategory::Progress => PlannerOption::ProgressWindow,
            ActionCategory::Quality => PlannerOption::QualityCycle,
            ActionCategory::Repair => PlannerOption::Recovery,
            _ => PlannerOption::ResourceRecovery,
        },
    })
}
