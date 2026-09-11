import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive, readonly } from 'vue'
import { WEB_PLANNER_POLICY, type PlannerAdvance } from '../apps/web/src/runtime/planner/protocol'
import { PlannerRuntime } from '../apps/web/src/runtime/planner/client'
import type {
  PlannerWorkerRequest,
  PlannerWorkerResponse,
} from '../apps/web/src/runtime/planner/workerContract'

class FakeWorker {
  static instance: FakeWorker

  onmessage: ((event: MessageEvent<PlannerWorkerResponse>) => void) | null = null
  onerror: ((event: ErrorEvent) => void) | null = null
  requests: PlannerWorkerRequest[] = []
  terminated = false

  constructor() {
    FakeWorker.instance = this
  }

  postMessage(request: PlannerWorkerRequest) {
    this.requests.push(structuredClone(request))
  }

  terminate() {
    this.terminated = true
  }

  respond(response: PlannerWorkerResponse) {
    this.onmessage?.({ data: response } as MessageEvent<PlannerWorkerResponse>)
  }
}

describe('browser planner deadlines', () => {
  it.each(['reset', 'continue', 'deviate'] as const)('sends replayed reactive budgets in %s requests', async mode => {
    const runtime = new PlannerRuntime()
    const initialization = runtime.initialize()
    const worker = FakeWorker.instance
    worker.respond({ id: worker.requests[0].id, ok: true, type: 'initialized' })
    await initialization

    const timeBudget = readonly(reactive({ remainingMilliseconds: 120000, expectedActionMilliseconds: 2500 }))
    const advance: PlannerAdvance = mode === 'reset'
      ? { mode, timeBudget }
      : { mode, action: 'observe', timeBudget }
    const result = runtime.recommend(advance, 'test-episode')
    await vi.advanceTimersByTimeAsync(0)
    const request = worker.requests.at(-1)!
    expect(request).toMatchObject({ type: 'recommend', advance })
    const reply = { action: 'observe', option: null, persona: null, policyVersion: WEB_PLANNER_POLICY, contextFingerprint: 'test' }
    worker.respond({ id: request.id, ok: true, type: 'recommendation', reply })
    await expect(result).resolves.toEqual(reply)
    await vi.advanceTimersByTimeAsync(3000)
    expect(worker.terminated).toBe(false)
    runtime.dispose()
  })

  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('Worker', FakeWorker)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('allows a slow mobile WASM download and compilation to finish after three seconds', async () => {
    const runtime = new PlannerRuntime()
    const initialization = runtime.initialize()
    const request = FakeWorker.instance.requests[0]

    await vi.advanceTimersByTimeAsync(4_000)
    expect(runtime.status.value).toBe('loading')
    expect(FakeWorker.instance.terminated).toBe(false)

    FakeWorker.instance.respond({ id: request.id, ok: true, type: 'initialized' })
    await expect(initialization).resolves.toBeUndefined()
    expect(runtime.status.value).toBe('ready')
  })

  it('keeps the three-second deadline for an actual recommendation', async () => {
    const runtime = new PlannerRuntime()
    const initialization = runtime.initialize()
    const initializeRequest = FakeWorker.instance.requests[0]
    FakeWorker.instance.respond({ id: initializeRequest.id, ok: true, type: 'initialized' })
    await initialization

    const recommendation = runtime.recommend(
      { mode: 'reset' },
      'native-generic-episode-batch-v7\ttest',
    )
    const rejection = expect(recommendation).rejects.toThrow(
      'Main solver exceeded its 3000ms deadline',
    )
    await vi.advanceTimersByTimeAsync(3_000)

    await rejection
    expect(FakeWorker.instance.terminated).toBe(true)
    expect(runtime.status.value).toBe('error')
  })

  it('can retry initialization after a Worker load error', async () => {
    const runtime = new PlannerRuntime()
    const firstInitialization = runtime.initialize()
    const firstRequest = FakeWorker.instance.requests[0]
    const firstRejection = expect(firstInitialization).rejects.toThrow('WASM unavailable')
    FakeWorker.instance.respond({ id: firstRequest.id, ok: false, error: 'WASM unavailable' })

    await firstRejection
    expect(runtime.status.value).toBe('error')

    const retry = runtime.initialize()
    const retryRequest = FakeWorker.instance.requests[1]
    expect(runtime.status.value).toBe('loading')
    FakeWorker.instance.respond({ id: retryRequest.id, ok: true, type: 'initialized' })

    await expect(retry).resolves.toBeUndefined()
    expect(runtime.status.value).toBe('ready')
  })
})
