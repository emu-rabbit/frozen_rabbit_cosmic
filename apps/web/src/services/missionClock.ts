import type { PlannerTimeBudget } from '@frozen-rabbit-expert/protocol'

export const EXPECTED_ACTION_MILLISECONDS = 5_300
export const MISSION_RESERVE_MILLISECONDS = 30_000

export interface MissionClock {
  missionId: number
  timeLimitSeconds: number
  recipeIds: readonly number[]
  firstReportedConditionAt: number | null
  completedRecipeIds: readonly number[]
}

export function missionRemainingMilliseconds(clock: MissionClock, now: number): number | null {
  if (clock.timeLimitSeconds === 0 || clock.firstReportedConditionAt === null) return null
  return Math.max(0, clock.timeLimitSeconds * 1000 - Math.max(0, now - clock.firstReportedConditionAt))
}

/** User-selected approximation: one craft per item; equal shares among unfinished items. */
export function craftTimeBudget(clock: MissionClock, now: number): PlannerTimeBudget | undefined {
  const remaining = missionRemainingMilliseconds(clock, now)
  if (remaining === null) return undefined
  const unfinished = clock.recipeIds.filter(id => !clock.completedRecipeIds.includes(id)).length
  return {
    remainingMilliseconds: Math.floor(Math.max(0, remaining - MISSION_RESERVE_MILLISECONDS) / Math.max(1, unfinished)),
    expectedActionMilliseconds: EXPECTED_ACTION_MILLISECONDS,
  }
}
