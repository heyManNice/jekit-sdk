import { performance as fetchPerformance, stats } from 'jekit-core'
import { stores } from '@halo-dev/ui-shared'
import { computed, ref } from 'vue'

export type SiteStats = Awaited<ReturnType<typeof stats>>
export type SitePerformance = Awaited<ReturnType<typeof fetchPerformance>>

export interface PerformancePoint {
  label: string
  ttfb: number
  plt: number
  ttfbRaw: number
  pltRaw: number
}

export function useSiteStats() {
  const globalInfoStore = stores.globalInfo()
  const data = ref<SiteStats | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const domain = computed(() => {
    const value = globalInfoStore.globalInfo?.externalUrl || window.location.origin
    try {
      return new URL(value).origin
    } catch {
      return value
    }
  })

  async function refresh(path = '/') {
    loading.value = true
    error.value = null
    try {
      if (!globalInfoStore.globalInfo) {
        await globalInfoStore.fetchGlobalInfo()
      }
      data.value = await stats({ domain: domain.value, path })
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : '无法读取统计数据'
    } finally {
      loading.value = false
    }
  }

  return { data, domain, loading, error, refresh }
}

export function useSitePerformance() {
  const globalInfoStore = stores.globalInfo()
  const data = ref<SitePerformance | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const domain = computed(() => {
    const value = globalInfoStore.globalInfo?.externalUrl || window.location.origin
    try {
      return new URL(value).origin
    } catch {
      return value
    }
  })

  async function refresh() {
    loading.value = true
    error.value = null
    try {
      if (!globalInfoStore.globalInfo) {
        await globalInfoStore.fetchGlobalInfo()
      }
      data.value = await fetchPerformance({ domain: domain.value })
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : '无法读取性能数据'
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, refresh }
}

export function buildPerformancePoints(data: SitePerformance | null): PerformancePoint[] {
  if (!data) return []
  const { ttfbHist, pltHist } = data

  let start = 0
  let end = ttfbHist.length - 2
  while (start < end && ttfbHist[start] === 0 && pltHist[start] === 0) start++
  while (end > start && ttfbHist[end - 1] === 0 && pltHist[end - 1] === 0) end--

  const sumTtfb = ttfbHist.slice(start, end).reduce((sum, value) => sum + value, 0)
  const sumPlt = pltHist.slice(start, end).reduce((sum, value) => sum + value, 0)

  return Array.from({ length: end - start }, (_, offset) => {
    const index = start + offset
    const ttfbRaw = ttfbHist[index] ?? 0
    const pltRaw = pltHist[index] ?? 0
    const label = index < 100 ? `${index * 10}ms` : index < 253 ? `${index / 100}s` : '≥2.53s'
    return {
      label,
      ttfb: sumTtfb > 0 ? Math.round((ttfbRaw / sumTtfb) * 100) : 0,
      plt: sumPlt > 0 ? Math.round((pltRaw / sumPlt) * 100) : 0,
      ttfbRaw,
      pltRaw,
    }
  })
}

// NumberFlow 只接受 number（core 的累计指标是 bigint）。
// 数据未就绪时返回 0，数据到位后由 0 → 实际值的过渡产生入场动画（与 Halo 仪表盘卡片一致）
export function toFlowNumber(value: number | bigint | undefined): number {
  return value === undefined || value === null ? 0 : Number(value)
}
