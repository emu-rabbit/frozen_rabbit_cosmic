<script setup lang="ts">
import { computed, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import Dialog from 'primevue/dialog'
import { useActiveCraftSession } from '@/composables/useActiveCraftSession'
import { useMissionData } from '@/services/missionData'
import type { DataLocale } from '@/types/missionData'

defineProps<{ paused: boolean }>()

const { t, locale } = useI18n()
const { activeSession, state } = useActiveCraftSession()
const { pendingUpdate, dismissUpdate } = useMissionData()
const updateSummary = computed(() => {
  const summary = pendingUpdate.value?.updateSummary
  return summary?.[locale.value as DataLocale] ?? summary?.en ?? []
})
const titleId = useId()
const descriptionId = useId()

const reload = () => window.location.reload()
</script>

<template>
  <Dialog
    :visible="pendingUpdate !== null && !paused"
    @update:visible="dismissUpdate"
    @keydown.esc.stop="dismissUpdate"
    modal
    dismissable-mask
    :close-on-escape="false"
    :draggable="false"
    :header="t('missionDataUpdate.title')"
    :aria-labelledby="titleId"
    :aria-describedby="descriptionId"
    :close-button-props="{ 'aria-label': t('common.close'), severity: 'secondary', text: true }"
    class="!w-[calc(100%-2rem)] !max-w-lg !rounded-2xl !border-[#d9efe5] !bg-white !shadow-2xl dark:!border-slate-700 dark:!bg-slate-900"
    :pt="{
      mask: { class: '!bg-slate-900/55 backdrop-blur-[3px]' },
      header: { class: '!gap-3 !rounded-t-2xl !border-b !border-[#d9efe5] !bg-[#eef8f3] !py-4 dark:!border-slate-700 dark:!bg-slate-950' },
      pcCloseButton: { root: { class: '!h-11 !w-11 !p-0' } },
      content: { class: '!pb-5 !pt-5' },
      footer: { class: '!flex-col-reverse !items-stretch !gap-2 sm:!flex-row sm:!items-center' },
    }"
  >
    <template #header>
      <h2 :id="titleId" tabindex="-1" autofocus class="m-0 text-lg font-bold text-[#2d6a5a] outline-none dark:text-[#91d5bf]">
        {{ t('missionDataUpdate.title') }}
      </h2>
    </template>
    <div :id="descriptionId" class="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
      <p class="m-0">{{ t('missionDataUpdate.ready') }}</p>
      <ul v-if="updateSummary.length" class="mb-0 mt-3 list-disc space-y-1 break-words pl-5">
        <li v-for="(line, index) in updateSummary" :key="index">{{ line }}</li>
      </ul>
      <p v-if="activeSession && state?.terminal === 'none'" class="mb-0 mt-2">
        {{ t('missionDataUpdate.craftWarning') }}
      </p>
    </div>
    <template #footer>
      <button
        type="button"
        class="min-h-11 rounded-xl border-0 bg-transparent px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        @click="dismissUpdate"
      >
        {{ t('missionDataUpdate.later') }}
      </button>
      <button
        type="button"
        class="min-h-11 rounded-xl border-0 bg-[#2d6a5a] px-4 py-2 text-sm font-bold text-white hover:bg-[#235648]"
        @click="reload"
      >
        {{ t('missionDataUpdate.apply') }}
      </button>
    </template>
  </Dialog>
</template>
