export const NOTIFY_TYPE_OPTIONS = [
  { value: 'RESERVATION_SUCCESS', label: '预约成功通知' },
  { value: 'REPAIR_CONFIRM', label: '报修确认通知' },
  { value: 'RENTAL_DUE', label: '租赁到期提醒' },
  { value: 'OVERDUE', label: '逾期提醒' },
  { value: 'PICKUP', label: '取件提醒' },
  { value: 'REPAIR_DONE', label: '维修完成提醒' }
]

export const RECEIVE_STATUS_OPTIONS = [
  { value: 'SENT', label: '已发送' },
  { value: 'READ', label: '已读' },
  { value: 'FAILED', label: '发送失败' }
]

// 提醒方式：记录表里的单条渠道（IN_APP / EMAIL）
export const CHANNEL_OPTIONS = [
  { value: 'IN_APP', label: '站内消息' },
  { value: 'EMAIL', label: '邮件通知' }
]

// 配置页的默认提醒方式：可同时投递两个渠道
export const CHANNEL_MODE_OPTIONS = [
  { value: 'IN_APP', label: '仅站内消息' },
  { value: 'EMAIL', label: '仅邮件通知' },
  { value: 'BOTH', label: '站内消息 + 邮件' }
]

const NOTIFY_TYPE_TAGS = {
  RESERVATION_SUCCESS: 'success',
  REPAIR_CONFIRM: 'primary',
  RENTAL_DUE: 'warning',
  OVERDUE: 'danger',
  PICKUP: 'primary',
  REPAIR_DONE: 'success'
}

const RECEIVE_STATUS_TAGS = {
  SENT: 'info',
  READ: 'success',
  FAILED: 'danger'
}

export function notifyTypeLabel(type) {
  return NOTIFY_TYPE_OPTIONS.find((item) => item.value === type)?.label || type || '-'
}

export function notifyTypeTag(type) {
  return NOTIFY_TYPE_TAGS[type] || 'info'
}

export function receiveStatusLabel(status) {
  return RECEIVE_STATUS_OPTIONS.find((item) => item.value === status)?.label || status || '-'
}

export function receiveStatusTag(status) {
  return RECEIVE_STATUS_TAGS[status] || 'info'
}

// 单条记录渠道文案：IN_APP → 站内消息，EMAIL → 邮件通知
export function channelLabel(channel) {
  return CHANNEL_OPTIONS.find((item) => item.value === channel)?.label || channel || '-'
}

// 默认提醒方式文案：IN_APP / EMAIL / BOTH
export function channelModeLabel(mode) {
  return CHANNEL_MODE_OPTIONS.find((item) => item.value === mode)?.label || mode || '-'
}
