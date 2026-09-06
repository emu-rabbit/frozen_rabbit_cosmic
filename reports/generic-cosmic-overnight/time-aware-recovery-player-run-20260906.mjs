import fs from 'node:fs'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { execFile } from 'node:child_process'
const root='evaluation-runs/time-aware-recovery-development'
const dir=root+'/player-mission'
const config=JSON.parse(fs.readFileSync(root+'/config.json'))
const binary=`${root}/.artifacts/${config.sha}/craft-kernel-generic-episode.exe`
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(binary)).digest('hex'),config.sha)
const cases=JSON.parse(fs.readFileSync(dir+'/cases.json'))
const inputs=fs.readFileSync(dir+'/input.tsv','utf8').trim().split(/\r?\n/)
const verify=process.argv.includes('--verify-saved')
assert.equal(inputs.length,192)
const started=performance.now()
const outputs=await Promise.all(Array.from({length:4},async(_,k)=>{
 if(verify)return fs.readFileSync(dir+`/output-${k}.tsv`,'utf8')
 assert.ok(!fs.existsSync(dir+'/result.json'))
 const payload=inputs.filter((_,i)=>i%4===k).join('\n')+'\n'
 return new Promise((resolve,reject)=>{
  const child=execFile(binary,[],{encoding:'utf8',timeout:285000,maxBuffer:32e6,windowsHide:true},(error,stdout,stderr)=>{
   fs.writeFileSync(dir+`/output-${k}.tsv`,stdout??'');fs.writeFileSync(dir+`/stderr-${k}.txt`,stderr??'')
   if(error)reject(error);else resolve(stdout)
  });child.stdin.end(payload)
 })
}))
const rows=outputs.flatMap(out=>{
 const lines=out.trim().split(/\r?\n/),batch=lines.pop().split('\t')
 assert.equal(batch[2],'summary');assert.equal(batch[3],'ok');assert.equal(Number(batch[4]),48)
 return lines.map(line=>{
  const c=line.split('\t');assert.equal(c.length,51);assert.equal(c[3],'ok')
  const meta=cases.find(x=>x.caseId===c[1]);assert.ok(meta)
  const acts=c[18].split(','),completed=c[15]==='completed',quality=Number(c[27]),maximum=Number(c[6])
  return {...meta,completed,quality,maximum,full:completed&&quality>=maximum,actions:Number(c[17]),stop:c[16],observe:acts.filter(x=>x==='observe').length,steps:Number(c[25])-1,prefix:acts.slice(0,12),maxMs:Number(c[23])/1e6}
 })
})
assert.equal(rows.length,192)
const modes=['v2.3.0','exp-time-aware-recovery','exp-eager-recovery']
const pairs=[]
for(const mode of modes)for(const world of ['balanced-iid','normal-heavy-iid'])for(let sample=0;sample<16;sample++){
 const a=rows.find(x=>x.mode===mode&&x.world===world&&x.sample===sample&&x.recipeId===36534)
 const b=rows.find(x=>x.mode===mode&&x.world===world&&x.sample===sample&&x.recipeId===36535)
 const complete=a.full&&b.completed,totalActions=a.actions+b.actions
 pairs.push({mode,world,sample,complete,bothFull:a.full&&b.full,secondTier:complete?[16440,19180,24660,27400].filter(q=>b.quality>=q).length:0,totalActions,within:Object.fromEntries([4,5,6].map(seconds=>[seconds,complete&&totalActions*seconds+30<=600]))})
}
function summary(rs){return {n:rs.length,completed:rs.filter(r=>r.completed).length,full:rs.filter(r=>r.full).length,meanActions:rs.reduce((s,r)=>s+r.actions,0)/rs.length,stops:Object.fromEntries(Object.entries(Object.groupBy(rs,r=>r.stop)).map(([k,v])=>[k,v.length]))}}
const arms=Object.fromEntries(modes.map(mode=>{
 const rs=rows.filter(r=>r.mode===mode),ps=pairs.filter(r=>r.mode===mode)
 return [mode,{recipes:Object.fromEntries([36534,36535].map(id=>[id,summary(rs.filter(r=>r.recipeId===id))])),pairs:{n:ps.length,complete:ps.filter(r=>r.complete).length,bothFull:ps.filter(r=>r.bothFull).length,thirdTierOrBetter:ps.filter(r=>r.complete&&r.secondTier>=3).length,within:Object.fromEntries([4,5,6].map(t=>[t,{complete:ps.filter(r=>r.within[t]).length,thirdTierOrBetter:ps.filter(r=>r.within[t]&&r.secondTier>=3).length,bothFull:ps.filter(r=>r.within[t]&&r.bothFull).length}]))}}]
}))
const result={sha:config.sha,arms,pairs,rows}
if(verify)assert.deepEqual(JSON.parse(fs.readFileSync(dir+'/result.json')),result)
else {fs.writeFileSync(dir+'/result.json',JSON.stringify(result,null,2));fs.writeFileSync(dir+'/timing.json',JSON.stringify({wallMs:performance.now()-started}))}
console.log(JSON.stringify(arms,null,2))
