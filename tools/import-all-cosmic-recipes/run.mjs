import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const REVISION = 'c142b1269a76e9e3fffc42f984a5f193ba565ddc'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const TABLES = ['Recipe', 'RecipeLevelTable', 'Item', 'WKSMissionRecipe', 'WKSMissionUnit', 'WKSMissionToDoEvalutionRefin']
const JOBS = ['carpenter', 'blacksmith', 'armorer', 'goldsmith', 'leatherworker', 'weaver', 'alchemist', 'culinarian']
const hash = text => createHash('sha256').update(text).digest('hex')

export function parseCsv(text) {
  const rows = []; let row = []; let value = ''; let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"') {
      if (quoted && text[i + 1] === '"') { value += '"'; i++ } else quoted = !quoted
    } else if (!quoted && (ch === ',' || ch === '\n')) {
      row.push(value.replace(/\r$/, '')); value = ''
      if (ch === '\n') { rows.push(row); row = [] }
    } else value += ch
  }
  if (quoted) throw new Error('Unterminated CSV field')
  if (value || row.length) { row.push(value); rows.push(row) }
  const header = rows.shift()
  return rows.map(row => {
    if (row.length !== header.length) throw new Error('CSV row width mismatch')
    return Object.fromEntries(header.map((key, i) => [key, row[i]]))
  })
}

export async function generate({ download = false, check = false } = {}) {
  const directory = path.join(ROOT, '.cache/all-cosmic', REVISION)
  await mkdir(directory, { recursive: true })
  const hashes = {}; const tables = {}
  for (const table of TABLES) {
    const file = path.join(directory, `${table}.csv`)
    if (download) {
      const response = await fetch(`https://raw.githubusercontent.com/xivapi/ffxiv-datamining/${REVISION}/csv/en/${table}.csv`)
      if (!response.ok) throw new Error(`${table}: HTTP ${response.status}`)
      await writeFile(file, await response.text())
    }
    const text = await readFile(file, 'utf8')
    hashes[table] = hash(text)
    tables[table] = new Map(parseCsv(text).map(row => [Number(row['#']), row]))
  }
  const membership = new Map()
  for (const unit of tables.WKSMissionUnit.values()) {
    if (!unit.Name) continue
    const row = tables.WKSMissionRecipe.get(Number(unit.WKSMissionRecipe))
    if (!row) continue
    for (let i = 0; i < 5; i++) {
      const id = Number(row[`Recipe[${i}]`]); if (!id) continue
      const list = membership.get(id) ?? []
      list.push({ id: Number(row['#']), name: unit.Name.replace(/[\uE000-\uF8FF]/gu, '').trim(), levelGroup: Number(unit.LevelGroup), unitId: Number(unit['#']) })
      membership.set(id, list)
    }
  }
  const expertText = await readFile(path.join(ROOT, 'packages/data/src/generated/cosmicExpertRecipes.generated.ts'), 'utf8')
  const experts = JSON.parse(expertText.match(/GENERATED_COSMIC_EXPERT_RECIPES = (\[[\s\S]*\]) as const/)[1])
  const expertIds = new Set(experts.map(row => row.recipeId))
  const recipes = [...membership].sort(([a], [b]) => a - b).map(([recipeId, missions]) => {
    const row = tables.Recipe.get(recipeId)
    const level = tables.RecipeLevelTable.get(Number(row.RecipeLevelTable))
    const item = tables.Item.get(Number(row.ItemResult))
    if (!row || !level || !item || !JOBS[Number(row.CraftType)]) throw new Error(`Missing data for ${recipeId}`)
    const requiredQuality = Number(row.RequiredQuality)
    const qualityOutcome = requiredQuality > 0 ? 'required-quality' : item.CanBeHq === 'True' ? 'hq-chance' : 'collectability'
    const progressRequired = Math.floor(Number(level.Difficulty) * Number(row.DifficultyFactor) / 100)
    const qualityMax = Math.floor(Number(level.Quality) * Number(row.QualityFactor) / 100)
    const durabilityMax = Math.floor(Number(level.Durability) * Number(row.DurabilityFactor) / 100)
    const qualityRow = Number(row.CollectableMetadataKey) === 7 ? tables.WKSMissionToDoEvalutionRefin.get(Number(row.CollectableMetadata)) : undefined
    const qualityPercentages = qualityRow ? ['LowPercent', 'MidPercent', 'HighPercent'].map(key => Number(qualityRow[key])) : []
    const key = [Number(level.ClassJobLevel), progressRequired, qualityMax, requiredQuality, durabilityMax, Number(level.ProgressDivider), Number(level.QualityDivider), Number(level.ProgressModifier), Number(level.QualityModifier), Number(row.RequiredCraftsmanship), Number(row.RequiredControl), Number(level.ConditionsFlag), qualityOutcome].join(':')
    const mechanicsFamilyId = `cosmic-expert-mechanics-${hash(key).slice(0, 12)}`
    const expert = experts.find(row => row.recipeId === recipeId)
    if (expert && expert.mechanicsFamilyId !== mechanicsFamilyId) throw new Error(`Expert regression: ${recipeId}`)
    return {
      recipeId, itemId: Number(row.ItemResult), itemIconId: Number(item.Icon), nameEn: item.Name,
      job: JOBS[Number(row.CraftType)], missionIds: missions.map(m => m.id), missionNamesEn: missions.map(m => m.name),
      recipeLevelTableId: Number(row.RecipeLevelTable), recipeLevel: Number(level.ClassJobLevel),
      progressRequired, qualityMax, requiredQuality, durabilityMax,
      progressDivider: Number(level.ProgressDivider), qualityDivider: Number(level.QualityDivider),
      progressModifier: Number(level.ProgressModifier), qualityModifier: Number(level.QualityModifier),
      recommendedCraftsmanship: Number(level.SuggestedCraftsmanship), conditionsFlag: Number(level.ConditionsFlag),
      qualityOutcome, mechanicsFamilyId, isExpert: row.IsExpert === 'True',
      maxAdjustableJobLevel: Number(row.MaxAdjustableJobLevel), difficultyFactor: Number(row.DifficultyFactor), qualityFactor: Number(row.QualityFactor),
      qualityPercentages, levelGroup: missions[0].levelGroup,
    }
  })
  if (recipes.length !== 1584 || recipes.filter(r => r.isExpert).length !== 432 || experts.some(r => !membership.has(r.recipeId))) throw new Error('Unexpected 7.55 membership')
  const levels = []
  for (let jobLevel = 1; jobLevel <= 100; jobLevel++) {
    const row = [...tables.RecipeLevelTable.values()].find(row => Number(row.ClassJobLevel) === jobLevel)
    if (!row) throw new Error(`Missing level ${jobLevel}`)
    levels.push(Object.fromEntries(Object.entries(row).map(([key, value]) => [key, Number(value)])))
  }
  const content = { recipes, levels }
  const source = { patch: '7.55', xivapiVersion: '284bb7f44b9c0976', wksMissionUnitRevision: REVISION, sourceHashes: hashes, recipeCount: recipes.length, mechanicsFamilyCount: new Set(recipes.map(r => r.mechanicsFamilyId)).size, catalogIdentitySha256: hash(JSON.stringify(content)) }
  const output = `/* eslint-disable */\nimport type { CosmicRecipeRow } from '../cosmicRecipeRow'\n// Generated by tools/import-all-cosmic-recipes/run.mjs; pinned game data.\nexport const COSMIC_GENERATED_SOURCE = ${JSON.stringify(source, null, 2)} as const\nexport const GENERATED_COSMIC_RECIPES: readonly CosmicRecipeRow[] = [\n${recipes.map(row => JSON.stringify(row)).join(',\n')}\n] as const\nexport const COSMIC_LEVEL_TABLES = ${JSON.stringify(levels)} as const\n`
  const file = path.join(ROOT, 'packages/data/src/generated/cosmicRecipes.generated.ts')
  if (check) { if (await readFile(file, 'utf8') !== output) throw new Error('Generated catalog drift') }
  else await writeFile(file, output)
  console.log(JSON.stringify({ ...source, additionalRecipes: recipes.filter(r => !expertIds.has(r.recipeId)).length }))
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  generate({ download: process.argv.includes('--download'), check: process.argv.includes('--check') }).catch(error => { console.error(error); process.exitCode = 1 })
}
