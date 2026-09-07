import fs from 'node:fs'
import path from 'node:path'

const catalog = fs.readFileSync('packages/data/src/generated/cosmicRecipes.generated.ts', 'utf8')
const recipes = JSON.parse(catalog.match(/GENERATED_COSMIC_RECIPES: readonly CosmicRecipeRow\[\] = (\[[\s\S]*?\]) as const/)[1])
const out = process.argv[2] ?? '.tmp/cosmic-standard'
fs.mkdirSync(out, { recursive: true })
// Three fixed recipe shapes and two CP bands. Recipe 36188 gained lower control
// bands during development to locate a Raphael near-miss; this is not holdout.
const cases = []
for (const id of [36175, 36188, 37985]) {
  const r = recipes.find(r => r.recipeId === id)
  for (const cp of [500, 600]) for (const control of (id === 36188 ? [1500, 2000, 2500, 3500, 4500, 5500] : [3500, 4500, 5500])) {
    const caseId = `r${id}-cp${cp}-c${control}`
    const state = [1, 0, 0, r.durabilityMax, cp, 'normal', 0, 0, 0, 0, 0, 0, 0, 0, 0, '-', 1, 0, 0, 0, 0, 0, 'none', '-']
    const cells = ['native-generic-episode-batch-v8',caseId,'episode','generic-craft-exp-cosmic-standard','balanced',r.qualityMax,r.qualityMax,0,'hard-quality-max',1,r.qualityMax,0,0,0,515,'none',
      r.recipeId,r.recipeLevelTableId,r.progressRequired,r.qualityMax,r.requiredQuality,r.durabilityMax,r.progressDivider,r.qualityDivider,r.progressModifier,r.qualityModifier,
      100,5000,control,cp,0,0,...state,0,0,0,80,...Array.from({length:121},(_,i)=>i%11===0?1:0)]
    if(cells.length!==181)throw Error('arity')
    cases.push({caseId,recipe:r,crafter:{level:100,craftsmanship:5000,control,maxCp:cp},input:cells.join('\t')})
  }
}
fs.writeFileSync(path.join(out,'cases.json'),JSON.stringify(cases,null,2))
fs.writeFileSync(path.join(out,'cases.tsv'),cases.map(c=>c.input).join('\n')+'\n')
console.log(`Prepared ${cases.length} development cases in ${out}`)
