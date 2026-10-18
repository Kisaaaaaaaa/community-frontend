import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/components/layout/index.vue'
import { getAccessToken } from '@/utils/auth'

// 静态路由：登录/注册 + 布局页面
const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', public: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/register/index.vue'),
    meta: { title: '注册', public: true }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/home',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/home/index.vue'),
        meta: { title: '首页', icon: 'HomeFilled' }
      },
      {
        path: 'tools',
        name: 'Tools',
        component: () => import('@/views/tools/index.vue'),
        meta: { title: '工具列表' }
      },
      {
        path: 'tools/audit',
        name: 'ToolAudit',
        component: () => import('@/views/tools/audit.vue'),
        meta: { title: '工具审核' }
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

// 全局前置守卫：设置页面标题 + 登录鉴权
router.beforeEach((to, from, next) => {
  const baseTitle = '社区服务平台'
  document.title = to.meta.title ? `${to.meta.title} - ${baseTitle}` : baseTitle

  const token = getAccessToken()

  // 需要登录的页面：未登录则跳转登录页，并记录来源用于登录后回跳
  if (to.meta.requiresAuth && !token) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  // 已登录时访问登录/注册页，直接返回首页
  if (token && (to.path === '/login' || to.path === '/register')) {
    next('/home')
    return
  }

  next()
})

export default router
