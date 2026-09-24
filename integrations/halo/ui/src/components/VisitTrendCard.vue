<script setup lang="ts">
import { VEmpty } from '@halo-dev/components'
import type { ChartData, ChartOptions } from 'chart.js'
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import DashboardCardError from '@/components/DashboardCardError.vue'
import type { SiteStats } from '@/model/site-stats'
import { neutral } from '@/utils/theme'
import '@/utils/register-charts'

const props = defineProps<{
  data: SiteStats | null
  loading: boolean
  error: boolean
}>()

const daily = computed(() => {
  const requests = props.data?.dailyRequestForSite ?? []
  const visitors = props.data?.dailyVisitorForSite ?? []
  const dateFormatter = new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' })
  // daily 数组的最后一格是昨天，今天的数据由 todayRequestForSite 单独返回。
  return requests.map((value, index) => ({
    label: dateFormatter.format(new Date(Date.now() - (requests.length - index) * 86_400_000)),
    requests: Number(value),
    visitors: Number(visitors[index] ?? 0),
  }))
})
const hasTrendData = computed(() => daily.value.some((item) => item.requests > 0 || item.visitors > 0))
const chartData = computed<ChartData<'line'>>(() => ({
  labels: daily.value.map((item) => item.label),
  datasets: [
    {
      label: '浏览量',
      data: daily.value.map((item) => item.requests),
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
    {
      label: '访客数',
      data: daily.value.map((item) => item.visitors),
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37, 99, 235, 0.06)',
      fill: false,
      tension: 0.35,
      borderWidth: 2,
      pointBackgroundColor: '#2563eb',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
    },
  ],
}))

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 500 },
  // 首帧容器测量会触发一次 resize，开启 resize 动画即可让图表画出来。
  transitions: { resize: { animation: { duration: 600 } } },
  interaction: { intersect: false, mode: 'index' },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#ffffff',
      titleColor: neutral.textMuted,
      bodyColor: neutral.text,
      borderColor: neutral.grid,
      borderWidth: 1,
      padding: 10,
      callbacks: {
        label: (context) => `${context.dataset.label}：${context.parsed.y} ${context.datasetIndex === 0 ? '次' : '人'}`,
      },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: neutral.line, font: { size: 11 } } },
    y: {
      beginAtZero: true,
      grid: { color: neutral.grid },
      ticks: { color: neutral.line, font: { size: 11 }, precision: 0, maxTicksLimit: 5 },
    },
  },
}
</script>

<template>
  <WidgetCard>
    <template #title><div class="panel-title">最近 7 天访问趋势</div></template>
    <template #actions>
      <div class="performance-legend" aria-label="图例">
        <span><i class="legend-dot legend-dot--pv" />浏览量</span>
        <span><i class="legend-dot legend-dot--uv" />访客数</span>
      </div>
    </template>
    <div class="trend-card">
      <div v-if="loading && !data" class="performance-state">正在加载统计数据…</div>
      <DashboardCardError v-else-if="error" />
      <div v-else-if="hasTrendData" class="chart-container">
        <Line :data="chartData" :options="chartOptions" role="img" aria-label="最近 7 天站点浏览量和访客数趋势" />
      </div>
      <div v-else class="trend-empty">
        <VEmpty title="暂无趋势数据" message="最近 7 天没有浏览记录" />
      </div>
    </div>
  </WidgetCard>
</template>
