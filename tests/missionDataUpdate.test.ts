import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { serializeMissionDataManifestIdentity } from '../packages/data/src/missionDataManifest'
import type { CachedMissionData, MissionDataManifest } from '../apps/web/src/types/missionData'

const cache = vi.hoisted(() => ({
  readMissionDataCache: vi.fn<() => Promise<{ active?: CachedMissionData; pending?: CachedMissionData } | null>>(),
  saveMissionDataCache: vi.fn<(key: 'active' | 'pending', data: CachedMissionData, expectedActive?: string) => Promise<boolean>>(),
  clearMissionDataCache: vi.fn(),
}))
vi.mock('../apps/web/src/services/missionDataCache', () => cache)

const directory = new URL('../apps/web/public/mission-data/', import.meta.url)
const update: MissionDataManifest = JSON.parse(readFileSync(new URL('manifest.json', directory), 'utf8'))
const { updateSummary, ...manifest } = update
if (!updateSummary) throw new Error('expected the shipped update summary')
manifest.version = manifestChecksum(manifest)
const bytes = Uint8Array.from(readFileSync(new URL(manifest.bundle.file, directory))).buffer
const active = { manifest, bytes }

function manifestChecksum(value: MissionDataManifest) {
  return createHash('sha256').update(serializeMissionDataManifestIdentity(value)).digest('hex')
}

function serve(next: MissionDataManifest, bundle = bytes) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => url.endsWith('manifest.json')
    ? Response.json(next)
    : new Response(bundle)))
}

async function load() {
  const { useMissionData } = await import('../apps/web/src/services/missionData')
  const data = useMissionData()
  await data.load()
  return data
}

beforeEach(() => {
  vi.resetModules()
  cache.readMissionDataCache.mockReset().mockResolvedValue({ active })
  cache.saveMissionDataCache.mockReset().mockResolvedValue(true)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('announces only when a validated update is stored and keeps the active data until reload', async () => {
  const pendingWrite = Promise.withResolvers<boolean>()
  cache.saveMissionDataCache.mockImplementation(key => key === 'pending' ? pendingWrite.promise : Promise.resolve(true))
  serve(update)
  const data = await load()
  const missions = data.missions.value

  await vi.waitFor(() => expect(cache.saveMissionDataCache).toHaveBeenCalledWith('pending', { manifest: update, bytes }, manifest.version))
  expect(data.pendingUpdate.value).toBeNull()
  pendingWrite.resolve(true)
  await vi.waitFor(() => expect(data.pendingUpdate.value?.updateSummary).toEqual(updateSummary))
  expect(data.missions.value).toBe(missions)

  data.dismissUpdate()
  await data.load()
  expect(data.pendingUpdate.value).toBeNull()
  expect(cache.saveMissionDataCache).toHaveBeenCalledTimes(2)
})

it('keeps the reminder hidden if the pending cache write fails', async () => {
  cache.saveMissionDataCache.mockImplementation(async key => key === 'active')
  serve(update)
  const data = await load()
  await vi.waitFor(() => expect(data.cacheAvailable.value).toBe(false))
  expect(data.pendingUpdate.value).toBeNull()
  expect(data.missions.value).toHaveLength(manifest.bundle.records)
})

it('keeps using the cached data if the update bundle fails validation', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  serve(update, new ArrayBuffer(1))
  const data = await load()
  await vi.waitFor(() => expect(warn).toHaveBeenCalled())
  expect(cache.saveMissionDataCache).toHaveBeenCalledExactlyOnceWith('active', active, manifest.version)
  expect(data.pendingUpdate.value).toBeNull()
  expect(data.error.value).toBe(false)
})

it('accepts an older update without a summary', async () => {
  const legacy = structuredClone(manifest)
  legacy.sources.teamcraft.commit = 'a'.repeat(40)
  legacy.version = manifestChecksum(legacy)
  serve(legacy)
  const data = await load()

  await vi.waitFor(() => expect(data.pendingUpdate.value).toEqual(legacy))
})

it.each([
  { reason: 'summary text was changed without updating the checksum', tw: updateSummary.tw.map(() => '改過的摘要'), rehash: false },
  { reason: 'translations have different lengths', tw: [], rehash: true },
])('rejects an update when $reason', async ({ tw, rehash }) => {
  const altered = { ...update, updateSummary: { ...updateSummary, tw } }
  if (rehash) altered.version = manifestChecksum(altered)
  serve(altered)
  cache.readMissionDataCache.mockResolvedValue(null)
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  await expect(load()).rejects.toThrow('no usable mission data')
  expect(warn).toHaveBeenCalledOnce()
  expect(cache.saveMissionDataCache).not.toHaveBeenCalled()
})
