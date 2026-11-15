<template>
  <div class="layout-wrapper" :class="{ 'layout--mobile': isMobile }">
    <!-- 顶部导航栏（PC 与移动端共用） -->
    <AppHeader />

    <div class="layout-body">
      <!-- PC 端：固定侧边栏 -->
      <AppSidebar v-if="!isMobile" />

      <!-- 移动端：抽屉式导航 -->
      <el-drawer
        v-else
        v-model="appStore.mobileMenuOpen"
        direction="ltr"
        size="70%"
        :show-close="false"
        title="导航菜单"
      >
        <AppSidebar :in-drawer="true" />
      </el-drawer>

      <!-- 主内容区 -->
      <main class="layout-main">
        <div class="layout-content" :class="{ 'is-full': route.meta.fullBleed }">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </main>
    </div>

    <!-- 移动端：底部导航栏 -->
    <nav v-if="isMobile" class="bottom-nav">
      <router-link
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        class="bottom-nav-item"
        active-class="active"
      >
        <el-icon :size="24">
          <component :is="item.icon" />
        </el-icon>
        <span>{{ item.title }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/store/app'
import { useNotificationStore } from '@/store/notification'
import { useUserStore } from '@/store/user'
import { useResponsive } from '@/utils/responsive'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'
import {
  HomeFilled,
  Box,
  Calendar,
  Reading,
  User,
  Tickets,
  Document
} from '@element-plus/icons-vue'

const route = useRoute()
const appStore = useAppStore()
const userStore = useUserStore()
const notificationStore = useNotificationStore()
const { isMobile } = useResponsive()

onMounted(() => {
  if (userStore.role === 'RESIDENT') {
    notificationStore.startPolling()
  }
})

onUnmounted(() => {
  notificationStore.reset()
})

// 底部导航菜单项：居民展示高频业务入口，工作人员 / 管理员展示管理入口
const menuItems = computed(() => {
  if (userStore.role === 'RESIDENT') {
    return [
      { path: '/home', title: '首页', icon: HomeFilled },
      { path: '/tools', title: '工具', icon: Box },
      { path: '/reservations', title: '预约', icon: Calendar },
      { path: '/records', title: '租赁', icon: Reading },
      { path: '/profile', title: '我的', icon: User }
    ]
  }
  if (userStore.role === 'STAFF' || userStore.role === 'ADMIN') {
    return [
      { path: '/home', title: '首页', icon: HomeFilled },
      { path: '/tools', title: '工具', icon: Box },
      { path: '/reservations/manage', title: '预约', icon: Tickets },
      { path: '/records/manage', title: '租赁', icon: Document },
      { path: '/profile', title: '我的', icon: User }
    ]
  }
  return [
    { path: '/home', title: '首页', icon: HomeFilled },
    { path: '/tools', title: '工具', icon: Box }
  ]
})

</script>

<style lang="scss" scoped>
.layout-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
}

.layout-body {
  display: flex;
  flex: 1;
  margin-top: var(--header-height);
  min-height: 0;
}

.layout-main {
  flex: 1;
  min-width: 0;
  overflow-x: hidden;
}

.layout-content {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: var(--space-lg);
}

// 全屏铺满型页面（如 AI 对话）：去掉最大宽度与内边距，内容紧贴侧边栏
.layout-content.is-full {
  max-width: none;
  padding: 0;
}

// 移动端：收紧内边距，并为固定底栏预留高度，避免内容被遮挡
.layout--mobile {
  .layout-content {
    padding: var(--space-md) var(--space-md)
      calc(var(--bottom-nav-height) + var(--space-lg) + env(safe-area-inset-bottom));
  }

  .layout-content.is-full {
    padding: 0;
  }
}

// 移动端底部导航栏
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  height: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  background: var(--card-bg-color);
  border-top: 1px solid var(--border-lighter);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.06);
  z-index: 1000;

  .bottom-nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    color: var(--text-secondary);
    font-size: 12px;
    line-height: 1.2;
    transition: color 0.2s;
    -webkit-tap-highlight-color: transparent;

    &:active {
      opacity: 0.75;
    }

    &.active {
      color: var(--color-primary);
      font-weight: 600;
    }
  }
}
</style>
