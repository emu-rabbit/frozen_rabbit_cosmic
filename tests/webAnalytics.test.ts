// @vitest-environment jsdom
import { beforeEach, afterEach, expect, it, vi } from 'vitest'

beforeEach(() => {
  vi.resetModules()
  localStorage.clear()
  document.head.innerHTML = ''
  delete window.gtag
  delete window.dataLayer
  vi.stubEnv('PROD', true)
  vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST')
})
afterEach(() => vi.unstubAllEnvs())
const commands = () => (window.dataLayer ?? []).map(value => Array.from(value as ArrayLike<unknown>))

it('does not load or track when the ID is blank or in development', async () => {
  vi.stubEnv('VITE_GA_MEASUREMENT_ID', '')
  let analytics = await import('../apps/web/src/services/analytics')
  analytics.initializeAnalytics()
  analytics.setAnalyticsConsent('granted')
  expect(window.dataLayer).toBeUndefined()
  expect(document.querySelector('script')).toBeNull()
  vi.resetModules()
  vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST')
  vi.stubEnv('PROD', false)
  analytics = await import('../apps/web/src/services/analytics')
  analytics.initializeAnalytics()
  expect(window.dataLayer).toBeUndefined()
})

it('defaults to denied, tracks only after acceptance, and deduplicates initial events', async () => {
  const analytics = await import('../apps/web/src/services/analytics')
  analytics.initializeAnalytics()
  analytics.trackRouteChange()
  expect(commands()[0]).toEqual(['consent', 'default', expect.objectContaining({ analytics_storage: 'denied', ad_storage: 'denied' })])
  expect(commands().filter(row => row[0] === 'event')).toHaveLength(0)
  analytics.setAnalyticsConsent('granted')
  analytics.initializeAnalytics()
  document.querySelector('script')!.dispatchEvent(new Event('load'))
  expect(document.querySelectorAll('script')).toHaveLength(1)
  expect(commands().filter(row => row[1] === 'page_view')).toHaveLength(1)
  expect(commands().filter(row => row[1] === 'analytics_ready')).toHaveLength(1)
  analytics.trackRouteChange()
  expect(commands().filter(row => row[1] === 'page_view')).toHaveLength(2)
  analytics.setAnalyticsConsent('denied')
  analytics.trackRouteChange()
  expect(commands().filter(row => row[1] === 'page_view')).toHaveLength(2)
  expect(localStorage.getItem('frozen-rabbit-cosmic-analytics-consent')).toBeNull()
  expect(analytics.getAnalyticsConsent()).toBe('denied')
  vi.resetModules()
  expect((await import('../apps/web/src/services/analytics')).getAnalyticsConsent()).toBeNull()
})

it('restores persisted acceptance on reload', async () => {
  localStorage.setItem('frozen-rabbit-cosmic-analytics-consent', 'granted')
  const analytics = await import('../apps/web/src/services/analytics')
  analytics.initializeAnalytics()
  expect(commands().filter(row => row[1] === 'page_view')).toHaveLength(1)
})
