import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
const mode = process.argv[2];
assert.ok(['deferred', 'confirmed'].includes(mode));
const solver = `generic-craft-external-reference-exp-opening-${mode}`;
const oldRoot='evaluation-runs/opening-recovery-development/opening-recovery-v23-s64';
const oldSource='evaluation-runs/resource-certificate-development/artisan-continuation-fresh-s64/raw-partials';
const review=JSON.parse(fs.readFileSync('reports/generic-cosmic-overnight/opening-recovery-s64-slices-20260906.json'));
const changes=new Set(review.changes.map(x=>x.caseId));
const cfg=JSON.parse(fs.readFileSync(oldRoot+'/config.json'));
const families=new Map(cfg.payload.axes.families.map((f,i)=>[f.familyId,`F${String(i+1).padStart(2,'0')}`]));
const equipment=new Map(cfg.payload.axes.equipmentIds.map((e,i)=>[e,['E02','E03','E07','E09','E10'][i]]));
const selected=[];
for(const file of fs.readdirSync(oldRoot+'/shards').filter(f=>f.endsWith('.json'))){
 const s=JSON.parse(fs.readFileSync(oldRoot+'/shards/'+file));assert.equal(s.status,'completed');
 const b=new Map(s.report.rows.filter(r=>r.arm==='baseline').map(r=>[r.caseId,r]));
 for(const o of s.report.rows.filter(r=>r.arm==='candidate'&&(r.seedIndex===0||changes.has(r.caseId))))selected.push({b:b.get(o.caseId),o});
}
assert.equal(new Set(selected.map(p=>p.o.caseId)).size,selected.length);
assert.equal(selected.filter(p=>changes.has(p.o.caseId)).length,114);
const files=fs.readdirSync(oldSource).filter(f=>f.endsWith('.candidate.tsv')), cache=new Map();
function input(p){const family=p.o.familyId;if(!cache.has(family))cache.set(family,new Map(fs.readFileSync(oldSource+'/'+files.find(f=>f.startsWith(family)),'utf8').trim().split(/\r?\n/).map(r=>[r.split('\t')[1],r])));const c=cache.get(family).get(p.o.caseId).split('\t');c[3]=solver;c[15]='none';return c.join('\t');}
const verify=process.argv.includes('--verify-saved');
const saved=process.argv.includes('--read-saved')||verify;
const root=`evaluation-runs/opening-recovery-repair/${mode}-diagnostic-s64`;
const existingConfig=saved?JSON.parse(fs.readFileSync(root+'/config.json')):null;
const binaryPath=saved?`evaluation-runs/opening-recovery-repair/.artifacts/${existingConfig.sha}/craft-kernel-generic-episode.exe`:(process.argv.find(x=>x.startsWith('--binary='))?.slice(9)??'native/craft-kernel/target/release/craft-kernel-generic-episode.exe');
const binary=fs.readFileSync(binaryPath);
const sha=crypto.createHash('sha256').update(binary).digest('hex');
const bin=`evaluation-runs/opening-recovery-repair/.artifacts/${sha}/craft-kernel-generic-episode.exe`;
fs.mkdirSync(path.dirname(bin),{recursive:true});if(!fs.existsSync(bin))fs.writeFileSync(bin,binary,{flag:'wx'});
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(bin)).digest('hex'),sha);
fs.mkdirSync(root,{recursive:true});assert.ok(verify||!fs.existsSync(root+'/result.json'),'completed result exists');
const inputs=Array.from({length:4},(_,k)=>selected.filter((_,i)=>i%4===k).map(input).join('\n')+'\n');
if(!saved)fs.writeFileSync(root+'/config.json',JSON.stringify({mode,solver,sha,baseConfig:cfg.configFingerprint,source:'all 114 changed-quality cases plus sample 0 in each of 500 cells; development only',cases:selected.length,workers:4,maxWallMs:300000},null,2));
console.log(JSON.stringify({mode,cases:selected.length,sha,workers:4}));
const start=performance.now();
const outputs=saved ? inputs.map((_,k)=>fs.readFileSync(root+`/output-${k}.tsv`,'utf8')) : await Promise.all(inputs.map((input,k)=>new Promise((resolve,reject)=>{
 fs.writeFileSync(root+`/input-${k}.tsv`,input);
 const child=execFile(bin,[],{encoding:'utf8',timeout:270000,maxBuffer:32e6,windowsHide:true},(error,stdout,stderr)=>{
  fs.writeFileSync(root+`/output-${k}.tsv`,stdout??'');fs.writeFileSync(root+`/stderr-${k}.txt`,stderr??'');
  if(error)reject(error);else resolve(stdout);
 });child.stdin.end(input);
})));
const out=new Map(outputs.flatMap(t=>t.trim().split(/\r?\n/)).filter(r=>r.split('\t')[1]!=='__batch__').map(r=>{const c=r.split('\t');assert.equal(c.length,51);assert.equal(c[3],'ok');assert.equal(c[4],solver);const durations=c[50]==='-'?[]:c[50].split(',').map(Number);assert.equal(durations.length,Number(c[21]));assert.equal(durations.reduce((s,n)=>s+n,0),Number(c[22]));assert.equal(Math.max(0,...durations),Number(c[23]));return [c[1],{terminal:c[15],stop:c[16],actions:Number(c[17]),quality:Number(c[27]),calls:Number(c[21]),durations}];}));
assert.equal(out.size,selected.length);
const full=r=>r.terminal==='completed'&&r.qualityMaximumReached;
const rs=selected.map(p=>{const c=out.get(p.o.caseId);assert.ok(c);return {caseId:p.o.caseId,family:families.get(p.o.familyId),equipment:equipment.get(p.o.equipmentId),world:p.o.worldId,hard:p.o.qualityUtilityKind==='hard-quality-max',oldWin:!full(p.b)&&full(p.o),oldLoss:full(p.b)&&!full(p.o),baselineFull:full(p.b),openingFull:full(p.o),candidateFull:c.terminal==='completed'&&c.quality>=p.o.qualityMaximum,openingActions:p.o.actions,openingStop:p.o.stopReason,...c};});
function summary(rs){const both=rs.filter(r=>r.openingFull&&r.candidateFull);return {n:rs.length,baselineFull:rs.filter(r=>r.baselineFull).length,openingFull:rs.filter(r=>r.openingFull).length,candidateFull:rs.filter(r=>r.candidateFull).length,wins:rs.filter(r=>!r.openingFull&&r.candidateFull).length,losses:rs.filter(r=>r.openingFull&&!r.candidateFull).length,rescuedOldLoss:rs.filter(r=>r.oldLoss&&r.candidateFull).length,lostOldWin:rs.filter(r=>r.oldWin&&!r.candidateFull).length,newLossFromQualityTie:rs.filter(r=>!r.oldWin&&!r.oldLoss&&r.openingFull&&!r.candidateFull).length,newWinFromQualityTie:rs.filter(r=>!r.oldWin&&!r.oldLoss&&!r.openingFull&&r.candidateFull).length,stops:Object.fromEntries(Object.entries(Object.groupBy(rs,r=>r.stop)).map(([k,v])=>[k,v.length])),bothFullN:both.length,bothFullActionDelta:both.length?both.reduce((s,r)=>s+r.actions-r.openingActions,0)/both.length:null};}
const group=(key)=>Object.fromEntries(Object.entries(Object.groupBy(rs.filter(r=>r.hard),r=>r[key])).map(([k,v])=>[k,summary(v)]));
const ds=rs.flatMap(r=>r.durations).sort((a,b)=>a-b),q=p=>ds[Math.ceil(ds.length*p)-1]/1e6;
const wallMs=saved ? Math.max(...inputs.map((_,k)=>fs.statSync(root+`/output-${k}.tsv`).mtimeMs))-fs.statSync(root+'/input-0.tsv').mtimeMs : performance.now()-start;
const result={mode,sha,wallMs,overall:summary(rs),hard:summary(rs.filter(r=>r.hard)),families:group('family'),equipment:group('equipment'),world:group('world'),latency:{calls:ds.length,p50:q(.5),p95:q(.95),worst:q(1),over100ms:ds.filter(x=>x>1e8).length},rows:rs.map(({durations,...r})=>r)};
if(verify){const previous=JSON.parse(fs.readFileSync(root+'/result.json'));const {wallMs:oldWall,...oldRest}=previous;const {wallMs:newWall,...newRest}=result;assert.deepEqual(newRest,oldRest);console.log('saved outputs verified');}else fs.writeFileSync(root+'/result.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({...result,rows:undefined},null,2));
