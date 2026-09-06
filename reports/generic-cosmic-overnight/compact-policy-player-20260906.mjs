import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import {execFile} from 'node:child_process'
const args=Object.fromEntries(process.argv.slice(2).map(a=>a.replace(/^--/,'').split('=')))
assert.match(args.candidate??'',/^generic-craft-external-reference-exp-[a-z-]+$/)
const root='evaluation-runs/compact-policy-development/player-confirmation'
const original='evaluation-runs/time-aware-recovery-development/player-mission'
const baseline='generic-craft-external-reference-v2.3.0'
const modes=[baseline,args.candidate]
const source=fs.readFileSync(original+'/input.tsv','utf8').trim().split(/\r?\n/).map(x=>x.split('\t')).filter(c=>c[3]===baseline)
const cases=[]
const inputs=source.flatMap(c=>modes.map(mode=>{
 const recipeId=Number(c[1].match(/player-(\d+)/)[1]),sample=Number(c[1].match(/sample-(\d+)/)[1]),world=c[1].split('|')[1]
 const a=[...c];a[1]=`player-${recipeId}|${world}|sample-${sample}|${mode}`;a[3]=mode;a[56]=String((2026090602+sample*104729+recipeId*13)>>>0)
 cases.push({caseId:a[1],recipeId,sample,world,mode,seed:Number(a[56])});return a.join('\t')
}))
assert.equal(inputs.length,128)
assert.ok(!fs.existsSync(root));fs.mkdirSync(root,{recursive:true})
const bytes=fs.readFileSync('native/craft-kernel/target/release/craft-kernel-generic-episode.exe'),sha=crypto.createHash('sha256').update(bytes).digest('hex')
const binary=`evaluation-runs/compact-policy-development/.artifacts/${sha}/craft-kernel-generic-episode.exe`
fs.mkdirSync(path.dirname(binary),{recursive:true});fs.writeFileSync(binary,bytes)
fs.writeFileSync(root+'/input.tsv',inputs.join('\n')+'\n');fs.writeFileSync(root+'/cases.json',JSON.stringify(cases,null,2))
fs.writeFileSync(root+'/config.json',JSON.stringify({sha,modes,baseSeed:2026090602,secondsPerAction:[4,5,6],overheadSeconds:30,missionSeconds:600},null,2))
const started=performance.now()
const outputs=await Promise.all([0,1,2,3].map(k=>new Promise((resolve,reject)=>{
 const child=execFile(binary,[],{encoding:'utf8',timeout:180000,maxBuffer:32e6,windowsHide:true},(e,out,err)=>{
  fs.writeFileSync(root+`/output-${k}.tsv`,out??'');fs.writeFileSync(root+`/stderr-${k}.txt`,err??'');if(e)reject(e);else resolve(out)
 });child.stdin.end(inputs.filter((_,i)=>i%4===k).join('\n')+'\n')
})))
const metadata=new Map(cases.map(c=>[c.caseId,c]))
const rows=outputs.flatMap(out=>{const lines=out.trim().split(/\r?\n/),batch=lines.pop().split('\t');assert.equal(batch[3],'ok');return lines.map(line=>{
 const c=line.split('\t');assert.equal(c.length,51);assert.equal(c[3],'ok');const completed=c[15]==='completed',quality=Number(c[27]);return {...metadata.get(c[1]),completed,quality,full:completed&&quality>=Number(c[6]),actions:Number(c[17]),stop:c[16]}
})})
const pairs=Object.values(Object.groupBy(rows,r=>[r.world,r.sample,r.mode].join('|'))).map(rs=>{
 assert.equal(rs.length,2);const first=rs.find(r=>r.recipeId===36534),second=rs.find(r=>r.recipeId===36535)
 return {world:first.world,sample:first.sample,mode:first.mode,complete:first.completed&&second.completed,bothFull:first.full&&second.full,thirdTier:first.full&&second.completed&&second.quality>=24660,actions:first.actions+second.actions}
})
function summary(ps){return {n:ps.length,complete:ps.filter(p=>p.complete).length,bothFull:ps.filter(p=>p.bothFull).length,thirdTier:ps.filter(p=>p.thirdTier).length,within:Object.fromEntries([4,5,6].map(s=>[s,{complete:ps.filter(p=>p.complete&&p.actions*s+30<=600).length,bothFull:ps.filter(p=>p.bothFull&&p.actions*s+30<=600).length,thirdTier:ps.filter(p=>p.thirdTier&&p.actions*s+30<=600).length}]))}}
const arms=Object.fromEntries(modes.map(m=>[m,{...summary(pairs.filter(p=>p.mode===m)),worlds:Object.fromEntries(['balanced-iid','normal-heavy-iid'].map(w=>[w,summary(pairs.filter(p=>p.mode===m&&p.world===w))]))}]))
const result={sha,wallMs:performance.now()-started,arms,pairs,rows}
fs.writeFileSync(root+'/result.json',JSON.stringify(result,null,2));console.log(JSON.stringify({sha,wallMs:result.wallMs,arms},null,2))
