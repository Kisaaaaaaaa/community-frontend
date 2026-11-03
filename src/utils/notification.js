export const NOTIFY_TYPE_OPTIONS = [
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

const NOTIFY_TYPE_TAGS = {
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
