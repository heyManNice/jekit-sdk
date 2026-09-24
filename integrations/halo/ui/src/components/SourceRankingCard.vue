<script setup lang="ts">
import { dimensionOption } from 'jekit-core'
import { computed, onMounted, ref } from 'vue'
import DashboardCardError from '@/components/DashboardCardError.vue'
import { buildSourceRows, useSiteSource } from '@/model/site-stats'

const props = defineProps<{
  title: string
  dimension: dimensionOption
  labels: Readonly<Record<number, string>>
  tone: 'source' | 'browser' | 'os'
}>()

const source = useSiteSource(props.dimension)
const period = ref<'today' | 'total'>('today')
const periodOptions = [
  { label: '今日', value: 'today' },
  { label: '累计', value: 'total' },
] as const
const rows = computed(() => buildSourceRows(
  source.data.value,
  props.labels,
  Number.POSITIVE_INFINITY,
  true,
  period.value,
))

onMounted(() => void source.refresh())
</script>

<template>
  <WidgetCard>
    <template #title>
      <div class="panel-title">{{ title }}</div>
    </template>
    <template #actions>
      <div class="source-period-tabs" :aria-label="`${title}统计范围`">
        <button v-for="option in periodOptions" :key="option.value" type="button"
          :class="{ 'is-active': period === option.value }"
          :aria-pressed="period === option.value" @click="period = option.value">
          {{ option.label }}
        </button>
      </div>
    </template>
    <div class="ranking-card">
      <div v-if="source.loading.value && !source.data.value" class="performance-state">正在加载{{ title }}数据…</div>
      <DashboardCardError v-else-if="source.error.value" />
      <div v-else-if="rows.length" class="ranking-list">
        <div v-for="row in rows" :key="`${period}:${row.name}`" class="ranking-row">
          <div class="ranking-copy">
            <span>{{ row.name }}</span>
            <span>{{ row.total.toLocaleString() }} 次 · {{ row.percent.toFixed(1) }}%</span>
          </div>
          <div class="progress-track" aria-hidden="true">
            <span class="progress-value" :class="`progress-value--${tone}`" :style="{ width: `${row.percent}%` }" />
          </div>
        </div>
      </div>
      <div v-else class="performance-state">暂无{{ title }}数据</div>
    </div>
  </WidgetCard>
</template>

<style scoped>
.source-period-tabs {
  display: inline-flex;
  align-items: center;
  gap: .125rem;
  padding: .125rem;
  border-radius: .375rem;
  background: #f3f4f6;
}

.source-period-tabs button {
  border: 0;
  border-radius: .25rem;
  padding: .1875rem .5rem;
  color: #6b7280;
  background: transparent;
  cursor: pointer;
  font: inherit;
  font-size: .75rem;
  line-height: 1.25rem;
  transition: color 150ms ease, background-color 150ms ease, box-shadow 150ms ease;
}

.source-period-tabs button:hover { color: #374151; }
.source-period-tabs button:focus-visible {
  outline: 2px solid rgb(var(--colors-primary) / .45);
  outline-offset: 1px;
}
.source-period-tabs button.is-active {
  color: #111827;
  background: #fff;
  box-shadow: 0 1px 2px rgb(0 0 0 / .08);
}

.ranking-list {
  display: grid;
  height: 15rem;
  align-content: start;
  gap: .625rem;
  overflow-y: auto;
  padding-right: .25rem;
}
.ranking-row { display: grid; gap: .25rem; }
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
.ranking-copy span:last-child { color: #9ca3af; white-space: nowrap; }
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
.progress-value--source { background: #16a34a; }
.progress-value--browser { background: #2563eb; }
.progress-value--os { background: #9333ea; }
@keyframes source-progress-enter {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
@media (prefers-reduced-motion: reduce) {
  .progress-value { animation: none; }
}
</style>
