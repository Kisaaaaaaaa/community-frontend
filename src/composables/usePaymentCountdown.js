import { onBeforeUnmount, onMounted, ref } from 'vue'

// 兼容 "YYYY-MM-DD HH:mm:ss" 与 ISO 两种时间格式
function toTimestamp(value) {
  if (!value) return NaN
  let text = String(value).trim()
  if (text.includes(' ') && !text.includes('T')) text = text.replace(' ', 'T')
  return new Date(text).getTime()
}

/**
 * 缴费截止倒计时
 * 内部共享单个每秒心跳，组件卸载时自动清理，避免每个单元格各起一个定时器。
 * 返回 { payCountdown, deadlineClass }，调用时传入 payDeadline 字符串。
 */
export function usePaymentCountdown() {
  const now = ref(Date.now())
  let timer = null

  onMounted(() => {
    timer = setInterval(() => {
      now.value = Date.now()
    }, 1000)
  })

  onBeforeUnmount(() => {
    if (timer) clearInterval(timer)
    timer = null
  })

  function remainMs(payDeadline) {
    return toTimestamp(payDeadline) - now.value
  }

  // 剩余时长文案：剩 HH:MM:SS / 已超时
  function payCountdown(payDeadline) {
    const ms = remainMs(payDeadline)
    if (Number.isNaN(ms)) return '—'
    if (ms <= 0) return '已超时'
    const pad = (n) => String(n).padStart(2, '0')
    const total = Math.floor(ms / 1000)
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    return `剩 ${pad(h)}:${pad(m)}:${pad(s)}`
  }

  // 分级变色：超时红、5 分钟内加重、30 分钟内橙色
  function deadlineClass(payDeadline) {
    const ms = remainMs(payDeadline)
    if (Number.isNaN(ms)) return 'is-none'
    if (ms <= 0) return 'is-overdue'
    if (ms <= 5 * 60 * 1000) return 'is-urgent'
    if (ms <= 30 * 60 * 1000) return 'is-warning'
    return ''
  }

  return { payCountdown, deadlineClass }
}
