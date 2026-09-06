<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { externalLinks } from '@/config/externalLinks'

const { t } = useI18n()
const sections = ['foundation', 'finish', 'compare', 'opening', 'feedback', 'limits'] as const
</script>

<template>
  <article class="algorithm-view">
    <RouterLink :to="{ name: 'faq' }" class="faq-inline-link algorithm-back">
      <i class="pi pi-arrow-left" aria-hidden="true"></i>{{ t('algorithm.back') }}
    </RouterLink>
    <header class="algorithm-header">
      <p class="algorithm-version">{{ t('algorithm.version') }}</p>
      <h1 class="page-title">{{ t('algorithm.title') }}</h1>
      <p class="page-description">{{ t('algorithm.intro') }}</p>
      <p class="algorithm-priority">{{ t('algorithm.priority') }}</p>
    </header>
    <div class="algorithm-sections">
      <section v-for="(section, index) in sections" :key="section" :aria-labelledby="`algorithm-${section}`">
        <span class="algorithm-number" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
        <div>
          <h2 :id="`algorithm-${section}`">{{ t(`algorithm.${section}.title`) }}</h2>
          <p>{{ t(`algorithm.${section}.first`) }}</p>
          <p>{{ t(`algorithm.${section}.second`) }}</p>
        </div>
      </section>
    </div>
    <footer class="algorithm-footer">
      <p>{{ t('algorithm.sourceIntro') }}</p>
      <a :href="externalLinks.artisan" target="_blank" rel="noopener noreferrer" class="faq-inline-link">
        {{ t('algorithm.sourceLink') }} <i class="pi pi-external-link" aria-hidden="true"></i>
      </a>
    </footer>
  </article>
</template>

<style>
.algorithm-view { width: 100%; max-width: 52rem; margin: 0 auto; padding: 2rem 2rem 5rem; }
.algorithm-back { min-height: 44px; margin-bottom: 1.5rem; }
.algorithm-header { margin-bottom: 2.5rem; }
.algorithm-version { color: #367360; font-size: .8rem; font-weight: 800; letter-spacing: .06em; margin: 0 0 .75rem; }
.algorithm-header .page-description { max-width: 42rem; line-height: 1.9; }
.algorithm-priority { margin-top: 1.5rem; padding: 1rem 1.25rem; border-left: 3px solid #80bca1; background: #f0f8f3; border-radius: 0 .75rem .75rem 0; line-height: 1.8; color: #365f50; }
.algorithm-sections section { display: grid; grid-template-columns: 2rem minmax(0, 1fr); gap: 1rem; padding: 1.75rem 0; border-top: 1px solid #dfe9e3; }
.algorithm-number { padding-top: .25rem; font-size: .8rem; color: #59806c; font-weight: 800; }
.algorithm-sections h2 { margin: 0 0 1rem; font-size: 1.2rem; line-height: 1.5; color: #253e33; }
.algorithm-sections p, .algorithm-footer p { margin: .75rem 0 0; line-height: 1.95; color: #4b5f55; overflow-wrap: anywhere; }
.algorithm-footer { margin-top: 1rem; padding-top: 1.5rem; border-top: 1px solid #dfe9e3; }
.algorithm-footer a { min-height: 44px; }
html.dark .algorithm-version, html.dark .algorithm-number { color: #8dcab1; }
html.dark .algorithm-priority { background: #192f29; color: #b9dfcd; }
html.dark .algorithm-sections h2 { color: #e1eee7; }
html.dark .algorithm-sections p, html.dark .algorithm-footer p { color: #b9c9c1; }
html.dark .algorithm-sections section, html.dark .algorithm-footer { border-color: #34463e; }
@media (max-width: 640px) {
  .algorithm-view { padding: 1.25rem 1rem 4rem; }
  .algorithm-sections section { grid-template-columns: 1.5rem minmax(0, 1fr); gap: .5rem; }
}
</style>
