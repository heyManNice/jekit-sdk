<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import DashboardCardError from '@/components/DashboardCardError.vue'
import { useLatestDocumentStats } from '@/model/site-stats'
import IconExternalLinkLine from '~icons/ri/external-link-line'

const latestDocuments = useLatestDocumentStats()
const rowLimit = ref(7)
const tableElement = ref<HTMLElement | null>(null)
let resizeObserver: ResizeObserver | undefined

function updateRowLimit(element: HTMLElement) {
  const firstRow = element.querySelector<HTMLElement>('.documents-row')
  const rowHeight = firstRow?.getBoundingClientRect().height ?? 0
  if (rowHeight <= 0) return

  const nextLimit = Math.max(1, Math.floor((element.clientHeight + .5) / rowHeight))
  if (nextLimit === rowLimit.value) return

  rowLimit.value = nextLimit
  void latestDocuments.refresh(nextLimit)
}

watch(tableElement, (element) => {
  resizeObserver?.disconnect()
  if (!element) return

  resizeObserver = new ResizeObserver(() => updateRowLimit(element))
  resizeObserver.observe(element)
  updateRowLimit(element)
}, { flush: 'post' })

onMounted(() => void latestDocuments.refresh(rowLimit.value))
onBeforeUnmount(() => resizeObserver?.disconnect())
</script>

<template>
  <WidgetCard>
    <template #title><div class="panel-title">最新文章</div></template>
    <div class="documents-card">
      <div v-if="latestDocuments.loading.value && !latestDocuments.data.value" class="performance-state">
        正在加载文档数据…
      </div>
      <DashboardCardError v-else-if="latestDocuments.error.value" />
      <div v-else-if="latestDocuments.data.value?.length" ref="tableElement" class="documents-table">
        <div v-for="(item, index) in latestDocuments.data.value" :key="item.path" class="documents-row"
          :style="{ animationDelay: `${index * 50}ms` }">
          <div class="document-name">
            <strong :title="item.title">{{ item.title }}</strong>
            <a :href="item.href" target="_blank" rel="noopener noreferrer" :aria-label="`访问 ${item.title}`"
              :title="item.path">
              <IconExternalLinkLine />
            </a>
          </div>
          <div class="document-metrics">
            <span>总浏览 <strong>{{ item.totalRequests }}</strong> 次</span>
            <i aria-hidden="true">·</i>
            <span>总访客 <strong>{{ item.totalVisitors }}</strong> 人</span>
            <i aria-hidden="true">·</i>
            <span>今日浏览 <strong>{{ item.todayRequests }}</strong> 次</span>
            <i aria-hidden="true">·</i>
            <span>今日访客 <strong>{{ item.todayVisitors }}</strong> 人</span>
          </div>
        </div>
      </div>
      <div v-else class="performance-state">暂无已发布文章</div>
    </div>
  </WidgetCard>
</template>

<style scoped>
.documents-card {
  container: documents-card / inline-size;
  overflow-x: auto;
}
.documents-table {
  display: grid;
  height: 15rem;
  min-width: 26rem;
  grid-template-columns: max-content minmax(0, 1fr);
  grid-auto-rows: 2rem;
  align-content: space-between;
  overflow: auto;
}
.documents-row {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
  align-items: center;
  gap: .75rem;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
  font-size: .75rem;
  opacity: 0;
  animation: document-row-enter 300ms ease-out forwards;
}
@keyframes document-row-enter {
  from { opacity: 0; }
  to { opacity: 1; }
}
.document-name {
  display: flex;
  min-width: max-content;
  align-items: center;
  gap: .375rem;
}
.document-name strong {
  white-space: nowrap;
  color: #374151;
  font-weight: 500;
}
.document-name a {
  display: inline-flex;
  flex: none;
  color: #9ca3af;
}
.document-name a:hover { color: #374151; }
.document-name a :deep(svg) { width: .875rem; height: .875rem; }
.document-metrics {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: flex-end;
  gap: .375rem;
  color: #6b7280;
  white-space: nowrap;
}
.document-metrics strong { color: #374151; font-weight: 500; }
.document-metrics i { color: #d1d5db; font-style: normal; }
@container documents-card (max-width: 36rem) {
  .documents-table { min-width: 0; grid-template-columns: minmax(0, 1fr) max-content; }
  .document-name { min-width: 0; overflow: hidden; }
  .document-name strong { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
}
@media (prefers-reduced-motion: reduce) {
  .documents-row { animation: none; opacity: 1; }
}
</style>
