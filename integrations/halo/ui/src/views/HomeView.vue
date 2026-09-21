<script setup lang="ts">
import { IconPlug, IconRefreshLine, VButton, VCard, VPageHeader } from '@halo-dev/components'
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { computed, onMounted } from 'vue'
import { Line } from 'vue-chartjs'
import { buildPerformancePoints, formatMetric, useSitePerformance, useSiteStats } from '@/model/site-stats'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

const dashboard = useSiteStats()
const performance = useSitePerformance()

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

const performancePoints = computed(() => buildPerformancePoints(performance.data.value))
const performanceChartData = computed<ChartData<'line'>>(() => ({
  labels: performancePoints.value.map((point) => point.label),
  datasets: [
    {
      label: 'TTFB',
      data: performancePoints.value.map((point) => point.ttfb),
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37, 99, 235, 0.12)',
      fill: true,
      tension: 0.3,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 3,
    },
    {
      label: 'PLT',
      data: performancePoints.value.map((point) => point.plt),
      borderColor: '#9333ea',
      backgroundColor: 'rgba(147, 51, 234, 0.1)',
      fill: true,
      tension: 0.3,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 3,
    },
  ],
}))

const performanceChartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 500 },
  interaction: { intersect: false, mode: 'index' },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#ffffff',
      titleColor: '#64748b',
      bodyColor: '#0f172a',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      padding: 10,
      callbacks: {
        label: (context) => {
          const point = performancePoints.value[context.dataIndex]
          const raw = context.dataset.label === 'TTFB' ? point?.ttfbRaw : point?.pltRaw
          return `${context.dataset.label}: ${context.parsed.y}%（${raw ?? 0} 次）`
        },
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#94a3b8', font: { size: 11 }, maxTicksLimit: 8 },
    },
    y: {
      beginAtZero: true,
      grid: { color: '#e2e8f0' },
      ticks: {
        color: '#94a3b8',
        font: { size: 11 },
        maxTicksLimit: 5,
        callback: (value) => `${value}%`,
      },
    },
  },
}

function refresh() {
  void dashboard.refresh('/')
  void performance.refresh()
}

onMounted(refresh)
</script>

<template>
  <VPageHeader title="Jekit 统计">
    <template #icon>
      <IconPlug />
    </template>
    <template #actions>
      <VButton
        type="secondary"
        :loading="dashboard.loading.value || performance.loading.value"
        @click="refresh"
      >
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

    <VCard title="今日性能指标">
      <template #actions>
        <div class="performance-legend card-action" aria-label="图例">
          <span><i class="legend-dot legend-dot--ttfb" />TTFB</span>
          <span><i class="legend-dot legend-dot--plt" />PLT</span>
        </div>
      </template>

      <div class="performance-card">
        <div v-if="performance.loading.value && !performance.data.value" class="performance-state">
          正在加载性能数据…
        </div>
        <div v-else-if="performance.error.value" class="performance-state performance-state--error">
          暂时无法读取性能数据，请稍后重试。
        </div>
        <div v-else-if="performancePoints.length" class="performance-chart">
          <Line
            :data="performanceChartData"
            :options="performanceChartOptions"
            role="img"
            aria-label="今日 TTFB 和 PLT 耗时分布"
          />
        </div>
        <div v-else class="performance-state">今日暂无性能数据</div>
      </div>
      <template #footer>
        <p class="performance-description">
          TTFB 为收到首字节的耗时，PLT 为页面完全加载的耗时。性能数据仅统计当天。
        </p>
      </template>
    </VCard>

    <VCard title="最近 7 天浏览趋势">
      <template #actions>
        <span class="metric-type card-action">PV</span>
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
.jekit-dashboard { display: grid; min-width: 0; gap: 1rem; margin: 1rem; }
.jekit-dashboard > *, .metric-grid, .metric-grid > * { min-width: 0; max-width: 100%; }
p { margin: 0; }
.error-banner { display: grid; gap: .2rem; padding: 1rem; border: 1px solid #fecaca; border-radius: .5rem; color: #991b1b; background: #fff1f2; }
.metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; }
.metric-card { padding: 1rem; }
.metric-card span { color: #64748b; font-size: .875rem; }
.metric-card strong { display: block; margin-top: .5rem; color: #0f172a; font-size: 1.75rem; line-height: 1.2; letter-spacing: -.025em; }
.metric-type { border-radius: 999px; padding: .25rem .6rem; color: #15803d; background: #f0fdf4; font-size: .75rem; font-weight: 600; }
.performance-legend { display: flex; align-items: center; gap: 1rem; color: #64748b; font-size: .75rem; }
.performance-legend span { display: flex; align-items: center; gap: .375rem; }
.legend-dot { display: inline-block; width: .75rem; height: .1875rem; border-radius: 999px; }
.legend-dot--ttfb { background: #2563eb; }
.legend-dot--plt { background: #9333ea; }
.performance-card { padding: 1rem; }
.card-action { margin-right: 1rem; }
.performance-description { margin: 0; color: #64748b; font-size: .8125rem; line-height: 1.5; }
.performance-state { display: flex; min-height: 12rem; align-items: center; justify-content: center; color: #64748b; font-size: .875rem; }
.performance-state--error { color: #b91c1c; }
.performance-chart { position: relative; height: 15rem; margin-top: 1rem; }
.bars { display: grid; grid-template-columns: repeat(7, 1fr); gap: .65rem; height: 15rem; margin-top: 1.5rem; }
.bar-item { display: grid; grid-template-rows: auto 1fr auto; gap: .45rem; min-width: 0; text-align: center; color: #758095; font-size: .68rem; }
.bar-track { position: relative; overflow: hidden; border-radius: .375rem; background: #f1f5f9; }
.bar-fill { position: absolute; right: 0; bottom: 0; left: 0; border-radius: .375rem; background: #16a34a; transition: height .3s ease; }
.empty { padding: 4rem 0; text-align: center; color: #7a8495; }
@media (max-width: 800px) { .metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 480px) { .metric-grid { grid-template-columns: 1fr; } }
</style>
