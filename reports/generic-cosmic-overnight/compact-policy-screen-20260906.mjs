import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'

const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')))
assert.match(args.run ?? '', /^[a-z0-9-]+$/)
const modes = args.modes.split(',')
const samples = (args.samples ?? '0').split(',').map(Number)
const root = `evaluation-runs/compact-policy-development/${args.run}`
const oldRoot = 'evaluation-runs/opening-recovery-development/opening-recovery-v23-s64'
const source = 'evaluation-runs/resource-certificate-development/artisan-continuation-fresh-s64/raw-partials'
const cfg = JSON.parse(fs.readFileSync(oldRoot + '/config.json'))
const familyNames = new Map(cfg.payload.axes.families.map((f,i) => [f.familyId, `F${String(i+1).padStart(2,'0')}`]))
const selected = fs.readdirSync(oldRoot+'/shards').filter(f=>f.endsWith('.json')).flatMap(f=>{
 const s=JSON.parse(fs.readFileSync(oldRoot+'/shards/'+f));assert.equal(s.status,'completed')
 return s.report.rows.filter(r=>r.arm==='candidate'&&samples.includes(r.seedIndex))
}).filter(r=>!args.families || args.families.split(',').includes(familyNames.get(r.familyId)))
assert.equal(selected.length,(args.families ? args.families.split(',').length*10 : 500)*samples.length)
const files=fs.readdirSync(source).filter(f=>f.endsWith('.candidate.tsv')),cache=new Map()
function input(row,mode){
 if(!cache.has(row.familyId))cache.set(row.familyId,new Map(fs.readFileSync(path.join(source,files.find(f=>f.startsWith(row.familyId))),'utf8').trim().split(/\r?\n/).map(r=>[r.split('\t')[1],r])))
 const c=cache.get(row.familyId).get(row.caseId).split('\t');c[3]='generic-craft-external-reference-exp-'+mode;c[15]='full';return c.join('\t')
}
const saved = Object.hasOwn(args,'verify-saved')
const hash=b=>crypto.createHash('sha256').update(b).digest('hex')
const bytes=saved?null:fs.readFileSync(args.binary ?? 'native/craft-kernel/target/release/craft-kernel-generic-episode.exe')
const sha=saved?JSON.parse(fs.readFileSync(root+'/config.json')).sha:hash(bytes)
const binary=`evaluation-runs/compact-policy-development/.artifacts/${sha}/craft-kernel-generic-episode.exe`
if(!saved){
 assert.ok(!fs.existsSync(root),'run directory already exists')
 fs.mkdirSync(root,{recursive:true});fs.mkdirSync(path.dirname(binary),{recursive:true});fs.writeFileSync(binary,bytes)
 fs.writeFileSync(root+'/config.json',JSON.stringify({sha,modes,samples,families:args.families??'all',sourceFingerprint:cfg.configFingerprint,workers:4,maxWallMs:285000},null,2))
}
assert.equal(hash(fs.readFileSync(binary)),sha)
const work=modes.flatMap(mode=>selected.map(row=>({mode,row,input:input(row,mode)})))
console.log(JSON.stringify({run:args.run,episodes:work.length,sha,workers:4}))
const start=performance.now()
const outputs=await Promise.all(Array.from({length:4},async(_,k)=>{
 const payload=work.filter((_,i)=>i%4===k).map(x=>x.input).join('\n')+'\n'
 if(saved){assert.equal(fs.readFileSync(root+`/input-${k}.tsv`,'utf8'),payload);return fs.readFileSync(root+`/output-${k}.tsv`,'utf8')}
 fs.writeFileSync(root+`/input-${k}.tsv`,payload)
 return new Promise((resolve,reject)=>{const child=execFile(binary,[],{encoding:'utf8',timeout:285000,maxBuffer:128e6,windowsHide:true},(e,out,err)=>{
  fs.writeFileSync(root+`/output-${k}.tsv`,out??'');fs.writeFileSync(root+`/stderr-${k}.txt`,err??'');if(e)reject(e);else resolve(out)
 });child.stdin.end(payload)})
}))
const old=new Map(selected.map(r=>[r.caseId,r]))
const rows=outputs.flatMap(out=>{
 const lines=out.trim().split(/\r?\n/),batch=lines.pop().split('\t');assert.equal(batch[2],'summary');assert.equal(batch[3],'ok')
 return lines.map(line=>{
  const c=line.split('\t');assert.equal(c.length,51);assert.equal(c[3],'ok');const b=old.get(c[1]);assert.ok(b)
  const milestones=c.slice(11,11+Number(c[10])).map(Number),tier=q=>milestones.filter(x=>q>=x).length
  const completed=c[15]==='completed',quality=Number(c[27]),acts=c[18].split(',')
  return {caseId:c[1],sample:b.seedIndex,mode:c[4].replace('generic-craft-external-reference-exp-',''),family:familyNames.get(b.familyId),familyId:b.familyId,equipment:b.equipmentId,world:b.worldId,kind:c[9],baselineCompleted:b.terminal==='completed',baselineFull:b.terminal==='completed'&&b.qualityMaximumReached,baselineActions:b.actions,baselineQuality:b.quality,baselineTier:b.terminal==='completed'?tier(b.quality):0,completed,full:completed&&quality>=Number(c[6]),actions:Number(c[17]),steps:Number(c[25])-1,quality,tier:completed?tier(quality):0,stop:c[16],observe:acts.filter(a=>a==='observe').length,durations:c[50].split(',').map(Number)}
 })
})
assert.equal(rows.length,work.length)
const quantiles=xs=>{xs.sort((a,b)=>a-b);return Object.fromEntries([['p50',.5],['p95',.95],['max',1]].map(([k,p])=>[k,xs[Math.ceil(xs.length*p)-1]??null]))}
function summary(rs){
 const both=rs.filter(r=>r.baselineFull&&r.full)
 return {n:rs.length,baselineCompleted:rs.filter(r=>r.baselineCompleted).length,completed:rs.filter(r=>r.completed).length,baselineFull:rs.filter(r=>r.baselineFull).length,full:rs.filter(r=>r.full).length,wins:rs.filter(r=>!r.baselineFull&&r.full).length,losses:rs.filter(r=>r.baselineFull&&!r.full).length,bothFullN:both.length,bothFullMeanActionDelta:both.length?both.reduce((s,r)=>s+r.actions-r.baselineActions,0)/both.length:null,tierUp:rs.filter(r=>r.baselineCompleted&&r.completed&&r.tier>r.baselineTier).length,tierDown:rs.filter(r=>r.baselineCompleted&&r.completed&&r.tier<r.baselineTier).length,completedActions:quantiles(rs.filter(r=>r.completed).map(r=>r.actions)),failedActions:quantiles(rs.filter(r=>!r.completed).map(r=>r.actions)),observe:quantiles(rs.map(r=>r.observe)),stops:Object.fromEntries(Object.entries(Object.groupBy(rs,r=>r.stop)).map(([k,v])=>[k,v.length]))}
}
const group=(rs,key)=>Object.fromEntries(Object.entries(Object.groupBy(rs,key)).map(([k,v])=>[k,summary(v)]))
const arms=Object.fromEntries(modes.map(m=>{const rs=rows.filter(r=>r.mode===m);return [m,{...summary(rs),objectives:group(rs,r=>r.kind),families:group(rs,r=>r.family),equipment:group(rs,r=>r.equipment),worlds:group(rs,r=>r.world),cells:group(rs,r=>[r.family,r.equipment,r.world].join('|')),latency:quantiles(rs.flatMap(r=>r.durations).map(x=>x/1e6))}]}))
const result={sha,modes,samples,arms,rows:rows.map(({durations,...r})=>r)}
if(saved)assert.deepEqual(JSON.parse(fs.readFileSync(root+'/result.json')),result)
else{fs.writeFileSync(root+'/result.json',JSON.stringify(result,null,2));fs.writeFileSync(root+'/timing.json',JSON.stringify({wallMs:performance.now()-start}))}
console.log(JSON.stringify(Object.fromEntries(modes.map(m=>[m,{...arms[m],objectives:undefined,families:undefined,equipment:undefined,worlds:undefined,cells:undefined}])),null,2))
