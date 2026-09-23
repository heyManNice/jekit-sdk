import { definePlugin } from '@halo-dev/ui-shared'
import { IconEye } from '@halo-dev/components'
import { markRaw } from 'vue'
import PerformanceWidget from './components/PerformanceWidget.vue'
import StatsWidget from './components/StatsWidget.vue'

export default definePlugin({
  components: {},
  routes: [
    {
      parentName: 'Root',
      route: {
        path: '/jekit/stats',
        name: 'JekitStats',
        component: () => import(/* webpackChunkName: "HomeView" */ './views/HomeView.vue'),
        meta: {
          title: 'Jekit 统计',
          searchable: true,
          menu: {
            name: 'Jekit 统计',
            group: 'dashboard',
            icon: markRaw(IconEye),
            priority: 40,
          },
        },
      },
    },
  ],
  extensionPoints: {
    'console:dashboard:widgets:create': () => [
      {
        id: 'jekit-stats-widget',
        component: markRaw(StatsWidget),
        group: 'Jekit',
        defaultSize: {
          w: 4,
          h: 5,
          minW: 3,
          minH: 4,
        },
      },
      {
        id: 'jekit-performance-widget',
        component: markRaw(PerformanceWidget),
        group: 'Jekit',
        defaultSize: {
          w: 4,
          h: 5,
          minW: 3,
          minH: 4,
        },
      },
    ],
  },
})
