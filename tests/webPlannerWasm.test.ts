import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { COSMIC_EXPERT_SCENARIO_DATA, cosmicExpertScenarioDataByRecipeId } from '@frozen-rabbit-expert/data'
import {
  previewAction,
  applyObservedOutcome,
  createInitialCraftState,
  type CraftActionId,
  type CrafterProfile,
} from '@frozen-rabbit-expert/domain'
import {
  parsePlannerReply,
  serializePlannerRequest,
  WEB_PLANNER_ABI,
  WEB_PLANNER_POLICY,
} from '../apps/web/src/runtime/planner/protocol'
import { createPlannerEpisode } from '../apps/web/src/runtime/planner/episode'

interface PlannerWasmExports extends WebAssembly.Exports {
  memory: WebAssembly.Memory
  frozen_rabbit_web_input_resize(length: number): number
  frozen_rabbit_web_input_ptr(): number
  frozen_rabbit_web_recommend(): number
  frozen_rabbit_web_output_ptr(): number
  frozen_rabbit_web_output_len(): number
  frozen_rabbit_web_reset_session(): void
}

const repositoryRoot = path.resolve(import.meta.dirname, '..')
const wasmPath = path.join(
  repositoryRoot,
  'apps', 'web', 'src', 'runtime', 'wasm', 'frozen_rabbit_craft_kernel_web.wasm',
)
const fixturePath = path.join(
  repositoryRoot,
  'native', 'craft-kernel', 'tests', 'fixtures', 'web-bridge-f36-prefix.tsv',
)

async function loadWasm(): Promise<PlannerWasmExports> {
  const bytes = readFileSync(wasmPath)
  const { instance } = await WebAssembly.instantiate(bytes, {})
  return instance.exports as PlannerWasmExports
}

function recommend(exports: PlannerWasmExports, request: string) {
  const encoded = new TextEncoder().encode(request)
  expect(exports.frozen_rabbit_web_input_resize(encoded.byteLength)).toBe(0)
  const pointer = exports.frozen_rabbit_web_input_ptr()
  new Uint8Array(exports.memory.buffer, pointer, encoded.byteLength).set(encoded)
  exports.frozen_rabbit_web_recommend()
  const outputPointer = exports.frozen_rabbit_web_output_ptr()
  const outputLength = exports.frozen_rabbit_web_output_len()
  return new TextDecoder().decode(
    new Uint8Array(exports.memory.buffer, outputPointer, outputLength).slice(),
  )
}

describe('time-budgeted Web planner boundary', () => {
  it('accepts an omitted, ample, and zero time budget without inventing a craft stop', async () => {
    const scenario = cosmicExpertScenarioDataByRecipeId(37006)!
    const crafter: CrafterProfile = { level: 100, craftsmanship: 5408, control: 5237, maxCp: 749, cosmicToolGoodBonus: true, specialist: true }
    const episode = createPlannerEpisode(scenario, crafter, createInitialCraftState(scenario.recipe, crafter))
    const exports = await loadWasm()
    for (const timeBudget of [undefined, { remainingMilliseconds: 600000, expectedActionMilliseconds: 5300 }, { remainingMilliseconds: 0, expectedActionMilliseconds: 5300 }]) {
      const result = parsePlannerReply(recommend(exports, serializePlannerRequest({ mode: 'reset', ...(timeBudget ? { timeBudget } : {}) }, episode)))
      expect(result.action).not.toBeNull()
      expect(result.contextFingerprint.includes(':time-budget:')).toBe(timeBudget !== undefined)
    }
    expect(() => serializePlannerRequest({ mode: 'reset', timeBudget: { remainingMilliseconds: -1, expectedActionMilliseconds: 5300 } }, episode)).toThrow('time budget')
    expect(() => serializePlannerRequest({ mode: 'reset', timeBudget: { remainingMilliseconds: 1, expectedActionMilliseconds: 0 } }, episode)).toThrow('time budget')
    expect(() => parsePlannerReply(recommend(exports, `time-budget:5:0\treset\t${episode}`))).toThrow('positive')
  })
  it('loads the production WASM and returns a version-checked recommendation', async () => {
    expect(WEB_PLANNER_POLICY).toBe('generic-craft-external-reference-v2.4.0')
    const exports = await loadWasm()
    const fixturePrefix = readFileSync(fixturePath, 'utf8').trim().replace(
      'generic-craft-route-portfolio-v1.12.0',
      WEB_PLANNER_POLICY,
    )
    const episode = `${fixturePrefix}\t1\t1\t1\t1\t1\t1\t1\t1\t0`
    const row = recommend(exports, serializePlannerRequest({ mode: 'reset' }, episode))
    const reply = parsePlannerReply(row)

    expect(row.startsWith(`${WEB_PLANNER_ABI}\tok\t${WEB_PLANNER_POLICY}\t`)).toBe(true)
    expect(reply.policyVersion).toBe(WEB_PLANNER_POLICY)
    expect(reply.action).not.toBeNull()
    expect(reply.contextFingerprint).not.toBe('')
  })

  it('runs the standard recipe through the production WASM with Excellent, Poor, deviation and reset', async () => {
    const scenario = cosmicExpertScenarioDataByRecipeId(37041)!
    const crafter: CrafterProfile = { level: 100, craftsmanship: 5408, control: 5237, maxCp: 722, specialist: true }
    const exports = await loadWasm()
    let state = createInitialCraftState(scenario.recipe, crafter)
    let mode: 'reset' | 'continue' | 'deviate' = 'reset'
    let lastAction: CraftActionId = 'observe'
    for (let step = 0; step < 80 && state.terminal === 'none'; step++) {
      const reply = parsePlannerReply(recommend(exports, serializePlannerRequest(
        mode === 'reset' ? { mode } : { mode, action: lastAction },
        createPlannerEpisode(scenario, crafter, state),
      )))
      expect(reply.action).not.toBeNull()
      const actual = step === 2 ? 'observe' : reply.action as CraftActionId
      state = applyObservedOutcome(scenario.recipe, crafter, state, actual, {
        success: true, nextCondition: step % 7 === 1 ? 'excellent' : 'normal',
      }).nextState
      lastAction = actual
      mode = step === 2 ? 'deviate' : 'continue'
    }
    expect(state.terminal).toBe('completed')
    expect(state.quality).toBe(scenario.recipe.qualityMax)
    const reset = parsePlannerReply(recommend(exports, serializePlannerRequest({ mode: 'reset' },
      createPlannerEpisode(scenario, crafter, createInitialCraftState(scenario.recipe, crafter)))))
    expect(reset.action).not.toBeNull()
  }, 15000)

  it('covers all 25 added mechanics families in bounded closed loops', async () => {
    const families = [...new Map(COSMIC_EXPERT_SCENARIO_DATA.filter(s => s.recipe.isExpert === false && s.missionNamesEn.some(name => /^EX(?:\+)?:/.test(name)))
      .map(s => [s.recipe.recipeFamilyId, s])).values()]
    expect(families).toHaveLength(25)
    const exports = await loadWasm()
    const results: { recipe: number; family: string; outcome: string; colored: boolean; terminal: string; quality: number; qualityMax: number; actions: number }[] = []
    for (const scenario of families) {
      for (const colored of [false, true]) {
        const crafter: CrafterProfile = { level: 100, craftsmanship: 5408, control: 5237, maxCp: 722, specialist: false }
        let state = createInitialCraftState(scenario.recipe, crafter)
        let last: CraftActionId | null = null
        let actions = 0
        while (state.terminal === 'none' && actions < 80) {
          const reply = parsePlannerReply(recommend(exports, serializePlannerRequest(
            last ? { mode: 'continue', action: last } : { mode: 'reset' },
            createPlannerEpisode(scenario, crafter, state))))
          expect(reply.action, 'recipe ' + scenario.recipe.canonicalRecipeId).not.toBeNull()
          last = reply.action as CraftActionId
          expect(previewAction(scenario.recipe, crafter, state, last).legal).toBe(true)
          const pool = scenario.recipe.randomConditions!
          state = applyObservedOutcome(scenario.recipe, crafter, state, last, {
            success: true, nextCondition: colored ? pool[actions % pool.length]! : 'normal',
          }).nextState
          actions++
        }
        results.push({ recipe: scenario.recipe.canonicalRecipeId, family: scenario.recipe.recipeFamilyId, outcome: scenario.recipe.qualityOutcome, colored, terminal: state.terminal, quality: state.quality, qualityMax: scenario.recipe.qualityMax, actions })
      }
    }
    if (process.env.NONEXPERT_SMOKE_REPORT) writeFileSync(process.env.NONEXPERT_SMOKE_REPORT, JSON.stringify({
      kind: 'bounded-synthetic-fixed-tape-not-natural-success-rate',
      wasmSha256: createHash('sha256').update(readFileSync(wasmPath)).digest('hex'),
      policy: WEB_PLANNER_POLICY,
      equipment: { level: 100, craftsmanship: 5408, control: 5237, maxCp: 722, specialist: false, cosmicToolGoodBonus: false },
      actionLimit: 80, successAssumption: 'all-actions-succeed',
      worlds: ['all-normal', 'cyclic-declared-random-colors'],
      results,
    }, null, 2) + '\n')
    expect(results).toHaveLength(50)
  }, 60000)

  it('solves an unlabelled Class A recipe with the production WASM', async () => {
    const scenario = cosmicExpertScenarioDataByRecipeId(36192)!
    const crafter: CrafterProfile = { level: 100, craftsmanship: 5408, control: 5237, maxCp: 722 }
    const exports = await loadWasm()
    let state = createInitialCraftState(scenario.recipe, crafter)
    let last: CraftActionId | null = null
    for (let step = 0; step < 80 && state.terminal === 'none'; step++) {
      const reply = parsePlannerReply(recommend(exports, serializePlannerRequest(
        last ? { mode: 'continue', action: last } : { mode: 'reset' },
        createPlannerEpisode(scenario, crafter, state))))
      expect(reply.action).not.toBeNull()
      last = reply.action as CraftActionId
      expect(previewAction(scenario.recipe, crafter, state, last).legal).toBe(true)
      state = applyObservedOutcome(scenario.recipe, crafter, state, last, {success: true, nextCondition: 'normal'}).nextState
    }
    expect(state.terminal).toBe('completed')
    expect(state.quality).toBe(scenario.recipe.qualityMax)
  }, 15000)

  it('fails closed when a different policy is serialized', () => {
    expect(() => serializePlannerRequest(
      { mode: 'reset' },
      'native-generic-episode-batch-v7\tcase\tepisode\tgeneric-craft-route-portfolio-v1.1.0',
    )).toThrow(`must use ${WEB_PLANNER_POLICY}`)
  })

  it('accepts a live Web session row generated from catalog data', async () => {
    const scenario = cosmicExpertScenarioDataByRecipeId(37_006)
    expect(scenario).not.toBeNull()
    const crafter: CrafterProfile = {
      level: 100,
      craftsmanship: 5_408,
      control: 5_237,
      maxCp: 749,
      cosmicToolGoodBonus: true,
      specialist: true,
    }
    const state = createInitialCraftState(scenario!.recipe, crafter)
    const episode = createPlannerEpisode(scenario!, crafter, state)
    expect(episode.split('\t')).toHaveLength(182)

    const exports = await loadWasm()
    const row = recommend(exports, serializePlannerRequest({ mode: 'reset' }, episode))
    const first = parsePlannerReply(row)
    expect(first.action).not.toBeNull()

    const nextState = applyObservedOutcome(
      scenario!.recipe,
      crafter,
      state,
      first.action as CraftActionId,
      { success: true, nextCondition: 'normal' },
    ).nextState
    const continued = recommend(exports, serializePlannerRequest(
      { mode: 'continue', action: first.action! },
      createPlannerEpisode(scenario!, crafter, nextState),
    ))
    expect(parsePlannerReply(continued).action).not.toBeNull()
  })
})
