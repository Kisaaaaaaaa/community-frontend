<template>
  <header class="app-header">
    <div class="header-inner">
      <!-- 左侧：菜单按钮（移动端）/ 折叠按钮（PC端） -->
      <div class="header-left">
        <el-icon v-if="isMobile" :size="24" class="menu-btn" @click="appStore.toggleMobileMenu()">
          <Menu />
        </el-icon>
        <el-icon v-else :size="20" class="collapse-btn" @click="appStore.toggleSidebar()">
          <Fold v-if="!appStore.sidebarCollapsed" />
          <Expand v-else />
        </el-icon>

        <div class="logo">
          <el-icon :size="28" color="#fff"><HomeFilled /></el-icon>
          <span class="logo-text">社区服务平台</span>
        </div>
      </div>

      <!-- 右侧：用户区域 -->
      <div class="header-right">
        <el-dropdown trigger="click" @command="handleCommand">
          <span class="user-info">
            <el-avatar :size="32" class="user-avatar">{{ avatarText }}</el-avatar>
            <span class="user-name hidden-mobile">{{ userStore.realName || userStore.roleLabel }}</span>
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item disabled>{{ userStore.roleLabel }}</el-dropdown-item>
              <el-dropdown-item command="profile">个人主页</el-dropdown-item>
              <el-dropdown-item>我的消息</el-dropdown-item>
              <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAppStore } from '@/store/app'
import { useUserStore } from '@/store/user'
import { Menu, Fold, Expand, HomeFilled, ArrowDown } from '@element-plus/icons-vue'

const appStore = useAppStore()
const userStore = useUserStore()
const router = useRouter()
const { isMobile } = storeToRefs(appStore)

// 头像展示姓名首字
const avatarText = computed(() => (userStore.realName || userStore.roleLabel || '用户').charAt(0))

// 下拉菜单命令处理
async function handleCommand(command) {
  if (command === 'profile') {
    router.push('/profile')
    return
  }
  if (command === 'logout') {
    await userStore.logout()
    ElMessage.success('已退出登录')
    router.replace('/login')
  }
}
</script>

<style lang="scss" scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-height);
  background: linear-gradient(135deg, var(--color-primary), #66b1ff);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1100;

  .header-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    padding: 0 var(--space-md);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .menu-btn,
  .collapse-btn {
    color: #fff;
    cursor: pointer;
    padding: var(--space-xs);
    border-radius: var(--radius-sm);
    transition: background 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }

  .logo {
    display: flex;
    align-items: center;
    gap: var(--space-sm);

    .logo-text {
      color: #fff;
      font-size: var(--font-size-lg);
      font-weight: 600;
    }
  }

  .header-right {
    .user-info {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      cursor: pointer;
      color: #fff;
      padding: var(--space-xs);
      border-radius: var(--radius-sm);

      &:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      .user-avatar {
        background: rgba(255, 255, 255, 0.3);
        color: #fff;
      }
    }
  }
}

// 移动端适配
.is-mobile {
  .app-header {
    .logo-text {
      font-size: var(--font-size-base);
    }
  }
}
</style>
