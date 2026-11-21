import type { CraftingJob, RecipeProfile } from '@frozen-rabbit-expert/domain'

/** Normalized, pinned Recipe + WKS membership data emitted by the importer. */
export interface CosmicRecipeRecord {
  recipeId: number
  isExpert: boolean
  itemId: number
  itemIconId: number
  nameEn: string
  job: CraftingJob
  missionIds: readonly number[]
  missionNamesEn: readonly string[]
  recipeLevelTableId: number
  recipeLevel: number
  difficultyBase: number
  difficultyFactor: number
  progressRequired: number
  qualityBase: number
  qualityFactor: number
  qualityMax: number
  requiredQuality: number
  durabilityBase: number
  durabilityFactor: number
  durabilityMax: number
  progressDivider: number
  qualityDivider: number
  progressModifier: number
  qualityModifier: number
  recommendedCraftsmanship: number
  requiredCraftsmanship: number
  requiredControl: number
  conditionsFlag: number
  isCollectable: boolean
  canBeHq: boolean
  qualityOutcome: RecipeProfile['qualityOutcome']
  mechanicsFamilyId: string
}
