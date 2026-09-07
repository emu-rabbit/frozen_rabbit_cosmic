import { ACTIONS, assertCraftState, type ActionPreview, type CraftActionId, type CraftState, type CrafterProfile, type MaterialCondition, type ObservedActionOutcome, type RecipeProfile, type TransitionResult } from '@frozen-rabbit-expert/domain'
import { encodeState } from './episode'

export const WEB_MECHANICS_VERSION = 'cosmic-craft-mechanics-v0.6.0-ordinary-conditions'
interface MechanicsExports extends WebAssembly.Exports {
  memory: WebAssembly.Memory
  frozen_rabbit_web_input_resize(length: number): number
  frozen_rabbit_web_input_ptr(): number
  frozen_rabbit_web_mechanics(): number
  frozen_rabbit_web_output_ptr(): number
  frozen_rabbit_web_output_len(): number
}
const encoder = new TextEncoder(); const decoder = new TextDecoder()
let wasm: MechanicsExports | undefined
let loading: Promise<void> | undefined

function call(request: string): string {
  if (!wasm) throw new Error('Rust mechanics is not initialized')
  const bytes = encoder.encode(request)
  if (wasm.frozen_rabbit_web_input_resize(bytes.length) !== 0) throw new Error('Mechanics input exceeds limit')
  new Uint8Array(wasm.memory.buffer, wasm.frozen_rabbit_web_input_ptr(), bytes.length).set(bytes)
  const status = wasm.frozen_rabbit_web_mechanics()
  const text = decoder.decode(new Uint8Array(wasm.memory.buffer, wasm.frozen_rabbit_web_output_ptr(), wasm.frozen_rabbit_web_output_len())).trimEnd()
  if (status !== 0) throw new Error(text)
  return text
}

/** A separate instance performs only bounded mechanics, never a solver search. */
export async function initializeMechanics(bytes?: BufferSource): Promise<void> {
  if (wasm) return
  if (loading) return loading
  loading = (async () => {
    if (!bytes) {
      const response = await fetch(new URL('../wasm/frozen_rabbit_craft_kernel_web.wasm', import.meta.url), { signal: AbortSignal.timeout(30_000) })
      if (!response.ok) throw new Error(`Unable to load Rust mechanics (${response.status})`)
      bytes = await response.arrayBuffer()
    }
    const { instance } = await WebAssembly.instantiate(bytes, {})
    if (typeof instance.exports.frozen_rabbit_web_mechanics !== 'function') throw new Error('Rust mechanics export is missing')
    wasm = instance.exports as MechanicsExports
    if (call('identity') !== WEB_MECHANICS_VERSION) { wasm = undefined; throw new Error('Rust mechanics identity mismatch') }
  })().finally(() => { loading = undefined })
  return loading
}

function request(recipe: RecipeProfile, crafter: CrafterProfile, state: CraftState, action: CraftActionId, observed?: ObservedActionOutcome) {
  const cells = ['native-transition-batch-v2', 'web', observed ? 'apply' : 'preview',
    recipe.canonicalRecipeId, recipe.recipeLevel, recipe.progressRequired, recipe.qualityMax, recipe.requiredQuality, recipe.durabilityMax,
    recipe.progressDivider, recipe.qualityDivider, recipe.progressModifier, recipe.qualityModifier,
    crafter.level, crafter.craftsmanship, crafter.control, crafter.maxCp, Number(crafter.cosmicToolGoodBonus === true), Number(crafter.specialist === true),
    ...encodeState(state), action,
    ...(observed ? [Number(observed.success), observed.nextCondition] : []),
  ]
  const reply = call(cells.join('\t')).split('\t')
  if (reply[0] !== 'native-transition-batch-v2' || reply[3] !== 'ok') throw new Error(reply[4] ?? 'Invalid Rust mechanics response')
  return reply
}

export function previewAction(recipe: RecipeProfile, crafter: CrafterProfile, state: CraftState, action: CraftActionId): ActionPreview {
  const cells = request(recipe, crafter, state, action)
  return { action: ACTIONS[action], legal: cells[4] === '1', ...(cells[5] === '-' ? {} : { reason: cells[5] }), cpCost: Number(cells[6]), durabilityCost: Number(cells[7]), successRate: Number(cells[8]), progressGain: Number(cells[9]), qualityGain: Number(cells[10]) }
}

export function applyObservedOutcome(recipe: RecipeProfile, crafter: CrafterProfile, state: CraftState, action: CraftActionId, observed: ObservedActionOutcome): TransitionResult {
  const cells = request(recipe, crafter, state, action, observed)
  const s = cells.slice(13, 37)
  if (s.length !== 24) throw new Error('Invalid Rust state arity')
  const number = (i: number) => Number(s[i])
  const nextState: CraftState = {
    step: number(0), progress: number(1), quality: number(2), durability: number(3), cp: number(4), condition: s[5] as MaterialCondition, innerQuiet: number(6),
    buffs: { wasteNot: number(7), veneration: number(8), greatStrides: number(9), innovation: number(10), finalAppraisal: number(11), manipulation: number(12), muscleMemory: number(13), expedience: number(14) },
    comboFrom: s[15] === '-' ? null : s[15] as CraftActionId,
    trainedPerfectionAvailable: s[16] === '1', trainedPerfectionActive: s[17] === '1', carefulObservationUsesLeft: number(18), heartAndSoulAvailable: s[19] === '1', heartAndSoulActive: s[20] === '1', quickInnovationAvailable: s[21] === '1', terminal: s[22] as CraftState['terminal'], failureReason: s[23] === '-' ? null : s[23] as CraftState['failureReason'],
  }
  assertCraftState(recipe, crafter, nextState)
  return { nextState, explanationCodes: cells[37] === '-' ? [] : cells[37]!.split(',') }
}

export function legalActions(recipe: RecipeProfile, crafter: CrafterProfile, state: CraftState): CraftActionId[] {
  return (Object.keys(ACTIONS) as CraftActionId[]).filter(action => previewAction(recipe, crafter, state, action).legal)
}
