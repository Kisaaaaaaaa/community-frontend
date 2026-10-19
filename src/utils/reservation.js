// ============================================================
// 租赁预约模块共享字典（对应接口文档 3.2 枚举 / 3.3.2 ReservationVO）
// 供「我的预约」「预约管理」「预约详情」等页面复用
// ============================================================

// 预约状态：WAIT_PAY / CONFIRMED / PICKED_UP / RETURNED / CANCELLED / OVERDUE
export const RESERVATION_STATUS_OPTIONS = [
  { value: 'WAIT_PAY', label: '待缴费', tag: 'warning' },
  { value: 'CONFIRMED', label: '已预约', tag: 'success' },
  { value: 'PICKED_UP', label: '已取件', tag: 'primary' },
  { value: 'RETURNED', label: '已归还', tag: 'info' },
  { value: 'CANCELLED', label: '已取消', tag: 'info' },
  { value: 'OVERDUE', label: '已逾期', tag: 'danger' }
]

const STATUS_MAP = Object.fromEntries(
  RESERVATION_STATUS_OPTIONS.map((item) => [item.value, item])
)

export function reservationStatusLabel(value) {
  return STATUS_MAP[value]?.label || value || '-'
}

export function reservationStatusTag(value) {
  return STATUS_MAP[value]?.tag || 'info'
}

// 押金状态：UNPAID / PAID / REFUNDED / PART_REFUND
export const DEPOSIT_STATUS_LABELS = {
  UNPAID: '未缴纳',
  PAID: '已缴纳',
  REFUNDED: '已退还',
  PART_REFUND: '部分退还'
}

export function depositStatusLabel(value) {
  return DEPOSIT_STATUS_LABELS[value] || value || '-'
}

// 押金退还状态：PROCESSING / REFUNDED / FAILED
export const REFUND_STATUS_LABELS = {
  PROCESSING: '退还处理中',
  REFUNDED: '已退还',
  FAILED: '退还失败'
}

export function refundStatusLabel(value) {
  return REFUND_STATUS_LABELS[value] || value || '-'
}

// 金额格式化（保留两位小数）
export function formatAmount(amount) {
  return amount === null || amount === undefined ? '-' : Number(amount).toFixed(2)
}

// 仅「待缴费」「已预约」两种状态允许取消（后端另有「取件前 24 小时」约束）
export function canCancel(status) {
  return status === 'WAIT_PAY' || status === 'CONFIRMED'
}
