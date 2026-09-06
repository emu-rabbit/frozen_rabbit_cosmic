import fs from 'node:fs'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import {execFile} from 'node:child_process'
const root='evaluation-runs/compact-policy-development/short-finish-split-check'
assert.ok(!fs.existsSync(root),'Use a new result directory; do not overwrite evidence')
fs.mkdirSync(root,{recursive:true})
const source='evaluation-runs/compact-policy-development/compact-recovery-independent-s64'
const sha=b=>crypto.createHash('sha256').update(b).digest('hex')
const bytes=fs.readFileSync('native/craft-kernel/target/release/craft-kernel-generic-episode.exe')
const hash=sha(bytes),binary=`evaluation-runs/compact-policy-development/.artifacts/${hash}/craft-kernel-generic-episode.exe`
fs.mkdirSync(binary.slice(0,binary.lastIndexOf('/')),{recursive:true});fs.writeFileSync(binary,bytes)
const oldHash='5bc5b974646731b8745de3d32b4171342547fde46a977aaaada0735d2eea80cf'
const oldBinary=`evaluation-runs/compact-policy-development/.artifacts/${oldHash}/craft-kernel-generic-episode.exe`
assert.equal(sha(fs.readFileSync(oldBinary)),oldHash)
const short='generic-craft-external-reference-exp-short-certified-finish'
const manifest=JSON.parse(fs.readFileSync(`${source}/manifest.json`))
const selected=manifest.shards.flatMap(s=>{
 const rows=JSON.parse(fs.readFileSync(`${source}/shards/${s.fileName}`)).report.rows.filter(r=>r.arm==='baseline'&&r.seedIndex===0)
 const inputFile=fs.readdirSync(`${source}/raw-partials`).find(f=>f.startsWith(s.familyId)&&f.endsWith('.baseline.tsv'))
 const lines=new Map(fs.readFileSync(`${source}/raw-partials/${inputFile}`,'utf8').trim().split(/\r?\n/).map(l=>[l.split('\t')[1],l]))
 return rows.map((r,i)=>({r,family:`F${String(s.ordinal+1).padStart(2,'0')}`,input:lines.get(r.caseId),parity:Math.floor(i/2)===s.ordinal%5}))
})
assert.equal(selected.length,500)
const change=(input,policy)=>{const c=input.split('\t');c[3]=policy;c[15]='full';return c.join('\t')}
const parity=selected.filter(s=>s.parity).flatMap(s=>['generic-craft-external-reference-v2.3.0','generic-craft-external-reference-exp-compact-recovery'].map(policy=>({...s,policy,input:change(s.input,policy)})))
assert.equal(parity.length,200)
const run=(exe,rows)=>new Promise((resolve,reject)=>{
 const p=execFile(exe,[],{encoding:'utf8',timeout:285000,maxBuffer:96e6,windowsHide:true},(e,out)=>e?reject(e):resolve(out.trim().split(/\r?\n/).map(l=>l.split('\t')).filter(c=>c[2]==='episode')))
 p.stdin.end(rows.map(r=>r.input).join('\n')+'\n')
})
const jobs=[...parity.map(p=>({...p,old:true})),...parity.map(p=>({...p,old:false})),...selected.map(s=>({...s,policy:short,input:change(s.input,short),old:false}))]
const start=performance.now()
// Four bounded child batches, never an unattended overnight invocation.
const batches=[0,1,2,3].map(k=>jobs.filter((_,i)=>i%4===k))
const outputs=await Promise.all(batches.map(async(batch,k)=>{
 let rows=[]
 for(const old of [true,false]){const part=batch.filter(j=>j.old===old);fs.writeFileSync(`${root}/input-${k}-${old}.tsv`,part.map(r=>r.input).join('\n')+'\n');const result=await run(old?oldBinary:binary,part);fs.writeFileSync(`${root}/output-${k}-${old}.tsv`,result.map(r=>r.join('\t')).join('\n')+'\n');rows.push(...result.map(r=>({old,c:r})))}
 return rows
}))
const all=outputs.flat(),original=new Map(all.filter(r=>r.old).map(r=>[r.c[1]+'|'+r.c[4],r.c]))
let checked=0
for(const {c,old} of all)if(!old&&c[4]!==short){const expected=original.get(c[1]+'|'+c[4]);assert.ok(expected);for(let j=0;j<51;j++)if(![22,23,50].includes(j))assert.equal(c[j],expected[j],`${c[1]} field ${j}`);checked++}
assert.equal(checked,200)
const saved=new Map(selected.map(s=>[s.r.caseId,s]))
const rows=all.filter(r=>r.c[4]===short).map(({c})=>{const {r,bogus,...s}=saved.get(c[1]);return {caseId:c[1],family:s.family,equipment:r.equipmentId,world:r.worldId,kind:r.qualityUtilityKind,baselineCompleted:r.terminal==='completed',baselineFull:r.terminal==='completed'&&r.qualityMaximumReached,baselineActions:r.actions,completed:c[15]==='completed',full:c[15]==='completed'&&Number(c[27])>=r.qualityMaximum,actions:Number(c[17]),stop:c[16],observe:c[18].split(',').filter(a=>a==='observe').length}})
assert.equal(rows.length,500)
const both=rows.filter(r=>r.baselineFull&&r.full)
const result={binarySha256:hash,originalSha256:oldHash,sourceRun:manifest.runId,sample:0,interpretation:'Post hoc split verification on existing confirmation sample; not an independent new long run.',executedEpisodes:900,parityEpisodes:checked,parityNonTimingDifferences:0,shortCases:500,baselineCompleted:rows.filter(r=>r.baselineCompleted).length,completed:rows.filter(r=>r.completed).length,baselineFull:rows.filter(r=>r.baselineFull).length,full:rows.filter(r=>r.full).length,fullWins:rows.filter(r=>!r.baselineFull&&r.full).length,fullLosses:rows.filter(r=>r.baselineFull&&!r.full).length,bothFull:both.length,meanPairedFullActionDelta:both.reduce((s,r)=>s+r.actions-r.baselineActions,0)/both.length,stops:Object.fromEntries(Object.entries(Object.groupBy(rows,r=>r.stop)).map(([k,v])=>[k,v.length])),wallMs:performance.now()-start,rows}
fs.writeFileSync(`${root}/result.json`,JSON.stringify(result,null,2)+'\n')
console.log(JSON.stringify({...result,rows:undefined},null,2))
