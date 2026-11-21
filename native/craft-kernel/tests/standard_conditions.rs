use frozen_rabbit_craft_kernel::main_solver::*;
use frozen_rabbit_craft_kernel::research::{
    EpisodeRandomStream, MATERIAL_CONDITION_COUNT, RandomDrawCursor, apply_observed_outcome,
    draw_simulated_action_outcome, preview_action,
};

fn bottle() -> RecipeProfile {
    // Pinned Recipe 37041 / RecipeLevelTable 721, game-data 284bb7f44b9c0976.
    RecipeProfile {
        normal_condition_rules: true,
        canonical_recipe_id: 37041,
        recipe_level: 721,
        progress_required: 7800,
        quality_max: 12200,
        required_quality: 0,
        durability_max: 65,
        progress_divider: 170.0,
        quality_divider: 150.0,
        progress_modifier: 90.0,
        quality_modifier: 75.0,
    }
}
fn crafter() -> CrafterProfile {
    CrafterProfile {
        level: 100,
        craftsmanship: 5408,
        control: 5237,
        max_cp: 722,
        cosmic_tool_good_bonus: false,
        specialist: true,
    }
}

#[test]
fn standard_quality_multipliers_and_condition_only_actions() {
    // Excellent ×4 and Poor ×0.5, independent of the tool's Good-only bonus.
    let recipe = bottle();
    let mut crafter = crafter();
    for bonus in [false, true] {
        crafter.cosmic_tool_good_bonus = bonus;
        let mut state = CraftState::initial(&recipe, &crafter);
        let normal =
            preview_action(&recipe, &crafter, &state, CraftActionId::BasicTouch).quality_gain;
        for (condition, numerator, denominator) in [
            (MaterialCondition::Excellent, 4, 1),
            (MaterialCondition::Poor, 1, 2),
        ] {
            state.condition = condition;
            assert_eq!(
                preview_action(&recipe, &crafter, &state, CraftActionId::BasicTouch).quality_gain,
                normal * numerator / denominator
            );
            for action in [
                CraftActionId::PreciseTouch,
                CraftActionId::IntensiveSynthesis,
                CraftActionId::TricksOfTheTrade,
            ] {
                assert_eq!(
                    preview_action(&recipe, &crafter, &state, action).legal,
                    condition == MaterialCondition::Excellent
                );
            }
        }
    }
}

#[test]
fn forced_colors_preserve_no_step_buffs_and_do_not_draw_rng() {
    let recipe = bottle();
    let crafter = crafter();
    for (condition, expected) in [
        (MaterialCondition::Excellent, MaterialCondition::Poor),
        (MaterialCondition::Poor, MaterialCondition::Normal),
        (MaterialCondition::Good, MaterialCondition::Normal),
    ] {
        for action in [
            CraftActionId::Observe,
            CraftActionId::CarefulObservation,
            CraftActionId::FinalAppraisal,
        ] {
            let mut state = CraftState::initial(&recipe, &crafter);
            state.condition = condition;
            let next = if action == CraftActionId::FinalAppraisal {
                condition
            } else {
                expected
            };
            let preview = preview_action(&recipe, &crafter, &state, action);
            let mut random = EpisodeRandomStream::new(7);
            let cursor = RandomDrawCursor {
                condition_draws: 0,
                success_draws: 0,
            };
            let draw = draw_simulated_action_outcome(
                &preview,
                &state,
                &[1.0; MATERIAL_CONDITION_COUNT],
                &mut random,
                cursor,
            );
            assert_eq!(draw.observed.next_condition, next);
            assert_eq!(draw.cursor_after.condition_draws, 0);
            // A contradictory reported color cannot override a forced rule.
            let after = apply_observed_outcome(
                &recipe,
                &crafter,
                &state,
                action,
                ObservedActionOutcome {
                    success: true,
                    next_condition: MaterialCondition::Excellent,
                },
            )
            .unwrap()
            .next_state;
            assert_eq!(after.condition, next);
        }
    }
    let mut expert = recipe;
    expert.normal_condition_rules = false;
    let mut state = CraftState::initial(&expert, &crafter);
    state.condition = MaterialCondition::Good;
    assert_eq!(
        apply_observed_outcome(
            &expert,
            &crafter,
            &state,
            CraftActionId::Observe,
            ObservedActionOutcome {
                success: true,
                next_condition: MaterialCondition::Good
            }
        )
        .unwrap()
        .next_state
        .condition,
        MaterialCondition::Good
    );
}

#[test]
fn non_expert_special_colors_still_return_good_to_normal() {
    let recipe = bottle();
    let crafter = crafter();
    let mut state = CraftState::initial(&recipe, &crafter);
    // ConditionsFlag 995 has Good Omen without Excellent/Poor. IsExpert=false
    // still applies Artisan Simulator.GetNextCondition's Good -> Normal rule.
    state.condition = MaterialCondition::GoodOmen;
    let good = apply_observed_outcome(
        &recipe,
        &crafter,
        &state,
        CraftActionId::Observe,
        ObservedActionOutcome {
            success: true,
            next_condition: MaterialCondition::Normal,
        },
    )
    .unwrap()
    .next_state;
    assert_eq!(good.condition, MaterialCondition::Good);
    let normal = apply_observed_outcome(
        &recipe,
        &crafter,
        &good,
        CraftActionId::Observe,
        ObservedActionOutcome {
            success: true,
            next_condition: MaterialCondition::GoodOmen,
        },
    )
    .unwrap()
    .next_state;
    assert_eq!(normal.condition, MaterialCondition::Normal);
}

#[test]
fn bottle_runs_the_public_solver_through_normal_and_forced_color_paths() {
    let recipe = bottle();
    let crafter = crafter();
    let conditions = AvailableConditions::from_conditions(&[
        MaterialCondition::Normal,
        MaterialCondition::Good,
        MaterialCondition::Excellent,
        MaterialCondition::Poor,
    ])
    .unwrap();
    for colored in [false, true] {
        let config = MainSolverConfig::new(
            recipe,
            crafter,
            MainSolverObjective::ContinuousCollectability {
                quality_maximum: 12200,
                protected_floor: 7000,
            },
            conditions,
        )
        .unwrap();
        let mut solver = MainSolverSession::new(config);
        let mut state = CraftState::initial(&recipe, &crafter);
        for step in 0..80 {
            if state.terminal != CraftTerminal::None {
                break;
            }
            let MainSolverStatus::Recommendation(recommendation) =
                solver.recommend(&state).unwrap()
            else {
                panic!("missing recommendation at {state:?}");
            };
            let action = recommendation.action;
            assert!(preview_action(&recipe, &crafter, &state, action).legal);
            let observed = ObservedActionOutcome {
                success: true,
                next_condition: if colored && step % 7 == 2 {
                    MaterialCondition::Excellent
                } else {
                    MaterialCondition::Normal
                },
            };
            let after = apply_observed_outcome(&recipe, &crafter, &state, action, observed)
                .unwrap()
                .next_state;
            solver.observe(action, observed).unwrap();
            state = after;
        }
        assert_eq!(
            state.terminal,
            CraftTerminal::Completed,
            "colored={colored}: {state:?}"
        );
        assert_eq!(
            state.quality, recipe.quality_max,
            "colored={colored}: {state:?}"
        );
    }
}
