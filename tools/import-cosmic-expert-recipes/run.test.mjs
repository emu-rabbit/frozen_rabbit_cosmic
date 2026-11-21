import { test } from 'node:test'
import assert from 'node:assert/strict'
import { missionNamesByRecipeRowId } from './run.mjs'

const header = '#,Name,SilverStarRequirement,GoldStarRequirement,WKSMissionText,ClassJobCategory[0],ClassJobCategory[1],Unknown1,MissionTime,MissionReward,MissionToDo[0],MissionToDo[1],MissionToDo[2],LockedBehind,WKSMissionSupplyItem,WKSMissionRecipe,PlaceName,SortKey,WKSFunction,LevelGroup,MissionLotteryCond,WKSMissionLotterySpecialCond,IsSynced,IsSpecialQuest,Unknown2'
function row(id, name, levelGroup) {
  const values = Array(25).fill('0')
  values[0] = String(id); values[1] = name
  values[15] = String(id); values[19] = String(levelGroup)
  return values.join(',')
}

test('A membership follows LevelGroup, including unlabelled A and excluding D/C/B', () => {
  const names = missionNamesByRecipeRowId([header,
    row(1, 'Multi-purpose Fiberboard', 1),
    row(2, 'Thin Fiberboard', 2),
    row(3, 'Resupplying Containers', 3),
    row(4, 'High-durability Fiberboard', 4),
    row(5, 'EX: Test Material Final Processing', 5),
    row(6, 'Master: Renewable Fuel Survey', 6),
  ].join('\n'))
  assert.deepEqual([...names.keys()], [4, 5, 6])
  assert.equal(names.get(4)[0].nameEn, 'High-durability Fiberboard')
})

test('an unknown mission level group fails closed', () => {
  for (const group of ['', 0, 7, 'bad']) {
    assert.throws(() => missionNamesByRecipeRowId(`${header}\n${row(1, 'Test', group)}`), /invalid LevelGroup/)
  }
})
