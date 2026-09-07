import type { CraftObjective, MaterialCondition, RecipeProfile, SourceMetadata } from '@frozen-rabbit-expert/domain'
import { COSMIC_EXPERT_SCENARIO_DATA, type CosmicExpertScenarioDataEntry } from './cosmicExpertCatalog'
import { COSMIC_GENERATED_SOURCE, COSMIC_LEVEL_TABLES, GENERATED_COSMIC_RECIPES } from './generated/cosmicRecipes.generated'

export { COSMIC_GENERATED_SOURCE, GENERATED_COSMIC_RECIPES }
export const COSMIC_CATALOG_VERSION = `cosmic-catalog-${COSMIC_GENERATED_SOURCE.catalogIdentitySha256.slice(0, 16)}-v1`
const experts = new Map(COSMIC_EXPERT_SCENARIO_DATA.map(entry => [entry.recipe.canonicalRecipeId, entry]))
const rows = new Map<number, (typeof GENERATED_COSMIC_RECIPES)[number]>(GENERATED_COSMIC_RECIPES.map(row => [row.recipeId, row]))
const flags: readonly (readonly [number, MaterialCondition])[] = [[1, 'normal'], [2, 'good'], [4, 'excellent'], [8, 'poor'], [16, 'centered'], [32, 'sturdy'], [64, 'pliant'], [128, 'malleable'], [256, 'primed'], [512, 'goodOmen'], [1024, 'robust']]

export function cosmicScenarioDataByRecipeId(recipeId: number, crafterLevel = 100): CosmicExpertScenarioDataEntry | null {
  if (!Number.isInteger(crafterLevel) || crafterLevel < 1 || crafterLevel > 100) throw new Error('Crafter level must be 1–100')
  const raw = rows.get(recipeId)
  if (!raw) return null
  const expert = experts.get(recipeId)
  if (expert) {
    if (crafterLevel < raw.recipeLevel) throw new Error(`Recipe ${recipeId} requires level ${raw.recipeLevel}`)
    return expert
  }
  const level = raw.maxAdjustableJobLevel > 0 && crafterLevel < raw.maxAdjustableJobLevel
    ? COSMIC_LEVEL_TABLES[crafterLevel - 1] : undefined
  if (!level && crafterLevel < raw.recipeLevel) throw new Error(`Recipe ${recipeId} requires level ${raw.recipeLevel}`)
  const conditionsFlag = level?.ConditionsFlag ?? raw.conditionsFlag
  if (conditionsFlag & ~2047) throw new Error(`Unknown conditions ${conditionsFlag}`)
  const availableConditions = flags.filter(([flag]) => conditionsFlag & flag).map(([, condition]) => condition)
  if (availableConditions.includes('robust') && !availableConditions.includes('sturdy')) availableConditions.push('sturdy')
  const source: SourceMetadata = {
    sourceKind: 'datamined', confidence: 'verified', patch: '7.55', verifiedAt: '2026-09-07',
    sourceUrl: `https://github.com/xivapi/ffxiv-datamining/tree/${COSMIC_GENERATED_SOURCE.wksMissionUnitRevision}/csv/en`,
    sourceRevision: COSMIC_CATALOG_VERSION,
    notes: ['WKS membership、Recipe、RecipeLevelTable 與收藏門檻來自固定版本遊戲資料；自然球色機率不在此資料的保證範圍。'],
  }
  const profileId = `cosmic-recipe-${recipeId}-level-${crafterLevel}-${COSMIC_GENERATED_SOURCE.catalogIdentitySha256.slice(0, 16)}`
  const recipe: RecipeProfile = {
    profileId, canonicalRecipeId: recipeId, canonicalItemId: raw.itemId, itemIconId: raw.itemIconId,
    identityConfidence: 'verified', recipeFamilyId: level ? `${raw.mechanicsFamilyId}-level-${crafterLevel}` : raw.mechanicsFamilyId,
    missionFamily: `cosmic-exploration-wks-${raw.missionIds.join('-')}`, displayName: raw.nameEn, displayNameEn: raw.nameEn, job: raw.job,
    recipeLevel: level?.['#'] ?? raw.recipeLevelTableId,
    progressRequired: level ? Math.floor(level.Difficulty * raw.difficultyFactor / 100) : raw.progressRequired,
    qualityMax: level ? Math.floor(level.Quality * raw.qualityFactor / 100) : raw.qualityMax,
    requiredQuality: raw.requiredQuality, durabilityMax: raw.durabilityMax,
    progressDivider: level?.ProgressDivider ?? raw.progressDivider, qualityDivider: level?.QualityDivider ?? raw.qualityDivider,
    progressModifier: level?.ProgressModifier ?? raw.progressModifier, qualityModifier: level?.QualityModifier ?? raw.qualityModifier,
    recommendedCraftsmanship: level?.SuggestedCraftsmanship ?? raw.recommendedCraftsmanship,
    availableConditions, randomConditions: flags.filter(([flag, condition]) => conditionsFlag & flag && condition !== 'poor').map(([, condition]) => condition),
    qualityOutcome: raw.qualityOutcome, conditionProfileId: 'manual-cosmic-all-conditions-v1', source,
  }
  const percentages = [...raw.qualityPercentages].filter(p => p > 0 && p < 100)
  const thresholds = [...new Set(percentages.map(p => Math.floor(recipe.qualityMax * p / 1000) * 10))].filter(q => q > 0 && q < recipe.qualityMax)
  const ids = ['scored', 'mid', 'high'] as const
  const objective: CraftObjective = {
    objectiveId: `${profileId}-objective`, recipeProfileId: profileId,
    mode: recipe.requiredQuality > 0 ? 'required-quality' : 'maximize-quality-with-safe-completion',
    qualityTiers: recipe.qualityOutcome === 'hq-chance' ? [] : [
      ...(recipe.qualityOutcome === 'collectability' ? thresholds.map((q, i) => ({ id: ids[i]!, minimumQuality: q, minimumCollectability: q / 10 })) : []),
      { id: 'maximum', minimumQuality: recipe.qualityMax, minimumCollectability: Math.floor(recipe.qualityMax / 10) },
    ], source,
  }
  return { scenarioId: `cosmic-expert-${recipeId}`, recipe, objective, missionIds: raw.missionIds, missionNamesEn: raw.missionNamesEn }
}

export const COSMIC_SCENARIO_DATA = GENERATED_COSMIC_RECIPES.map(row => cosmicScenarioDataByRecipeId(row.recipeId)!)
const familyRecipes = new Map<string, number[]>()
for (const entry of COSMIC_SCENARIO_DATA) {
  const ids = familyRecipes.get(entry.recipe.recipeFamilyId) ?? []
  ids.push(entry.recipe.canonicalRecipeId)
  familyRecipes.set(entry.recipe.recipeFamilyId, ids)
}
export const COSMIC_MECHANICS_FAMILIES = [...familyRecipes].map(([familyId, recipeIds]) => ({ familyId, representativeRecipeId: recipeIds[0]!, recipeIds }))
