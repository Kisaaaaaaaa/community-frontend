import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 应用全局状态
 * 管理侧边栏折叠、移动端抽屉导航等 UI 状态
 */
export const useAppStore = defineStore('app', () => {
  // 侧边栏是否折叠（PC 端）
  const sidebarCollapsed = ref(false)

  // 移动端导航抽屉是否展开
  const mobileMenuOpen = ref(false)

  // 当前是否为移动端视口
  const isMobile = ref(false)

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setMobile(isMob) {
    isMobile.value = isMob
    // 切换到移动端时自动收起侧边栏
    if (isMob) {
      sidebarCollapsed.value = false
    }
  }

  function toggleMobileMenu() {
    mobileMenuOpen.value = !mobileMenuOpen.value
  }

  function closeMobileMenu() {
    mobileMenuOpen.value = false
  }

  return {
    sidebarCollapsed,
    mobileMenuOpen,
    isMobile,
    toggleSidebar,
    setMobile,
    toggleMobileMenu,
    closeMobileMenu
  }
})
