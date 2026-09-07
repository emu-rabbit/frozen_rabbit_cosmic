<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type DeepReadonly } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMissionData } from '@/services/missionData'
import { startCraftSession } from '@/composables/useActiveCraftSession'
import { plannerRuntime } from '@/runtime/planner'
import { GENERATED_COSMIC_RECIPES } from '@frozen-rabbit-expert/data'
import {
  calculateEquipmentStatsAfterConsumables,
  findPreferredEquipmentProfileForJob,
  isDefaultEquipmentProfile,
  useEquipmentProfiles,
} from '@/composables/useEquipmentProfiles'
import type { CosmicMission, DataLocale, LocalizedNames, MissionItem } from '@/types/missionData'

const props = defineProps<{ mission: DeepReadonly<CosmicMission>; reset?: boolean }>()
const emit = defineEmits<{ close: []; started: [] }>()
const { t, locale } = useI18n()
const missionData = useMissionData()
const equipmentProfiles = useEquipmentProfiles()
const selectedMission = computed(() => props.mission)
const selectedRecipeId = ref<number | null>(null)
const selectedEquipmentProfileId = ref<string | null>(null)
const detailCloseButton = ref<HTMLButtonElement | null>(null)
const dialog = ref<HTMLElement | null>(null)
const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
const plannerStartPending = ref(false)
let closed = false
const localizedName = (names: LocalizedNames) => {
  const language = locale.value as DataLocale
  return names[language] || names.en || Object.values(names)[0] || ''
}
const compatibleEquipmentProfiles = computed(() => selectedMission.value
  ? equipmentProfiles.profilesForJob(selectedMission.value.job)
  : [])
const selectedEquipmentProfile = computed(() => compatibleEquipmentProfiles.value
  .find(profile => profile.id === selectedEquipmentProfileId.value) ?? null)
const requiredLevel = computed(() => {
  const recipe = GENERATED_COSMIC_RECIPES.find(row => row.recipeId === selectedRecipeId.value)
  return recipe?.maxAdjustableJobLevel ? 10 : recipe?.recipeLevel ?? 100
})
const levelIsValid = computed(() => (selectedEquipmentProfile.value?.level ?? 0) >= requiredLevel.value)
const plannerIsPreparing = computed(() => (
  plannerRuntime.status.value === 'idle'
  || plannerRuntime.status.value === 'loading'
  || plannerStartPending.value
))
const plannerCanStart = computed(() => (
  selectedRecipeId.value !== null
  && selectedEquipmentProfile.value !== null
  && levelIsValid.value
  && plannerRuntime.status.value === 'ready'
  && !plannerStartPending.value
))
const selectedEquipmentSummary = computed(() => {
  const profile = selectedEquipmentProfile.value
  if (!profile) return ''

  const stats = calculateEquipmentStatsAfterConsumables(profile, missionData.consumables.value)
  const parts = [
    `${stats.craftsmanship.toLocaleString()}/${stats.control.toLocaleString()}/${stats.maxCp.toLocaleString()}`,
  ]
  if (profile.relicToolGoodBonus) parts.push(t('missions.equipmentRelicEffect'))
  if (profile.specialist) parts.push(t('missions.equipmentSpecialist'))
  return parts.join(' · ')
})

const preparePlanner = () => {
  void plannerRuntime.initialize().catch(() => {})
}
const openMission = async (mission: DeepReadonly<CosmicMission>) => {
  selectedRecipeId.value = mission.items[0]?.recipeId ?? null
  selectedEquipmentProfileId.value = findPreferredEquipmentProfileForJob(
    equipmentProfiles.orderedProfiles.value,
    mission.job,
  )?.id ?? null
  preparePlanner()
  await nextTick()
  detailCloseButton.value?.focus()
}
const closeMission = () => {
  closed = true
  emit('close')
}
const profileName = (profile: NonNullable<typeof selectedEquipmentProfile.value>) => {
  if (isDefaultEquipmentProfile(profile)) return t('equipmentProfiles.defaultName')
  return profile.name || t('equipmentProfiles.unnamed')
}
const itemInputId = (item: DeepReadonly<MissionItem>) => `mission-item-${item.recipeId}`
const startCrafting = async () => {
  if (plannerStartPending.value || !levelIsValid.value) return
  plannerStartPending.value = true
  try {
    await plannerRuntime.initialize()
    if (closed) return
    const mission = selectedMission.value
    const profile = selectedEquipmentProfile.value
    const item = mission?.items.find(candidate => candidate.recipeId === selectedRecipeId.value)
    if (!mission || !item || !profile) return
    const stats = calculateEquipmentStatsAfterConsumables(profile, missionData.consumables.value)
    startCraftSession({
      mission,
      item,
      equipmentProfile: profile,
      crafter: {
        level: profile.level,
        craftsmanship: stats.craftsmanship,
        control: stats.control,
        maxCp: stats.maxCp,
        cosmicToolGoodBonus: profile.relicToolGoodBonus,
        specialist: profile.specialist,
      },
    })
    emit('started')
  } catch {
    return
  } finally {
    plannerStartPending.value = false
  }
}

const onKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') closeMission()
  if (event.key !== 'Tab') return
  const controls = dialog.value?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled)')
  const first = controls?.[0]
  const last = controls?.[controls.length - 1]
  if (!first || !last) return
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}
watch(() => props.mission, mission => { void openMission(mission) }, { immediate: true })
onMounted(() => { document.addEventListener('keydown', onKeyDown) })
onBeforeUnmount(() => {
  closed = true
  document.removeEventListener('keydown', onKeyDown)
  if (returnFocus?.isConnected) returnFocus.focus()
})
</script>

<template>
  <Teleport to="body">
    <div v-if="selectedMission" class="mission-detail-layer" @click.self="closeMission">
      <section ref="dialog" class="mission-detail" role="dialog" aria-modal="true" :aria-labelledby="`mission-${selectedMission.id}-title`">
        <button ref="detailCloseButton" class="mission-detail-close" type="button" :aria-label="t('common.close')" @click="closeMission">
          <i class="pi pi-times" aria-hidden="true"></i>
        </button>
        <div class="mission-detail-heading">
          <img :src="selectedMission.jobIcon" :alt="t(`missions.jobs.${selectedMission.job}`)" />
          <div>
            <span>{{ t(`missions.jobs.${selectedMission.job}`) }} · {{ t(`missions.planets.${selectedMission.planet}`) }}</span>
            <h2 :id="`mission-${selectedMission.id}-title`">{{ localizedName(selectedMission.names) }}</h2>
          </div>
        </div>
        <p v-if="reset" class="mission-equipment-summary">{{ t('solver.resetMissionDescription') }}</p>
        <p v-if="selectedEquipmentProfile && !levelIsValid" role="alert">{{ t('missions.requiredLevel', { level: requiredLevel }) }}</p>
        <fieldset class="mission-detail-section">
          <legend>{{ t('missions.chooseItem') }}</legend>
          <div class="mission-detail-items">
            <label v-for="item in selectedMission.items" :key="item.recipeId" class="mission-detail-item" :for="itemInputId(item)">
              <input :id="itemInputId(item)" v-model="selectedRecipeId" type="radio" name="mission-item" :value="item.recipeId" />
              <img :src="item.icon" :alt="localizedName(item.names)" />
              <strong>{{ localizedName(item.names) }}</strong>
              <i class="pi pi-check" aria-hidden="true"></i>
            </label>
          </div>
        </fieldset>
        <fieldset class="mission-detail-section">
          <legend>{{ t('missions.chooseEquipmentProfile') }}</legend>
          <label class="mission-equipment-select">
            <span class="sr-only">{{ t('missions.equipmentProfileLabel') }}</span>
            <select v-model="selectedEquipmentProfileId">
              <option v-for="profile in compatibleEquipmentProfiles" :key="profile.id" :value="profile.id">
                {{ profileName(profile) }}
              </option>
            </select>
            <i class="pi pi-chevron-down" aria-hidden="true"></i>
          </label>
          <p v-if="selectedEquipmentProfile" class="mission-equipment-summary">
            {{ selectedEquipmentSummary }}
          </p>
        </fieldset>
        <div v-if="plannerRuntime.status.value === 'error'" class="mission-planner-status--error" role="alert">
          <span>{{ t('missions.solverLoadError') }}</span>
          <button type="button" @click="preparePlanner">{{ t('missions.retrySolver') }}</button>
        </div>
        <button class="mission-detail-start" type="button" :disabled="!plannerCanStart" aria-live="polite" @click="startCrafting">
          <i v-if="plannerIsPreparing" class="pi pi-spin pi-spinner" aria-hidden="true"></i>
          {{ t(plannerIsPreparing ? 'missions.preparingSolver' : reset ? 'solver.resetMission' : 'missions.startCrafting') }}
        </button>
      </section>
    </div>
  </Teleport>
</template>
