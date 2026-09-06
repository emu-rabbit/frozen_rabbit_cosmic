import fs from 'node:fs'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import {execFile} from 'node:child_process'

const root='evaluation-runs/compact-policy-development/v240-adoption-parity'
assert.ok(!fs.existsSync(root),'Output already exists; preserve the recorded result')
fs.mkdirSync(root,{recursive:true})
const priorRoot='evaluation-runs/compact-policy-development/time-budget-integration-check'
const policy='generic-craft-external-reference-v2.4.0'
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex')
const prior=[0,1,2,3].flatMap(k=>{
 const inputs=fs.readFileSync(`${priorRoot}/input-${k}.tsv`,'utf8').trim().split(/\r?\n/)
 return fs.readFileSync(`${priorRoot}/output-${k}.tsv`,'utf8').trim().split(/\r?\n/).map((line,i)=>{
  const cells=inputs[i].split('\t')
  return {job:{budget:cells[0]==='-'?null:Number(cells[0]),caseId:cells[3],input:inputs[i]},c:line.split('\t')}
 })
})
const none=new Map(prior.filter(r=>r.job.budget===null).map(r=>[r.c[1],r.c]))
const selected=[
 ...prior.filter(r=>r.job.budget===159000&&r.c[18]!==none.get(r.c[1])[18]).slice(0,8),
 ...prior.filter(r=>r.job.budget===null).slice(0,2),
 ...prior.filter(r=>r.job.budget===600000).slice(0,2),
]
assert.equal(selected.length,12)
const jobs=selected.map(r=>{
 const cells=r.job.input.split('\t');cells[5]=policy
 return {...r.job,input:cells.join('\t')}
})
const bytes=fs.readFileSync('native/craft-kernel/target/release/examples/time_budget_probe.exe')
const sha=hash(bytes),binary=`${root}/time_budget_probe.exe`
fs.writeFileSync(binary,bytes)
const input=jobs.map(j=>j.input).join('\n')+'\n'
fs.writeFileSync(`${root}/input.tsv`,input)
const output=await new Promise((resolve,reject)=>{
 const p=execFile(binary,[],{encoding:'utf8',timeout:60000,maxBuffer:16e6,windowsHide:true},(e,out)=>e?reject(e):resolve(out));p.stdin.end(input)
})
fs.writeFileSync(`${root}/output.tsv`,output)
const lines=output.trim().split(/\r?\n/);assert.equal(lines.length,jobs.length)
const results=lines.map((line,i)=>({job:jobs[i],c:line.split('\t')}))
for(let i=0;i<results.length;i++){
 const c=results[i].c,old=selected[i].c
 assert.equal(c.length,51);assert.equal(c[4],policy)
 for(let j=0;j<51;j++)if(![4,22,23,50].includes(j))assert.equal(c[j],old[j],`promotion drift case ${i} field ${j}`)
}
const wasmBytes=fs.readFileSync('apps/web/src/runtime/wasm/frozen_rabbit_craft_kernel_web.wasm')
const {instance}=await WebAssembly.instantiate(wasmBytes,{}),wasm=instance.exports,encoder=new TextEncoder(),decoder=new TextDecoder()
const samples=results;
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
const report={policy,sourcePolicy:'generic-craft-external-reference-exp-time-budgeted-recovery',nativeCases:results.length,nativeNonTimingDifferences:0,probeSha256:sha,wasmSha256:hash(wasmBytes),wasmCases:samples.length,wasmRecommendations:calls,wasmActionOrFinalContextDifferences:0,p95Ms:latencies[Math.ceil(latencies.length*.95)-1],maxMs:latencies.at(-1),interpretation:'Version promotion parity on 12 saved integration cases (8 tight, 2 omitted, 2 ample); not independent quality confirmation.'}
fs.writeFileSync(`${root}/result.json`,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify(report,null,2))
