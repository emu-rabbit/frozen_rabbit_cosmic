import fs from 'node:fs'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import {execFile} from 'node:child_process'
const dir='evaluation-runs/time-aware-recovery-development/player-mission'
const binary='native/craft-kernel/target/release/craft-kernel-generic-episode.exe'
const inputs=fs.readFileSync(dir+'/input.tsv','utf8').trim().split(/\r?\n/).filter(r=>!r.includes('|exp-time-aware-recovery\t'))
const expected=new Map([0,1,2,3].flatMap(k=>fs.readFileSync(dir+`/output-${k}.tsv`,'utf8').trim().split(/\r?\n/)).filter(r=>!r.includes('\t__batch__\t')).map(r=>{const c=r.split('\t');return [c[1],c]}))
assert.equal(inputs.length,128)
const outputs=await Promise.all([0,1,2,3].map(k=>new Promise((resolve,reject)=>{
 const child=execFile(binary,[],{encoding:'utf8',timeout:120000,maxBuffer:32e6,windowsHide:true},(error,stdout)=>error?reject(error):resolve(stdout))
 child.stdin.end(inputs.filter((_,i)=>i%4===k).join('\n')+'\n')
})))
let n=0
for(const output of outputs){
 const lines=output.trim().split(/\r?\n/),batch=lines.pop().split('\t')
 assert.equal(batch[3],'ok');assert.equal(Number(batch[4]),32)
 for(const line of lines){
  const c=line.split('\t'),e=expected.get(c[1]);assert.equal(c.length,51);assert.ok(e)
  for(let i=0;i<51;i++)if(![22,23,50].includes(i))assert.equal(c[i],e[i],`${c[1]} column ${i}`)
  n++
 }
}
const result={sha:crypto.createHash('sha256').update(fs.readFileSync(binary)).digest('hex'),cases:n,nonTimingMismatches:0,includes:'actions, transitions, final state, draw cursors, context and complete trace'}
fs.writeFileSync(dir+'/final-parity.json',JSON.stringify(result,null,2))
console.log(JSON.stringify(result))
