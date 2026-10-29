import request from '@/utils/request'

// 工具列表查询：居民仅返回审核通过且可用的工具，工作人员/管理员返回全部
// params: keyword / category / page / pageSize
export function getToolList(params) {
  return request({
    url: '/tools',
    method: 'get',
    params
  })
}

// 工具信息审核：auditStatus=APPROVED / REJECTED，驳回时 auditRemark 必填
export function auditTool(toolCode, data) {
  return request({
    url: `/tools/${toolCode}/audit`,
    method: 'put',
    data
  })
}

// 工具录入 ：录入后进入待审核（PENDING）状态
export function createTool(data) {
  return request({
    url: '/tools',
    method: 'post',
    data
  })
}

// 逻辑删除工具：仅 tool_status 为 AVAILABLE 时允许删除
export function deleteTool(toolCode) {
  return request({
    url: `/tools/${toolCode}`,
    method: 'delete'
  })
}

// 4.2.4 工具详情查询：返回 { tool, rentalHistory }
export function getToolDetail(toolCode) {
  return request({
    url: `/tools/${toolCode}`,
    method: 'get'
  })
}

// 4.2.5 工具状态更新：data = { status, reason, damageLevel? }
export function updateToolStatus(toolCode, data) {
  return request({
    url: `/tools/${toolCode}/status`,
    method: 'put',
    data
  })
}

// 4.2.6 工具状态变更日志：params = { page, pageSize }
export function getToolStatusLogs(toolCode, params) {
  return request({
    url: `/tools/${toolCode}/status-logs`,
    method: 'get',
    params
  })
}
