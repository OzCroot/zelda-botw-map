/**
 * Google Tag Manager. Loads only in production builds and only when VITE_GTM_ID (e.g. GTM-XXXXXXX) is set,
 * so local dev and forks send nothing. Tags (GA4 etc.) are configured inside the GTM container.
 */
declare global {
  interface Window {
    dataLayer: Record<string, unknown>[]
  }
}

export function initAnalytics(id: string | undefined = import.meta.env.VITE_GTM_ID) {
  if (!import.meta.env.PROD || !id || !/^GTM-[A-Z0-9]+$/.test(id)) return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })
  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtm.js?id=${id}`
  document.head.appendChild(s)
}

/**
 * Pushes a custom event for GTM (trigger: Custom Event with this name). A no-op until GTM has loaded, so dev
 * and forks send nothing. Params must be coarse and anonymous: categories, formats, counts. Never marker names,
 * notes, search text or share-code contents.
 */
export function track(event: string, params: Record<string, string | number | boolean> = {}) {
  if (!window.dataLayer) return
  window.dataLayer.push({ event, ...params })
}
