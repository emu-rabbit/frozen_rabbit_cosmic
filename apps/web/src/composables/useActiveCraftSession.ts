import { computed, readonly, ref, shallowRef, type DeepReadonly } from 'vue'
import {
  ACTIONS,
  createInitialCraftState,
  type CraftActionId,
  type CrafterProfile,
  type MaterialCondition,
} from '@frozen-rabbit-expert/domain'
import {
  COSMIC_CATALOG_VERSION,
  cosmicScenarioDataByRecipeId,
  type CosmicExpertScenarioDataEntry,
} from '@frozen-rabbit-expert/data'
import {
  MODEL_VERSIONS,
  createEventId,
  createSessionExport,
  removeLastStep,
  replaySession,
  type SessionEvent,
  type PlannerTimeBudget,
} from '@frozen-rabbit-expert/protocol'
import type { EquipmentProfile } from './useEquipmentProfiles'
import type { CosmicMission, MissionItem } from '@/types/missionData'
import { WEB_PLANNER_POLICY, plannerRuntime, type PlannerReply } from '@/runtime/planner'
import { createPlannerEpisode } from '@/runtime/planner/episode'
import { applyObservedOutcome, legalActions, previewAction, WEB_MECHANICS_VERSION } from '@/runtime/planner/mechanics'
import { craftTimeBudget, EXPECTED_ACTION_MILLISECONDS, MISSION_RESERVE_MILLISECONDS, type MissionClock } from '@/services/missionClock'

export interface CraftSessionSelection {
  mission: DeepReadonly<CosmicMission>
  item: DeepReadonly<MissionItem>
  equipmentProfile: Readonly<EquipmentProfile>
  crafter: Readonly<CrafterProfile>
}

interface ActiveCraftSession extends CraftSessionSelection {
  scenario: Readonly<CosmicExpertScenarioDataEntry>
  initialState: ReturnType<typeof createInitialCraftState>
  startedAt: number
}

const activeSession = shallowRef<ActiveCraftSession | null>(null)
const missionClock = shallowRef<MissionClock | null>(null)
let recommendationTimeBudget: PlannerTimeBudget | undefined

function currentTimeBudget() {
  return missionClock.value ? craftTimeBudget(missionClock.value, Date.now()) : undefined
}

export function actionNeedsObservedCondition(
  action: CraftActionId,
  currentCondition: MaterialCondition | undefined,
) {
  const definition = ACTIONS[action]
  if (definition.rerollsCondition === true) return true
  if (definition.noStep === true) return false
  return !['goodOmen', 'robust', 'excellent', 'poor'].includes(currentCondition ?? '')
}
const events = ref<SessionEvent[]>([])
const recommendation = shallowRef<PlannerReply | null>(null)
const recommendationLoading = ref(false)
const recommendationError = ref<string | null>(null)
const inputLocked = ref(false)
let requestRevision = 0

const replay = computed(() => {
  const session = activeSession.value
  if (!session) return null
  return replaySession(session.scenario.recipe, session.crafter, session.initialState, events.value, applyObservedOutcome)
})
const state = computed(() => replay.value?.state ?? null)
const actionCount = computed(() => events.value.filter(event => event.type === 'craftActionResolved').length)
const availableActions = computed(() => {
  const session = activeSession.value
  const current = state.value
  return session && current ? legalActions(session.scenario.recipe, session.crafter, current) : []
})

function startEvents(): SessionEvent[] {
  const at = Date.now()
  return [
    { type: 'craftStarted', id: createEventId(), at },
    { type: 'conditionSelected', id: createEventId(), at: at + 1, condition: 'normal' },
  ]
}

async function requestRecommendation(advance: Parameters<typeof plannerRuntime.recommend>[0]) {
  const session = activeSession.value
  const current = state.value
  if (!session || !current || current.terminal !== 'none') {
    recommendation.value = null
    recommendationLoading.value = false
    recommendationError.value = null
    return
  }

  const revision = ++requestRevision
  recommendationLoading.value = true
  recommendationError.value = null
  try {
    const timeBudget = currentTimeBudget()
    const reply = await plannerRuntime.recommend(
      { ...advance, ...(timeBudget ? { timeBudget } : {}) },
      createPlannerEpisode(session.scenario, session.crafter, current),
    )
    if (revision !== requestRevision) return
    recommendationTimeBudget = timeBudget
    recommendation.value = reply
    if (reply.action === null) recommendationError.value = 'policy-null'
  } catch (error) {
    if (revision !== requestRevision) return
    recommendation.value = null
    recommendationError.value = error instanceof Error ? error.message : String(error)
    console.warn('[CraftSession] Recommendation failed', recommendationError.value)
  } finally {
    if (revision === requestRevision) recommendationLoading.value = false
  }
}

export function startCraftSession(selection: CraftSessionSelection, preserveMissionClock = false) {
  const scenario = cosmicScenarioDataByRecipeId(selection.item.recipeId, selection.crafter.level)
  if (!scenario) throw new Error(`Recipe ${selection.item.recipeId} is missing from the Cosmic catalog`)
  if (!preserveMissionClock || missionClock.value?.missionId !== selection.mission.id) {
    missionClock.value = {
      missionId: selection.mission.id,
      timeLimitSeconds: selection.mission.timeLimitSeconds,
      recipeIds: selection.mission.items.map(item => item.recipeId),
      firstReportedConditionAt: null,
      completedRecipeIds: [],
    }
  } else {
    missionClock.value = { ...missionClock.value, completedRecipeIds: missionClock.value.completedRecipeIds.filter(id => id !== selection.item.recipeId) }
  }
  recommendationTimeBudget = undefined
  const crafter = { ...selection.crafter }
  const equipmentProfile = {
    ...selection.equipmentProfile,
    jobs: [...selection.equipmentProfile.jobs],
    food: selection.equipmentProfile.food ? { ...selection.equipmentProfile.food } : null,
    medicine: selection.equipmentProfile.medicine ? { ...selection.equipmentProfile.medicine } : null,
  }
  activeSession.value = {
    ...selection,
    equipmentProfile,
    crafter,
    scenario,
    initialState: createInitialCraftState(scenario.recipe, crafter),
    startedAt: Date.now(),
  }
  events.value = startEvents()
  recommendation.value = null
  recommendationError.value = null
  inputLocked.value = false
  void requestRecommendation({ mode: 'reset' })
}

export function useActiveCraftSession() {
  function exportSession() {
    const session = activeSession.value
    if (!session) return null
    const exported = createSessionExport(
      session.scenario.scenarioId,
      session.scenario.recipe,
      session.scenario.objective,
      session.crafter,
      session.initialState,
      events.value,
      {
        ...MODEL_VERSIONS,
        plannerPolicy: WEB_PLANNER_POLICY,
        recipeCatalog: COSMIC_CATALOG_VERSION,
        mechanics: WEB_MECHANICS_VERSION,
        conditionProfiles: 'manual-cosmic-all-conditions-v1',
        sessionCodec: 'cosmic-session-v1',
      },
    )
    if (missionClock.value) {
      const clock = missionClock.value
      exported.missionTiming = {
        missionId: clock.missionId,
        timeLimitSeconds: clock.timeLimitSeconds,
        firstReportedConditionAt: clock.firstReportedConditionAt,
        completedRecipeIds: [...clock.completedRecipeIds],
        expectedActionMilliseconds: EXPECTED_ACTION_MILLISECONDS,
        reserveMilliseconds: MISSION_RESERVE_MILLISECONDS,
      }
    }
    return exported
  }

  function replaceItem(item: DeepReadonly<MissionItem>) {
    const session = activeSession.value
    if (!session || item.recipeId === session.item.recipeId) return
    startCraftSession({
      mission: session.mission,
      item,
      equipmentProfile: session.equipmentProfile,
      crafter: session.crafter,
    }, true)
  }

  function replaceMission(mission: DeepReadonly<CosmicMission>) {
    const session = activeSession.value
    const item = mission.items[0]
    if (!session || !item) return
    startCraftSession({
      mission,
      item,
      equipmentProfile: session.equipmentProfile,
      crafter: session.crafter,
    })
  }

  function restart() {
    const session = activeSession.value
    if (!session) return
    startCraftSession(session, true)
  }

  async function resolveAction(
    action: CraftActionId,
    success: boolean,
    nextCondition: MaterialCondition,
  ) {
    if (inputLocked.value || recommendationLoading.value) return
    const session = activeSession.value
    const before = state.value
    if (!session || !before || before.terminal !== 'none') return
    if (!availableActions.value.includes(action)) throw new Error(`Illegal action: ${action}`)
    inputLocked.value = true
    try {
      const recommendedAction = recommendation.value?.action
      const now = Date.now()
      events.value = [
        ...events.value,
        {
          type: 'craftActionUsed',
          id: createEventId(),
          at: Date.now(),
          action,
          previousCondition: before.condition,
          ...(recommendationTimeBudget ? { plannerTimeBudget: { ...recommendationTimeBudget } } : {}),
        },
        {
          type: 'craftActionResolved',
          id: createEventId(),
          at: Date.now() + 1,
          success,
          nextCondition,
        },
      ]
      const after = state.value
      // A terminal action has no next condition for the player to report.
      if (after?.terminal === 'none' && missionClock.value && missionClock.value.timeLimitSeconds > 0
        && missionClock.value.firstReportedConditionAt === null
        && actionNeedsObservedCondition(action, before.condition)) {
        missionClock.value = { ...missionClock.value, firstReportedConditionAt: now }
      }
      if (after?.terminal === 'completed' && missionClock.value) {
        missionClock.value = { ...missionClock.value, completedRecipeIds: [...new Set([...missionClock.value.completedRecipeIds, session.item.recipeId])] }
      }
      if (!after || after.terminal !== 'none') {
        ++requestRevision
        recommendation.value = null
        recommendationLoading.value = false
        recommendationError.value = null
        return
      }
      await requestRecommendation({
        mode: recommendedAction === action ? 'continue' : 'deviate',
        action,
      })
    } finally {
      inputLocked.value = false
    }
  }

  async function rebuildRecommendation() {
    const session = activeSession.value
    if (!session) return
    const revision = ++requestRevision
    recommendationLoading.value = true
    recommendationError.value = null
    recommendation.value = null
    try {
      let current = { ...session.initialState, buffs: { ...session.initialState.buffs } }
      let reply: PlannerReply | null = null
      let pendingAction: CraftActionId | null = null
      const recordedActions = events.value.filter(event => event.type === 'craftActionUsed')
      let resolvedCount = 0
      let timeBudget = recordedActions[0]?.plannerTimeBudget ?? (recordedActions.length === 0 ? currentTimeBudget() : undefined)
      for (const event of events.value) {
        if (event.type === 'conditionSelected') {
          current = { ...current, condition: event.condition }
          if (reply === null) {
            reply = await plannerRuntime.recommend(
              { mode: 'reset', ...(timeBudget ? { timeBudget } : {}) },
              createPlannerEpisode(session.scenario, session.crafter, current),
            )
          }
        } else if (event.type === 'craftActionUsed') {
          pendingAction = event.action
        } else if (event.type === 'craftActionResolved' && pendingAction !== null) {
          const actualAction = pendingAction
          current = applyObservedOutcome(
            session.scenario.recipe,
            session.crafter,
            current,
            actualAction,
            event,
          ).nextState
          pendingAction = null
          resolvedCount += 1
          timeBudget = resolvedCount < recordedActions.length
            ? recordedActions[resolvedCount]?.plannerTimeBudget
            : currentTimeBudget()
          if (current.terminal === 'none') {
            reply = await plannerRuntime.recommend(
              { mode: reply?.action === actualAction ? 'continue' : 'deviate', action: actualAction, ...(timeBudget ? { timeBudget } : {}) },
              createPlannerEpisode(session.scenario, session.crafter, current),
            )
          } else reply = null
        }
      }
      if (revision !== requestRevision) return
      recommendationTimeBudget = timeBudget
      recommendation.value = reply
      if (current.terminal === 'none' && reply?.action === null) recommendationError.value = 'policy-null'
    } catch (error) {
      if (revision !== requestRevision) return
      recommendationError.value = error instanceof Error ? error.message : String(error)
      console.warn('[CraftSession] Recommendation rebuild failed', recommendationError.value)
    } finally {
      if (revision === requestRevision) recommendationLoading.value = false
    }
  }

  function undo() {
    if (inputLocked.value || recommendationLoading.value || actionCount.value === 0) return
    events.value = removeLastStep(events.value)
    if (missionClock.value && activeSession.value) {
      missionClock.value = { ...missionClock.value, completedRecipeIds: missionClock.value.completedRecipeIds.filter(id => id !== activeSession.value?.item.recipeId) }
    }
    void rebuildRecommendation()
  }

  function actionNeedsSuccess(action: CraftActionId) {
    const session = activeSession.value
    const current = state.value
    if (!session || !current) return false
    return previewAction(session.scenario.recipe, session.crafter, current, action).successRate < 1
  }

  function actionNeedsNextCondition(action: CraftActionId) {
    return actionNeedsObservedCondition(action, state.value?.condition)
  }

  return {
    activeSession: readonly(activeSession),
    missionClock: readonly(missionClock),
    events: readonly(events),
    state,
    actionCount,
    recommendation: readonly(recommendation),
    recommendationLoading: readonly(recommendationLoading),
    recommendationError: readonly(recommendationError),
    inputLocked: readonly(inputLocked),
    availableActions,
    exportSession,
    replaceItem,
    replaceMission,
    restart,
    resolveAction,
    undo,
    actionNeedsSuccess,
    actionNeedsNextCondition,
  }
}
