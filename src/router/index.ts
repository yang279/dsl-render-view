import { createRouter, createWebHistory } from 'vue-router'
import WorkspaceLayout from '@/layouts/WorkspaceLayout'

const router = createRouter({
  history: createWebHistory(),
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
