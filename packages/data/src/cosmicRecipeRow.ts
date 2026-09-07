import type { CraftingJob, RecipeProfile } from '@frozen-rabbit-expert/domain'

export interface CosmicRecipeRow {
  recipeId: number
  itemId: number
  itemIconId: number
  nameEn: string
  job: Exclude<CraftingJob, 'unknown'>
  missionIds: readonly number[]
  missionNamesEn: readonly string[]
  recipeLevelTableId: number
  recipeLevel: number
  progressRequired: number
  qualityMax: number
  requiredQuality: number
  durabilityMax: number
  progressDivider: number
  qualityDivider: number
  progressModifier: number
  qualityModifier: number
  recommendedCraftsmanship: number
  conditionsFlag: number
  qualityOutcome: RecipeProfile['qualityOutcome']
  mechanicsFamilyId: string
  isExpert: boolean
  maxAdjustableJobLevel: number
  difficultyFactor: number
  qualityFactor: number
  qualityPercentages: readonly number[]
  levelGroup: number
}
