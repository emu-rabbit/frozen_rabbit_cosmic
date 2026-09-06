import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { parseMissionRows } from './project.mjs'

const header = '#,Name,LockedBehind,WKSMissionRecipe,WKSMissionLotterySpecialCond,MissionTime'
const conditions = '#,WeatherRequired,StartTimeHour,EndTimeHour\n0,0,0,0\n5,0,18,20'

test('mission time follows the unit-to-recipe relation and is separate from availability', () => {
  const result = parseMissionRows(`${header}\n268,EX+: Crew Suits I,0,269,5,600\n269,EX+: Crew Suits II,268,270,0,600`, conditions)
  assert.equal(result.byRecipeId.get(269).unitId, 268)
  assert.equal(result.byRecipeId.get(269).timeLimitSeconds, 600)
  assert.equal(result.byRecipeId.get(269).timed, true)
  assert.equal(result.byRecipeId.get(270).timeLimitSeconds, 600)
  assert.equal(result.byRecipeId.get(270).timed, false)
})

test('missing, fractional and negative mission limits fail closed', () => {
  for (const value of ['', '-1', '1.5', 'unknown']) {
    assert.throws(() => parseMissionRows(`${header}\n268,Test,0,269,0,${value}`, conditions), /invalid MissionTime/)
  }
  assert.throws(() => parseMissionRows(header.replace(',MissionTime', ''), conditions), /missing MissionTime/)
  // Zero is an explicit unlimited duration, not missing data.
  assert.equal(parseMissionRows(`${header}\n1,Other,0,2,0,0`, conditions).byRecipeId.get(2).timeLimitSeconds, 0)
})

test('shipped mission keeps both player recipes under the shared 600-second allowance', () => {
  const directory = new URL('../../apps/web/public/mission-data/', import.meta.url)
  const manifest = JSON.parse(readFileSync(new URL('manifest.json', directory), 'utf8'))
  const bundle = JSON.parse(gunzipSync(readFileSync(new URL(manifest.bundle.file, directory))).toString('utf8'))
  const mission = bundle.missions.find(m => m.id === 269)
  assert.equal(mission.timeLimitSeconds, 600)
  assert.deepEqual(mission.items.map(item => item.recipeId), [36534, 36535])
  assert.equal(bundle.missions.find(m => m.id === 25).timeLimitSeconds, 0)
  assert.equal(bundle.missions.filter(m => m.timeLimitSeconds > 0).length, 160)
  assert.equal(bundle.missions.filter(m => m.timeLimitSeconds === 0).length, 120)
  assert.ok(bundle.missions.every(m => Number.isSafeInteger(m.timeLimitSeconds) && m.timeLimitSeconds >= 0))
})
