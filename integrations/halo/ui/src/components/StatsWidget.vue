<script setup lang="ts">
import NumberFlow from '@number-flow/vue'
import { IconEye, IconUserLine } from '@halo-dev/components'
import { onMounted } from 'vue'
import { toFlowNumber, useSiteStats } from '@/model/site-stats'

defineProps<{ editMode?: boolean; previewMode?: boolean; config?: Record<string, unknown> }>()

const dashboard = useSiteStats()
onMounted(() => dashboard.refresh('/'))
</script>

<template>
  <WidgetCard title="Jekit 今日统计">
    <div class="widget-container">
      <div class="widget-body">
        <template v-if="dashboard.error.value">
          <p class="widget-error">暂时无法读取统计数据</p>
        </template>
        <template v-else>
          <div class="widget-metric">
            <span class="widget-icon">
              <IconEye />
            </span>
            <div class="widget-copy">
              <span>今日浏览</span>
              <NumberFlow class="widget-value" :value="toFlowNumber(dashboard.data.value?.todayRequestForSite)"
                :format="{ notation: 'compact' }" />
            </div>
          </div>
          <div class="widget-metric">
            <span class="widget-icon">
              <IconUserLine />
            </span>
            <div class="widget-copy">
              <span>今日访客</span>
              <NumberFlow class="widget-value" :value="toFlowNumber(dashboard.data.value?.todayVisitorForSite)"
                :format="{ notation: 'compact' }" />
            </div>
          </div>
        </template>
      </div>
    </div>
    <template #actions>
      <router-link :to="{ name: 'JekitStats' }">查看详情</router-link>
    </template>
  </WidgetCard>
</template>

<style scoped>
/* 与统计页保持同一套配色：数据色各自保留，通用元素（灰阶、错误提示）取 Halo 的取值与令牌 */
.widget-container {
  container-type: inline-size;
  display: flex;
  height: 100%;
  min-width: 0;
}

/* 只有两个指标：等分宽度，内容水平垂直居中 */
.widget-body {
  display: grid;
  flex: 1;
  min-width: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: center;
  justify-items: center;
  gap: .75rem;
  padding: 1rem;
}

.widget-metric {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: center;
  gap: .75rem;
}

.widget-icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: .625rem;
  color: #4b5563;
  background: #f3f4f6;
}

.widget-icon :deep(svg) {
  width: 1.25rem;
  height: 1.25rem;
}

.widget-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.widget-copy span {
  display: block;
  color: #6b7280;
  font-size: .75rem;
}

.widget-value {
  display: block;
  overflow: hidden;
  color: #111827;
  font-size: clamp(1.125rem, 12cqi, 1.5rem);
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.widget-error {
  grid-column: 1 / -1;
  color: rgb(var(--colors-danger) / 1);
}

a {
  color: #4b5563;
  font-size: .8rem;
  font-weight: 500;
}

a:hover {
  color: #111827;
}

@container (max-width: 15rem) {
  .widget-body {
    grid-template-columns: 1fr;
  }
}
</style>
