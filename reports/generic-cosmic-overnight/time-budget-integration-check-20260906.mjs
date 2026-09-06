import fs from 'node:fs'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import {execFile} from 'node:child_process'
const root='evaluation-runs/compact-policy-development/time-budget-integration-check'
assert.ok(!fs.existsSync(root));fs.mkdirSync(root,{recursive:true})
const source='evaluation-runs/compact-policy-development/compact-recovery-independent-s64'
const manifest=JSON.parse(fs.readFileSync(`${source}/manifest.json`))
const policy='generic-craft-external-reference-exp-time-budgeted-recovery'
const hash=b=>crypto.createHash('sha256').update(b).digest('hex')
const bytes=fs.readFileSync('native/craft-kernel/target/release/examples/time_budget_probe.exe')
const sha=hash(bytes),binary=`evaluation-runs/compact-policy-development/.artifacts/${sha}/time_budget_probe.exe`
fs.mkdirSync(binary.slice(0,binary.lastIndexOf('/')),{recursive:true});fs.writeFileSync(binary,bytes)
const priorRoot='evaluation-runs/compact-policy-development/short-finish-split-check'
const prior=new Map([0,1,2,3].flatMap(k=>fs.readFileSync(`${priorRoot}/output-${k}-false.tsv`,'utf8').trim().split(/\r?\n/).map(l=>l.split('\t'))).filter(c=>c[4].endsWith('exp-short-certified-finish')).map(c=>[c[1],c]))
const selected=manifest.shards.flatMap(s=>{
 const saved=JSON.parse(fs.readFileSync(`${source}/shards/${s.fileName}`)).report.rows.filter(r=>r.arm==='baseline'&&r.seedIndex===0)
 const file=fs.readdirSync(`${source}/raw-partials`).find(f=>f.startsWith(s.familyId)&&f.endsWith('.baseline.tsv'))
 const inputs=new Map(fs.readFileSync(`${source}/raw-partials/${file}`,'utf8').trim().split(/\r?\n/).map(l=>[l.split('\t')[1],l]))
 return saved.filter((_,i)=>Math.floor(i/2)===s.ordinal%5).map(r=>{const c=inputs.get(r.caseId).split('\t');c[3]=policy;c[15]='full';return {family:`F${String(s.ordinal+1).padStart(2,'0')}`,world:r.worldId,equipment:r.equipmentId,caseId:r.caseId,input:c.join('\t')}})
})
assert.equal(selected.length,100)
const jobs=[null,600000,159000].flatMap(budget=>selected.map(s=>({...s,budget,input:`${budget??'-'}\t5300\t${s.input}`})))
const started=performance.now()
const results=(await Promise.all([0,1,2,3].map(async k=>{
 const part=jobs.filter((_,i)=>i%4===k),input=part.map(j=>j.input).join('\n')+'\n';fs.writeFileSync(`${root}/input-${k}.tsv`,input)
 const output=await new Promise((resolve,reject)=>{const p=execFile(binary,[],{encoding:'utf8',timeout:180000,maxBuffer:64e6,windowsHide:true},(e,out)=>e?reject(e):resolve(out));p.stdin.end(input)})
 fs.writeFileSync(`${root}/output-${k}.tsv`,output)
 const lines=output.trim().split(/\r?\n/);assert.equal(lines.length,part.length)
 return lines.map((l,i)=>({job:part[i],c:l.split('\t')}))
}))).flat()
const none=new Map(results.filter(r=>r.job.budget===null).map(r=>[r.c[1],r.c]))
for(const {job,c}of results){assert.equal(c.length,51);assert.equal(c[3],'ok');assert.equal(c[1],job.caseId);assert.ok(!['policy-null','no-legal-action','illegal-action'].includes(c[16]));if(job.budget===null){const old=prior.get(c[1]);assert.ok(old);for(let j=0;j<51;j++)if(![4,22,23,50].includes(j))assert.equal(c[j],old[j],`split default drift ${j}`)}if(job.budget===600000){const old=none.get(c[1]);for(let j=0;j<51;j++)if(![22,23,50].includes(j))assert.equal(c[j],old[j],`ample time drift ${j}`)}}
const summarize=rs=>({n:rs.length,completed:rs.filter(r=>r.c[15]==='completed').length,full:rs.filter(r=>r.c[15]==='completed'&&Number(r.c[27])>=Number(r.c[6])).length,changedActions:rs.filter(r=>r.c[18]!==none.get(r.c[1])[18]).length,bothFullActionDelta:rs.filter(r=>r.c[15]==='completed'&&Number(r.c[27])>=Number(r.c[6])&&none.get(r.c[1])[15]==='completed'&&Number(none.get(r.c[1])[27])>=Number(r.c[6])).map(r=>Number(r.c[17])-Number(none.get(r.c[1])[17]))})
const wasmBytes=fs.readFileSync('apps/web/src/runtime/wasm/frozen_rabbit_craft_kernel_web.wasm')
const {instance}=await WebAssembly.instantiate(wasmBytes,{}),wasm=instance.exports,encoder=new TextEncoder(),decoder=new TextDecoder()
const changed=results.filter(r=>r.job.budget===159000&&r.c[18]!==none.get(r.c[1])[18]).slice(0,8)
const samples=[...changed,...results.filter(r=>r.job.budget===null).slice(0,2),...results.filter(r=>r.job.budget===600000).slice(0,2)]
let calls=0;const latencies=[]
for(const {job,c}of samples){
 const original=job.input.split('\t').slice(2),steps=c[49].split(';').map(s=>s.split('|')),actions=c[18].split(',')
 let state=original.slice(32,56)
 wasm.frozen_rabbit_web_reset_session()
 for(let i=0;i<=actions.length;i++){
  const input=[...original];input.splice(32,24,...state)
  const remaining=job.budget===null?null:Math.max(0,job.budget-i*5300)
  const prefix=remaining===null?'':`time-budget:${remaining}:5300\t`
  const request=encoder.encode(`${prefix}${i===0?'reset':`continue:${actions[i-1]}`}\t${input.join('\t')}`)
  assert.equal(wasm.frozen_rabbit_web_input_resize(request.length),0);new Uint8Array(wasm.memory.buffer,wasm.frozen_rabbit_web_input_ptr(),request.length).set(request)
  const t=performance.now();assert.equal(wasm.frozen_rabbit_web_recommend(),0);latencies.push(performance.now()-t)
  const out=decoder.decode(new Uint8Array(wasm.memory.buffer,wasm.frozen_rabbit_web_output_ptr(),wasm.frozen_rabbit_web_output_len())).trim().split('\t')
  assert.equal(out[0],'rust-web-planner-abi-v2');assert.equal(out[2],policy);assert.equal(out[3],actions[i]??'-',`${job.caseId} step ${i}`);calls++
  if(i===actions.length)assert.equal(out[6].split(':time-budget:')[0],c[24]);else state=steps[i].slice(8)
 }
}
latencies.sort((a,b)=>a-b)
const report={policy,probeSha256:sha,wasmSha256:hash(wasmBytes),sourceRun:manifest.runId,sample:0,executedEpisodes:300,interpretation:'Post hoc integration check, 100 representative cases at omitted/600s/159s single-craft budgets, 5.3s per action. Not an independent quality or mission-level evaluation.',budgets:Object.fromEntries(Object.entries(Object.groupBy(results,r=>String(r.job.budget))).map(([k,v])=>[k,summarize(v)])),noBudgetVersusShortNonTimingDifferences:0,ampleVersusNoBudgetNonTimingDifferences:0,wasm:{cases:samples.length,recommendations:calls,actionOrFinalContextDifferences:0,p95Ms:latencies[Math.ceil(latencies.length*.95)-1],maxMs:latencies.at(-1)},wallMs:performance.now()-started}
fs.writeFileSync(`${root}/result.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2))
