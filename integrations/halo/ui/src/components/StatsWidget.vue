<script setup lang="ts">
import { IconEye, IconUserLine } from '@halo-dev/components'
import { onMounted } from 'vue'
import { formatMetric, useSiteStats } from '@/model/site-stats'

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
            <span class="widget-icon"><IconEye /></span>
            <div class="widget-copy">
              <span>今日浏览</span>
              <strong>{{ formatMetric(dashboard.data.value?.todayRequestForSite) }}</strong>
            </div>
          </div>
          <div class="widget-metric">
            <span class="widget-icon"><IconUserLine /></span>
            <div class="widget-copy">
              <span>今日访客</span>
              <strong>{{ formatMetric(dashboard.data.value?.todayVisitorForSite) }}</strong>
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
.widget-container { container-type: inline-size; min-width: 0; }
.widget-body { display: grid; min-width: 0; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; padding: 1rem; }
.widget-metric { display: flex; min-width: 0; align-items: center; gap: .75rem; }
.widget-icon { display: inline-flex; flex: none; align-items: center; justify-content: center; border-radius: 999px; padding: .625rem; color: #4b5563; background: #f3f4f6; }
.widget-icon :deep(svg) { width: 1.25rem; height: 1.25rem; }
.widget-copy { display: flex; min-width: 0; flex-direction: column; }
.widget-copy span { display: block; color: #6b7280; font-size: .75rem; }
.widget-copy strong { display: block; overflow: hidden; color: #111827; font-size: clamp(1.125rem, 12cqi, 1.5rem); font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
.widget-error { grid-column: 1 / -1; color: #b42318; }
a { color: #4b5563; font-size: .8rem; font-weight: 500; }
a:hover { color: #111827; }
@container (max-width: 15rem) { .widget-body { grid-template-columns: 1fr; } }
</style>
