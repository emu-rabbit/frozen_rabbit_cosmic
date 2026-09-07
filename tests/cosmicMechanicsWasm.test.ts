import { readFileSync, writeFileSync } from 'node:fs'
import { beforeAll, describe, expect, it } from 'vitest'
import { cosmicScenarioDataByRecipeId, COSMIC_SCENARIO_DATA, COSMIC_MECHANICS_FAMILIES, GENERATED_COSMIC_RECIPES } from '@frozen-rabbit-expert/data'
import { createInitialCraftState, type CrafterProfile, type CraftActionId, type MaterialCondition } from '@frozen-rabbit-expert/domain'
import { replaySession } from '@frozen-rabbit-expert/protocol'
import { initializeMechanics, previewAction, applyObservedOutcome } from '../apps/web/src/runtime/planner/mechanics'
import { createPlannerEpisode } from '../apps/web/src/runtime/planner/episode'
import { parsePlannerReply, serializePlannerRequest } from '../apps/web/src/runtime/planner/protocol'

const crafter: CrafterProfile = { level: 100, craftsmanship: 5000, control: 5000, maxCp: 600, specialist: false }
beforeAll(async () => { await initializeMechanics(readFileSync('apps/web/src/runtime/wasm/frozen_rabbit_craft_kernel_web.wasm')) })

describe('all Cosmic catalog and authoritative mechanics', () => {
  it('closes representative ordinary crafts across levels and forced-color tapes', async () => {
    const { instance } = await WebAssembly.instantiate(readFileSync('apps/web/src/runtime/wasm/frozen_rabbit_craft_kernel_web.wasm'), {})
    const w = instance.exports as any
    const request = (text: string) => {
      const bytes = new TextEncoder().encode(text)
      expect(w.frozen_rabbit_web_input_resize(bytes.length)).toBe(0)
      new Uint8Array(w.memory.buffer, w.frozen_rabbit_web_input_ptr(), bytes.length).set(bytes)
      expect(w.frozen_rabbit_web_recommend()).toBe(0)
      return parsePlannerReply(new TextDecoder().decode(new Uint8Array(w.memory.buffer, w.frozen_rabbit_web_output_ptr(), w.frozen_rabbit_web_output_len())))
    }
    const results = []
    const selectedFamilies = new Set<string>()
    const representatives = GENERATED_COSMIC_RECIPES.filter(row => {
      if (row.conditionsFlag !== 15 || selectedFamilies.has(row.mechanicsFamilyId)) return false
      selectedFamilies.add(row.mechanicsFamilyId)
      return true
    })
    for (const level of [10, 30, 50, 70, 90, 100]) {
      const cases = level === 100 ? representatives : representatives.filter(r => r.maxAdjustableJobLevel > 0).sort((a,b) => b.qualityMax / b.durabilityMax - a.qualityMax / a.durabilityMax).slice(0, 4)
      for (const { recipeId } of cases) {
        const scenario = cosmicScenarioDataByRecipeId(recipeId, level)!
        for (const band of [1, 1.5]) for (const tape of ['normal', 'colors'] as const) {
          const profile = { ...crafter, level, craftsmanship: Math.max(40, Math.round((scenario.recipe.recommendedCraftsmanship ?? 100) * band)), control: Math.max(40, Math.round((scenario.recipe.recommendedCraftsmanship ?? 100) * band)), maxCp: level < 50 ? 300 : 600 }
          let state = { ...createInitialCraftState(scenario.recipe, profile), trainedPerfectionAvailable: level === 100 }
          let actionCount = 0
          let reply = request(serializePlannerRequest({ mode: 'reset' }, createPlannerEpisode(scenario, profile, state)))
          while (state.terminal === 'none' && actionCount < 80) {
            expect(reply.action, JSON.stringify({ level, recipeId, band, tape, state })).not.toBeNull()
            const action = reply.action! as CraftActionId
            const preview = previewAction(scenario.recipe, profile, state, action)
            expect(preview.legal).toBe(true)
            const nextCondition: MaterialCondition = state.condition === 'excellent' ? 'poor' : state.condition === 'poor' || state.condition === 'good' ? 'normal' : tape === 'colors' && actionCount % 4 === 0 ? 'excellent' : 'normal'
            const success = preview.successRate === 1 || actionCount % 2 === 0
            state = applyObservedOutcome(scenario.recipe, profile, state, action, { success, nextCondition }).nextState
            actionCount++
            if (state.terminal === 'none') reply = request(serializePlannerRequest({ mode: 'continue', action }, createPlannerEpisode(scenario, profile, state)))
          }
          results.push({ level, recipeId, band, tape, terminal: state.terminal, quality: state.quality / scenario.recipe.qualityMax, actions: actionCount })
        }
      }
    }
    if (process.env.STANDARD_SCREEN_OUTPUT) writeFileSync(process.env.STANDARD_SCREEN_OUTPUT, JSON.stringify(results, null, 2))
    expect(results.every(r => r.terminal !== 'none')).toBe(true)
  }, 60_000)
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
