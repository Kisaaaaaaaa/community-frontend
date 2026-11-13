import request from '@/utils/request'

// 生成幂等键：4.3.4 押金缴纳须携带 X-Idempotency-Key，避免重复缴费
function genIdempotencyKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `idem-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

// 4.3.1 查询工具可预约时段
// 权限：resident / staff / admin
// params：startDate（yyyy-MM-dd，默认当天）、days（默认 14，最大 30）
export function getAvailableSlots(toolCode, params) {
  return request({
    url: `/tools/${toolCode}/available-slots`,
    method: 'get',
    params
  })
}

// 4.3.2 预约时段冲突校验
// data：{ toolCode, startTime, endTime }
// 返回：{ available, conflictOrders[], suggestedSlots[] }
export function checkAvailability(data) {
  return request({
    url: '/reservations/availability-check',
    method: 'post',
    data
  })
}

// 4.3.3 创建租赁预约
// 权限：resident / staff
// data：{ toolCode, startTime, endTime, pickerName?, pickerPhone? }
// 返回：{ orderNo, status, depositAmount, payBillNo, payDeadline }
export function createReservation(data) {
  return request({
    url: '/reservations',
    method: 'post',
    data
  })
}

// 4.3.4 押金缴纳（统一走支付宝真实沙箱）
// 权限：resident（本人）
// data：{ payChannel: 'ALIPAY' }；须携带 X-Idempotency-Key 请求头
// 返回：{ orderNo, payNo, payChannel, amount, payUrl, payForm, payType, expireTime }
export function payDeposit(orderNo, data = { payChannel: 'ALIPAY' }) {
  return request({
    url: `/reservations/${orderNo}/deposit/pay`,
    method: 'post',
    data,
    headers: { 'X-Idempotency-Key': genIdempotencyKey() }
  })
}

// 查询押金支付/退款状态（ALIPAY 渠道支付完成后轮询用）
// sync=true 时后端会主动向渠道对账（query 接口），兜底异步 notify 未到达的场景
export function getDepositStatus(orderNo, sync = false) {
  return request({
    url: `/reservations/${orderNo}/deposit/status`,
    method: 'get',
    params: { sync: sync ? true : undefined }
  })
}

// 4.3.5 取消预约
// 权限：resident（本人）/ staff（代操作）
// data：{ cancelReason? }
// 注意：取消会触发押金退还，属资金类接口，后端强制要求 X-Idempotency-Key
// 返回：{ orderNo, status: 'CANCELLED', refundAmount, refundStatus }
export function cancelReservation(orderNo, data) {
  return request({
    url: `/reservations/${orderNo}/cancel`,
    method: 'post',
    data,
    headers: { 'X-Idempotency-Key': genIdempotencyKey() }
  })
}

// 4.3.6 预约详情查询
// 权限：resident（本人）/ staff / admin
// 返回：{ reservation, refundInfo }
export function getReservationDetail(orderNo) {
  return request({
    url: `/reservations/${orderNo}`,
    method: 'get'
  })
}

// 4.3.7 我的预约列表
// 权限：resident
// params：status / page / pageSize
// 返回：{ list, total, page, pageSize, pages }
export function getMyReservations(params) {
  return request({
    url: '/reservations/my',
    method: 'get',
    params
  })
}

// 4.3.8 预约管理列表
// 权限：staff / admin
// params：keyword / toolCode / status / dateStart / dateEnd / page / pageSize
// 返回：{ list, total, page, pageSize, pages }
export function getManageReservations(params) {
  return request({
    url: '/reservations/manage',
    method: 'get',
    params
  })
}
