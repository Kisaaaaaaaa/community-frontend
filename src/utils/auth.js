// ============================================================
// 认证信息本地存储工具
// 统一管理访问令牌 / 刷新令牌 / 过期时间 / 用户信息
// 作为令牌的唯一数据源，供请求拦截器与状态管理读取
// ============================================================

const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const EXPIRES_TIME_KEY = 'expires_time'
const USER_INFO_KEY = 'user_info'

// 角色标识 -> 中文名称
export const ROLE_LABELS = {
  RESIDENT: '居民',
  STAFF: '社区工作人员',
  ADMIN: '管理员'
}

// 统一角色大小写（接口返回可能是 resident / RESIDENT）
export function normalizeRole(role) {
  return (role || '').toUpperCase()
}

export function getRoleLabel(role) {
  return ROLE_LABELS[normalizeRole(role)] || '用户'
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || ''
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || ''
}

export function getExpiresTime() {
  return localStorage.getItem(EXPIRES_TIME_KEY) || ''
}

// 保存令牌及过期时间
export function setTokens({ accessToken, refreshToken, expiresTime } = {}) {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  if (expiresTime) localStorage.setItem(EXPIRES_TIME_KEY, expiresTime)
}

export function getUserInfo() {
  const raw = localStorage.getItem(USER_INFO_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setUserInfo(info) {
  if (info) localStorage.setItem(USER_INFO_KEY, JSON.stringify(info))
}

// 清空全部认证信息
export function clearAuth() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(EXPIRES_TIME_KEY)
  localStorage.removeItem(USER_INFO_KEY)
}
