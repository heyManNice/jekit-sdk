<script setup lang="ts">
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
          <div>
            <span>浏览</span>
            <strong>{{ formatMetric(dashboard.data.value?.todayRequestForSite) }}</strong>
          </div>
          <div>
            <span>访客</span>
            <strong>{{ formatMetric(dashboard.data.value?.todayVisitorForSite) }}</strong>
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
.widget-body div { min-width: 0; border-radius: .75rem; padding: .9rem; background: #f0faf6; }
.widget-body span { display: block; color: #64748b; font-size: .75rem; }
.widget-body strong { display: block; overflow: hidden; margin-top: .25rem; color: #08795b; font-size: clamp(1.125rem, 12cqi, 1.5rem); text-overflow: ellipsis; white-space: nowrap; }
.widget-error { grid-column: 1 / -1; color: #b42318; }
a { color: #08795b; font-size: .8rem; font-weight: 700; }
@container (max-width: 15rem) { .widget-body { grid-template-columns: 1fr; } }
</style>
