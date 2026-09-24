<script setup lang="ts">
import type { ChartData, ChartOptions } from 'chart.js'
import { computed, onMounted } from 'vue'
import { Line } from 'vue-chartjs'
import DashboardCardError from '@/components/DashboardCardError.vue'
import { buildPerformancePoints, useSitePerformance } from '@/model/site-stats'
import { neutral } from '@/utils/theme'
import '@/utils/register-charts'

const performance = useSitePerformance()
const points = computed(() => buildPerformancePoints(performance.data.value))
const chartData = computed<ChartData<'line'>>(() => ({
  labels: points.value.map((point) => point.label),
  datasets: [
    {
      label: 'TTFB',
      data: points.value.map((point) => point.ttfb),
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37, 99, 235, 0.12)',
      fill: true,
      tension: 0.3,
      borderWidth: 2,
      pointBackgroundColor: '#2563eb',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 3,
    },
    {
      label: 'PLT',
      data: points.value.map((point) => point.plt),
      borderColor: '#9333ea',
      backgroundColor: 'rgba(147, 51, 234, 0.1)',
      fill: true,
      tension: 0.3,
      borderWidth: 2,
      pointBackgroundColor: '#9333ea',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 3,
    },
  ],
}))

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 500 },
  // 同趋势图，靠 resize transition 播放入场动画
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
        label: (context) => {
          const point = points.value[context.dataIndex]
          const raw = context.dataset.label === 'TTFB' ? point?.ttfbRaw : point?.pltRaw
          return `${context.dataset.label}: ${context.parsed.y}%（${raw ?? 0} 次）`
        },
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: neutral.line, font: { size: 11 }, maxTicksLimit: 8 },
    },
    y: {
      beginAtZero: true,
      grid: { color: neutral.grid },
      ticks: {
        color: neutral.line,
        font: { size: 11 },
        maxTicksLimit: 5,
        callback: (value) => `${value}%`,
      },
    },
  },
}

onMounted(() => void performance.refresh())
</script>

<template>
  <WidgetCard>
    <template #title><div class="panel-title">今日网站性能</div></template>
    <template #actions>
      <div class="performance-legend" aria-label="图例">
        <span><i class="legend-dot legend-dot--ttfb" />TTFB</span>
        <span><i class="legend-dot legend-dot--plt" />PLT</span>
      </div>
    </template>
    <div class="performance-card">
      <div v-if="performance.loading.value && !performance.data.value" class="performance-state">正在加载性能数据…</div>
      <DashboardCardError v-else-if="performance.error.value" />
      <div v-else-if="points.length" class="chart-container">
        <Line :data="chartData" :options="chartOptions" role="img" aria-label="今日 TTFB 和 PLT 耗时分布" />
      </div>
      <div v-else class="performance-state">今日暂无性能数据</div>
    </div>
  </WidgetCard>
</template>
