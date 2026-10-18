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
