<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { formatMetric, useSiteStats } from '@/model/site-stats'

const path = ref('/')
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

onMounted(() => dashboard.refresh(path.value))
</script>

<template>
  <main class="jekit-dashboard">
    <header class="page-header">
      <div>
        <p class="eyebrow">JEKIT ANALYTICS</p>
        <h1>访问统计</h1>
        <p class="subtitle">{{ dashboard.domain.value }}</p>
      </div>
      <button class="refresh-button" :disabled="dashboard.loading.value" @click="dashboard.refresh(path)">
        {{ dashboard.loading.value ? '刷新中…' : '刷新' }}
      </button>
    </header>

    <section class="query-card">
      <label for="jekit-path">页面路径</label>
      <div class="query-row">
        <input id="jekit-path" v-model="path" type="text" placeholder="/" @keyup.enter="dashboard.refresh(path)" />
        <button @click="dashboard.refresh(path)">查询</button>
      </div>
      <p>输入 <code>/</code> 查看站点指标，或输入文章路径查看对应页面。</p>
    </section>

    <div v-if="dashboard.error.value" class="error-banner">
      <strong>读取失败</strong>
      <span>暂时无法读取统计数据，请稍后重试。</span>
    </div>

    <section class="metric-grid" aria-live="polite">
      <article v-for="card in cards" :key="card.label" class="metric-card">
        <span>{{ card.label }}</span>
        <strong>{{ formatMetric(card.value) }}</strong>
      </article>
    </section>

    <section class="trend-card">
      <div class="section-heading">
        <div>
          <p class="eyebrow">LAST 7 DAYS</p>
          <h2>站点浏览趋势</h2>
        </div>
        <span>PV</span>
      </div>
      <div v-if="daily.length" class="bars">
        <div v-for="item in daily" :key="item.label" class="bar-item">
          <strong>{{ formatMetric(item.value) }}</strong>
          <div class="bar-track"><div class="bar-fill" :style="{ height: item.height }" /></div>
          <span>{{ item.label }}</span>
        </div>
      </div>
      <p v-else class="empty">{{ dashboard.loading.value ? '正在加载统计数据…' : '暂无趋势数据' }}</p>
    </section>
  </main>
</template>

<style scoped>
.jekit-dashboard { min-height: 100%; padding: 2rem; color: #162033; background: radial-gradient(circle at top right, #e8fff7 0, transparent 30%), #f6f8fb; }
.page-header, .section-heading, .query-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
h1, h2, p { margin: 0; }
h1 { font-size: 2rem; letter-spacing: -0.04em; }
h2 { font-size: 1.15rem; }
.eyebrow { color: #0a8f6a; font-size: .72rem; font-weight: 800; letter-spacing: .16em; }
.subtitle { margin-top: .35rem; color: #687386; }
button { border: 0; border-radius: .65rem; padding: .65rem 1rem; color: white; background: #0a8f6a; cursor: pointer; font-weight: 650; }
button:disabled { cursor: wait; opacity: .55; }
.query-card, .trend-card, .metric-card { border: 1px solid #e2e7ef; border-radius: 1rem; background: rgba(255,255,255,.92); box-shadow: 0 10px 28px rgba(25,38,58,.06); }
.query-card { margin-top: 1.5rem; padding: 1rem; }
.query-card label { display: block; margin-bottom: .5rem; font-weight: 700; }
.query-card input { flex: 1; min-width: 0; border: 1px solid #ccd4df; border-radius: .65rem; padding: .65rem .8rem; background: white; }
.query-card p { margin-top: .55rem; color: #7a8495; font-size: .8rem; }
.error-banner { display: grid; gap: .2rem; margin-top: 1rem; padding: 1rem; border: 1px solid #fecaca; border-radius: .8rem; color: #991b1b; background: #fff1f2; }
.metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; margin-top: 1rem; }
.metric-card { padding: 1.1rem; }
.metric-card span { color: #6b7689; font-size: .82rem; }
.metric-card strong { display: block; margin-top: .5rem; font-size: 1.75rem; letter-spacing: -.04em; }
.trend-card { margin-top: 1rem; padding: 1.25rem; }
.section-heading > span { border-radius: 999px; padding: .3rem .65rem; color: #08795b; background: #e2f8f0; font-size: .75rem; font-weight: 800; }
.bars { display: grid; grid-template-columns: repeat(7, 1fr); gap: .65rem; height: 15rem; margin-top: 1.5rem; }
.bar-item { display: grid; grid-template-rows: auto 1fr auto; gap: .45rem; min-width: 0; text-align: center; color: #758095; font-size: .68rem; }
.bar-track { position: relative; overflow: hidden; border-radius: .45rem; background: #eef2f6; }
.bar-fill { position: absolute; right: 0; bottom: 0; left: 0; border-radius: .45rem; background: linear-gradient(180deg, #2ad09b, #078864); transition: height .3s ease; }
.empty { padding: 4rem 0; text-align: center; color: #7a8495; }
@media (max-width: 800px) { .jekit-dashboard { padding: 1rem; } .metric-grid { grid-template-columns: repeat(2, 1fr); } .page-header { align-items: flex-start; } }
</style>
