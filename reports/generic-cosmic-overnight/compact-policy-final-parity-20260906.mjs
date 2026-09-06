import fs from 'node:fs'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import {execFile} from 'node:child_process'
const root='evaluation-runs/compact-policy-development'
const screen=root+'/screen-combined'
const inputs=[0,1,2,3].flatMap(k=>fs.readFileSync(screen+`/input-${k}.tsv`,'utf8').trim().split(/\r?\n/))
const expected=new Map([0,1,2,3].flatMap(k=>fs.readFileSync(screen+`/output-${k}.tsv`,'utf8').trim().split(/\r?\n/)).map(l=>{const c=l.split('\t');return [c[1],c]}))
const families=Object.values(Object.groupBy(inputs,l=>l.split('|')[0]))
const selected=families.flatMap((rs,i)=>['balanced-iid','normal-heavy-iid'].map(w=>rs.filter(r=>r.includes(`|world:${w}@`))[i%5]))
assert.equal(selected.length,100)
const binary='native/craft-kernel/target/release/craft-kernel-generic-episode.exe'
const run=(exe,rows)=>new Promise((resolve,reject)=>{const child=execFile(exe,[],{encoding:'utf8',timeout:180000,maxBuffer:64e6,windowsHide:true},(e,out)=>e?reject(e):resolve(out));child.stdin.end(rows.join('\n')+'\n')})
const episodes=out=>out.trim().split(/\r?\n/).map(l=>l.split('\t')).filter(c=>c[2]==='episode')
const old='evaluation-runs/opening-recovery-development/.artifacts/889253f5f76a47373380e8398a32d783cb1477772e08c139be55a95ee02c8621/craft-kernel-generic-episode.exe'
const baselineInput=selected.filter((_,i)=>i%2===0).map(l=>{const c=l.split('\t');c[3]='generic-craft-external-reference-exp-opening-recovery';return c.join('\t')})
const oldBaseline=episodes(await run(old,baselineInput));assert.equal(oldBaseline.length,50)
const currentBaselineInput=baselineInput.map(l=>l.replace('generic-craft-external-reference-exp-opening-recovery','generic-craft-external-reference-v2.3.0'))
const all=[...selected,...currentBaselineInput]
const outputs=await Promise.all([0,1,2,3].map(k=>run(binary,all.filter((_,i)=>i%4===k))))
const baselineMap=new Map(oldBaseline.map(c=>[c[1],c]));let candidates=0,baselines=0
for(const out of outputs)for(const c of episodes(out)){
 const baseline=c[4].endsWith('v2.3.0'),e=baseline?baselineMap.get(c[1]):expected.get(c[1]);assert.ok(e);assert.equal(c.length,51)
 for(let j=0;j<51;j++)if(![4,22,23,50].includes(j))assert.equal(c[j],e[j],`${c[1]} field ${j}`)
 if(baseline)baselines++;else candidates++
}
assert.equal(candidates,100);assert.equal(baselines,50)
fs.writeFileSync(root+'/wasm-parity-input.tsv',selected.filter((_,i)=>Math.floor(i/2)%7===0).join('\n')+'\n')
const result={sha:crypto.createHash('sha256').update(fs.readFileSync(binary)).digest('hex'),candidates,baselines,nonTimingMismatches:0,fields:'actions, full transitions, RNG cursors, final state and context; policy alias and timing excluded'}
fs.writeFileSync(root+'/final-parity.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result))
