import fs from 'node:fs'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'

// Read saved results only; this script never launches the solver.
const root = 'evaluation-runs/compact-policy-development/compact-recovery-independent-s64'
const manifest = JSON.parse(fs.readFileSync(`${root}/manifest.json`))
const config = JSON.parse(fs.readFileSync(`${root}/config.json`))
const sha = '5bc5b974646731b8745de3d32b4171342547fde46a977aaaada0735d2eea80cf'
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(`evaluation-runs/compact-policy-development/.artifacts/${sha}/craft-kernel-generic-episode.exe`)).digest('hex'), sha)
const equipment = ['player-food-medicine-cosmic-tool-v1','player-food-medicine-specialist-cosmic-tool-v1','generic-i750-hq-unmelded-buffed-v1','generic-i750-hq-five-meld-template-buffed-v1','generic-i750-hq-five-meld-template-buffed-specialist-v1']
const labels = ['E02','E03','E07','E09','E10']
const hqTable = JSON.parse('[' + fs.readFileSync('packages/domain/src/hqChance.ts','utf8').match(/= \[([\s\S]*?)\] as const/)[1].replace(/,\s*$/, '') + ']')
const complete = r => r.terminal === 'completed'
const full = r => complete(r) && r.qualityMaximumReached
const tier = r => complete(r) ? r.qualityMilestones.filter(q => q < r.qualityMaximum && r.quality >= q).length : 0
const hq = r => { const p = Math.min(100, Math.floor(r.quality * 100 / r.qualityMaximum)); return p < 50 ? Math.floor(1+p*14/50) : hqTable[p] }
const mean = a => a.length ? a.reduce((s,x)=>s+x,0)/a.length : null
const stats = a => { a.sort((a,b)=>a-b); return {n:a.length,mean:mean(a),p05:a[Math.ceil(a.length*.05)-1]??null,p50:a[Math.ceil(a.length*.5)-1]??null,p95:a[Math.ceil(a.length*.95)-1]??null,max:a.at(-1)??null} }
const pairs = [], shards = []
for (const entry of manifest.shards) {
  assert.equal(entry.status,'completed')
  const s = JSON.parse(fs.readFileSync(`${root}/shards/${entry.fileName}`)); shards.push(s)
  assert.equal(s.nativeBinarySha256,sha); assert.equal(s.configFingerprint,manifest.configFingerprint)
  assert.equal(s.baseSeed,20270223); assert.equal(s.report.executedEpisodes,1280); assert.equal(s.report.reusedEpisodes,0)
  const map = new Map()
  for (const r of s.report.rows) {
    assert.ok(['baseline','candidate'].includes(r.arm)); assert.equal(r.risk,'balanced')
    assert.equal(r.solverVersion,s.report.solvers[r.arm]); assert.equal(r.actions,r.recommendationDurationsNs.length)
    const p = map.get(r.caseId) ?? {id:r.caseId,family:`F${String(s.ordinal+1).padStart(2,'0')}`,familyId:s.familyId,recipe:s.representativeRecipeId,equipment:labels[equipment.indexOf(r.equipmentId)],world:r.worldId,sample:r.seedIndex,kind:r.qualityUtilityKind}
    assert.ok(!p[r.arm]); p[r.arm]=r; map.set(r.caseId,p)
  }
  assert.equal(map.size,640)
  for (const p of map.values()) { assert.ok(p.baseline&&p.candidate); assert.equal(p.baseline.pairedSeed,p.candidate.pairedSeed); pairs.push(p) }
}
assert.equal(shards.length,50); assert.equal(pairs.length,32000); assert.equal(new Set(pairs.map(p=>p.id)).size,32000)
function armStats(rs) {
  const done=rs.filter(complete)
  return {completed:done.length,full:rs.filter(full).length,completedActions:stats(done.map(r=>r.actions)),completedSteps:stats(done.map(r=>r.advancingSteps)),nonCompletedActions:stats(rs.filter(r=>!complete(r)).map(r=>r.actions)),nonCompletedSteps:stats(rs.filter(r=>!complete(r)).map(r=>r.advancingSteps)),stops:Object.fromEntries(Object.entries(Object.groupBy(rs,r=>r.stopReason)).map(([k,v])=>[k,v.length])),tiers:[1,2,3].map(t=>rs.filter(r=>r.qualityUtilityKind==='collectability-tiers'&&tier(r)>=t).length),completedQualityFraction:stats(done.map(r=>r.quality/r.qualityMaximum)),completedHqMean:rs.every(r=>r.qualityUtilityKind==='hq-chance')?mean(done.map(hq)):null,completedCollectabilityMean:rs.every(r=>r.qualityUtilityKind==='continuous-collectability'||r.qualityUtilityKind==='collectability-tiers')?mean(done.map(r=>Math.floor(r.quality/10))):null}
}
function summary(ps) {
  const both=ps.filter(p=>full(p.baseline)&&full(p.candidate)), done=ps.filter(p=>complete(p.baseline)&&complete(p.candidate)), collect=done.filter(p=>p.kind==='collectability-tiers')
  return {n:ps.length,baseline:armStats(ps.map(p=>p.baseline)),candidate:armStats(ps.map(p=>p.candidate)),completionWins:ps.filter(p=>!complete(p.baseline)&&complete(p.candidate)).length,completionLosses:ps.filter(p=>complete(p.baseline)&&!complete(p.candidate)).length,fullWins:ps.filter(p=>!full(p.baseline)&&full(p.candidate)).length,fullLosses:ps.filter(p=>full(p.baseline)&&!full(p.candidate)).length,bothFull:both.length,bothFullActionDelta:stats(both.map(p=>p.candidate.actions-p.baseline.actions)),bothFullStepDelta:stats(both.map(p=>p.candidate.advancingSteps-p.baseline.advancingSteps)),bothCompletedActionDelta:stats(done.map(p=>p.candidate.actions-p.baseline.actions)),collectabilityTierUp:collect.filter(p=>tier(p.candidate)>tier(p.baseline)).length,collectabilityTierDown:collect.filter(p=>tier(p.candidate)<tier(p.baseline)).length}
}
function ci(ps, key=p=>p.family) {
  const clusters=Object.values(Object.groupBy(ps,key)).map(xs=>({n:xs.length,c:xs.reduce((s,p)=>s+Number(complete(p.candidate))-Number(complete(p.baseline)),0),f:xs.reduce((s,p)=>s+Number(full(p.candidate))-Number(full(p.baseline)),0),b:xs.filter(p=>full(p.baseline)&&full(p.candidate)).length,a:xs.filter(p=>full(p.baseline)&&full(p.candidate)).reduce((s,p)=>s+p.candidate.actions-p.baseline.actions,0)}))
  let seed=20260906; const rand=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296}
  const draws=Array.from({length:5000},()=>{let n=0,c=0,f=0,b=0,a=0;for(let i=0;i<clusters.length;i++){const x=clusters[Math.floor(rand()*clusters.length)];n+=x.n;c+=x.c;f+=x.f;b+=x.b;a+=x.a}return[c/n*100,f/n*100,a/b]})
  return {clusterCount:clusters.length,method:'paired cluster percentile bootstrap, 5000 resamples, PRNG 20260906; marginal descriptive intervals, no multiple-comparison correction',completionPp:range(0),fullPp:range(1),bothFullActionDelta:range(2)}
  function range(k){const a=draws.map(x=>x[k]).sort((a,b)=>a-b);return[a[124],a[4874]]}
}
const grouped=(key,intervals=false)=>Object.fromEntries(Object.entries(Object.groupBy(pairs,key)).sort().map(([k,ps])=>[k,{...summary(ps),...(intervals?{intervals:ci(ps)}:{})}]))
const cells=grouped(p=>`${p.family}|${p.equipment}|${p.world}`)
assert.equal(Object.keys(cells).length,500);for(const s of Object.values(cells))assert.equal(s.n,64)
const runtime=Object.fromEntries(['baseline','candidate'].map(arm=>[arm,{latencyMs:stats(pairs.flatMap(p=>p[arm].recommendationDurationsNs.map(n=>n/1e6))),totalRecommendationSeconds:pairs.reduce((s,p)=>s+p[arm].recommendationNs/1e9,0),summedBatchWallSeconds:shards.reduce((s,x)=>s+x.report.timing[`${arm}WallClockMs`]/1000,0)}]))
const thermal=fs.readdirSync(`${root}/logs`).filter(f=>f.startsWith('thermal-')).flatMap(f=>fs.readFileSync(`${root}/logs/${f}`,'utf8').trim().split(/\r?\n/).map(JSON.parse))
const timePairs=pairs.filter(p=>p.family==='F14').map(a=>[a,pairs.find(b=>b.family==='F15'&&b.equipment===a.equipment&&b.world===a.world&&b.sample===a.sample)])
assert.equal(timePairs.length,640); assert.ok(timePairs.every(p=>p[1]))
function timeSummary(xs){return Object.fromEntries([4,5,6].map(seconds=>[seconds,Object.fromEntries(['baseline','candidate'].map(arm=>[arm,{complete:xs.filter(([a,b])=>complete(a[arm])&&complete(b[arm])&&(a[arm].actions+b[arm].actions)*seconds+30<=600).length,bothFull:xs.filter(([a,b])=>full(a[arm])&&full(b[arm])&&(a[arm].actions+b[arm].actions)*seconds+30<=600).length,firstFullSecondThird:xs.filter(([a,b])=>full(a[arm])&&tier(b[arm])>=3&&(a[arm].actions+b[arm].actions)*seconds+30<=600).length}]))]))}
const report={identity:{run:manifest.runId,configFingerprint:manifest.configFingerprint,binarySha256:sha,baseSeed:20270223,shards:50,cases:32000,episodes:64000,axes:config.payload.axes},overall:{...summary(pairs),intervals:ci(pairs)},worlds:grouped(p=>p.world,true),equipment:grouped(p=>p.equipment,true),equipmentWorlds:grouped(p=>`${p.equipment}|${p.world}`,true),objectives:grouped(p=>p.kind,true),objectiveWorlds:grouped(p=>`${p.kind}|${p.world}`,true),families:grouped(p=>p.family),cells,f15SeedClusterIntervals:ci(pairs.filter(p=>p.family==='F15'),p=>String(p.sample)),runtime,operational:{timing:manifest.timing,attempts:manifest.shards.flatMap(s=>s.attempts).length,thermalTypes:Object.fromEntries(Object.entries(Object.groupBy(thermal,r=>r.type)).map(([k,v])=>[k,v.length])),temperatures:stats(thermal.filter(r=>r.type==='sample'&&r.status==='ok').map(r=>r.temperatureCelsius)),nonSampleThermalEvents:thermal.filter(r=>r.type!=='sample')},timeSensitivity:{assumption:'Synthetic F14+F15 representative pair matched by equipment/world/seed index; distinct recipe streams. 600 seconds, 30 seconds overhead; all actions charged equally; not real player equipment or mission controller.',n:640,overall:timeSummary(timePairs),worlds:Object.fromEntries(Object.entries(Object.groupBy(timePairs,p=>p[0].world)).map(([k,v])=>[k,{n:v.length,results:timeSummary(v)}])),equipmentWorlds:Object.fromEntries(Object.entries(Object.groupBy(timePairs,p=>`${p[0].equipment}|${p[0].world}`)).map(([k,v])=>[k,{n:v.length,results:timeSummary(v)}]))},qualityLossCases:pairs.filter(p=>full(p.baseline)&&!full(p.candidate)||complete(p.baseline)&&complete(p.candidate)&&p.kind==='collectability-tiers'&&tier(p.candidate)<tier(p.baseline)).map(p=>({...p,baseline:{...p.baseline,recommendationDurationsNs:undefined},candidate:{...p.candidate,recommendationDurationsNs:undefined}}))}
fs.writeFileSync('reports/generic-cosmic-overnight/compact-recovery-s64-analysis-20260906.json',JSON.stringify(report,null,2)+'\n')
const show=x=>x===null?'—':Number(x).toFixed(2)
const lengths=x=>[x.p50,x.p95,x.max].map(v=>v??'—').join('/')
const slices=['# Compact Recovery s64 完整切片','', '由 [分析程式](compact-recovery-s64-analysis-20260906.mjs) 從 saved shards 生成；判讀見 [主報告](compact-recovery-s64-review-20260906.md)。全部為 Balanced；B 為 v2.3，C 為 Compact Recovery。這是 synthetic assumed-world evidence。','', '完成者與未完成者長度均為 p50/p95/max；A 為全部技能，S 為推進工序。ΔA 只取兩臂都完成且滿品質的配對，負值較短。各格 64 seeds，單件差等於 1.5625 個百分點；表內點估計不構成每格非劣證明。三檔只計一般收藏品的 100/300/700 分門檻，未完成算未達檔。','', '## 家族彙整','', '| 家族 | n | 完成 B→C | 滿品質 B→C | 滿品質得/失 | 雙滿 ΔA | 收藏升/降檔 |','| --- | --- | --- | --- | --- | --- | --- |']
for(const [k,s]of Object.entries(report.families))slices.push(`| ${k} | ${s.n} | ${s.baseline.completed}→${s.candidate.completed} | ${s.baseline.full}→${s.candidate.full} | ${s.fullWins}/${s.fullLosses} | ${show(s.bothFullActionDelta.mean)} | ${s.collectabilityTierUp}/${s.collectabilityTierDown} |`)
slices.push('','## 全部 500 格','','| 家族／裝備／world | 完成 B→C | 滿品質 B→C | 得/失 | 三檔 B→C | 雙滿 ΔA | 完成 A B→C | 完成 S B→C | 未完成 A B→C | 未完成 S B→C |','| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |')
for(const [k,s]of Object.entries(cells))slices.push(`| ${k.replaceAll('|',' / ')} | ${s.baseline.completed}→${s.candidate.completed} | ${s.baseline.full}→${s.candidate.full} | ${s.fullWins}/${s.fullLosses} | ${s.baseline.tiers.join('/')}→${s.candidate.tiers.join('/')} | ${show(s.bothFullActionDelta.mean)} | ${lengths(s.baseline.completedActions)}→${lengths(s.candidate.completedActions)} | ${lengths(s.baseline.completedSteps)}→${lengths(s.candidate.completedSteps)} | ${lengths(s.baseline.nonCompletedActions)}→${lengths(s.candidate.nonCompletedActions)} | ${lengths(s.baseline.nonCompletedSteps)}→${lengths(s.candidate.nonCompletedSteps)} |`)
fs.writeFileSync('reports/generic-cosmic-overnight/compact-recovery-s64-slices-20260906.md',slices.join('\n')+'\n')
console.log(JSON.stringify({overall:report.overall,worlds:report.worlds,f15:report.families.F15,f15Intervals:report.f15SeedClusterIntervals,runtime:report.runtime,thermal:report.operational.temperatures,time:report.timeSensitivity.overall},null,2))
