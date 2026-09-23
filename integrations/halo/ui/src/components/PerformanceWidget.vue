<script setup lang="ts">
import NumberFlow from '@number-flow/vue'
import { computed, onMounted } from 'vue'
import { getPerformanceSummary, useSitePerformance } from '@/model/site-stats'
import IconTimerLine from '~icons/ri/timer-line'

defineProps<{ editMode?: boolean; previewMode?: boolean; config?: Record<string, unknown> }>()

const performance = useSitePerformance()
const ttfb = computed(() => getPerformanceSummary(performance.data.value?.ttfbHist))
const plt = computed(() => getPerformanceSummary(performance.data.value?.pltHist))

onMounted(() => performance.refresh())
</script>

<template>
  <WidgetCard title="网站性能">
    <div class="widget-container">
      <p v-if="performance.error.value" class="widget-state widget-state--error">暂时无法读取性能数据</p>
      <div v-else class="widget-body">
        <div class="widget-metric">
          <span class="widget-icon" aria-hidden="true"><IconTimerLine /></span>
          <div class="widget-copy">
            <span>TTFB P75</span>
            <NumberFlow class="widget-value" :value="ttfb.flowValue" :prefix="ttfb.prefix" :suffix="ttfb.suffix"
              :format="{ minimumFractionDigits: ttfb.fractionDigits, maximumFractionDigits: ttfb.fractionDigits }" />
          </div>
        </div>
        <div class="widget-metric">
          <span class="widget-icon" aria-hidden="true"><IconTimerLine /></span>
          <div class="widget-copy">
            <span>PLT P75</span>
            <NumberFlow class="widget-value" :value="plt.flowValue" :prefix="plt.prefix" :suffix="plt.suffix"
              :format="{ minimumFractionDigits: plt.fractionDigits, maximumFractionDigits: plt.fractionDigits }" />
          </div>
        </div>
      </div>
    </div>
    <template #actions>
      <router-link :to="{ name: 'JekitStats' }">查看详情</router-link>
    </template>
  </WidgetCard>
</template>

<style scoped>
.widget-container {
  container-type: inline-size;
  display: flex;
  height: 100%;
  min-width: 0;
}

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

.widget-copy>span {
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

.widget-state {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  margin: 0;
  color: #6b7280;
  font-size: .8125rem;
}

.widget-state--error {
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
