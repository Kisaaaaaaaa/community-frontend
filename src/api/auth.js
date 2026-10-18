import request from '@/utils/request'

// 用户登录：居民/工作人员用手机号，管理员用工号
export function login(data) {
  return request({
    url: '/auth/login',
    method: 'post',
    data
  })
}

// 刷新访问令牌（令牌过期后换发新的访问令牌与刷新令牌）
export function refreshToken(data) {
  return request({
    url: '/auth/refresh',
    method: 'post',
    data
  })
}

// 退出登录：服务端将当前访问令牌与刷新令牌置为失效
export function logout() {
  return request({
    url: '/auth/logout',
    method: 'post'
  })
}

// 账号注册：居民与工作人员自助注册
export function register(data) {
  return request({
    url: '/users/register',
    method: 'post',
    data
  })
}
