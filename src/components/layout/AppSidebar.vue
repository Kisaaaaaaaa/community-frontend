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
      <el-menu-item index="/tools">
        <el-icon><Box /></el-icon>
        <template #title>工具列表</template>
      </el-menu-item>
      <el-menu-item v-if="userStore.role === 'RESIDENT'" index="/reservations">
        <el-icon><Calendar /></el-icon>
        <template #title>我的预约</template>
      </el-menu-item>
      <el-menu-item
        v-if="userStore.role === 'STAFF' || userStore.role === 'ADMIN'"
        index="/reservations/manage"
      >
        <el-icon><Tickets /></el-icon>
        <template #title>预约管理</template>
      </el-menu-item>
      <el-menu-item v-if="userStore.role === 'RESIDENT'" index="/records">
        <el-icon><Reading /></el-icon>
        <template #title>我的租赁</template>
      </el-menu-item>
      <el-menu-item
        v-if="userStore.role === 'STAFF' || userStore.role === 'ADMIN'"
        index="/records/manage"
      >
        <el-icon><Document /></el-icon>
        <template #title>租赁管理</template>
      </el-menu-item>
      <el-menu-item index="/profile">
        <el-icon><User /></el-icon>
        <template #title>个人主页</template>
      </el-menu-item>
      <el-menu-item v-if="userStore.role === 'ADMIN'" index="/admin/users">
        <el-icon><UserFilled /></el-icon>
        <template #title>用户管理</template>
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
import { useUserStore } from '@/store/user'
import { Box, Calendar, Document, HomeFilled, InfoFilled, Reading, Tickets, User, UserFilled } from '@element-plus/icons-vue'

defineProps({
  inDrawer: {
    type: Boolean,
    default: false
  }
})

const route = useRoute()
const appStore = useAppStore()
const userStore = useUserStore()

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
