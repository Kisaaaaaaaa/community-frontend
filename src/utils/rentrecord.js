// 租赁记录相关的状态映射与工具函数

// ---------- 记录状态 ----------
export const RECORD_STATUS_OPTIONS = [
  { value: 'CONFIRMED', label: '待取件' },
  { value: 'PICKED_UP', label: '租赁中' },
  { value: 'RETURNED', label: '已归还' },
  { value: 'OVERDUE', label: '逾期' }
]

export function recordStatusLabel(status) {
  const map = {
    CONFIRMED: '待取件',
    PICKED_UP: '租赁中',
    RETURNED: '已归还',
    OVERDUE: '逾期'
  }
  return map[status] || status || '-'
}

export function recordStatusTag(status) {
  switch (status) {
    case 'CONFIRMED':
      return 'warning'
    case 'PICKED_UP':
      return 'primary'
    case 'RETURNED':
      return 'success'
    case 'OVERDUE':
      return 'danger'
    default:
      return 'info'
  }
}

// ---------- 验收结果 ----------
export const ACCEPTANCE_RESULT_OPTIONS = [
  { value: 'INTACT', label: '完好' },
  { value: 'MINOR', label: '轻微损坏' },
  { value: 'SEVERE', label: '严重损坏' }
]

export function acceptanceResultLabel(result) {
  const map = {
    INTACT: '完好',
    MINOR: '轻微损坏',
    SEVERE: '严重损坏'
  }
  return map[result] || result || '-'
}

export function acceptanceResultTag(result) {
  switch (result) {
    case 'INTACT':
      return 'success'
    case 'MINOR':
      return 'warning'
    case 'SEVERE':
      return 'danger'
    default:
      return 'info'
  }
}

// ---------- 逾期状态 ----------
export const OVERDUE_STATUS_OPTIONS = [
  { value: 'NONE', label: '无逾期' },
  { value: 'YES', label: '有逾期' }
]

export function overdueStatusLabel(status) {
  const map = {
    NONE: '无逾期',
    YES: '有逾期'
  }
  return map[status] || status || '-'
}

// ---------- 退还状态 ----------
export function refundStatusLabel(status) {
  const map = {
    PROCESSING: '处理中',
    REFUNDED: '已退还',
    PART_REFUND: '部分退还'
  }
  return map[status] || status || '-'
}

// ---------- 损坏程度 ----------
export const DAMAGE_LEVEL_OPTIONS = [
  { value: 1, label: '1级（完好）' },
  { value: 2, label: '2级（轻度磨损）' },
  { value: 3, label: '3级（中度损坏）' },
  { value: 4, label: '4级（严重损坏）' }
]

// ---------- 格式化 ----------
export function formatAmount(value) {
  if (value === null || value === undefined) return '0.00'
  const num = Number(value)
  if (isNaN(num)) return '0.00'
  return num.toFixed(2)
}

// 时间精简：2026-10-16 20:00 → 10-16 20:00
export function shortDT(value) {
  const s = String(value || '')
  return s.length > 10 ? s.slice(5) : s || '-'
}

// ---------- 权限判断 ----------
// 哪些状态允许取件确认（预约已缴费 CONFIRMED）
export function canPickup(reservationStatus) {
  return reservationStatus === 'CONFIRMED'
}

// 哪些状态允许归还验收（已取件 PICKED_UP）
export function canReturn(reservationStatus) {
  return reservationStatus === 'PICKED_UP'
}

// 哪些状态允许修改取件人（4.4.3：仅待取件 CONFIRMED，已取件后不可修改）
export function canUpdatePicker(status) {
  return status === 'CONFIRMED'
}
