//! Bounded research input: `remaining_ms|-\taction_ms\t<141-cell episode>`.
//! Counts simulated action time, not CPU time; never a live game-clock oracle.
use frozen_rabbit_craft_kernel::main_solver::CraftTimeBudget;
use frozen_rabbit_craft_kernel::research::{
    execute_generic_episode_with_time_budget, format_generic_episode_result,
    parse_generic_episode_case,
};
use std::io::{self, Read};

fn main() -> Result<(), String> {
    let mut text = String::new();
    io::stdin()
        .read_to_string(&mut text)
        .map_err(|e| e.to_string())?;
    let lines: Vec<_> = text.lines().filter(|line| !line.is_empty()).collect();
    if lines.len() > 1000 {
        return Err("probe is capped at 1000 episodes per invocation".into());
    }
    let parsed: Result<Vec<_>, String> = lines
        .iter()
        .map(|line| {
            let mut cells = line.splitn(3, '\t');
            let remaining = cells.next().ok_or("missing remaining time")?;
            let expected = cells
                .next()
                .ok_or("missing action time")?
                .parse::<u32>()
                .map_err(|_| "invalid action time")?;
            let case = parse_generic_episode_case(cells.next().ok_or("missing episode")?)
                .map_err(|e| e.message)?;
            let budget = if remaining == "-" {
                None
            } else {
                Some(CraftTimeBudget::new(
                    remaining
                        .parse::<u64>()
                        .map_err(|_| "invalid remaining time")?,
                    expected,
                )?)
            };
            Ok((case, budget))
        })
        .collect();
    for (case, budget) in parsed? {
        println!(
            "{}",
            format_generic_episode_result(&execute_generic_episode_with_time_budget(
                &case, budget
            )?)
        );
    }
    Ok(())
}
