import { definePlugin } from '@halo-dev/ui-shared'
import { IconPlug } from '@halo-dev/components'
import { markRaw } from 'vue'
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
            icon: markRaw(IconPlug),
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
    ],
  },
})
