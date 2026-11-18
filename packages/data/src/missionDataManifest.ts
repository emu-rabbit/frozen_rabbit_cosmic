export type DataLocale = 'tw' | 'cn' | 'en' | 'ja'
export type MissionDataUpdateSummary = Record<DataLocale, string[]>

export interface AssetDescriptor {
  file: string
  sha256: string
  bytes: number
}

export interface BundleDescriptor extends AssetDescriptor {
  jsonBytes: number
  encoding: 'gzip'
  records: number
}

interface MissionDataManifestIdentity {
  formatVersion: number
  sources: {
    teamcraft: { repository: string; commit: string }
    missions: { repository: string; commit: string }
    missionLocales: Record<Exclude<DataLocale, 'en'>, { repository: string; commit: string }>
    jobIcons: { provider: 'xivapi'; baseUrl: string }
    actionIcons: {
      provider: 'xivapi'
      repository: 'xivapi/ffxiv-datamining'
      commit: string
      assetBaseUrl: 'https://v2.xivapi.com/api/asset'
    }
    catalog: { identity: string; xivapiVersion: string }
  }
  bundle: BundleDescriptor
  notice: AssetDescriptor
  updateSummary?: MissionDataUpdateSummary
}

export interface MissionDataManifest extends MissionDataManifestIdentity {
  generator: string
  version: string
}

export function serializeMissionDataManifestIdentity({
  formatVersion, sources, bundle, notice, updateSummary,
}: MissionDataManifestIdentity): string {
  return JSON.stringify({ formatVersion, sources, bundle, notice, updateSummary })
}

export function isMissionDataUpdateSummary(summary: unknown): summary is MissionDataUpdateSummary {
  if (!summary || typeof summary !== 'object' || Array.isArray(summary) || Object.keys(summary).length !== 4) return false
  const { en, tw, cn, ja } = summary as Record<DataLocale, unknown>
  return Array.isArray(en) && en.length > 0 && en.length <= 10
    && [en, tw, cn, ja].every(lines => Array.isArray(lines) && lines.length === en.length
      && lines.every(line => typeof line === 'string' && line.trim().length > 0 && line.length <= 300))
}
