import fs from 'node:fs'
import { createPlannerEpisode } from '../../apps/web/src/runtime/planner/episode'

const output = 'evaluation-runs/time-aware-recovery-development/player-mission'
fs.mkdirSync(output, { recursive: true })
const source = 'evaluation-runs/resource-certificate-development/artisan-continuation-fresh-s64/raw-partials'
const modes = ['v2.3.0', 'exp-time-aware-recovery', 'exp-eager-recovery']
const inputs: string[] = []
const metadata: unknown[] = []
for (const recipeId of [36534, 36535]) {
  const file = fs.readdirSync('player-record').find(f => f.includes(`${recipeId}-20260906`))!
  const d = JSON.parse(fs.readFileSync('player-record/' + file, 'utf8'))
  const sourceFile = fs.readdirSync(source).find(f => f.startsWith(d.recipe.recipeFamilyId) && f.endsWith('.candidate.tsv'))!
  const originals = fs.readFileSync(source + '/' + sourceFile, 'utf8').trim().split(/\r?\n/).map(r => r.split('\t'))
  for (const world of ['balanced-iid', 'normal-heavy-iid']) {
    const worldRow = originals.find(c => c[1].includes(`|world:${world}@`))!
    if (!worldRow) throw new Error(`missing ${world}`)
    for (let sample = 0; sample < 16; sample++) {
      const seed = (2026090601 + sample * 104729 + recipeId * 13) >>> 0
      for (const mode of modes) {
        const c = createPlannerEpisode({ recipe: d.recipe, objective: d.objective } as any, d.crafter, d.initialState).split('\t')
        c[1] = `player-${recipeId}|${world}|sample-${sample}|${mode}`
        c[3] = 'generic-craft-external-reference-' + mode
        c[15] = 'full'
        c[56] = String(seed)
        c.splice(60,81,...worldRow.slice(60,141))
        inputs.push(c.join('\t'))
        metadata.push({ caseId: c[1], file, recipeId, world, sample, seed, mode, familyId: d.recipe.recipeFamilyId, crafter: d.crafter })
      }
    }
  }
}
fs.writeFileSync(output + '/input.tsv', inputs.join('\n')+'\n')
fs.writeFileSync(output + '/cases.json', JSON.stringify(metadata,null,2))
console.log(`wrote ${inputs.length} episodes`)
