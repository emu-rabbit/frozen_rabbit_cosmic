<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getAnalyticsConsent, isAnalyticsAvailable, setAnalyticsConsent, type AnalyticsConsent } from '@/services/analytics'

const props = defineProps<{ paused: boolean }>()
const { t } = useI18n()
const consent = ref(isAnalyticsAvailable() ? getAnalyticsConsent() : 'denied')
const visible = computed(() => isAnalyticsAvailable() && !props.paused && !consent.value)
function choose(value: AnalyticsConsent) {
  setAnalyticsConsent(value)
  consent.value = value
}
</script>

<template>
  <section v-if="visible" class="analytics-consent" aria-live="polite" :aria-label="t('analytics.message')">
    <p>{{ t('analytics.message') }}</p>
    <div class="analytics-actions">
      <button type="button" @click="choose('denied')">{{ t('analytics.reject') }}</button>
      <button type="button" class="analytics-accept" @click="choose('granted')">{{ t('analytics.accept') }}</button>
    </div>
  </section>
</template>

<style scoped>
.analytics-consent { position: fixed; right: 1rem; bottom: 1rem; left: 1rem; z-index: 80; display: flex; flex-wrap: wrap; align-items: center; gap: .75rem; max-width: 28rem; margin-left: auto; padding: .75rem; border: 1px solid #cbd5e1; border-radius: .75rem; background: #fffffff2; color: #475569; box-shadow: 0 4px 20px #0f172a1a; font-size: .75rem; }
p { flex: 1 1 12rem; margin: 0; }
.analytics-actions { display: flex; gap: .25rem; margin-left: auto; }
button { min-height: 44px; min-width: 44px; padding: .5rem .75rem; border-radius: .5rem; font-weight: 600; }
button:focus-visible { outline: 2px solid #15803d; outline-offset: 2px; }
.analytics-accept { background: #48745c; color: white; }
:global(.dark) .analytics-consent { background: #0f172af2; border-color: #334155; color: #cbd5e1; }
</style>
