import fs from 'node:fs'
import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import crypto from 'node:crypto'
const root='evaluation-runs/compact-policy-development/compact-recovery-independent-s64'
const report=JSON.parse(fs.readFileSync('reports/generic-cosmic-overnight/compact-recovery-s64-analysis-20260906.json'))
const sha=report.identity.binarySha256
const binary=`evaluation-runs/compact-policy-development/.artifacts/${sha}/craft-kernel-generic-episode.exe`
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(binary)).digest('hex'),sha)
const selected=['F15','F28'].flatMap(f=>report.qualityLossCases.filter(p=>p.family===f&&p.baseline.terminal==='completed').sort((a,b)=>a.candidate.quality/a.candidate.qualityMaximum-b.candidate.quality/b.candidate.qualityMaximum||a.id.localeCompare(b.id)).slice(0,2))
assert.equal(selected.length,4)
const requests=selected.flatMap(p=>['baseline','candidate'].map(arm=>{
  const file=fs.readdirSync(`${root}/raw-partials`).find(f=>f.startsWith(p.familyId)&&f.endsWith(`.${arm}.tsv`))
  const line=fs.readFileSync(`${root}/raw-partials/${file}`,'utf8').split(/\r?\n/).find(l=>l.split('\t')[1]===p.id)
  assert.ok(line); const cells=line.split('\t');cells[15]='full'
  return {p,arm,line:cells.join('\t')}
}))
const out=execFileSync(binary,[],{input:requests.map(r=>r.line).join('\n')+'\n',encoding:'utf8',timeout:30000,maxBuffer:16e6,windowsHide:true})
const lines=out.trim().split(/\r?\n/);assert.equal(lines.pop().split('\t')[2],'summary')
assert.equal(lines.length,8)
const rows=lines.map((line,i)=>{
  const c=line.split('\t'),{p,arm}=requests[i],old=p[arm]
  assert.equal(c[1],p.id);assert.equal(c[3],'ok');assert.equal(c[15],old.terminal);assert.equal(c[16],old.stopReason);assert.equal(Number(c[17]),old.actions);assert.equal(Number(c[27]),old.quality);assert.equal(c[24],old.plannerContext)
  return {caseId:p.id,family:p.family,equipment:p.equipment,world:p.world,sample:p.sample,arm,actions:c[18].split(','),quality:Number(c[27]),terminal:c[15],trace:c[49].split(';').map(s=>s.split('|'))}
})
const pairs=selected.map(p=>{const b=rows.find(r=>r.caseId===p.id&&r.arm==='baseline'),c=rows.find(r=>r.caseId===p.id&&r.arm==='candidate'),i=b.actions.findIndex((a,i)=>a!==c.actions[i]);return {caseId:p.id,family:p.family,equipment:p.equipment,world:p.world,sample:p.sample,firstDifferentAction:i+1,priorState:i?b.trace[i-1].slice(8):null,baselineAction:b.actions[i],candidateAction:c.actions[i],baselineQuality:b.quality,candidateQuality:c.quality,baselineActions:b.actions.length,candidateActions:c.actions.length,baselineObserve:b.actions.filter(a=>a==='observe').length,candidateObserve:c.actions.filter(a=>a==='observe').length}})
fs.writeFileSync('reports/generic-cosmic-overnight/compact-recovery-s64-replay-20260906.json',JSON.stringify({binarySha256:sha,selection:'Two lowest quality-ratio saved loss cases in each of F15 and F28; post hoc diagnosis, not representative frequencies.',checkedEpisodes:8,pairs,rows},null,2)+'\n')
console.log(JSON.stringify(pairs,null,2))
