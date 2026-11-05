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
      <el-menu-item v-if="userStore.role === 'RESIDENT'" index="/repairs">
        <el-icon><Warning /></el-icon>
        <template #title>我的报修</template>
      </el-menu-item>
      <el-menu-item
        v-if="userStore.role === 'STAFF' || userStore.role === 'ADMIN'"
        index="/repairs/manage"
      >
        <el-icon><Tools /></el-icon>
        <template #title>报修管理</template>
      <el-menu-item v-if="userStore.role === 'RESIDENT'" index="/notifications" class="notify-menu-item">
        <el-icon class="notify-icon-wrap">
          <Bell />
          <span v-if="unreadCount > 0" class="unread-badge">
            {{ unreadCount > 99 ? '99+' : unreadCount }}
          </span>
        </el-icon>
        <template #title>我的消息</template>
      </el-menu-item>
      <el-menu-item
        v-if="userStore.role === 'STAFF' || userStore.role === 'ADMIN'"
        index="/notifications/records"
      >
        <el-icon><Message /></el-icon>
        <template #title>提醒发送记录</template>
      </el-menu-item>
      <el-menu-item v-if="userStore.role === 'ADMIN'" index="/notifications/config">
        <el-icon><Setting /></el-icon>
        <template #title>提醒配置</template>
      </el-menu-item>
      <el-menu-item index="/profile">
        <el-icon><User /></el-icon>
        <template #title>个人主页</template>
      </el-menu-item>
      <el-menu-item v-if="userStore.role === 'ADMIN'" index="/admin/users">
        <el-icon><UserFilled /></el-icon>
        <template #title>用户管理</template>
      </el-menu-item>
      <!-- <el-menu-item index="/about">
        <el-icon><InfoFilled /></el-icon>
        <template #title>关于平台</template>
      </el-menu-item> -->
    </el-menu>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/store/app'
import { useNotificationStore } from '@/store/notification'
import { useUserStore } from '@/store/user'
import { Box, Calendar, Document, HomeFilled, InfoFilled, Reading, Tickets, Tools, User, UserFilled, Warning } from '@element-plus/icons-vue'
import { Bell, Box, Calendar, Document, HomeFilled, InfoFilled, Message, Reading, Setting, Tickets, User, UserFilled } from '@element-plus/icons-vue'

defineProps({
  inDrawer: {
    type: Boolean,
    default: false
  }
})

const route = useRoute()
const appStore = useAppStore()
const userStore = useUserStore()
const { unreadCount } = storeToRefs(useNotificationStore())

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
  overflow-x: hidden;
  overflow-y: auto;

  &.collapsed {
    width: var(--sidebar-collapsed-width);
  }
}

.sidebar-menu {
  border-right: none;
  height: 100%;
  overflow: visible;

  // 适老化：增大菜单项高度
  :deep(.el-menu-item) {
    min-height: 48px;
    font-size: var(--font-size-base);
    overflow: visible;
  }
}

.notify-icon-wrap {
  position: relative;
  overflow: visible !important;
}

.unread-badge {
  position: absolute;
  top: -7px;
  right: -10px;
  z-index: 2;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--color-danger);
  color: #fff;
  font-size: 11px;
  font-style: normal;
  font-weight: 600;
  line-height: 16px;
  text-align: center;
  pointer-events: none;
}

// 在抽屉中不使用 border-right
:global(.el-drawer__body) {
  .app-sidebar {
    width: 100% !important;
    border-right: none;
  }
}
</style>
