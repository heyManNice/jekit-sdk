<script setup lang="ts">
import { VEmpty } from '@halo-dev/components'
import type { ChartData, ChartOptions } from 'chart.js'
import { computed, onMounted } from 'vue'
import { Line } from 'vue-chartjs'
import DashboardCardError from '@/components/DashboardCardError.vue'
import { useSiteUserHistory } from '@/model/site-stats'
import { neutral } from '@/utils/theme'
import '@/utils/register-charts'

const userHistory = useSiteUserHistory()
const points = computed(() => {
  const dateFormatter = new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' })
  const valueByDate = new Map<number, number>()

  for (const item of userHistory.data.value ?? []) {
    const date = new Date(Number(item.date))
    date.setHours(0, 0, 0, 0)
    valueByDate.set(date.getTime(), Number(item.value))
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today)
    // history 日趋势与 stats 的最近 7 天口径一致：最右侧为昨天，不补今天。
    date.setDate(today.getDate() - (7 - index))
    return { label: dateFormatter.format(date), value: valueByDate.get(date.getTime()) ?? 0 }
  })
})
const hasHistory = computed(() => userHistory.data.value !== null)
const chartData = computed<ChartData<'line'>>(() => ({
  labels: points.value.map((item) => item.label),
  datasets: [
    {
      label: '用户数',
      data: points.value.map((item) => item.value),
      borderColor: '#9333ea',
      backgroundColor: 'rgba(147, 51, 234, 0.1)',
      fill: true,
      tension: 0.35,
      borderWidth: 2,
      pointBackgroundColor: '#9333ea',
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
      callbacks: { label: (context) => `用户数：${context.parsed.y} 人` },
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

onMounted(() => void userHistory.refresh())
</script>

<template>
  <WidgetCard>
    <template #title><div class="panel-title">最近 7 天用户数</div></template>
    <template #actions>
      <div class="performance-legend" aria-label="图例">
        <span><i class="legend-dot legend-dot--users" />用户数</span>
      </div>
    </template>
    <div class="trend-card">
      <div v-if="userHistory.loading.value && !userHistory.data.value" class="performance-state">正在加载用户数据…</div>
      <DashboardCardError v-else-if="userHistory.error.value" />
      <div v-else-if="hasHistory" class="chart-container">
        <Line :data="chartData" :options="chartOptions" role="img" aria-label="最近 7 天累计站点用户数趋势" />
      </div>
      <div v-else class="trend-empty">
        <VEmpty title="暂无用户数据" message="最近 7 天没有用户记录" />
      </div>
    </div>
  </WidgetCard>
</template>
