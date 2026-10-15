<template>
  <aside class="app-sidebar" :class="{ collapsed: appStore.sidebarCollapsed }">
    <el-menu
      :default-active="activeMenu"
      :collapse="appStore.sidebarCollapsed && !inDrawer"
      :collapse-transition="false"
      router
      class="sidebar-menu"
      @select="onMenuSelect"
    >
      <el-menu-item index="/home">
        <el-icon><HomeFilled /></el-icon>
        <template #title>首页</template>
      </el-menu-item>
      <el-menu-item index="/about">
        <el-icon><InfoFilled /></el-icon>
        <template #title>关于平台</template>
      </el-menu-item>
    </el-menu>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/store/app'
import { HomeFilled, InfoFilled } from '@element-plus/icons-vue'

defineProps({
  inDrawer: {
    type: Boolean,
    default: false
  }
})

const route = useRoute()
const appStore = useAppStore()

// 当前激活的菜单项
const activeMenu = computed(() => route.path)

// 移动端选中后关闭抽屉
const onMenuSelect = () => {
  if (appStore.isMobile) {
    appStore.closeMobileMenu()
  }
}
</script>

<style lang="scss" scoped>
.app-sidebar {
  width: var(--sidebar-width);
  background-color: var(--card-bg-color);
  border-right: 1px solid var(--border-lighter);
  transition: width 0.28s ease;
  overflow: hidden;

  &.collapsed {
    width: var(--sidebar-collapsed-width);
  }
}

.sidebar-menu {
  border-right: none;
  height: 100%;

  // 适老化：增大菜单项高度
  :deep(.el-menu-item) {
    min-height: 48px;
    font-size: var(--font-size-base);
  }
}

// 在抽屉中不使用 border-right
:global(.el-drawer__body) {
  .app-sidebar {
    width: 100% !important;
    border-right: none;
  }
}
</style>
