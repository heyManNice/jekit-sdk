import { spaGreet, type JekitStats } from 'jekit-core'
import './style.css'

declare global {
  interface Window {
    __jekitHaloStarted?: boolean
    _jekit?: JekitStats
  }
}

const fieldClasses: Record<keyof JekitStats, string> = {
  sitePv: 'jk-site-pv',
  siteUv: 'jk-site-uv',
  pagePv: 'jk-page-pv',
  pageUv: 'jk-page-uv',
  sitePvToday: 'jk-site-pv-today',
  siteUvToday: 'jk-site-uv-today',
  pagePvToday: 'jk-page-pv-today',
  pageUvToday: 'jk-page-uv-today',
}

function selectField(field: keyof JekitStats): Element[] {
  return Array.from(document.querySelectorAll(
    `[data-jekit-field="${field}"], .${fieldClasses[field]}`,
  ))
}

function updateDom(data: JekitStats) {
  for (const field of Object.keys(fieldClasses) as (keyof JekitStats)[]) {
    for (const element of selectField(field)) {
      element.textContent = data[field]
    }
  }
}

function publish(name: 'jekitloading' | 'jekitready' | 'jekiterror', data: JekitStats) {
  updateDom(data)
  if (name === 'jekitready') {
    document.querySelectorAll<HTMLElement>('.jekit-halo-stats').forEach((element) => {
      element.hidden = false
    })
  }
  window._jekit = data
  window.dispatchEvent(new CustomEvent(name, { detail: data }))
  window.dispatchEvent(new CustomEvent('jekitchange', { detail: data }))
}

function state(value: string): JekitStats {
  return {
    sitePv: value,
    siteUv: value,
    pagePv: value,
    pageUv: value,
    sitePvToday: value,
    siteUvToday: value,
    pagePvToday: value,
    pageUvToday: value,
  }
}

function start() {
  if (window.__jekitHaloStarted) return
  window.__jekitHaloStarted = true

  spaGreet({
    onLoading: () => publish('jekitloading', state('--')),
    onSuccess: (result) => publish('jekitready', {
      sitePv: result.totalRequestForSite.toString(),
      siteUv: result.totalVisitorForSite.toString(),
      pagePv: result.totalRequestForPage.toString(),
      pageUv: result.totalVisitorForPage.toString(),
      sitePvToday: result.todayRequestForSite.toString(),
      siteUvToday: result.todayVisitorForSite.toString(),
      pagePvToday: result.todayRequestForPage.toString(),
      pageUvToday: result.todayVisitorForPage.toString(),
    }),
    onError: (error) => {
      publish('jekiterror', state('--'))
      document.querySelectorAll<HTMLElement>('.jekit-halo-stats').forEach((element) => {
        element.hidden = true
      })
      console.error('[Jekit Halo] Failed to collect statistics', error)
    },
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true })
} else {
  start()
}
