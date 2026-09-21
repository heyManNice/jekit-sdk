import { stats } from 'jekit-core'
import { stores } from '@halo-dev/ui-shared'
import { computed, ref } from 'vue'

export type SiteStats = Awaited<ReturnType<typeof stats>>

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

export function formatMetric(value: unknown): string {
  if (value === null || value === undefined) return '--'
  const numeric = Number(value)
  return Number.isFinite(numeric) ? new Intl.NumberFormat('zh-CN').format(numeric) : String(value)
}
