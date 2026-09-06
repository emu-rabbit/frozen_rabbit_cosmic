import type { PlannerTimeBudget } from '@frozen-rabbit-expert/protocol'
export type { PlannerTimeBudget } from '@frozen-rabbit-expert/protocol'

export const WEB_PLANNER_ABI = 'rust-web-planner-abi-v2'
export const WEB_PLANNER_POLICY = 'generic-craft-external-reference-v2.4.0'
export const WEB_PLANNER_MAX_INPUT_BYTES = 64 * 1024

export type PlannerAdvance = (
  | { mode: 'reset' }
  | { mode: 'continue' | 'deviate'; action: string }
) & { timeBudget?: PlannerTimeBudget }

export interface PlannerReply {
  action: string | null
  option: string | null
  persona: string | null
  policyVersion: typeof WEB_PLANNER_POLICY
  contextFingerprint: string
}

const optionalCell = (cell: string) => cell === '-' ? null : cell

export function serializePlannerRequest(advance: PlannerAdvance, episode: string): string {
  const trimmedEpisode = episode.trimEnd()
  if (!trimmedEpisode || /[\r\n]/u.test(trimmedEpisode)) {
    throw new Error('Planner episode must contain exactly one non-empty TSV row')
  }

  const cells = trimmedEpisode.split('\t')
  if (cells[3] !== WEB_PLANNER_POLICY) {
    throw new Error(`Planner episode must use ${WEB_PLANNER_POLICY}`)
  }

  const advanceCell = advance.mode === 'reset'
    ? 'reset'
    : `${advance.mode}:${advance.action}`
  const budget = advance.timeBudget
  if (budget && (!Number.isSafeInteger(budget.remainingMilliseconds) || budget.remainingMilliseconds < 0
    || !Number.isInteger(budget.expectedActionMilliseconds) || budget.expectedActionMilliseconds <= 0
    || budget.expectedActionMilliseconds > 0xffff_ffff)) {
    throw new Error('Planner time budget requires nonnegative remaining time and positive action time')
  }
  const prefix = budget ? `time-budget:${budget.remainingMilliseconds}:${budget.expectedActionMilliseconds}\t` : ''
  const request = `${prefix}${advanceCell}\t${trimmedEpisode}`
  if (new TextEncoder().encode(request).byteLength > WEB_PLANNER_MAX_INPUT_BYTES) {
    throw new Error('Planner request exceeds the Rust ABI input limit')
  }
  return request
}

export function parsePlannerReply(row: string): PlannerReply {
  const cells = row.trimEnd().split('\t')
  if (cells[0] !== WEB_PLANNER_ABI) {
    throw new Error(`Unexpected Web planner ABI: ${cells[0] ?? 'missing'}`)
  }
  if (cells[1] === 'error') {
    throw new Error(cells[2] || 'Rust Web planner returned an unspecified error')
  }
  if (cells.length !== 7 || cells[1] !== 'ok') {
    throw new Error('Rust Web planner returned an invalid reply')
  }
  if (cells[2] !== WEB_PLANNER_POLICY) {
    throw new Error(`Unexpected solver policy: ${cells[2]}`)
  }

  return {
    policyVersion: WEB_PLANNER_POLICY,
    action: optionalCell(cells[3] ?? '-'),
    option: optionalCell(cells[4] ?? '-'),
    persona: optionalCell(cells[5] ?? '-'),
    contextFingerprint: cells[6] ?? '',
  }
}
