/**
 * AI 问答助手接口（后端 apps/ai/views.py）
 *
 * 路由表：
 *   POST   /ai/kb/documents                     4.7.2 建立知识库文档（ADMIN）
 *   GET    /ai/kb/documents                     4.7.3 知识库文档列表（STAFF / ADMIN）
 *   GET    /ai/kb/documents/{docId}             4.7.4 解析状态查询（STAFF / ADMIN）
 *   DELETE /ai/kb/documents/{docId}             4.7.5 删除文档（ADMIN）
 *   POST   /ai/chat                             4.7.6 发起 AI 问答（全角色）
 *   GET    /ai/chat/sessions                    4.7.7 我的会话列表（全角色）
 *   GET    /ai/chat/sessions/{id}/messages      4.7.8 会话历史消息（本人 / STAFF / ADMIN）
 *
 * 知识库文档需先通过 /files/upload（usage=KB_DOC）取得 fileId，再调用建立文档接口。
 */
import request from '@/utils/request'

// ================== 枚举字典 ==================

// 文档类型
export const KB_DOC_TYPE = {
  MANUAL: 'MANUAL', // 操作手册
  SAFETY: 'SAFETY', // 安全警示
  RULE: 'RULE'      // 租赁规则
}

export const KB_DOC_TYPE_OPTIONS = [
  { label: '操作手册', value: KB_DOC_TYPE.MANUAL },
  { label: '安全警示', value: KB_DOC_TYPE.SAFETY },
  { label: '租赁规则', value: KB_DOC_TYPE.RULE }
]

// 解析状态
export const PARSE_STATUS = {
  PENDING: 'PENDING', // 待解析
  PARSING: 'PARSING', // 解析中
  INDEXED: 'INDEXED', // 已入库
  FAILED: 'FAILED'    // 解析失败
}

export const PARSE_STATUS_OPTIONS = [
  { label: '待解析', value: PARSE_STATUS.PENDING },
  { label: '解析中', value: PARSE_STATUS.PARSING },
  { label: '已入库', value: PARSE_STATUS.INDEXED },
  { label: '解析失败', value: PARSE_STATUS.FAILED }
]

// ================== 字典展示辅助 ==================

export function docTypeLabel(value) {
  const hit = KB_DOC_TYPE_OPTIONS.find((it) => it.value === value)
  return hit ? hit.label : value || '—'
}

export function parseStatusLabel(value) {
  const hit = PARSE_STATUS_OPTIONS.find((it) => it.value === value)
  return hit ? hit.label : value || '—'
}

export function parseStatusTagType(value) {
  switch (value) {
    case PARSE_STATUS.INDEXED:
      return 'success'
    case PARSE_STATUS.PARSING:
      return 'warning'
    case PARSE_STATUS.FAILED:
      return 'danger'
    default:
      return 'info'
  }
}

// ================== 知识库文档 ==================

// 4.7.2 建立知识库文档（ADMIN）
export function createKbDocument(data) {
  return request({
    url: '/ai/kb/documents',
    method: 'post',
    data
  })
}

// 4.7.3 知识库文档列表（STAFF / ADMIN）
export function getKbDocuments(params) {
  return request({
    url: '/ai/kb/documents',
    method: 'get',
    params
  })
}

// 4.7.4 文档解析状态查询（STAFF / ADMIN）
export function getKbDocumentStatus(docId) {
  return request({
    url: `/ai/kb/documents/${docId}`,
    method: 'get'
  })
}

// 4.7.5 删除知识库文档（ADMIN）
export function deleteKbDocument(docId) {
  return request({
    url: `/ai/kb/documents/${docId}`,
    method: 'delete'
  })
}

// ================== AI 问答 ==================

// 4.7.6 发起 AI 问答（全角色）
// data: { sessionId?, question }
export function askAi(data) {
  return request({
    url: '/ai/chat',
    method: 'post',
    data
  })
}

// 预约助手对话（多步工具调用，可查询实时可约时段并创建预约）
// data: { sessionId?, question }
// 返回：{ sessionId, answerId, answer, sources, answerTime, steps, reservation }
export function askAgent(data) {
  return request({
    url: '/ai/agent/chat',
    method: 'post',
    data
  })
}

// 4.7.7 我的会话列表（全角色）
export function getChatSessions(params) {
  return request({
    url: '/ai/chat/sessions',
    method: 'get',
    params
  })
}

// 4.7.8 会话历史消息
export function getChatMessages(sessionId, params) {
  return request({
    url: `/ai/chat/sessions/${sessionId}/messages`,
    method: 'get',
    params
  })
}
