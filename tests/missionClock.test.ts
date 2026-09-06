import { describe, expect, it } from 'vitest'
import { craftTimeBudget, missionRemainingMilliseconds, type MissionClock } from '../apps/web/src/services/missionClock'

const clock: MissionClock = { missionId: 269, timeLimitSeconds: 600, recipeIds: [36534, 36535], firstReportedConditionAt: 1000, completedRecipeIds: [] }

describe('shared mission time budget', () => {
  it('distinguishes no deadline, not started, and expired', () => {
    expect(craftTimeBudget({ ...clock, timeLimitSeconds: 0 }, 1000)).toBeUndefined()
    expect(craftTimeBudget({ ...clock, firstReportedConditionAt: null }, 1000)).toBeUndefined()
    expect(craftTimeBudget(clock, 700000)).toEqual({ remainingMilliseconds: 0, expectedActionMilliseconds: 5300 })
  })
  it('reserves overhead and divides the remaining time among unfinished items', () => {
    expect(craftTimeBudget(clock, 1000)?.remainingMilliseconds).toBe(285000)
    expect(craftTimeBudget(clock, 101000)?.remainingMilliseconds).toBe(235000)
    expect(craftTimeBudget({ ...clock, completedRecipeIds: [36534] }, 301000)?.remainingMilliseconds).toBe(270000)
    expect(missionRemainingMilliseconds(clock, 301000)).toBe(300000)
  })
})
