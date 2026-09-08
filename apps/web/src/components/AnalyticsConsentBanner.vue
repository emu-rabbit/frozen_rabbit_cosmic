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
  <Transition name="analytics-consent">
    <section v-if="visible" class="analytics-consent" aria-live="polite" :aria-label="t('analytics.message')">
      <p>{{ t('analytics.message') }}</p>
      <div class="analytics-actions">
        <button type="button" @click="choose('denied')">{{ t('analytics.reject') }}</button>
        <button type="button" class="analytics-accept" @click="choose('granted')">{{ t('analytics.accept') }}</button>
      </div>
    </section>
  </Transition>
</template>

<style scoped>
.analytics-consent {
  position: fixed;
  inset: auto .75rem .75rem;
  z-index: 80;
  display: flex;
  align-items: center;
  gap: .75rem;
  max-width: 36rem;
  margin-inline: auto;
  padding: .5rem .75rem;
  border: 1px solid #e2e8f0;
  border-radius: .5rem;
  background: #fffffff2;
  color: #475569;
  box-shadow: 0 10px 15px -3px #0f172a1a, 0 4px 6px -4px #0f172a1a;
  backdrop-filter: blur(8px);
  font-size: .75rem;
}
p { flex: 1; min-width: 0; margin: 0; line-height: 1.375; }
.analytics-actions { display: flex; flex-shrink: 0; align-items: center; gap: .25rem; }
button { min-height: 44px; min-width: 44px; padding: .25rem .5rem; border-radius: .375rem; color: #64748b; font-weight: 600; transition: background-color .15s, color .15s; }
button:hover { background: #f1f5f9; color: #334155; }
button:focus-visible { outline: 2px solid #3e8f7a; outline-offset: 2px; }
.analytics-accept { padding-inline: .625rem; background: #52a890; color: white; font-weight: 700; }
.analytics-accept:hover { background: #3e8f7a; color: white; }
:global(.dark) .analytics-consent { background: #0f172af2; border-color: #334155; color: #cbd5e1; }
:global(.dark) button { color: #94a3b8; }
:global(.dark) button:hover { background: #1e293b; color: #e2e8f0; }
:global(.dark) .analytics-accept { background: #3e8f7a; color: white; }
:global(.dark) .analytics-accept:hover { background: #52a890; }
@media (min-width: 640px) {
  .analytics-consent { right: 1rem; bottom: 1rem; left: auto; max-width: 28rem; }
}
.analytics-consent-enter-active,
.analytics-consent-leave-active { transition: opacity .2s ease, transform .2s ease; }
.analytics-consent-enter-from,
.analytics-consent-leave-to { opacity: 0; transform: translateY(8px); }
@media (prefers-reduced-motion: reduce) {
  .analytics-consent-enter-active,
  .analytics-consent-leave-active,
  button { transition: none; }
}
</style>
