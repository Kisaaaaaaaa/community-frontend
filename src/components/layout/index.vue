<template>
  <div class="layout-wrapper">
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
        <div class="layout-content">
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
import { computed } from 'vue'
import { useAppStore } from '@/store/app'
import { useResponsive } from '@/utils/responsive'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'
import { HomeFilled, InfoFilled, Box } from '@element-plus/icons-vue'

const appStore = useAppStore()
const { isMobile } = useResponsive()

// 底部导航菜单项（与路由 children 对应）
const menuItems = computed(() => [
  { path: '/home', title: '首页', icon: HomeFilled },
  { path: '/tools', title: '工具', icon: Box }
  // , { path: '/about', title: '关于', icon: InfoFilled }
])
</script>

<style lang="scss" scoped>
.layout-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
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

// 移动端底部导航栏
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  height: 56px;
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
    transition: color 0.2s;

    &.active {
      color: var(--color-primary);
    }
  }
}
</style>
