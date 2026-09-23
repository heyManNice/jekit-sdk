<script setup lang="ts">
import {
  IconEye,
  IconHistoryLine,
  IconSettings,
  IconUserFollow,
  IconUserLine,
  Toast,
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
import NumberFlow from '@number-flow/vue'
import {
  dimensionOption,
  whereWasIFromOption,
  whichBrowserOption,
  whichOsOption,
} from 'jekit-core'
import { computed, markRaw, onMounted, ref } from 'vue'
import { Line } from 'vue-chartjs'
import {
  buildPerformancePoints,
  buildSourceRows,
  toFlowNumber,
  useSitePerformance,
  useSiteSource,
  useSiteStats,
} from '@/model/site-stats'
import { neutral } from '@/utils/theme'
import IconShareLine from '~icons/ri/share-line'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

const dashboard = useSiteStats()
const performance = useSitePerformance()
const searchSource = useSiteSource(dimensionOption.SearchEngine)
const browserSource = useSiteSource(dimensionOption.Browser)
const osSource = useSiteSource(dimensionOption.OS)

const sourceLabels: Readonly<Record<number, string>> = {
  [whereWasIFromOption.Other]: '其他',
  [whereWasIFromOption.Direct]: '直接访问',
  [whereWasIFromOption.Bing]: 'Bing',
  [whereWasIFromOption.Google]: 'Google',
  [whereWasIFromOption.Baidu]: '百度',
  [whereWasIFromOption.Doubao]: '豆包',
  [whereWasIFromOption.Copilot]: 'Copilot',
  [whereWasIFromOption.Claude]: 'Claude',
  [whereWasIFromOption.ChatGPT]: 'ChatGPT',
  [whereWasIFromOption.DeepSeek]: 'DeepSeek',
  [whereWasIFromOption.Perplexity]: 'Perplexity',
  [whereWasIFromOption.Grok]: 'Grok',
  [whereWasIFromOption.Gemini]: 'Gemini',
  [whereWasIFromOption.Kimi]: 'Kimi',
  [whereWasIFromOption.Yuanbao]: '元宝',
  [whereWasIFromOption.Sogou]: '搜狗',
  [whereWasIFromOption.Search360]: '360 搜索',
  [whereWasIFromOption.Brave]: 'Brave',
  [whereWasIFromOption.DuckDuckGo]: 'DuckDuckGo',
  [whereWasIFromOption.Yandex]: 'Yandex',
  [whereWasIFromOption.Wenxin]: '文心一言',
  [whereWasIFromOption.Qwen]: '通义千问',
  [whereWasIFromOption.Spark]: '讯飞星火',
}

const browserLabels: Readonly<Record<number, string>> = {
  [whichBrowserOption.Other]: '其他',
  [whichBrowserOption.Chrome]: 'Chrome',
  [whichBrowserOption.Edge]: 'Edge',
  [whichBrowserOption.Safari]: 'Safari',
  [whichBrowserOption.Firefox]: 'Firefox',
  [whichBrowserOption.Opera]: 'Opera',
  [whichBrowserOption.WeChat]: '微信',
  [whichBrowserOption.Browser360]: '360 浏览器',
}

const osLabels: Readonly<Record<number, string>> = {
  [whichOsOption.Other]: '其他',
  [whichOsOption.Windows]: 'Windows',
  [whichOsOption.MacOS]: 'macOS',
  [whichOsOption.Linux]: 'Linux',
  [whichOsOption.Android]: 'Android',
  [whichOsOption.iOS]: 'iOS',
  [whichOsOption.HarmonyOS]: 'HarmonyOS',
}

const cards = computed(() => [
  { label: '今日浏览', number: toFlowNumber(dashboard.data.value?.todayRequestForSite), icon: markRaw(IconEye) },
  { label: '今日访客', number: toFlowNumber(dashboard.data.value?.todayVisitorForSite), icon: markRaw(IconUserLine) },
  { label: '累计浏览', number: toFlowNumber(dashboard.data.value?.totalRequestForSite), icon: markRaw(IconHistoryLine) },
  { label: '累计访客', number: toFlowNumber(dashboard.data.value?.totalVisitorForSite), icon: markRaw(IconUserFollow) },
])

const daily = computed(() => {
  const requests = dashboard.data.value?.dailyRequestForSite ?? []
  const visitors = dashboard.data.value?.dailyVisitorForSite ?? []
  const dateFormatter = new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' })
  // daily 数组的最后一格是「昨天」（今天的数据由 todayRequestForSite 单独返回），
  // 所以日期整体往前推一天：最右 = 昨天，最左 = 7 天前
  return requests.map((value, index) => ({
    label: dateFormatter.format(new Date(Date.now() - (requests.length - index) * 86_400_000)),
    requests: Number(value),
    visitors: Number(visitors[index] ?? 0),
  }))
})
const hasTrendData = computed(() => daily.value.some((item) => item.requests > 0 || item.visitors > 0))

const trendChartData = computed<ChartData<'line'>>(() => ({
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

const trendChartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 500 },
  // 首帧容器测量会触发一次 resize，开启 resize 动画即可让图表「画」出来
  transitions: {
    resize: { animation: { duration: 600 } },
  },
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
    x: {
      grid: { display: false },
      ticks: { color: neutral.line, font: { size: 11 } },
    },
    y: {
      beginAtZero: true,
      grid: { color: neutral.grid },
      ticks: {
        color: neutral.line,
        font: { size: 11 },
        precision: 0,
        maxTicksLimit: 5,
      },
    },
  },
}

const performancePoints = computed(() => buildPerformancePoints(performance.data.value))
const sourceRows = computed(() => buildSourceRows(searchSource.data.value, sourceLabels, Number.POSITIVE_INFINITY, true))
const browserRows = computed(() => buildSourceRows(browserSource.data.value, browserLabels, Number.POSITIVE_INFINITY, true))
const osRows = computed(() => buildSourceRows(osSource.data.value, osLabels, Number.POSITIVE_INFINITY, true))
const sourceLoading = computed(() => searchSource.loading.value && !searchSource.data.value)
const sourceError = computed(() => Boolean(searchSource.error.value))
const browserLoading = computed(() => browserSource.loading.value && !browserSource.data.value)
const browserError = computed(() => Boolean(browserSource.error.value))
const osLoading = computed(() => osSource.loading.value && !osSource.data.value)
const osError = computed(() => Boolean(osSource.error.value))
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
  // 同趋势图，靠 resize transition 播放入场动画
  transitions: {
    resize: { animation: { duration: 600 } },
  },
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

function refresh() {
  void dashboard.refresh('/')
  void performance.refresh()
  void searchSource.refresh()
  void browserSource.refresh()
  void osSource.refresh()
}

// 分享：复制官网统计面板地址（官网约定 ?query= 之后整体视为要查询的站点地址）
const shareLink = computed(() => `https://jekit.cn/stats/?query=${dashboard.domain.value}`)

async function share() {
  try {
    await navigator.clipboard.writeText(shareLink.value)
    Toast.success('已复制官网统计面板链接')
  } catch {
    Toast.error(`复制失败，请手动复制：${shareLink.value}`)
  }
}

// 首屏提示：统计信息存在 Jekit 服务器、数据公开可查询。
// 点过「我已知晓」后写进浏览器本地记录，刷新页面不再出现
const NOTICE_KEY = 'jekit-halo:notice:privacy'
const noticeVisible = ref(localStorage.getItem(NOTICE_KEY) !== '1')

function dismissNotice() {
  noticeVisible.value = false
  localStorage.setItem(NOTICE_KEY, '1')
}

onMounted(refresh)
</script>

<template>
  <VPageHeader title="Jekit 统计">
    <template #icon>
      <IconEye />
    </template>
    <template #actions>
      <VButton @click="share">
        <template #icon>
          <IconShareLine />
        </template>
        分享
      </VButton>
      <VButton type="secondary" :route="{ path: '/plugins/jekit-halo' }">
        <template #icon>
          <IconSettings />
        </template>
        插件设置
      </VButton>
    </template>
  </VPageHeader>

  <main class="jekit-dashboard">

    <!-- 数据公开提示：点过「我已知晓」后本浏览器不再显示 -->
    <div v-if="noticeVisible" class="notice-banner">
      <p class="notice-text">
        您正在使用的 Jekit 统计将统计信息储存在 Jekit 服务器，你的Jekit 数据将公开可查询。
        <a class="notice-link" href="https://jekit.cn/docs/intro/what-this-is/" target="_blank"
          rel="noopener noreferrer">了解更多</a>
      </p>
      <VButton type="secondary" size="sm" @click="dismissNotice">我已知晓</VButton>
    </div>

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
            <!-- 数字滚动入场动画，与 Halo 仪表盘上方卡片的实现一致 -->
            <NumberFlow class="metric-value" :value="card.number" :format="{ notation: 'compact' }" />
          </div>
        </div>
      </WidgetCard>
    </section>

    <section class="analysis-grid" aria-label="趋势分析">
      <WidgetCard>
        <template #title>
          <div class="panel-title">今日网站性能</div>
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
            <Line :data="performanceChartData" :options="performanceChartOptions" role="img"
              aria-label="今日 TTFB 和 PLT 耗时分布" />
          </div>
          <div v-else class="performance-state">今日暂无性能数据</div>
        </div>
      </WidgetCard>

      <WidgetCard>
        <template #title>
          <div class="panel-title">最近 7 天访问趋势</div>
        </template>
        <template #actions>
          <div class="performance-legend" aria-label="图例">
            <span><i class="legend-dot legend-dot--pv" />浏览量</span>
            <span><i class="legend-dot legend-dot--uv" />访客数</span>
          </div>
        </template>
        <div class="trend-card">
          <div v-if="dashboard.loading.value && !dashboard.data.value" class="performance-state">
            正在加载统计数据…
          </div>
          <div v-else-if="hasTrendData" class="chart-container">
            <Line :data="trendChartData" :options="trendChartOptions" role="img" aria-label="最近 7 天站点浏览量和访客数趋势" />
          </div>
          <div v-else class="trend-empty">
            <VEmpty title="暂无趋势数据" message="最近 7 天没有浏览记录" />
          </div>
        </div>
      </WidgetCard>

      <WidgetCard>
        <template #title>
          <div class="panel-title">访问来源</div>
        </template>
        <div class="ranking-card">
          <div v-if="sourceLoading" class="performance-state">正在加载来源数据…</div>
          <div v-else-if="sourceError" class="performance-state performance-state--error">
            暂时无法读取来源数据，请稍后重试。
          </div>
          <div v-else-if="sourceRows.length" class="ranking-list">
            <div v-for="row in sourceRows" :key="row.name" class="ranking-row">
              <div class="ranking-copy">
                <span>{{ row.name }}</span>
                <span>{{ row.total.toLocaleString() }} 次 · {{ row.percent.toFixed(1) }}%</span>
              </div>
              <div class="progress-track" aria-hidden="true">
                <span class="progress-value progress-value--source" :style="{ width: `${row.percent}%` }" />
              </div>
            </div>
          </div>
          <div v-else class="performance-state">暂无来源数据</div>
        </div>
      </WidgetCard>

      <WidgetCard>
        <template #title>
          <div class="panel-title">浏览器来源</div>
        </template>
        <div class="ranking-card">
          <div v-if="browserLoading" class="performance-state">正在加载浏览器数据…</div>
          <div v-else-if="browserError" class="performance-state performance-state--error">
            暂时无法读取浏览器数据，请稍后重试。
          </div>
          <div v-else-if="browserRows.length" class="ranking-list">
            <div v-for="row in browserRows" :key="row.name" class="ranking-row">
              <div class="ranking-copy">
                <span>{{ row.name }}</span>
                <span>{{ row.total.toLocaleString() }} 次 · {{ row.percent.toFixed(1) }}%</span>
              </div>
              <div class="progress-track" aria-hidden="true">
                <span class="progress-value progress-value--browser" :style="{ width: `${row.percent}%` }" />
              </div>
            </div>
          </div>
          <div v-else class="performance-state">暂无浏览器数据</div>
        </div>
      </WidgetCard>

      <WidgetCard>
        <template #title>
          <div class="panel-title">操作系统来源</div>
        </template>
        <div class="ranking-card">
          <div v-if="osLoading" class="performance-state">正在加载操作系统数据…</div>
          <div v-else-if="osError" class="performance-state performance-state--error">
            暂时无法读取操作系统数据，请稍后重试。
          </div>
          <div v-else-if="osRows.length" class="ranking-list">
            <div v-for="row in osRows" :key="row.name" class="ranking-row">
              <div class="ranking-copy">
                <span>{{ row.name }}</span>
                <span>{{ row.total.toLocaleString() }} 次 · {{ row.percent.toFixed(1) }}%</span>
              </div>
              <div class="progress-track" aria-hidden="true">
                <span class="progress-value progress-value--os" :style="{ width: `${row.percent}%` }" />
              </div>
            </div>
          </div>
          <div v-else class="performance-state">暂无操作系统数据</div>
        </div>
      </WidgetCard>
    </section>
  </main>
</template>

<style scoped>
/* 配色分工：数据可视化（折线、图例色块、指标徽章）保留各自高区分度的颜色；
   通用元素（网格线、坐标轴、tooltip、错误提示）用 Halo 的灰阶与 --colors-danger 令牌 */
.jekit-dashboard {
  display: grid;
  min-width: 0;
  gap: .625rem;
  margin: 1rem;
  /* 下方的容器查询要按「面板宽度」而不是视口宽度判断，因为面板宽度还要减去侧边栏等 */
  container-type: inline-size;
}

.jekit-dashboard>*,
.metric-grid,
.metric-grid>*,
.analysis-grid,
.analysis-grid>* {
  min-width: 0;
  max-width: 100%;
}

.error-banner {
  display: grid;
  gap: .2rem;
  padding: 1rem;
  border: 1px solid rgb(var(--colors-danger) / .25);
  border-radius: .5rem;
  color: rgb(var(--colors-danger) / 1);
  background: rgb(var(--colors-danger) / .06);
}

/* 数据公开提示：Halo 只有 primary/secondary/danger 三个颜色令牌、没有 warning，
   所以这里自配一缕琥珀色（黄色系）；文案与右侧「我已知晓」并排，窄面板时换行 */
.notice-banner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: .5rem .75rem;
  padding: .75rem 1rem;
  border-radius: .5rem;
  color: #92400e;
  background: #fef3c7;
}

.notice-text {
  /* 基准宽度给一个较小值：文字放不下时自己在块内折行，而不是把「我已知晓」挤到第二行 */
  flex: 1 1 16rem;
  min-width: 0;
  margin: 0;
  font-size: .9375rem;
  line-height: 1.6;
}

.notice-link {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
  /* 中文可以在任意字之间断行，链接不能被拆到两行 */
  white-space: nowrap;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: .625rem;
}

.metric-grid>* {
  height: 6.875rem;
}

.analysis-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: stretch;
  gap: .625rem;
}

.analysis-grid>* {
  height: 100%;
}

.panel-title {
  min-width: 0;
  flex: 1;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5rem;
}

.metric-card {
  display: flex;
  height: 100%;
  align-items: center;
  gap: 1rem;
  box-sizing: border-box;
  padding: .75rem 1rem;
}

.metric-icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: .625rem;
  color: #4b5563;
  background: #f3f4f6;
}

.metric-icon :deep(svg) {
  width: 1.25rem;
  height: 1.25rem;
}

.metric-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.metric-copy span {
  color: #6b7280;
  font-size: .875rem;
}

.metric-copy .metric-value {
  color: #111827;
  font-size: 1.5rem;
  line-height: 1.35;
  font-weight: 500;
  letter-spacing: -.025em;
}

.performance-legend {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #6b7280;
  font-size: .75rem;
}

.performance-legend span {
  display: flex;
  align-items: center;
  gap: .375rem;
}

.legend-dot {
  display: inline-block;
  width: .75rem;
  height: .1875rem;
  border-radius: 999px;
}

.legend-dot--ttfb {
  background: #2563eb;
}

.legend-dot--plt {
  background: #9333ea;
}

.legend-dot--pv {
  background: #16a34a;
}

.legend-dot--uv {
  background: #2563eb;
}

.performance-state {
  display: flex;
  min-height: 12rem;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: .875rem;
}

.performance-state--error {
  color: rgb(var(--colors-danger) / 1);
}

.performance-card,
.trend-card,
.ranking-card {
  min-width: 0;
  padding: .75rem 1rem;
}

.chart-container {
  position: relative;
  height: 15rem;
}

.trend-empty {
  display: flex;
  height: 15rem;
  align-items: center;
  justify-content: center;
}

.ranking-list {
  display: grid;
  height: 15rem;
  align-content: start;
  gap: .625rem;
  overflow-y: auto;
  padding-right: .25rem;
}

.ranking-row {
  display: grid;
  gap: .25rem;
}

.ranking-copy {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  color: #374151;
  font-size: .8125rem;
}

.ranking-copy span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ranking-copy span:last-child {
  color: #9ca3af;
  white-space: nowrap;
}

.progress-track {
  height: .375rem;
  overflow: hidden;
  border-radius: 999px;
  background: #f3f4f6;
}

.progress-value {
  display: block;
  height: 100%;
  min-width: .125rem;
  border-radius: inherit;
  transform-origin: left center;
  animation: source-progress-enter 500ms cubic-bezier(.25, 1, .5, 1) both;
}

.progress-value--source {
  background: #16a34a;
}

@keyframes source-progress-enter {
  from {
    transform: scaleX(0);
  }

  to {
    transform: scaleX(1);
  }
}

.progress-value--browser {
  background: #2563eb;
}

.progress-value--os {
  background: #9333ea;
}

/* 指标卡与下方图表卡在同一节点换行：
   56.625rem = 2 × 28rem（.analysis-grid 里图表卡的最小宽度）+ .625rem（间距），
   也就是「面板放不下两张图表卡、图表卡收成单列」的那一刻。 */
@container (max-width: 56.625rem) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .analysis-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .metric-grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .progress-value {
    animation: none;
  }
}
</style>
