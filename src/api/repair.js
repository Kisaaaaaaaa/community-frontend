/**
 * 损坏报修接口（后端 apps/repairs/views.py）
 *
 * 路由表：
 *   POST   /repairs                      4.5.1  提交报修申请（RESIDENT）
 *   GET    /repairs/my                   4.5.2  我的报修列表（RESIDENT）
 *   GET    /repairs/manage               4.5.4  报修单管理列表（STAFF / ADMIN）
 *   GET    /repairs/{repairNo}           4.5.3  报修单详情（RESIDENT 本人 / STAFF / ADMIN）
 *   PUT    /repairs/{repairNo}/verify    4.5.5  现场核验（STAFF）
 *   GET    /repairs/{repairNo}/progress  4.5.3b 进度日志（RESIDENT 本人 / STAFF / ADMIN）
 *   PUT    /repairs/{repairNo}/progress  4.5.6  进度更新（STAFF）
 *   PUT    /repairs/{repairNo}/acceptance 4.5.7 验收与上架（STAFF）
 *   GET    /repairs/{repairNo}/fee-payment 4.5.6补 维修费支付状态
 */
import request from '@/utils/request'

// ================== 枚举字典 ==================

// 报修单状态
export const REPAIR_STATUS = {
  SUBMITTED: 'SUBMITTED',     // 待核验
  VERIFYING: 'VERIFYING',     // 核验中
  REPAIRING: 'REPAIRING',     // 维修中
  REPAIRED: 'REPAIRED',       // 维修完成待验收
  CLOSED: 'CLOSED',           // 已完结
  REJECTED: 'REJECTED'        // 已驳回（误报）
}

export const REPAIR_STATUS_OPTIONS = [
  { label: '待核验', value: REPAIR_STATUS.SUBMITTED },
  { label: '核验中', value: REPAIR_STATUS.VERIFYING },
  { label: '维修中', value: REPAIR_STATUS.REPAIRING },
  { label: '维修完成', value: REPAIR_STATUS.REPAIRED },
  { label: '已完结', value: REPAIR_STATUS.CLOSED },
  { label: '已驳回', value: REPAIR_STATUS.REJECTED }
]

// 核验结果
export const VERIFY_RESULT = {
  CONFIRMED: 'CONFIRMED',     // 确认损坏（需维修）
  SUSPECTED: 'SUSPECTED',     // 疑似损坏（需进一步检测）
  FALSE_REPORT: 'FALSE_REPORT' // 误报
}

export const VERIFY_RESULT_OPTIONS = [
  { label: '确认损坏', value: VERIFY_RESULT.CONFIRMED },
  { label: '疑似损坏', value: VERIFY_RESULT.SUSPECTED },
  { label: '误报', value: VERIFY_RESULT.FALSE_REPORT }
]

// 维修进度状态
export const PROGRESS_STATUS = {
  WAIT_PART: 'WAIT_PART',     // 待配件
  REPAIRING: 'REPAIRING',     // 维修中
  REPAIRED: 'REPAIRED',       // 维修完成
  FAILED: 'FAILED'            // 维修失败（需报废）
}

export const PROGRESS_STATUS_OPTIONS = [
  { label: '待配件', value: PROGRESS_STATUS.WAIT_PART },
  { label: '维修中', value: PROGRESS_STATUS.REPAIRING },
  { label: '维修完成', value: PROGRESS_STATUS.REPAIRED },
  { label: '维修失败', value: PROGRESS_STATUS.FAILED }
]

// 验收结果
export const ACCEPT_RESULT = {
  QUALIFIED: 'QUALIFIED',     // 合格
  UNQUALIFIED: 'UNQUALIFIED', // 不合格（需二次维修）
  PARTIAL: 'PARTIAL'          // 部分合格（限用）
}

export const ACCEPT_RESULT_OPTIONS = [
  { label: '合格', value: ACCEPT_RESULT.QUALIFIED },
  { label: '部分合格', value: ACCEPT_RESULT.PARTIAL },
  { label: '不合格', value: ACCEPT_RESULT.UNQUALIFIED }
]

// 验收后工具状态
export const TOOL_STATUS_AFTER_REPAIR = {
  AVAILABLE: 'AVAILABLE',     // 可用（重新上架）
  REPAIRING: 'REPAIRING',     // 维修中（二次维修）
  SCRAPPED: 'SCRAPPED'        // 报废
}

export const TOOL_STATUS_AFTER_REPAIR_OPTIONS = [
  { label: '重新上架（可用）', value: TOOL_STATUS_AFTER_REPAIR.AVAILABLE },
  { label: '二次维修', value: TOOL_STATUS_AFTER_REPAIR.REPAIRING },
  { label: '报废', value: TOOL_STATUS_AFTER_REPAIR.SCRAPPED }
]

// 费用支付状态（主表 RepairOrder.fee_status）
export const FEE_STATUS = {
  UNPAID: 'UNPAID',   // 未支付
  PAYING: 'PAYING',   // 支付中
  PAID: 'PAID'        // 已支付
}

// 支付单状态（RepairFeePayment.status）
export const PAYMENT_ORDER_STATUS = {
  PENDING: 'PENDING', // 待支付
  PAID: 'PAID',       // 已支付
  CLOSED: 'CLOSED',   // 已关闭
  FAILED: 'FAILED'    // 支付失败
}

// ================== 接口 ==================

/** 4.5.1 提交损坏报修申请（RESIDENT） */
export function submitRepair(data) {
  // data: { orderNo, toolCode, damagePart, damageDescription, attachmentIds? }
  return request({ url: '/repairs', method: 'post', data })
}

/** 4.5.2 我的报修列表（RESIDENT） */
export function getMyRepairs(params) {
  return request({ url: '/repairs/my', method: 'get', params })
}

/** 4.5.4 报修单管理列表（STAFF / ADMIN） */
export function getManageRepairs(params) {
  return request({ url: '/repairs/manage', method: 'get', params })
}

/** 4.5.3 报修单详情（RESIDENT 本人 / STAFF / ADMIN） */
export function getRepairDetail(repairNo) {
  return request({ url: `/repairs/${repairNo}`, method: 'get' })
}

/** 4.5.5 现场核验（STAFF） */
export function verifyRepair(repairNo, data) {
  // data: { verifyResult, verifyRemark }
  return request({ url: `/repairs/${repairNo}/verify`, method: 'put', data })
}

/** 4.5.3b 维修进度日志（RESIDENT 本人 / STAFF / ADMIN） */
export function getRepairProgressLogs(repairNo) {
  return request({ url: `/repairs/${repairNo}/progress`, method: 'get' })
}

/** 4.5.6 更新维修进度（STAFF） */
export function updateRepairProgress(repairNo, data) {
  // data: { repairer, expectedDuration?, repairFee?, repairStartTime?, progressStatus, progressDesc }
  return request({ url: `/repairs/${repairNo}/progress`, method: 'put', data })
}

/** 4.5.7 维修后验收与上架（STAFF） */
export function acceptRepair(repairNo, data) {
  // data: { acceptResult, toolStatus, damageLevel, remark? }
  return request({ url: `/repairs/${repairNo}/acceptance`, method: 'put', data })
}

/** 4.5.6 补充 维修费支付状态查询（任意角色，sync=true 时主动对账） */
export function getRepairFeePayment(repairNo, sync = false) {
  return request({
    url: `/repairs/${repairNo}/fee-payment`,
    method: 'get',
    params: { sync: sync ? 'true' : 'false' }
  })
}
