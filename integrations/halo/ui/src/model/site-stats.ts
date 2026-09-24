import {
  history as fetchHistory,
  metricOption,
  performance as fetchPerformance,
  rangeOption,
  source as fetchSource,
  stats,
  scopeOption,
  type dimensionOption,
} from 'jekit-core'
import { consoleApiClient, ListPostsPublishPhaseEnum } from '@halo-dev/api-client'
import { stores } from '@halo-dev/ui-shared'
import { computed, ref } from 'vue'

export type SiteStats = Awaited<ReturnType<typeof stats>>
export type SitePerformance = Awaited<ReturnType<typeof fetchPerformance>>
export type SiteSource = Awaited<ReturnType<typeof fetchSource>>
export type SiteHistory = Awaited<ReturnType<typeof fetchHistory>>

export interface SourceRow {
  name: string
  total: number
  percent: number
}

export interface PerformanceSummary {
  flowValue: number
  prefix: string
  suffix: string
  fractionDigits: number
}

export interface DocumentStatsRow {
  title: string
  path: string
  href: string
  totalRequests: string
  totalVisitors: string
  todayRequests: string
  todayVisitors: string
}

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

export function useSiteSource(dimension: dimensionOption) {
  const globalInfoStore = stores.globalInfo()
  const data = ref<SiteSource | null>(null)
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
      data.value = await fetchSource({
        domain: domain.value,
        path: '/',
        scope: scopeOption.Site,
        dimension,
      })
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : '无法读取来源数据'
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, refresh }
}

export function useSiteUserHistory() {
  const globalInfoStore = stores.globalInfo()
  const data = ref<SiteHistory | null>(null)
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
      type HistoryParams = Parameters<typeof fetchHistory>[0]
      data.value = await fetchHistory({
        domain: domain.value,
        path: '/',
        range: rangeOption.Daily,
        metric: metricOption.totalUserForSite,
        dimensionValue: 0 as HistoryParams['dimensionValue'],
      })
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : '无法读取用户历史数据'
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, refresh }
}

export function useLatestDocumentStats() {
  const globalInfoStore = stores.globalInfo()
  const data = ref<DocumentStatsRow[] | null>(null)
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

  async function refresh(rowLimit = 7) {
    loading.value = true
    error.value = null
    try {
      if (!globalInfoStore.globalInfo) {
        await globalInfoStore.fetchGlobalInfo()
      }

      // 首页固定占第一行，其余行按卡片当前能完整容纳的数量查询最新文章。
      const articleLimit = Math.max(0, Math.min(99, Math.floor(rowLimit) - 1))
      const posts = articleLimit > 0
        ? (await consoleApiClient.content.post.listPosts({
            page: 1,
            size: articleLimit,
            sort: ['spec.publishTime,desc'],
            publishPhase: ListPostsPublishPhaseEnum.Published,
          })).data.items
        : []

      const targets = [
        { title: '首页', path: '/', href: new URL('/', domain.value).toString() },
        ...posts.map(({ post }) => {
          const permalink = post.status?.permalink
          let path = `/archives/${post.spec.slug}`
          if (permalink) {
            const url = new URL(permalink, domain.value)
            path = `${url.pathname}${url.search}${url.hash}`
          }
          return {
            title: post.spec.title,
            path,
            href: new URL(path, domain.value).toString(),
          }
        }),
      ]

      data.value = await Promise.all(targets.map(async (target) => {
        const result = await stats({ domain: domain.value, path: target.path })
        return {
          ...target,
          totalRequests: result.totalRequestForPage.toString(),
          totalVisitors: result.totalVisitorForPage.toString(),
          todayRequests: result.todayRequestForPage.toString(),
          todayVisitors: result.todayVisitorForPage.toString(),
        }
      }))
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : '无法读取最新文章数据'
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, refresh }
}

export function buildSourceRows(
  data: SiteSource | null,
  labels: Readonly<Record<number, string>>,
  limit = 5,
  includeZero = false,
): SourceRow[] {
  if (!data) return []

  const grandTotal = data.reduce((sum, item) => sum + Number(item.totalRequest), 0)

  const totalsByName = new Map<string, number>()
  if (includeZero) {
    Object.values(labels).forEach((name) => totalsByName.set(name, 0))
  }
  data.forEach((item) => {
    const name = labels[item.dimensionIndex] ?? '其他'
    totalsByName.set(name, (totalsByName.get(name) ?? 0) + Number(item.totalRequest))
  })

  const rows = Array.from(totalsByName, ([name, total]) => ({ name, total }))
    .filter((item) => includeZero || item.total > 0)
    .sort((left, right) => right.total - left.total)

  if (rows.length > limit) {
    const visible = rows.slice(0, limit - 1)
    const restRows = rows.slice(limit - 1)
    const rest = restRows.reduce((sum, item) => sum + item.total, 0)
    const otherName = visible.some((item) => item.name === '其他') ? '其余来源' : '其他'
    rows.splice(0, rows.length, ...visible, { name: otherName, total: rest })
  }

  return rows.slice(0, limit).map((item) => ({
    ...item,
    percent: grandTotal > 0 ? (item.total / grandTotal) * 100 : 0,
  }))
}

export function getPerformanceSummary(
  histogram: readonly number[] | undefined,
): PerformanceSummary {
  const valid = histogram?.slice(0, 254) ?? []
  const samples = valid.reduce((sum, count) => sum + count, 0)
  if (samples === 0) {
    return {
      flowValue: 0,
      prefix: '',
      suffix: '',
      fractionDigits: 0,
    }
  }

  const target = Math.ceil(samples * 0.75)
  let cumulative = 0
  let bucket = 0
  for (; bucket < valid.length; bucket++) {
    cumulative += valid[bucket] ?? 0
    if (cumulative >= target) break
  }

  const useSeconds = bucket >= 100
  return {
    flowValue: useSeconds ? Math.min(bucket, 253) / 100 : bucket * 10,
    prefix: bucket >= 253 ? '≥' : '',
    suffix: useSeconds ? 's' : 'ms',
    fractionDigits: useSeconds ? 2 : 0,
  }
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
