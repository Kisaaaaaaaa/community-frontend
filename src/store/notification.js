import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ElNotification } from 'element-plus'
import { getUnreadCount } from '@/api/notification'

const POLL_INTERVAL_MS = 15000

export const useNotificationStore = defineStore('notification', () => {
  const unreadCount = ref(0)
  const lastFetchedAt = ref(0)

  let pollTimer = null
  let knownCount = null
  let inFlight = false

  async function fetchUnreadCount({ silent = true } = {}) {
    if (inFlight) return unreadCount.value
    inFlight = true
    try {
      const data = await getUnreadCount()
      const next = data?.unreadCount || 0
      if (knownCount !== null && next > knownCount) {
        ElNotification({
          title: '您有新的站内消息',
          message: next === 1 ? '收到 1 条未读消息' : `当前共有 ${next} 条未读消息`,
          type: 'info'
        })
      }
      unreadCount.value = next
      knownCount = next
      lastFetchedAt.value = Date.now()
      return next
    } catch {
      if (!silent) {
        // 错误提示由请求拦截器统一处理
      }
      return unreadCount.value
    } finally {
      inFlight = false
    }
  }

  function setUnreadCount(count) {
    unreadCount.value = Math.max(0, Number(count) || 0)
    knownCount = unreadCount.value
  }

  function startPolling() {
    stopPolling()
    fetchUnreadCount()
    pollTimer = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return
      fetchUnreadCount()
    }, POLL_INTERVAL_MS)
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  function reset() {
    stopPolling()
    unreadCount.value = 0
    knownCount = null
    lastFetchedAt.value = 0
  }

  return {
    unreadCount,
    lastFetchedAt,
    fetchUnreadCount,
    setUnreadCount,
    startPolling,
    stopPolling,
    reset
  }
})
