// Reproduce from the repository root; reads completed evidence, runs no solver.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const root = 'evaluation-runs/opening-recovery-development/opening-recovery-v23-s64';
const config = JSON.parse(fs.readFileSync(`${root}/config.json`));
const manifest = JSON.parse(fs.readFileSync(`${root}/manifest.json`));
const families = new Map(config.payload.axes.families.map((f, i) => [f.familyId, `F${String(i + 1).padStart(2, '0')}`]));
const equipment = new Map(config.payload.axes.equipmentIds.map((e, i) => [e, ['E02', 'E03', 'E07', 'E09', 'E10'][i]]));
const shards = fs.readdirSync(`${root}/shards`).filter(f => f.endsWith('.json')).map(f => JSON.parse(fs.readFileSync(`${root}/shards/${f}`)));
assert.equal(shards.length, 50);
const pairs = shards.flatMap(s => {
  assert.equal(s.status, 'completed');
  assert.equal(s.report.schemaVersion, 'native-generic-cosmic-paired-matrix-v5');
  const baseline = new Map(s.report.rows.filter(r => r.arm === 'baseline').map(r => [r.caseId, r]));
  return s.report.rows.filter(r => r.arm === 'candidate').map(c => {
    const b = baseline.get(c.caseId); assert.ok(b); assert.equal(b.caseFingerprint, c.caseFingerprint);
    return { b, c, family: families.get(c.familyId), equipment: equipment.get(c.equipmentId), world: c.worldId };
  });
});
assert.equal(pairs.length, 32000);
assert.equal(new Set(pairs.map(p => p.c.caseId)).size, 32000);
const full = r => r.terminal === 'completed' && r.qualityMaximumReached;
const delta = p => Number(full(p.c)) - Number(full(p.b));
const group = (ps, f) => Object.groupBy(ps, f);
const quantile = (sorted, p) => sorted[Math.max(0, Math.ceil(sorted.length * p) - 1)] ?? null;
function stats(values) {
  values.sort((a, b) => a - b);
  return { n: values.length, mean: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null,
    p50: quantile(values, .5), p95: quantile(values, .95), max: quantile(values, 1) };
}
const omitted = new Set(['arm', 'solverVersion', 'recommendationNs', 'recommendationMaxNs', 'recommendationDurationsNs']);
const semantic = r => JSON.stringify(Object.fromEntries(Object.entries(r).filter(([k]) => !omitted.has(k))));
function summarize(ps) {
  const both = ps.filter(p => full(p.b) && full(p.c));
  const arms = Object.fromEntries(['b', 'c'].map(a => {
    const rs = ps.map(p => p[a]);
    return [a, { completed: rs.filter(r => r.terminal === 'completed').length, full: rs.filter(full).length,
      utility: rs.reduce((s, r) => s + r.completedObjectiveUtility, 0),
      stops: Object.fromEntries(Object.entries(group(rs, r => r.stopReason)).map(([k, v]) => [k, v.length])),
      lengths: Object.fromEntries(['completed', 'unfinished'].map(k => {
        const selected = rs.filter(r => (r.terminal === 'completed') === (k === 'completed'));
        return [k, { A: stats(selected.map(r => r.actions)), S: stats(selected.map(r => r.advancingSteps)) }];
      })) }];
  }));
  return { n: ps.length, ...arms, wins: ps.filter(p => delta(p) === 1).length,
    losses: ps.filter(p => delta(p) === -1).length, deltaPp: 100 * (arms.c.full - arms.b.full) / ps.length,
    changedSemantic: ps.filter(p => semantic(p.b) !== semantic(p.c)).length,
    bothFull: { n: both.length, A: stats(both.map(p => p.c.actions - p.b.actions)), S: stats(both.map(p => p.c.advancingSteps - p.b.advancingSteps)),
      shorter: both.filter(p => p.c.actions < p.b.actions).length, longer: both.filter(p => p.c.actions > p.b.actions).length } };
}
const summaries = (ps, f) => Object.fromEntries(Object.entries(group(ps, f)).sort(([a], [b]) => a.localeCompare(b)).map(([k, ps]) => [k, summarize(ps)]));
function latency(ps, arm) {
  const values = ps.flatMap(p => p[arm].recommendationDurationsNs).sort((a, b) => a - b);
  return { calls: values.length, p50Ms: quantile(values, .5) / 1e6, p95Ms: quantile(values, .95) / 1e6,
    worstMs: quantile(values, 1) / 1e6, over100Ms: values.filter(v => v > 1e8).length,
    over3s: values.filter(v => v >= 3e9).length };
}
const hard = pairs.filter(p => p.c.qualityUtilityKind === 'hard-quality-max');
assert.equal(hard.length, 8960);
function randomGenerator(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function bootstrap(ps, cluster) {
  const rng = randomGenerator(230906), samples = [];
  const groups = Object.values(group(ps, p => cluster ? p.family : `${p.family}|${p.equipment}|${p.world}`));
  const sums = groups.map(g => g.reduce((s, p) => s + delta(p), 0));
  // All-zero strata have a point-mass empirical distribution; skip their draws.
  const variable = groups.map(g => g.map(delta)).filter(g => g.some(d => d !== 0));
  for (let i = 0; i < 10000; i++) {
    let sum = 0, n = ps.length;
    if (cluster) {
      n = 0;
      for (let j = 0; j < groups.length; j++) { const k = Math.floor(rng() * groups.length); sum += sums[k]; n += groups[k].length; }
    } else {
      for (const ds of variable) for (let j = 0; j < ds.length; j++) sum += ds[Math.floor(rng() * ds.length)];
    }
    samples.push(100 * sum / n);
  }
  samples.sort((a, b) => a - b);
  return { draws: 10000, seed: 230906, lowerPp: quantile(samples, .025), upperPp: quantile(samples, .975) };
}
const events = fs.readdirSync(`${root}/logs`).filter(f => f.startsWith('thermal-')).flatMap(f => fs.readFileSync(`${root}/logs/${f}`, 'utf8').trim().split(/\r?\n/).filter(Boolean).map(l => JSON.parse(l)));
const attempts = Object.values(manifest.shards).flatMap(s => s.attempts);
const out = {
  root, configFingerprint: config.configFingerprint, binary: config.payload.evaluator.execution.binarySha256,
  activeWallMs: manifest.timing.activeWallClockMs, executed: shards.reduce((s, x) => s + x.report.executedEpisodes, 0),
  reused: shards.reduce((s, x) => s + x.report.reusedEpisodes, 0),
  attempts: Object.fromEntries(Object.entries(group(attempts, a => a.outcome)).map(([k, v]) => [k, v.length])),
  timedOut: attempts.filter(a => a.timedOut).length, workers: [...new Set(attempts.map(a => a.targetWorkerCount))],
  thermal: { types: Object.fromEntries(Object.entries(group(events, e => e.type)).map(([k, v]) => [k, v.length])),
    temperatures: stats(events.filter(e => Number.isFinite(e.temperatureCelsius)).map(e => e.temperatureCelsius)),
    stops: events.filter(e => e.type === 'stop') },
  overall: summarize(pairs), hard: summarize(hard), nonHard: summarize(pairs.filter(p => p.c.qualityUtilityKind !== 'hard-quality-max')),
  objectives: summaries(pairs, p => p.c.qualityUtilityKind), families: summaries(hard, p => p.family),
  equipment: summaries(hard, p => p.equipment), worlds: summaries(hard, p => p.world),
  cells: summaries(pairs, p => `${p.family}|${p.equipment}|${p.world}`),
  latency: { candidate: latency(pairs, 'c'), historicalBaseline: latency(pairs, 'b'), hardCandidate: latency(hard, 'c'),
    families: Object.fromEntries(Object.entries(group(hard, p => p.family)).map(([k, ps]) => [k, latency(ps, 'c')])) },
  uncertainty: { hardStratified: bootstrap(hard, false), hardFamilyCluster: bootstrap(hard, true), F43Stratified: bootstrap(hard.filter(p => p.family === 'F43'), false) },
  changes: pairs.filter(p => delta(p) !== 0).map(p => ({ family: p.family, equipment: p.equipment, world: p.world,
    caseId: p.c.caseId, caseFingerprint: p.c.caseFingerprint, win: delta(p) === 1,
    baseline: { stop: p.b.stopReason, quality: p.b.quality, actions: p.b.actions },
    candidate: { stop: p.c.stopReason, quality: p.c.quality, actions: p.c.actions } }))
};
fs.writeFileSync('reports/generic-cosmic-overnight/opening-recovery-s64-slices-20260906.json', JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify({ ...out, cells: undefined, changes: undefined, objectives: undefined,
  families: Object.fromEntries(Object.entries(out.families).map(([k, v]) => [k, { n: v.n, baseline: v.b.full, candidate: v.c.full, wins: v.wins, losses: v.losses, deltaPp: v.deltaPp, both: v.bothFull }])),
  negativeCells: Object.entries(out.cells).filter(([, v]) => v.deltaPp < 0).map(([k, v]) => ({ cell: k, wins: v.wins, losses: v.losses, deltaPp: v.deltaPp })) }, null, 2));
