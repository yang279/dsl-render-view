import { createRouter, createWebHashHistory } from 'vue-router'
import WorkspaceLayout from '@/layouts/WorkspaceLayout'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/editor',
    },
    {
      path: '/',
      component: WorkspaceLayout,
      children: [
        {
          path: 'editor',
          component: () => import('@/views/EditorPage/index'),
        },
        {
          path: 'preview',
          component: () => import('@/views/PreviewPage/index'),
        },
      ],
    },
  ],
})

export default router
