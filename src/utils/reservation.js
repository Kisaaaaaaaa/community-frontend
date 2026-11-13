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

// 押金状态：UNPAID / PAYING / PAID / REFUNDING / REFUNDED / PART_REFUND
export const DEPOSIT_STATUS_LABELS = {
  UNPAID: '未缴纳',
  PAYING: '支付中',
  PAID: '已缴纳',
  REFUNDING: '退还处理中',
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

// ================== 支付单状态（PayOrderStatus） ==================
// 用于押金支付单 payment.status
export const PAY_ORDER_STATUS_LABELS = {
  PENDING: '待支付',
  PAID: '已支付',
  CLOSED: '已关闭',
  FAILED: '支付失败'
}

export function payOrderStatusLabel(value) {
  return PAY_ORDER_STATUS_LABELS[value] || value || '-'
}

export function payOrderStatusTag(value) {
  const map = { PAID: 'success', CLOSED: 'info', FAILED: 'danger' }
  return map[value] || 'warning'
}

// ================== 维修费用支付状态（feeStatus） ==================
export const FEE_STATUS_LABELS = {
  UNPAID: '未支付',
  PAYING: '支付中',
  PAID: '已支付',
  FAILED: '支付失败',
  CLOSED: '已关闭',
  REFUNDING: '退款中',
  REFUNDED: '已退款'
}

export function feeStatusLabel(value) {
  return FEE_STATUS_LABELS[value] || value || '-'
}

export function feeStatusTag(value) {
  const map = { PAID: 'success', FAILED: 'danger', REFUNDED: 'info', CLOSED: 'info', PAYING: 'warning' }
  return map[value] || 'info'
}

// ================== 支付渠道 ==================
export const PAY_CHANNEL_LABELS = {
  ALIPAY: '支付宝沙箱',
  SANDBOX: '支付沙箱（模拟）'
}

export function payChannelLabel(value) {
  return PAY_CHANNEL_LABELS[value] || value || '-'
}

// 金额格式化（保留两位小数）
export function formatAmount(amount) {
  return amount === null || amount === undefined ? '-' : Number(amount).toFixed(2)
}

// 仅「待缴费」「已预约」两种状态允许取消（后端另有「取件前 24 小时」约束）
export function canCancel(status) {
  return status === 'WAIT_PAY' || status === 'CONFIRMED'
}

// 解析后端返回的 "YYYY-MM-DD HH:mm(:ss)"（本地时区）
function toTimestamp(value) {
  if (!value) return NaN
  const text = String(value).trim()
  if (!text) return NaN
  return new Date(text.includes('T') ? text : text.replace(' ', 'T')).getTime()
}

// 待缴费单是否已过缴费截止（与后端 Reservation.is_pay_expired 判定一致）
// 超时后预约会被释放为 OVERDUE，不允许再缴费 / 取消
export function isPayExpired(payDeadline) {
  if (!payDeadline) return false
  const ts = toTimestamp(payDeadline)
  return Number.isFinite(ts) && Date.now() > ts
}
