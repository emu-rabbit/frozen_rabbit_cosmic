<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch, type DeepReadonly } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useMissionData } from '@/services/missionData'
import { useFavoriteMissions } from '@/composables/useFavoriteMissions'
import MissionSetupDialog from '@/components/crafting/MissionSetupDialog.vue'
import {
  CRAFT_JOBS, MISSION_PLANETS, MISSION_RANKS, MISSION_TYPES,
  type CosmicMission, type CraftJob, type DataLocale, type LocalizedNames,
  type MissionPlanet, type MissionRank, type MissionType,
} from '@/types/missionData'

interface MissionFilters {
  jobs: CraftJob[]
  ranks: MissionRank[]
  planets: MissionPlanet[]
  types: MissionType[]
}

const props = withDefaults(defineProps<{ favoritesOnly?: boolean }>(), {
  favoritesOnly: false,
})

const PAGE_SIZE = 12
const { t, locale } = useI18n()
const router = useRouter()
const missionData = useMissionData()
const favoriteMissions = useFavoriteMissions()
const query = ref('')
const visibleCount = ref(PAGE_SIZE)
const isFilterOpen = ref(false)
const selectedMission = ref<DeepReadonly<CosmicMission> | null>(null)
const filterButton = ref<HTMLButtonElement | null>(null)
const filterCloseButton = ref<HTMLButtonElement | null>(null)
const filterShell = ref<HTMLElement | null>(null)
const applied = reactive<MissionFilters>({ jobs: [], ranks: [], planets: [], types: [] })
const draft = reactive<MissionFilters>({ jobs: [], ranks: [], planets: [], types: [] })

const localizedName = (names: LocalizedNames) => {
  const language = locale.value as DataLocale
  return names[language] || names.en || Object.values(names)[0] || ''
}

const filterIsActive = computed(() => applied.jobs.length + applied.ranks.length + applied.planets.length + applied.types.length > 0)
const filteredMissions = computed(() => {
  const search = query.value.trim().toLocaleLowerCase()
  return missionData.missions.value.filter((mission) => {
    if (props.favoritesOnly && !favoriteMissions.isFavorite(mission.id)) return false
    if (applied.jobs.length && !applied.jobs.includes(mission.job)) return false
    if (applied.ranks.length && !applied.ranks.includes(mission.rank)) return false
    if (applied.planets.length && !applied.planets.includes(mission.planet)) return false
    if (applied.types.length && !applied.types.every(type => mission.types.includes(type))) return false
    if (!search) return true
    return [
      ...Object.values(mission.names),
      t(`missions.jobs.${mission.job}`),
      t(`missions.planets.${mission.planet}`),
      ...mission.items.flatMap(item => Object.values(item.names)),
    ].join(' ').toLocaleLowerCase().includes(search)
  })
})
const visibleMissions = computed(() => filteredMissions.value.slice(0, visibleCount.value))
const hasFavorites = computed(() => favoriteMissions.favoriteMissionIds.value.length > 0)
watch([query, () => JSON.stringify(applied)], () => { visibleCount.value = PAGE_SIZE })

const copyFilters = (from: MissionFilters, to: MissionFilters) => {
  to.jobs = [...from.jobs]
  to.ranks = [...from.ranks]
  to.planets = [...from.planets]
  to.types = [...from.types]
}
const emptyFilters = (): MissionFilters => ({ jobs: [], ranks: [], planets: [], types: [] })

const openFilters = async () => {
  copyFilters(applied, draft)
  isFilterOpen.value = true
  await nextTick()
  filterCloseButton.value?.focus()
}
const closeFilters = (restoreFocus = true) => {
  isFilterOpen.value = false
  if (restoreFocus) void nextTick(() => filterButton.value?.focus())
}
const applyFilters = () => { copyFilters(draft, applied); closeFilters() }
const clearFilters = () => { copyFilters(emptyFilters(), draft); copyFilters(draft, applied); closeFilters() }
const openMission = (mission: DeepReadonly<CosmicMission>) => { selectedMission.value = mission }
const closeMission = () => { selectedMission.value = null }
const onCraftStarted = () => {
  closeMission()
  void router.push({ name: 'solver' })
}
const onDocumentPointerDown = (event: PointerEvent) => {
  if (isFilterOpen.value && !filterShell.value?.contains(event.target as Node)) closeFilters(false)
}
const onDocumentKeyDown = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') return
  if (selectedMission.value) { closeMission(); return }
  if (isFilterOpen.value) closeFilters()
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
  document.addEventListener('keydown', onDocumentKeyDown)
  void missionData.load()
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  document.removeEventListener('keydown', onDocumentKeyDown)
})
</script>

<template>
  <section class="mission-browser" aria-labelledby="mission-browser-title">
    <header class="mission-browser-header">
      <h1 id="mission-browser-title" class="page-title">{{ t(favoritesOnly ? 'favorites.title' : 'missions.title') }}</h1>
      <p class="page-description">{{ t(favoritesOnly ? 'favorites.description' : 'missions.description') }}</p>
    </header>

    <div ref="filterShell" class="mission-search-shell">
      <label class="mission-search">
        <i class="pi pi-search" aria-hidden="true"></i>
        <span class="sr-only">{{ t('missions.searchLabel') }}</span>
        <input v-model="query" type="search" :placeholder="t('missions.searchPlaceholder')" />
      </label>
      <button
        ref="filterButton"
        class="mission-filter-trigger"
        :class="{ 'mission-filter-trigger--active': filterIsActive }"
        type="button"
        :aria-label="t('missions.filters.open')"
        :aria-expanded="isFilterOpen"
        aria-controls="mission-filter-panel"
        @click="isFilterOpen ? closeFilters() : openFilters()"
      >
        <i class="pi pi-filter" aria-hidden="true"></i>
      </button>

      <div v-if="isFilterOpen" id="mission-filter-panel" class="mission-filter-panel" role="dialog" :aria-label="t('missions.filters.title')">
        <div class="mission-filter-heading">
          <strong>{{ t('missions.filters.title') }}</strong>
          <button ref="filterCloseButton" type="button" :aria-label="t('common.close')" @click="closeFilters()">
            <i class="pi pi-times" aria-hidden="true"></i>
          </button>
        </div>
        <fieldset>
          <legend>{{ t('missions.filters.job') }}</legend>
          <div class="filter-chip-grid filter-chip-grid--jobs">
            <label v-for="job in CRAFT_JOBS" :key="job" class="filter-chip">
              <input v-model="draft.jobs" type="checkbox" :value="job" />
              <span>{{ t(`missions.jobs.${job}`) }}</span>
            </label>
          </div>
        </fieldset>
        <fieldset>
          <legend>{{ t('missions.filters.rank') }}</legend>
          <div class="filter-chip-grid">
            <label v-for="rank in MISSION_RANKS" :key="rank" class="filter-chip">
              <input v-model="draft.ranks" type="checkbox" :value="rank" />
              <span>{{ t(`missions.ranks.${rank}`) }}</span>
            </label>
          </div>
        </fieldset>
        <fieldset>
          <legend>{{ t('missions.filters.planet') }}</legend>
          <div class="filter-chip-grid">
            <label v-for="planet in MISSION_PLANETS" :key="planet" class="filter-chip">
              <input v-model="draft.planets" type="checkbox" :value="planet" />
              <span>{{ t(`missions.planets.${planet}`) }}</span>
            </label>
          </div>
        </fieldset>
        <fieldset>
          <legend>{{ t('missions.filters.type') }}</legend>
          <div class="filter-chip-grid">
            <label v-for="type in MISSION_TYPES" :key="type" class="filter-chip">
              <input v-model="draft.types" type="checkbox" :value="type" />
              <span>{{ t(`missions.types.${type}`) }}</span>
            </label>
          </div>
        </fieldset>
        <div class="mission-filter-actions">
          <button type="button" class="filter-clear" @click="clearFilters">{{ t('missions.filters.clear') }}</button>
          <button type="button" class="filter-apply" @click="applyFilters">{{ t('missions.filters.apply') }}</button>
        </div>
      </div>
    </div>

    <div v-if="missionData.loading.value && !missionData.missions.value.length" class="mission-state" aria-live="polite">
      <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
      <span>{{ t('missions.loading') }}</span>
    </div>
    <div v-else-if="missionData.error.value" class="mission-state mission-state--error" role="alert">
      <span>{{ t('missions.loadError') }}</span>
      <button type="button" @click="missionData.retry">{{ t('missions.retry') }}</button>
    </div>
    <template v-else>
      <div class="mission-results-summary" aria-live="polite">{{ t('missions.resultCount', { count: filteredMissions.length }) }}</div>
      <div v-if="visibleMissions.length" class="mission-card-grid">
        <article v-for="mission in visibleMissions" :key="mission.id" class="mission-card">
          <button class="mission-card-main" type="button" @click="openMission(mission)">
            <img
              class="mission-job-icon"
              :src="mission.jobIcon"
              :alt="t(`missions.jobs.${mission.job}`)"
              width="48"
              height="48"
              loading="lazy"
              decoding="async"
              fetchpriority="low"
            />
            <span class="mission-card-copy">
              <span class="mission-card-meta">
                {{ t(`missions.jobs.${mission.job}`) }} · {{ t(`missions.ranks.${mission.rank}`) }} · {{ t(`missions.planets.${mission.planet}`) }}
              </span>
              <strong>{{ localizedName(mission.names) }}</strong>
            </span>
            <span class="mission-item-stack" :aria-label="t('missions.itemCount', { count: mission.items.length })">
              <img
                v-for="(item, index) in mission.items.slice(0, 3)"
                :key="item.recipeId"
                :src="item.icon"
                :alt="localizedName(item.names)"
                :style="{ zIndex: mission.items.length - index }"
                width="42"
                height="42"
                loading="lazy"
                decoding="async"
                fetchpriority="low"
              />
            </span>
            <span class="mission-favorite-space" aria-hidden="true"></span>
          </button>
          <button
            class="mission-favorite-slot"
            :class="{ 'mission-favorite-slot--active': favoriteMissions.isFavorite(mission.id) }"
            type="button"
            :aria-label="t(favoriteMissions.isFavorite(mission.id) ? 'favorites.remove' : 'favorites.add', { name: localizedName(mission.names) })"
            :aria-pressed="favoriteMissions.isFavorite(mission.id)"
            :title="t(favoriteMissions.isFavorite(mission.id) ? 'favorites.removeShort' : 'favorites.addShort')"
            @click="favoriteMissions.toggleFavorite(mission.id)"
          >
            <i :class="favoriteMissions.isFavorite(mission.id) ? 'pi pi-heart-fill' : 'pi pi-heart'" aria-hidden="true"></i>
          </button>
        </article>
      </div>
      <div v-else class="mission-state">
        <span>{{ t(favoritesOnly && !hasFavorites ? 'favorites.empty' : favoritesOnly ? 'favorites.noMatch' : 'missions.empty') }}</span>
        <button v-if="filterIsActive" type="button" @click="clearFilters">{{ t('missions.filters.clear') }}</button>
      </div>
      <button v-if="visibleCount < filteredMissions.length" class="mission-load-more" type="button" @click="visibleCount += PAGE_SIZE">
        {{ t('missions.loadMore') }}
      </button>
    </template>
  </section>

  <MissionSetupDialog v-if="selectedMission" :mission="selectedMission" @close="closeMission" @started="onCraftStarted" />
</template>
