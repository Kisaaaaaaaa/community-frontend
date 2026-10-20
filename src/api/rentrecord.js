import request from '@/utils/request'

// 4.4.1 取件确认
// 权限：STAFF / ADMIN
// data：{ pickerName, checkedIdNo, remark? }
// 返回：{ orderNo, status: 'PICKED_UP', actualPickupTime }
export function confirmPickup(orderNo, data) {
  return request({
    url: `/records/${orderNo}/pickup`,
    method: 'post',
    data
  })
}

// 4.4.2 归还验收
// 权限：STAFF / ADMIN
// data：{ returnTime, acceptanceResult, damageLevel, overdueFee?, remark? }
// 返回：{ orderNo, status: 'RETURNED', overdueFee, refundAmount, refundStatus, toolStatus }
export function confirmReturn(orderNo, data) {
  return request({
    url: `/records/${orderNo}/return`,
    method: 'post',
    data
  })
}

// 4.4.3 修改取件人（代取人）
// 权限：RESIDENT（本人）/ STAFF
// data：{ pickerName, pickerPhone }
export function updatePicker(orderNo, data) {
  return request({
    url: `/records/${orderNo}/picker`,
    method: 'put',
    data
  })
}

// 4.4.4 我的租赁记录
// 权限：RESIDENT
// params：status / keyword / page / pageSize
// 返回：{ list, total, page, pageSize, pages }
export function getMyRecords(params) {
  return request({
    url: '/records/my',
    method: 'get',
    params
  })
}

// 4.4.5 租赁记录管理查询
// 权限：STAFF / ADMIN
// params：renterName / toolCode / acceptanceResult / overdueStatus / dateStart / dateEnd / page / pageSize
// 返回：{ list, total, page, pageSize, pages }
export function getManageRecords(params) {
  return request({
    url: '/records/manage',
    method: 'get',
    params
  })
}

// 4.4.6 租赁记录详情
// 权限：RESIDENT（本人）/ STAFF / ADMIN
// 返回：{ record }
export function getRecordDetail(orderNo) {
  return request({
    url: `/records/${orderNo}`,
    method: 'get'
  })
}

// 4.4.7 导出租赁记录 Excel
// 权限：STAFF / ADMIN
// params：同 4.4.5 的筛选条件
// 返回：文件流（不走统一 JSON 响应）
export function exportRecords(params) {
  return request({
    url: '/records/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}
