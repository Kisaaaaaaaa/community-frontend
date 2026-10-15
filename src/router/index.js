import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/components/layout/index.vue'

// 静态路由：布局 + 示例页面
const routes = [
  {
    path: '/',
    component: Layout,
    redirect: '/home',
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/home/index.vue'),
        meta: { title: '首页', icon: 'HomeFilled' }
      },
      {
        path: 'about',
        name: 'About',
        component: () => import('@/views/about/index.vue'),
        meta: { title: '关于平台', icon: 'InfoFilled' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/not-found/index.vue'),
    meta: { title: '页面未找到' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    // 路由切换时回到顶部，提升移动端体验
    return { top: 0 }
  }
})

// 全局前置守卫：设置页面标题
router.beforeEach((to, from, next) => {
  const baseTitle = '社区服务平台'
  document.title = to.meta.title ? `${to.meta.title} - ${baseTitle}` : baseTitle
  next()
})

export default router
