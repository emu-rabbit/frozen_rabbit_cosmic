export type AnalyticsConsent = 'granted' | 'denied'

const MEASUREMENT_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID ?? '').trim()
const CONSENT_KEY = 'frozen-rabbit-cosmic-analytics-consent'
const SCRIPT_ID = 'frozen-rabbit-cosmic-google-analytics'
let deniedThisSession = false
let configured = false
let initialPageTracked = false
let readyTracked = false
let languageContext = {}
let themeContext = {}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export const isAnalyticsAvailable = () =>
  typeof window !== 'undefined' && typeof document !== 'undefined' && import.meta.env.PROD && Boolean(MEASUREMENT_ID)

export function getAnalyticsConsent(): AnalyticsConsent | null {
  if (deniedThisSession) return 'denied'
  try {
    const stored = localStorage.getItem(CONSENT_KEY)
    if (stored === 'granted') return 'granted'
    if (stored === 'denied') localStorage.removeItem(CONSENT_KEY)
  } catch { /* Storage may be unavailable; keep the page usable. */ }
  return deniedThisSession ? 'denied' : null
}

let grantedThisSession = false
const hasConsent = () => grantedThisSession || getAnalyticsConsent() === 'granted'
const userProperties = () => ({ ...languageContext, ...themeContext })
const consentSettings = (consent: AnalyticsConsent) => ({
  analytics_storage: consent,
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
})

function event(name: string, params: Record<string, unknown> = {}) {
  if (!isAnalyticsAvailable() || !hasConsent()) return
  window.gtag?.('event', name, { send_to: MEASUREMENT_ID, ...userProperties(), ...params })
}

function pageContext() {
  const path = window.location.pathname + window.location.hash.split('?')[0]
  return {
    page_title: document.title,
    page_location: window.location.origin + path,
    page_path: path,
    route_name: (window.location.hash.split('?')[0] ?? '').replace(/^#\/?/, '') || 'start',
  }
}

function trackInitialEvents() {
  if (!isAnalyticsAvailable() || !hasConsent()) return
  if (!initialPageTracked) {
    initialPageTracked = true
    event('page_view', pageContext())
  }
  if (!readyTracked) {
    readyTracked = true
    event('analytics_ready', pageContext())
  }
}

export function initializeAnalytics() {
  if (!isAnalyticsAvailable()) return
  window.dataLayer ??= []
  window.gtag ??= function () { window.dataLayer?.push(arguments) }
  if (!configured) {
    configured = true
    window.gtag('consent', 'default', { ...consentSettings('denied'), wait_for_update: 500 })
    window.gtag('js', new Date())
    window.gtag('config', MEASUREMENT_ID, { send_page_view: false })
    window.gtag('set', 'user_properties', userProperties())
  }
  if (!document.getElementById(SCRIPT_ID)) {
    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`
    script.addEventListener('load', trackInitialEvents, { once: true })
    document.head.appendChild(script)
  }
  if (hasConsent()) {
    window.gtag('consent', 'update', consentSettings('granted'))
    trackInitialEvents()
  }
}

export function setAnalyticsConsent(consent: AnalyticsConsent) {
  if (!isAnalyticsAvailable()) return
  initializeAnalytics()
  deniedThisSession = consent === 'denied'
  grantedThisSession = consent === 'granted'
  try {
    if (grantedThisSession) localStorage.setItem(CONSENT_KEY, 'granted')
    else localStorage.removeItem(CONSENT_KEY)
  } catch { /* Consent still applies for this page when storage is blocked. */ }
  window.gtag?.('consent', 'update', consentSettings(consent))
  if (grantedThisSession) {
    window.gtag?.('set', 'user_properties', userProperties())
    trackInitialEvents()
  }
}

export function setAnalyticsLanguage(language: string) {
  languageContext = {
    app_language: language,
    browser_language: navigator.language,
    browser_languages: navigator.languages.join(','),
  }
  if (!isAnalyticsAvailable() || !hasConsent()) return
  window.gtag?.('set', 'user_properties', userProperties())
  event('language_context_updated', languageContext)
}

export function setAnalyticsThemeMode(dark: boolean) {
  themeContext = { app_theme_mode: dark ? 'dark' : 'light' }
  if (!isAnalyticsAvailable() || !hasConsent()) return
  window.gtag?.('set', 'user_properties', userProperties())
  event('theme_context_updated', themeContext)
}

export function trackRouteChange() {
  if (!isAnalyticsAvailable() || !hasConsent()) return
  event('page_view', pageContext())
  event('route_change', pageContext())
}
