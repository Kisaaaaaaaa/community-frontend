import { ref, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '@/store/app'

// 移动端断点阈值（与 SCSS 断点保持一致）
const MOBILE_BREAKPOINT = 768

/**
 * 响应式视口监听组合式函数
 * 根据窗口宽度自动判断 PC / 移动端，并同步到 Pinia 与 <html> class
 * 用法：在根布局组件中调用 const { isMobile } = useResponsive()
 */
export function useResponsive() {
  const appStore = useAppStore()
  const isMobile = ref(false)

  const update = () => {
    const width = window.innerWidth
    isMobile.value = width < MOBILE_BREAKPOINT
    appStore.setMobile(isMobile.value)

    // 给 <html> 添加 .is-mobile / .is-pc class，便于 CSS 条件样式
    const html = document.documentElement
    html.classList.remove('is-mobile', 'is-pc')
    html.classList.add(isMobile.value ? 'is-mobile' : 'is-pc')
  }

  // 节流处理，避免 resize 频繁触发
  let timer = null
  const onResize = () => {
    clearTimeout(timer)
    timer = setTimeout(update, 100)
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', onResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', onResize)
  })

  return { isMobile }
}
