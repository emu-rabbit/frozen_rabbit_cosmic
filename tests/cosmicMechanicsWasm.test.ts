import { readFileSync } from 'node:fs'
import { beforeAll, describe, expect, it } from 'vitest'
import { cosmicScenarioDataByRecipeId, COSMIC_SCENARIO_DATA, COSMIC_MECHANICS_FAMILIES } from '@frozen-rabbit-expert/data'
import { createInitialCraftState, type CrafterProfile } from '@frozen-rabbit-expert/domain'
import { replaySession } from '@frozen-rabbit-expert/protocol'
import { initializeMechanics, previewAction, applyObservedOutcome } from '../apps/web/src/runtime/planner/mechanics'

const crafter: CrafterProfile = { level: 100, craftsmanship: 5000, control: 5000, maxCp: 600, specialist: false }
beforeAll(async () => { await initializeMechanics(readFileSync('apps/web/src/runtime/wasm/frozen_rabbit_craft_kernel_web.wasm')) })

describe('all Cosmic catalog and authoritative mechanics', () => {
  it('covers every pinned WKS recipe without changing expert membership', () => {
    expect(COSMIC_SCENARIO_DATA).toHaveLength(1584)
    expect(COSMIC_MECHANICS_FAMILIES).toHaveLength(138)
    expect(new Set(COSMIC_SCENARIO_DATA.map(s => s.recipe.canonicalRecipeId)).size).toBe(1584)
    for (const s of COSMIC_SCENARIO_DATA) {
      expect(s.recipe.progressRequired).toBeGreaterThan(0)
      expect(s.recipe.availableConditions).toContain('normal')
      expect(s.recipe.randomConditions).not.toContain('poor')
      expect(s.objective.recipeProfileId).toBe(s.recipe.profileId)
    }
  })
  it('resolves scaling while fixed level 100 crafts reject an underlevel profile', () => {
    const low = cosmicScenarioDataByRecipeId(36165, 50)!
    const high = cosmicScenarioDataByRecipeId(36165, 100)!
    expect(low.recipe.progressRequired).toBeLessThan(high.recipe.progressRequired)
    expect(low.recipe.qualityMax).toBeLessThan(high.recipe.qualityMax)
    expect(low.recipe.durabilityMax).toBe(high.recipe.durabilityMax)
    expect(() => cosmicScenarioDataByRecipeId(36194, 50)).toThrow('requires level')
  })
  it('uses the same Rust transition for preview, color feedback and replay', () => {
    const { recipe } = cosmicScenarioDataByRecipeId(36165)!
    const initial = createInitialCraftState(recipe, crafter)
    const excellent = { ...initial, condition: 'excellent' as const }
    const normal = previewAction(recipe, crafter, initial, 'basicTouch')
    expect(previewAction(recipe, crafter, excellent, 'basicTouch').qualityGain).toBe(normal.qualityGain * 4)
    const direct = applyObservedOutcome(recipe, crafter, excellent, 'basicTouch', { success: true, nextCondition: 'poor' }).nextState
    const replay = replaySession(recipe, crafter, excellent, [
      { type: 'craftActionUsed', id: '1', at: 1, action: 'basicTouch', previousCondition: 'excellent' },
      { type: 'craftActionResolved', id: '2', at: 2, success: true, nextCondition: 'poor' },
    ], applyObservedOutcome)
    expect(replay.state).toEqual(direct)
    expect(direct.condition).toBe('poor')
    expect(applyObservedOutcome(recipe, crafter, direct, 'observe', { success: true, nextCondition: 'normal' }).nextState.condition).toBe('normal')
  })
})
