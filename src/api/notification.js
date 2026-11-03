import request from '@/utils/request'

// 我的站内消息
export function getMyNotifications(params) {
  return request({
    url: '/notifications/my',
    method: 'get',
    params
  })
}

export function getUnreadCount() {
  return request({
    url: '/notifications/unread-count',
    method: 'get'
  })
}

// 标记指定消息已读；空数组表示全部已读
export function markNotificationsRead(notifyIds = []) {
  return request({
    url: '/notifications/read',
    method: 'put',
    data: { notifyIds }
  })
}

// 提醒配置（ADMIN）
export function getNotificationConfig() {
  return request({
    url: '/notification-config',
    method: 'get'
  })
}

export function updateNotificationConfig(data) {
  return request({
    url: '/notification-config',
    method: 'put',
    data
  })
}

// 提醒发送记录（STAFF / ADMIN）
export function getNotificationRecords(params) {
  return request({
    url: '/notifications/records',
    method: 'get',
    params
  })
}
