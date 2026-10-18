import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  login as loginApi,
  logout as logoutApi,
  register as registerApi
} from '@/api/auth'
import {
  clearAuth,
  getAccessToken,
  getRefreshToken,
  getRoleLabel,
  getUserInfo as readUserInfo,
  normalizeRole,
  setTokens,
  setUserInfo as persistUserInfo
} from '@/utils/auth'

/**
 * 用户状态管理
 * 负责登录、注册、退出登录，并维护当前用户信息与令牌
 */
export const useUserStore = defineStore('user', () => {
  // 初始化时从本地存储恢复登录状态
  const accessToken = ref(getAccessToken())
  const refreshToken = ref(getRefreshToken())
  const userInfo = ref(readUserInfo())

  const isLoggedIn = computed(() => !!accessToken.value)
  const role = computed(() => normalizeRole(userInfo.value?.role))
  const realName = computed(() => userInfo.value?.realName || '')

  // 写入认证信息（登录成功 / 刷新令牌后调用）
  function applyAuth(data = {}) {
    if (data.accessToken) {
      accessToken.value = data.accessToken
      refreshToken.value = data.refreshToken
      setTokens(data)
    }
    // 仅当返回用户信息时更新（刷新令牌接口不返回）
    if (data.userId !== undefined) {
      userInfo.value = {
        userId: data.userId,
        username: data.username,
        role: normalizeRole(data.role),
        realName: data.realName,
        status: data.status
      }
      persistUserInfo(userInfo.value)
    }
  }

  // 重置为未登录状态
  function resetAuth() {
    accessToken.value = ''
    refreshToken.value = ''
    userInfo.value = null
    clearAuth()
  }

  // 登录
  async function login(payload) {
    const data = await loginApi(payload)
    applyAuth(data)
    return data
  }

  // 退出登录：先通知服务端失效令牌，再清理本地状态
  async function logout() {
    try {
      await logoutApi()
    } catch {
      // 服务端取消失败时仍清理本地登录状态
    }
    resetAuth()
  }

  // 注册（居民直接激活，工作人员待审核）
  async function register(payload) {
    return registerApi(payload)
  }

  return {
    accessToken,
    refreshToken,
    userInfo,
    isLoggedIn,
    role,
    realName,
    roleLabel: computed(() => getRoleLabel(role.value)),
    applyAuth,
    resetAuth,
    login,
    logout,
    register
  }
})
