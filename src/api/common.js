import request from '@/utils/request'

// 示例：获取公告列表
export function getNoticeList(params) {
  return request({
    url: '/notices',
    method: 'get',
    params
  })
}

// 示例：获取功能菜单
export function getFeatureList() {
  return request({
    url: '/features',
    method: 'get'
  })
}
