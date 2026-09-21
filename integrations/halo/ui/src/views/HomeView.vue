<script setup lang="ts">
import {
  IconEye,
  IconHistoryLine,
  IconRefreshLine,
  IconUserFollow,
  IconUserLine,
  VButton,
  VEmpty,
  VPageHeader,
} from '@halo-dev/components'
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
import { computed, markRaw, onMounted } from 'vue'
import { Line } from 'vue-chartjs'
import { buildPerformancePoints, formatMetric, useSitePerformance, useSiteStats } from '@/model/site-stats'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

const dashboard = useSiteStats()
const performance = useSitePerformance()

const cards = computed(() => [
  { label: '今日浏览', value: dashboard.data.value?.todayRequestForSite, icon: markRaw(IconEye) },
  { label: '今日访客', value: dashboard.data.value?.todayVisitorForSite, icon: markRaw(IconUserLine) },
  { label: '累计浏览', value: dashboard.data.value?.totalRequestForSite, icon: markRaw(IconHistoryLine) },
  { label: '累计访客', value: dashboard.data.value?.totalVisitorForSite, icon: markRaw(IconUserFollow) },
])

const daily = computed(() => {
  const values = dashboard.data.value?.dailyRequestForSite ?? []
  const dateFormatter = new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' })
  return values.map((value, index) => ({
    label: dateFormatter.format(new Date(Date.now() - (values.length - 1 - index) * 86_400_000)),
    value: Number(value),
  }))
})
const hasTrendData = computed(() => daily.value.some((item) => item.value > 0))

const trendChartData = computed<ChartData<'line'>>(() => ({
  labels: daily.value.map((item) => item.label),
  datasets: [
    {
      label: '浏览量',
      data: daily.value.map((item) => item.value),
      borderColor: '#16a34a',
      backgroundColor: 'rgba(22, 163, 74, 0.12)',
      fill: true,
      tension: 0.35,
      borderWidth: 2,
      pointBackgroundColor: '#16a34a',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
    },
  ],
}))

const trendChartOptions: ChartOptions<'line'> = {
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
        label: (context) => `浏览量：${context.parsed.y} 次`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#94a3b8', font: { size: 11 } },
    },
    y: {
      beginAtZero: true,
      grid: { color: '#e2e8f0' },
      ticks: {
        color: '#94a3b8',
        font: { size: 11 },
        precision: 0,
        maxTicksLimit: 5,
      },
    },
  },
}

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
      <IconEye />
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
      <WidgetCard v-for="card in cards" :key="card.label">
        <div class="metric-card">
          <span class="metric-icon" aria-hidden="true">
            <component :is="card.icon" />
          </span>
          <div class="metric-copy">
            <span>{{ card.label }}</span>
            <strong>{{ formatMetric(card.value) }}</strong>
          </div>
        </div>
      </WidgetCard>
    </section>

    <section class="analysis-grid" aria-label="趋势分析">
    <WidgetCard>
      <template #title>
        <div class="panel-title">今日性能指标</div>
      </template>
      <template #actions>
        <div class="performance-legend" aria-label="图例">
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
        <div v-else-if="performancePoints.length" class="chart-container">
          <Line
            :data="performanceChartData"
            :options="performanceChartOptions"
            role="img"
            aria-label="今日 TTFB 和 PLT 耗时分布"
          />
        </div>
        <div v-else class="performance-state">今日暂无性能数据</div>
      </div>
      <p class="performance-description">
        TTFB 为收到首字节的耗时，PLT 为页面完全加载的耗时。性能数据仅统计当天。
      </p>
    </WidgetCard>

    <WidgetCard>
      <template #title>
        <div class="panel-title">最近 7 天浏览趋势</div>
      </template>
      <template #actions>
        <span class="metric-type">PV</span>
      </template>
      <div class="trend-card">
        <div v-if="dashboard.loading.value && !dashboard.data.value" class="performance-state">
          正在加载统计数据…
        </div>
        <div v-else-if="hasTrendData" class="chart-container">
          <Line
            :data="trendChartData"
            :options="trendChartOptions"
            role="img"
            aria-label="最近 7 天站点浏览量趋势"
          />
        </div>
        <div v-else class="trend-empty">
          <VEmpty title="暂无趋势数据" message="最近 7 天没有浏览记录" />
        </div>
      </div>
    </WidgetCard>
    </section>
  </main>
</template>

<style scoped>
.jekit-dashboard { display: grid; min-width: 0; gap: .625rem; margin: 1rem; }
.jekit-dashboard > *, .metric-grid, .metric-grid > *, .analysis-grid, .analysis-grid > * { min-width: 0; max-width: 100%; }
p { margin: 0; }
.error-banner { display: grid; gap: .2rem; padding: 1rem; border: 1px solid #fecaca; border-radius: .5rem; color: #991b1b; background: #fff1f2; }
.metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .625rem; }
.metric-grid > * { height: 6.875rem; }
.analysis-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 28rem), 1fr)); align-items: stretch; gap: .625rem; }
.analysis-grid > * { height: 100%; }
.panel-title { min-width: 0; flex: 1; font-size: 1rem; font-weight: 400; line-height: 1.5rem; }
.metric-card { display: flex; height: 100%; align-items: center; gap: 1rem; box-sizing: border-box; padding: .75rem 1rem; }
.metric-icon { display: inline-flex; flex: none; align-items: center; justify-content: center; border-radius: 999px; padding: .625rem; color: #4b5563; background: #f3f4f6; }
.metric-icon :deep(svg) { width: 1.25rem; height: 1.25rem; }
.metric-copy { display: flex; min-width: 0; flex-direction: column; }
.metric-copy span { color: #6b7280; font-size: .875rem; }
.metric-copy strong { color: #111827; font-size: 1.5rem; line-height: 1.35; font-weight: 500; letter-spacing: -.025em; }
.metric-type { border-radius: 999px; padding: .25rem .6rem; color: #15803d; background: #f0fdf4; font-size: .75rem; font-weight: 600; }
.performance-legend { display: flex; align-items: center; gap: 1rem; color: #64748b; font-size: .75rem; }
.performance-legend span { display: flex; align-items: center; gap: .375rem; }
.legend-dot { display: inline-block; width: .75rem; height: .1875rem; border-radius: 999px; }
.legend-dot--ttfb { background: #2563eb; }
.legend-dot--plt { background: #9333ea; }
.performance-description { margin: 0; border-top: 1px solid #eaecf0; padding: .75rem 1rem; color: #64748b; font-size: .8125rem; line-height: 1.5; }
.performance-state { display: flex; min-height: 12rem; align-items: center; justify-content: center; color: #64748b; font-size: .875rem; }
.performance-state--error { color: #b91c1c; }
.performance-card, .trend-card { min-width: 0; padding: .75rem 1rem; }
.chart-container { position: relative; height: 15rem; }
.trend-empty { display: flex; height: 15rem; align-items: center; justify-content: center; }
@media (max-width: 800px) { .metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 480px) { .metric-grid { grid-template-columns: 1fr; } }
</style>
