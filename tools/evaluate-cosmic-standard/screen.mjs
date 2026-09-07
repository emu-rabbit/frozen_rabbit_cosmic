import fs from 'node:fs'
import { spawnSync } from 'node:child_process'
const [mode='policy',out='.tmp/cosmic-standard',policy='generic-craft-exp-cosmic-standard-search',start='0',count='16'] = process.argv.slice(2)
const cases=JSON.parse(fs.readFileSync(`${out}/cases.json`,'utf8'))
const binary='tools/evaluate-normal-reference/native/target/release/normal-craft-reference.exe'
if(mode==='raphael') {
  const selected=cases.filter(c=>c.recipe.recipeId===36188 && c.crafter.maxCp===500 && c.crafter.control<=3500)
  const run=spawnSync(binary,['8000'],{input:selected.map(c=>c.input).join('\n')+'\n',encoding:'utf8',timeout:40000,maxBuffer:16*1024*1024})
  if(run.error||run.status!==0)throw Error(run.error??run.stderr)
  fs.writeFileSync(`${out}/raphael-near.jsonl`,run.stdout)
  console.log(run.stdout.split('\n').filter(l=>l.includes('"event":"result"')).map(l=>{const r=JSON.parse(l);return {id:r.caseId,status:r.status,quality:r.replay?.local.quality}}))
} else {
  // Condition probabilities are explicit synthetic assumptions, not game rates.
  const selected=cases.filter(c=>c.recipe.recipeId===36188 && c.crafter.maxCp===500 && [2000,2500,3500].includes(c.crafter.control))
  const inputs=[]
  for(const c of selected) for(let seed=+start;seed<+start + +count;seed++) {
    const cells=c.input.split('\t');cells[1]+=`-seed${seed}`;cells[3]=policy;cells[56]=String(seed)
    for(let i=60;i<181;i++)cells[i]=String((i-60)%11===0?78:(i-60)%11===1?20:(i-60)%11===9?2:0)
    inputs.push(cells.join('\t'))
  }
  const run=spawnSync(binary,['1','policy'],{input:inputs.join('\n')+'\n',encoding:'utf8',timeout:55000,maxBuffer:64*1024*1024})
  if(run.error||run.status!==0)throw Error(run.error??run.stderr)
  const rows=run.stdout.trim().split(/\r?\n/).map(JSON.parse)
  fs.writeFileSync(`${out}/${policy}-${start}.jsonl`,run.stdout)
  console.log(selected.map(c=>{const r=rows.filter(r=>r.caseId.startsWith(c.caseId+'-'));return {id:c.caseId,n:r.length,full:r.filter(r=>r.local.quality>=c.recipe.qualityMax&&r.stop==='completed').length,failed:r.filter(r=>r.stop!=='completed').length,maxEpisodeComputeMs:Math.max(...r.map(r=>r.computeNs/1e6)),maxRecommendationMs:Math.max(...r.map(r=>r.maxRecommendationNs/1e6))}}))
}
