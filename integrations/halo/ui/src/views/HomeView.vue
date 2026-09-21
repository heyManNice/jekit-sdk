<script setup lang="ts">
import { IconPlug, IconRefreshLine, VButton, VCard, VPageHeader } from '@halo-dev/components'
import { computed, onMounted } from 'vue'
import { formatMetric, useSiteStats } from '@/model/site-stats'

const dashboard = useSiteStats()

const cards = computed(() => [
  { label: '今日浏览', value: dashboard.data.value?.todayRequestForSite },
  { label: '今日访客', value: dashboard.data.value?.todayVisitorForSite },
  { label: '累计浏览', value: dashboard.data.value?.totalRequestForSite },
  { label: '累计访客', value: dashboard.data.value?.totalVisitorForSite },
])

const daily = computed(() => {
  const values = dashboard.data.value?.dailyRequestForSite ?? []
  const max = Math.max(...values.map(Number), 1)
  const dateFormatter = new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' })
  return values.map((value, index) => ({
    label: dateFormatter.format(new Date(Date.now() - (values.length - 1 - index) * 86_400_000)),
    value: Number(value),
    height: `${Math.max((Number(value) / max) * 100, 4)}%`,
  }))
})

onMounted(() => dashboard.refresh('/'))
</script>

<template>
  <VPageHeader title="Jekit 统计">
    <template #icon>
      <IconPlug />
    </template>
    <template #actions>
      <VButton type="secondary" :loading="dashboard.loading.value" @click="dashboard.refresh('/')">
        <template #icon>
          <IconRefreshLine />
        </template>
        刷新
      </VButton>
    </template>
  </VPageHeader>

  <main class="jekit-dashboard">

    <div v-if="dashboard.error.value" class="error-banner">
      <strong>读取失败</strong>
      <span>暂时无法读取统计数据，请稍后重试。</span>
    </div>

    <section class="metric-grid" aria-label="访问概览" aria-live="polite">
      <VCard v-for="card in cards" :key="card.label">
        <div class="metric-card">
          <span>{{ card.label }}</span>
          <strong>{{ formatMetric(card.value) }}</strong>
        </div>
      </VCard>
    </section>

    <VCard title="最近 7 天浏览趋势">
      <template #actions>
        <span class="metric-type">PV</span>
      </template>
      <div v-if="daily.length" class="bars">
        <div v-for="item in daily" :key="item.label" class="bar-item">
          <strong>{{ formatMetric(item.value) }}</strong>
          <div class="bar-track"><div class="bar-fill" :style="{ height: item.height }" /></div>
          <span>{{ item.label }}</span>
        </div>
      </div>
      <p v-else class="empty">{{ dashboard.loading.value ? '正在加载统计数据…' : '暂无趋势数据' }}</p>
    </VCard>
  </main>
</template>

<style scoped>
.jekit-dashboard { display: grid; gap: 1rem; margin: 1rem; }
p { margin: 0; }
.error-banner { display: grid; gap: .2rem; padding: 1rem; border: 1px solid #fecaca; border-radius: .5rem; color: #991b1b; background: #fff1f2; }
.metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; }
.metric-card { padding: 1rem; }
.metric-card span { color: #64748b; font-size: .875rem; }
.metric-card strong { display: block; margin-top: .5rem; color: #0f172a; font-size: 1.75rem; line-height: 1.2; letter-spacing: -.025em; }
.metric-type { border-radius: 999px; padding: .25rem .6rem; color: #15803d; background: #f0fdf4; font-size: .75rem; font-weight: 600; }
.bars { display: grid; grid-template-columns: repeat(7, 1fr); gap: .65rem; height: 15rem; margin-top: 1.5rem; }
.bar-item { display: grid; grid-template-rows: auto 1fr auto; gap: .45rem; min-width: 0; text-align: center; color: #758095; font-size: .68rem; }
.bar-track { position: relative; overflow: hidden; border-radius: .375rem; background: #f1f5f9; }
.bar-fill { position: absolute; right: 0; bottom: 0; left: 0; border-radius: .375rem; background: #16a34a; transition: height .3s ease; }
.empty { padding: 4rem 0; text-align: center; color: #7a8495; }
@media (max-width: 800px) { .metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 480px) { .metric-grid { grid-template-columns: 1fr; } }
</style>
