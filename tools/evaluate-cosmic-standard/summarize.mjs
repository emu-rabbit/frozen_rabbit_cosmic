import fs from 'node:fs'
import { createHash } from 'node:crypto'

const dir = process.argv[2] ?? '.tmp/cosmic-standard'
const output = process.argv[3] ?? `${dir}/stage-summary.json`
const readRows = name => fs.readFileSync(`${dir}/${name}`, 'utf8').trim().split(/\r?\n/).map(JSON.parse)
const policy = 'generic-craft-exp-cosmic-standard-search'
const rows = readRows(`${policy}-0.jsonl`)
const reference = readRows('raphael-near.jsonl').filter(r => r.event === 'result')
const cases = JSON.parse(fs.readFileSync(`${dir}/cases.json`, 'utf8')).filter(c => reference.some(r => r.caseId === c.caseId))
if (rows.length !== 48 || new Set(rows.map(r => r.caseId)).size !== 48 || reference.length !== 4) throw Error('Unexpected development corpus')
const hashes = Object.fromEntries([
  'native/craft-kernel/src/generic_solver/ordinary_search.rs',
  'native/craft-kernel/src/generic_solver.rs',
  'tools/evaluate-normal-reference/native/target/release/normal-craft-reference.exe',
  `${dir}/${policy}-0.jsonl`, `${dir}/raphael-near.jsonl`,
].map(p => [p, createHash('sha256').update(fs.readFileSync(p)).digest('hex')]))
const summary = cases.map(c => {
  const episodes = rows.filter(r => r.caseId.startsWith(`${c.caseId}-seed`))
  return { caseId: c.caseId, episodes: episodes.length,
    fullQuality: episodes.filter(r => r.stop === 'completed' && r.local.quality >= c.recipe.qualityMax).length,
    completed: episodes.filter(r => r.stop === 'completed').length,
    maxRecommendationMs: episodes.length ? Math.max(...episodes.map(r => r.maxRecommendationNs / 1e6)) : null,
    minQuality: episodes.length ? Math.min(...episodes.map(r => r.local.quality)) : null,
  }
})
fs.writeFileSync(output, JSON.stringify({
  date: '2026-09-07', policy, adopted: false, seeds: '0..15 development only; no holdout',
  world: 'Synthetic Normal/Good/Excellent weights 78/20/2, forced transitions handled by mechanics',
  raphaelRevision: '411168605989d573d89f2d71c01acac9f099e55a',
  sourceHashNote: 'Source hashes taken at closure after formatting and adding a regression test; binary and raw outputs are from the final development run before those non-behavioral changes.',
  hashes, cases, reference, summary,
  episodes: rows.map(({ steps, ...rest }) => ({ ...rest,
    poorSteps: steps.filter(s => s.before.condition === 'poor').length,
    ...(rest.local.quality < 1200 ? { steps } : {}),
  })),
}, null, 2) + '\n')
console.log(JSON.stringify(summary, null, 2))
