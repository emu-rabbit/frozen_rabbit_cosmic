import type { CraftActionId } from '@frozen-rabbit-expert/domain'
import type { DataLocale, MissionDataManifest } from '@frozen-rabbit-expert/data'

export type { AssetDescriptor, BundleDescriptor, DataLocale, MissionDataManifest } from '@frozen-rabbit-expert/data'
export type LocalizedNames = Partial<Record<DataLocale, string>>
export type CraftJob = 'carpenter' | 'blacksmith' | 'armorer' | 'goldsmith' | 'leatherworker' | 'weaver' | 'alchemist' | 'culinarian'
export type MissionRank = 'a' | 'ex' | 'ex-plus' | 'master'
export type MissionPlanet = 'sinus-ardorum' | 'phaenna' | 'oizys' | 'auxesia'
export type MissionType = 'timed' | 'weather'

export const MISSION_DATA_FORMAT = 5
export const CRAFT_JOBS: CraftJob[] = [
  'carpenter', 'blacksmith', 'armorer', 'goldsmith',
  'leatherworker', 'weaver', 'alchemist', 'culinarian',
]
export const MISSION_RANKS: MissionRank[] = ['a', 'ex', 'ex-plus', 'master']
export const MISSION_PLANETS: MissionPlanet[] = ['sinus-ardorum', 'phaenna', 'oizys', 'auxesia']
export const MISSION_TYPES: MissionType[] = ['timed', 'weather']

export interface MissionItem {
  recipeId: number
  itemId: number
  names: LocalizedNames
  icon: string
}

export interface CosmicMission {
  isExpert: boolean
  id: number
  /** WKSMissionUnit.MissionTime; total allowance, not remaining time. Zero means no time limit. */
  timeLimitSeconds: number
  names: LocalizedNames
  job: CraftJob
  jobId: number
  jobIcon: string
  rank: MissionRank
  planet: MissionPlanet
  types: MissionType[]
  items: MissionItem[]
  nextMissionId?: number
}

export interface MissionBundle {
  formatVersion: number
  catalogIdentity: string
  missions: CosmicMission[]
  consumables: {
    food: CraftingConsumable[]
    medicine: CraftingConsumable[]
  }
  actionIcons: Record<CraftJob, Record<CraftActionId, string>>
}

export interface CraftingConsumableBonus {
  stat: 'craftsmanship' | 'control' | 'maxCp'
  relative: true
  nq: { percent: number; max: number }
  hq: { percent: number; max: number }
}

export interface CraftingConsumable {
  itemId: number
  itemLevel: number
  names: LocalizedNames
  icon: string
  bonuses: CraftingConsumableBonus[]
}

export interface CachedMissionData {
  manifest: MissionDataManifest
  bytes: ArrayBuffer
}
