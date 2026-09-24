<script setup lang="ts">
import {
  IconEye,
  IconHistoryLine,
  IconSettings,
  IconUserFollow,
  IconUserLine,
  Toast,
  VButton,
  VPageHeader,
} from '@halo-dev/components'
import NumberFlow from '@number-flow/vue'
import { dimensionOption, whereWasIFromOption, whichBrowserOption, whichOsOption } from 'jekit-core'
import { computed, markRaw, onMounted, ref } from 'vue'
import LatestArticlesCard from '@/components/LatestArticlesCard.vue'
import PerformanceChartCard from '@/components/PerformanceChartCard.vue'
import SourceRankingCard from '@/components/SourceRankingCard.vue'
import UserHistoryCard from '@/components/UserHistoryCard.vue'
import VisitTrendCard from '@/components/VisitTrendCard.vue'
import '@/components/dashboard-card.css'
import { toFlowNumber, useSiteStats } from '@/model/site-stats'
import IconQuestionLine from '~icons/ri/question-line'
import IconShareLine from '~icons/ri/share-line'
import sloganImage from '../../../../../apps/docs/public/images/slogan.webp'

const dashboard = useSiteStats()

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

const registeredDate = computed(() => {
  const timestamp = Number(dashboard.data.value?.registeredAt ?? 0)
  if (!Number.isFinite(timestamp) || timestamp <= 0) return '—'
  const date = new Date(timestamp)
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(date)
})
const subPageCount = computed(() => dashboard.data.value ? Number(dashboard.data.value.subPageCount) : null)
const pageLimit = computed(() => {
  const limit = Number(dashboard.data.value?.pageLimitForSite ?? 0)
  return Number.isFinite(limit) && limit > 0 ? limit : null
})

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

// 首屏提示：点过「我已知晓」后写进浏览器本地记录，刷新页面不再出现。
const NOTICE_KEY = 'jekit-halo:notice:privacy'
const noticeVisible = ref(localStorage.getItem(NOTICE_KEY) !== '1')

function dismissNotice() {
  noticeVisible.value = false
  localStorage.setItem(NOTICE_KEY, '1')
}

onMounted(() => void dashboard.refresh('/'))
</script>

<template>
  <VPageHeader title="Jekit 统计">
    <template #icon><IconEye /></template>
    <template #actions>
      <VButton @click="share">
        <template #icon><IconShareLine /></template>
        分享
      </VButton>
      <VButton type="secondary" :route="{ path: '/plugins/jekit-halo' }">
        <template #icon><IconSettings /></template>
        插件设置
      </VButton>
    </template>
  </VPageHeader>

  <main class="jekit-dashboard">
    <div v-if="noticeVisible" class="notice-banner">
      <p class="notice-text">
        您正在使用的 Jekit 统计将统计信息储存在 Jekit 服务器，你的 Jekit 数据将公开可查询。
        <a class="notice-link" href="https://jekit.cn/docs/intro/what-this-is/" target="_blank"
          rel="noopener noreferrer">了解更多</a>
      </p>
      <VButton type="secondary" size="sm" @click="dismissNotice">我已知晓</VButton>
    </div>

    <div v-if="dashboard.error.value" class="error-banner">
      <span>
        暂时无法读取统计数据，请稍后重试。如果你是初次安装 Jekit 统计，请确保你的域名在安装后至少有一次访问。
        <a class="error-banner-link" :href="dashboard.domain.value" target="_blank" rel="noopener noreferrer">去访问</a>
      </span>
    </div>

    <section class="metric-grid" aria-label="访问概览" aria-live="polite">
      <WidgetCard v-for="card in cards" :key="card.label">
        <div class="metric-card">
          <span class="metric-icon" aria-hidden="true"><component :is="card.icon" /></span>
          <div class="metric-copy">
            <span>{{ card.label }}</span>
            <NumberFlow class="metric-value" :value="card.number" :format="{ notation: 'compact' }" />
          </div>
        </div>
      </WidgetCard>
    </section>

    <section class="analysis-grid" aria-label="趋势分析">
      <PerformanceChartCard />
      <LatestArticlesCard />
      <VisitTrendCard :data="dashboard.data.value" :loading="dashboard.loading.value"
        :error="Boolean(dashboard.error.value)" />
      <UserHistoryCard />
      <SourceRankingCard title="访问来源" :dimension="dimensionOption.SearchEngine" :labels="sourceLabels" tone="source" />
      <SourceRankingCard title="浏览器来源" :dimension="dimensionOption.Browser" :labels="browserLabels" tone="browser" />
      <SourceRankingCard title="操作系统来源" :dimension="dimensionOption.OS" :labels="osLabels" tone="os" />

      <WidgetCard>
        <template #title><div class="panel-title">更多信息</div></template>
        <div class="more-info-card">
          <div class="slogan-frame">
            <img :src="sloganImage" alt="Jekit，极简统计，为开发者而生">
          </div>
          <div class="more-info-content">
            <div class="more-info-intro">
              <h3>了解网站的更多数据</h3>
              <p>查看完整统计面板，了解访问趋势与访客来源。</p>
            </div>
            <div class="more-info-details">
              <div class="more-info-detail"><span>接入 Jekit 时间：{{ registeredDate }}</span></div>
              <div class="more-info-detail">
                <span>已统计子页面：{{ subPageCount ?? '—' }}<template v-if="pageLimit !== null"> / {{ pageLimit }}</template></span>
                <span class="page-limit-help-wrap">
                  <button class="page-limit-help" type="button" aria-label="了解子页面数量限制"
                    aria-describedby="page-limit-tooltip">
                    <IconQuestionLine aria-hidden="true" />
                  </button>
                  <span id="page-limit-tooltip" class="page-limit-tooltip" role="tooltip">
                    子页面数量限制是为了防止服务器资源被无限耗尽。如果当前配置不足以使用，你可以添加
                    <a href="https://jekit.cn/docs/intro/what-this-is/" target="_blank" rel="noopener noreferrer">交流群</a>
                    免费提高限制。
                  </span>
                </span>
              </div>
            </div>
            <div class="more-info-actions">
              <a :href="shareLink" target="_blank" rel="noopener noreferrer">访问更多指标</a>
              <a href="https://jekit.cn/docs/intro/what-this-is/" target="_blank" rel="noopener noreferrer">关于 Jekit</a>
            </div>
          </div>
        </div>
      </WidgetCard>
    </section>
  </main>
</template>

<style scoped>
.jekit-dashboard {
  display: grid;
  min-width: 0;
  gap: .625rem;
  margin: 1rem;
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
  color: rgb(var(--colors-danger) / 1);
  background: rgb(var(--colors-danger) / .06);
}
.error-banner-link,
.notice-link { color: inherit; text-decoration: underline; text-underline-offset: 2px; }
.notice-banner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: .5rem .75rem;
  padding: .75rem 1rem;
  color: #92400e;
  background: #fef3c7;
}
.error-banner,
.notice-banner { border-radius: .5rem; }
.notice-text {
  flex: 1 1 16rem;
  min-width: 0;
  margin: 0;
  font-size: .9375rem;
  line-height: 1.6;
}
.notice-link { white-space: nowrap; }
.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: .625rem;
}
.metric-grid>* { height: 6.875rem; }
.analysis-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: stretch;
  gap: .625rem;
}
.analysis-grid>* { height: 100%; }
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
.metric-icon :deep(svg) { width: 1.25rem; height: 1.25rem; }
.metric-copy { display: flex; min-width: 0; flex-direction: column; }
.metric-copy span { color: #6b7280; font-size: .875rem; }
.metric-copy .metric-value {
  color: #111827;
  font-size: 1.5rem;
  line-height: 1.35;
  font-weight: 500;
  letter-spacing: -.025em;
}
.more-info-card {
  display: grid;
  height: 15rem;
  min-width: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: stretch;
  gap: 1rem;
  padding: .75rem 1rem;
}
.slogan-frame {
  display: flex;
  width: 75%;
  height: 50%;
  min-width: 0;
  min-height: 0;
  align-self: center;
  align-items: center;
  justify-self: center;
  justify-content: center;
  overflow: hidden;
  border-radius: .5rem;
  background: #111827;
}
.slogan-frame img {
  display: block;
  width: 100%;
  height: 100%;
  max-height: 12rem;
  object-fit: contain;
}
.more-info-content {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  gap: .875rem;
  padding: .75rem 0;
}
.more-info-intro h3 {
  margin: 0;
  color: #374151;
  font-size: .9375rem;
  font-weight: 500;
  line-height: 1.5;
}
.more-info-intro p {
  margin: .25rem 0 0;
  color: #6b7280;
  font-size: .8125rem;
  line-height: 1.5;
}
.more-info-details { display: grid; gap: .25rem; }
.more-info-detail {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: .125rem;
  color: #6b7280;
  font-size: .8125rem;
  line-height: 1.5;
}
.page-limit-help-wrap {
  position: relative;
  display: inline-flex;
  width: 1rem;
  height: 1.25rem;
  flex: none;
  align-items: center;
  justify-content: center;
  line-height: 0;
}
.page-limit-help {
  display: inline-flex;
  width: 1rem;
  height: 1rem;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  padding: 0;
  color: #9ca3af;
  background: transparent;
  cursor: help;
}
.page-limit-help:hover { color: #374151; }
.page-limit-help:focus-visible {
  outline: 2px solid rgb(var(--colors-primary) / .45);
  outline-offset: 2px;
}
.page-limit-help :deep(svg) { display: block; width: .875rem; height: .875rem; }
.page-limit-tooltip {
  position: absolute;
  z-index: 10;
  top: 50%;
  right: calc(100% - .125rem);
  width: min(17rem, calc(100vw - 2rem));
  box-sizing: border-box;
  border-radius: .5rem;
  padding: .625rem .75rem;
  color: #fff;
  background: #374151;
  font-size: .75rem;
  line-height: 1.6;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateY(-50%);
  transition: opacity 150ms ease, visibility 150ms ease;
}
.page-limit-help-wrap:hover .page-limit-tooltip,
.page-limit-help-wrap:focus-within .page-limit-tooltip {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}
.page-limit-tooltip a { color: inherit; text-decoration: underline; text-underline-offset: 2px; }
.more-info-actions { display: flex; flex-wrap: wrap; gap: .375rem 1rem; }
.more-info-actions a {
  color: #374151;
  font-size: .8125rem;
  line-height: 1.5;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.more-info-actions a:hover { color: #111827; }

@container (max-width: 56.625rem) {
  .metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .analysis-grid { grid-template-columns: 1fr; }
}
@media (max-width: 480px) {
  .metric-grid { grid-template-columns: 1fr; }
}
</style>
