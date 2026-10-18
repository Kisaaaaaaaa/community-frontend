import request from '@/utils/request'

// 4.1.5 获取当前用户信息（全部角色）
// 返回：{ userId, username, realName, phone(脱敏), role, status, address, registerTime }
export function getProfile() {
  return request({
    url: '/users/me',
    method: 'get'
  })
}

// 4.1.6 修改个人信息（全部角色）
// data：username / realName / phone / address 任选其一或多项
export function updateProfile(data) {
  return request({
    url: '/users/me',
    method: 'put',
    data
  })
}

// 4.1.7 用户管理列表（仅 ADMIN）
// params：keyword / role / status / page / pageSize
// 返回：{ list, total, page, pageSize, pages }
export function getAdminUserList(params) {
  return request({
    url: '/admin/users',
    method: 'get',
    params
  })
}

// 4.1.8 用户启禁用、审核与角色变更（仅 ADMIN）
// PUT /admin/users/{userId}
// data：{ status?, role? } 至少传一项
//   status：0=禁用 1=正常 2=待审核；role：resident/staff/admin
export function updateAdminUser(userId, data) {
  return request({
    url: `/admin/users/${userId}`,
    method: 'put',
    data
  })
}

// 修改密码（全部角色）
// data：{ oldPassword, newPassword }
// 成功后服务端立即作废当前访问令牌，前端需强制重新登录
export function changePassword(data) {
  return request({
    url: '/users/password',
    method: 'put',
    data
  })
}
