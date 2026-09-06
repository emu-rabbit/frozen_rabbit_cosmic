import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'

const root = 'evaluation-runs/time-aware-recovery-development'
const oldRoot = 'evaluation-runs/opening-recovery-development/opening-recovery-v23-s64'
const source = 'evaluation-runs/resource-certificate-development/artisan-continuation-fresh-s64/raw-partials'
const modes = ['time-aware-recovery', 'eager-recovery']
const cfg = JSON.parse(fs.readFileSync(oldRoot + '/config.json'))
const familyNames = new Map(cfg.payload.axes.families.map((f,i) => [f.familyId, `F${String(i+1).padStart(2,'0')}`]))
const selected = fs.readdirSync(oldRoot + '/shards').filter(f => f.endsWith('.json')).flatMap(f => {
  const shard = JSON.parse(fs.readFileSync(oldRoot + '/shards/' + f))
  assert.equal(shard.status, 'completed')
  return shard.report.rows.filter(r => r.arm === 'candidate' && r.seedIndex === 0)
})
assert.equal(selected.length,500)
assert.equal(new Set(selected.map(r=>r.caseId)).size,500)
const files = fs.readdirSync(source).filter(f=>f.endsWith('.candidate.tsv'))
const cache = new Map()
function input(row,mode) {
  if(!cache.has(row.familyId))cache.set(row.familyId,new Map(fs.readFileSync(path.join(source,files.find(f=>f.startsWith(row.familyId))),'utf8').trim().split(/\r?\n/).map(r=>[r.split('\t')[1],r])))
  const c = cache.get(row.familyId).get(row.caseId).split('\t')
  c[3] = 'generic-craft-external-reference-exp-' + mode
  c[15] = 'none'
  return c.join('\t')
}
const verify = process.argv.includes('--verify-saved')
const saved = verify || process.argv.includes('--read-saved')
const executable = 'native/craft-kernel/target/release/craft-kernel-generic-episode.exe'
const hash = b=>crypto.createHash('sha256').update(b).digest('hex')
const binaryBytes = saved ? null : fs.readFileSync(executable)
const sha = saved ? JSON.parse(fs.readFileSync(root+'/config.json')).sha : hash(binaryBytes)
const binary = `${root}/.artifacts/${sha}/craft-kernel-generic-episode.exe`
if(!saved){
 assert.ok(!fs.existsSync(root+'/result.json'),'completed result exists')
 fs.mkdirSync(path.dirname(binary),{recursive:true});fs.writeFileSync(binary,binaryBytes)
 fs.writeFileSync(root+'/config.json',JSON.stringify({sha,sourceFingerprint:cfg.configFingerprint,modes,n:500,workers:4,maxWallMs:300000},null,2))
}
assert.equal(hash(fs.readFileSync(binary)),sha)
const work = modes.flatMap(mode=>selected.map(row=>({mode,row,input:input(row,mode)})))
const started=performance.now()
console.log(JSON.stringify({episodes:work.length,sha,workers:4}))
const outputs = await Promise.all(Array.from({length:4},async(_,k)=>{
 const items=work.filter((_,i)=>i%4===k), payload=items.map(x=>x.input).join('\n')+'\n'
 if(saved){assert.equal(fs.readFileSync(root+`/input-${k}.tsv`,'utf8'),payload);return fs.readFileSync(root+`/output-${k}.tsv`,'utf8')}
 fs.writeFileSync(root+`/input-${k}.tsv`,payload)
 return new Promise((resolve,reject)=>{
  const child=execFile(binary,[],{encoding:'utf8',timeout:285000,maxBuffer:64e6,windowsHide:true},(error,stdout,stderr)=>{
   fs.writeFileSync(root+`/output-${k}.tsv`,stdout??'');fs.writeFileSync(root+`/stderr-${k}.txt`,stderr??'')
   if(error)reject(error);else resolve(stdout)
  });child.stdin.end(payload)
 })
}))
const old = new Map(selected.map(r=>[r.caseId,r]))
const rows = outputs.flatMap(out=>{
 const lines=out.trim().split(/\r?\n/), batch=lines.pop().split('\t')
 assert.equal(batch[2],'summary');assert.equal(batch[3],'ok');assert.equal(Number(batch[4]),250)
 return lines.map(line=>{
  const c=line.split('\t');assert.equal(c.length,51);assert.equal(c[3],'ok')
  const b=old.get(c[1]);assert.ok(b)
  const durations=c[50].split(',').map(Number);assert.equal(durations.length,Number(c[21]))
  const acts=c[18].split(',')
  const completed=c[15]==='completed',full=completed&&Number(c[27])>=Number(c[6])
  const milestones=c.slice(11,11+Number(c[10])).map(Number)
  const tier=q=>milestones.filter(x=>q>=x).length
  return {caseId:c[1],mode:c[4].replace('generic-craft-external-reference-exp-',''),family:familyNames.get(b.familyId),equipment:b.equipmentId,world:b.worldId,kind:c[9],baselineCompleted:b.terminal==='completed',baselineFull:b.terminal==='completed'&&b.qualityMaximumReached,baselineActions:b.actions,baselineQuality:b.quality,baselineTier:b.terminal==='completed'?tier(b.quality):0,completed,full,actions:Number(c[17]),steps:Number(c[25])-1,quality:Number(c[27]),tier:completed?tier(Number(c[27])):0,stop:c[16],observe:acts.filter(a=>a==='observe').length,durations}
 })
})
assert.equal(rows.length,1000)
function summary(rs){
 const both=rs.filter(r=>r.baselineFull&&r.full), complete=rs.filter(r=>r.completed).map(r=>r.actions).sort((a,b)=>a-b)
 return {n:rs.length,baselineCompleted:rs.filter(r=>r.baselineCompleted).length,completed:rs.filter(r=>r.completed).length,baselineFull:rs.filter(r=>r.baselineFull).length,full:rs.filter(r=>r.full).length,wins:rs.filter(r=>!r.baselineFull&&r.full).length,losses:rs.filter(r=>r.baselineFull&&!r.full).length,bothFullN:both.length,bothFullMeanActionDelta:both.length?both.reduce((s,r)=>s+r.actions-r.baselineActions,0)/both.length:null,tierUp:rs.filter(r=>r.baselineCompleted&&r.completed&&r.tier>r.baselineTier).length,tierDown:rs.filter(r=>r.baselineCompleted&&r.completed&&r.tier<r.baselineTier).length,completedActions:{p50:complete[Math.ceil(complete.length*.5)-1],p95:complete[Math.ceil(complete.length*.95)-1],max:complete.at(-1)},stops:Object.fromEntries(Object.entries(Object.groupBy(rs,r=>r.stop)).map(([k,v])=>[k,v.length]))}
}
const group=(rs,key)=>Object.fromEntries(Object.entries(Object.groupBy(rs,r=>r[key])).map(([k,v])=>[k,summary(v)]))
const arms=Object.fromEntries(modes.map(mode=>{
 const rs=rows.filter(r=>r.mode===mode),ds=rs.flatMap(r=>r.durations).sort((a,b)=>a-b),q=p=>ds[Math.ceil(ds.length*p)-1]/1e6
 return [mode,{...summary(rs),objectives:group(rs,'kind'),families:group(rs,'family'),equipment:group(rs,'equipment'),worlds:group(rs,'world'),latency:{calls:ds.length,p50:q(.5),p95:q(.95),max:q(1)}}]
}))
const result={sha,arms,rows:rows.map(({durations,...r})=>r)}
if(verify)assert.deepEqual(JSON.parse(fs.readFileSync(root+'/result.json')),result)
else {fs.writeFileSync(root+'/result.json',JSON.stringify(result,null,2));fs.writeFileSync(root+'/timing.json',JSON.stringify({wallMs:saved?Math.max(...[0,1,2,3].map(k=>fs.statSync(root+`/output-${k}.tsv`).mtimeMs))-fs.statSync(root+'/input-0.tsv').mtimeMs:performance.now()-started}))}
console.log(JSON.stringify(Object.fromEntries(modes.map(m=>[m,{...arms[m],families:undefined,equipment:undefined,worlds:undefined} ])),null,2))
