//! Bounded ordinary-craft planning from the current observed state. Future
//! conditions are Normal except forced transitions; no future RNG is read.
use super::*;

#[derive(Clone)]
struct Node {
    state: CraftState,
    route: NormalActions,
    score: f64,
}

fn key(s: &CraftState) -> [i32; 24] {
    [
        s.progress,
        s.quality,
        s.cp,
        s.durability,
        s.inner_quiet,
        s.condition.index() as i32,
        s.buffs.waste_not,
        s.buffs.veneration,
        s.buffs.great_strides,
        s.buffs.innovation,
        s.buffs.manipulation,
        s.buffs.muscle_memory,
        s.buffs.final_appraisal,
        s.combo_from.map_or(-1, |a| a as i32),
        i32::from(s.step == 1),
        i32::from(s.trained_perfection_available),
        i32::from(s.trained_perfection_active),
        i32::from(s.heart_and_soul_available),
        i32::from(s.heart_and_soul_active),
        i32::from(s.quick_innovation_available),
        s.careful_observation_uses_left,
        s.buffs.expedience,
        0,
        0,
    ]
}

pub(super) fn recommend(
    recipe: &RecipeProfile,
    crafter: &CrafterProfile,
    state: &CraftState,
    context: &PlannerContext,
) -> Option<GenericDecision> {
    use CraftActionId::*;
    if state.terminal != CraftTerminal::None {
        return None;
    }
    let remaining = context
        .action_limit
        .saturating_sub(context.action_uses)
        .min(48);
    let r = RecipeProfile {
        required_quality: 0,
        ..recipe.clone()
    };
    let empty = NormalActions {
        actions: [BasicSynthesis; 48],
        len: 0,
    };
    let mut frontier = vec![Node {
        state: state.clone(),
        route: empty,
        score: 0.0,
    }];
    let mut best: Option<(i32, u32, NormalActions)> = None;
    if let Some(route) = context.route_memory.active.and_then(|r| r.normal_actions) {
        let mut replay = state.clone();
        let mut valid = route.len > 0 && route.len as u32 <= remaining;
        for &a in &route.actions[..route.len.min(48) as usize] {
            let p = preview_action(&r, crafter, &replay, a);
            if !p.legal || p.success_rate != 1.0 {
                valid = false;
                break;
            }
            let Ok(after) = apply_observed_outcome(
                &r,
                crafter,
                &replay,
                a,
                ObservedActionOutcome {
                    success: true,
                    next_condition: MaterialCondition::Normal,
                },
            ) else {
                valid = false;
                break;
            };
            replay = after.next_state;
        }
        if valid && replay.terminal == CraftTerminal::Completed {
            if replay.quality >= recipe.quality_max {
                return Some(decision(route));
            }
            best = Some((replay.quality, route.len as u32 - 1, route));
        }
    }
    let mut seen = HashSet::new();
    for depth in 0..remaining {
        let mut buckets: [Vec<Node>; 64] = std::array::from_fn(|_| Vec::new());
        for node in &frontier {
            for action in [
                BasicSynthesis,
                CarefulSynthesis,
                Groundwork,
                PrudentSynthesis,
                IntensiveSynthesis,
                MuscleMemory,
                BasicTouch,
                StandardTouch,
                AdvancedTouch,
                PrudentTouch,
                PreparatoryTouch,
                PreciseTouch,
                ByregotsBlessing,
                TrainedFinesse,
                RefinedTouch,
                Reflect,
                DelicateSynthesis,
                TricksOfTheTrade,
                TrainedPerfection,
                MastersMend,
                ImmaculateMend,
                WasteNot,
                WasteNot2,
                Veneration,
                Innovation,
                GreatStrides,
                Manipulation,
                Observe,
                HeartAndSoul,
                QuickInnovation,
            ] {
                let s = &node.state;
                let p = preview_action(&r, crafter, s, action);
                if !p.legal || p.success_rate != 1.0 {
                    continue;
                }
                if s.quality >= r.quality_max && p.progress_gain == 0 && p.quality_gain > 0 {
                    continue;
                }
                if (action == Observe && s.condition != MaterialCondition::Poor)
                    || (action == TricksOfTheTrade && s.cp >= crafter.max_cp)
                    || (matches!(action, MastersMend | ImmaculateMend)
                        && s.durability >= r.durability_max)
                    || (matches!(action, WasteNot | WasteNot2) && s.buffs.waste_not > 0)
                    || (action == Veneration && s.buffs.veneration > 0)
                    || (action == Innovation && s.buffs.innovation > 0)
                    || (action == GreatStrides && s.buffs.great_strides > 0)
                    || (action == Manipulation && s.buffs.manipulation > 0)
                {
                    continue;
                }
                let Ok(after) = apply_observed_outcome(
                    &r,
                    crafter,
                    s,
                    action,
                    ObservedActionOutcome {
                        success: true,
                        next_condition: MaterialCondition::Normal,
                    },
                ) else {
                    continue;
                };
                let s = after.next_state;
                if s.terminal == CraftTerminal::Failed {
                    continue;
                }
                let mut route = node.route;
                route.actions[depth as usize] = action;
                route.len = depth as u8 + 1;
                if s.terminal == CraftTerminal::Completed {
                    if best.is_none_or(|(q, n, _)| s.quality > q || (s.quality == q && depth < n)) {
                        best = Some((s.quality, depth, route));
                    }
                    continue;
                }
                if !seen.insert(key(&s)) {
                    continue;
                }
                let progress = s.progress as f64 / r.progress_required as f64;
                let quality = s.quality as f64 / r.quality_max.max(1) as f64;
                let resource = s.cp as f64 / crafter.max_cp.max(1) as f64;
                let durability = s.durability as f64 / r.durability_max as f64;
                let score = quality
                    + 0.3 * resource
                    + 0.12 * durability
                    + 0.018 * s.inner_quiet as f64
                    + 0.012
                        * (s.buffs.innovation + s.buffs.veneration + s.buffs.manipulation) as f64
                    + 0.03 * s.buffs.great_strides as f64
                    + 0.05 * s.buffs.muscle_memory as f64
                    + if s.trained_perfection_active {
                        0.12
                    } else {
                        0.0
                    }
                    + 0.15 * progress;
                let bucket =
                    ((progress * 8.0) as usize).min(7) * 8 + ((quality * 8.0) as usize).min(7);
                buckets[bucket].push(Node {
                    state: s,
                    route,
                    score,
                });
            }
        }
        if let Some((q, _, action)) = best {
            if q >= recipe.quality_max {
                return Some(decision(action));
            }
        }
        frontier.clear();
        for bucket in &mut buckets {
            bucket.sort_by(|a, b| b.score.total_cmp(&a.score));
            bucket.truncate(24);
            frontier.append(bucket);
        }
        if frontier.is_empty() {
            break;
        }
    }
    best.map(|(_, _, a)| decision(a))
}

fn decision(actions: NormalActions) -> GenericDecision {
    let action = actions.actions[0];
    GenericDecision {
        route: Some(RoutePlan {
            normal_actions: Some(actions),
            certified_actions: None,
            intent: RouteIntent::HybridWork,
            engine: ContinuationEngine::Budgeted,
            setup: None,
            consumer: None,
            interrupt: false,
        }),
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn retained_normal_finish_is_revalidated_when_poor_arrives() {
        use CraftActionId::*;
        let recipe = RecipeProfile {
            canonical_recipe_id: 0,
            recipe_level: 746,
            progress_required: 1,
            quality_max: 1500,
            required_quality: 1500,
            durability_max: 20,
            progress_divider: 180.0,
            quality_divider: 180.0,
            progress_modifier: 100.0,
            quality_modifier: 100.0,
        };
        let crafter = CrafterProfile {
            level: 100,
            craftsmanship: 5380,
            control: 5000,
            max_cp: 31,
            cosmic_tool_good_bonus: false,
            specialist: false,
        };
        let mut state = CraftState::initial(&recipe, &crafter);
        state.step = 2;
        state.inner_quiet = 10;
        let mut route = NormalActions {
            actions: [BasicSynthesis; 48],
            len: 2,
        };
        route.actions[0] = ByregotsBlessing;
        let mut context = PlannerContext {
            action_limit: 3,
            ..PlannerContext::default()
        };
        context.route_memory.active = decision(route).route;
        assert_eq!(
            recommend(&recipe, &crafter, &state, &context)
                .unwrap()
                .action,
            ByregotsBlessing
        );
        state.condition = MaterialCondition::Poor;
        let result = recommend(&recipe, &crafter, &state, &context).unwrap();
        assert_ne!(result.action, ByregotsBlessing);
        let route = result.route.unwrap().normal_actions.unwrap();
        for action in &route.actions[..route.len as usize] {
            state = apply_observed_outcome(
                &recipe,
                &crafter,
                &state,
                *action,
                ObservedActionOutcome {
                    success: true,
                    next_condition: MaterialCondition::Normal,
                },
            )
            .unwrap()
            .next_state;
        }
        assert_eq!(state.terminal, CraftTerminal::Completed);
        assert_eq!(state.quality, recipe.quality_max);
    }
}
