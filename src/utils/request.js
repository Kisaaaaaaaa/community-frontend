import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import {
  clearAuth,
  getAccessToken,
  getRefreshToken,
  setTokens
} from '@/utils/auth'

// 创建 axios 实例
const service = axios.create({
  baseURL: '/api/v1', // 统一前缀，由 vite 代理转发到后端（后端挂载于 /api/v1）
  timeout: 15000
})

// 请求拦截器：携带访问令牌
service.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ============================================================
// 刷新令牌：使用刷新令牌换发新的访问令牌与刷新令牌
// 并发请求仅触发一次刷新（单飞模式），避免重复刷新
// ============================================================
let refreshPromise = null

// 与令牌相关、需要「刷新令牌或重新登录」的业务码
// 其它业务码（如 40107 原密码不正确）即使伴随 HTTP 401，也不应触发刷新或退出登录
const TOKEN_ERROR_CODES = [40101, 40102, 40106]

function refreshAccessToken() {
  const refresh = getRefreshToken()
  if (!refresh) {
    return Promise.reject(new Error('无刷新令牌'))
  }
  if (!refreshPromise) {
    // 使用原生 axios 调用，绕过拦截器避免递归
    refreshPromise = axios
      .post('/api/v1/auth/refresh', { refreshToken: refresh })
      .then(({ data }) => {
        if (data?.code !== 0 || !data?.data?.accessToken) {
          throw new Error(data?.message || '刷新令牌无效或已过期')
        }
        setTokens(data.data)
        return data.data.accessToken
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

// 强制退出：清空本地登录状态并跳转登录页
async function forceLogout(message = '登录已过期，请重新登录') {
  clearAuth()
  const { useUserStore } = await import('@/store/user')
  useUserStore().resetAuth()

  const current = router.currentRoute.value
  if (current.path !== '/login') {
    router.replace({ path: '/login', query: { redirect: current.fullPath } })
  }
  if (message) {
    ElMessage.error(message)
  }
}

// 响应拦截器：统一业务码与错误处理
service.interceptors.response.use(
  (response) => {
    const res = response.data

    // 约定 code === 0 为成功，其余为业务错误
    if (res.code !== undefined && res.code !== 0) {
      // 40106：刷新令牌无效或已过期，需重新登录
      if (res.code === 40106) {
        forceLogout('登录已过期，请重新登录')
      } else {
        ElMessage.error(res.message || '请求失败')
      }
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res.data !== undefined ? res.data : res
  },
  async (error) => {
    const { response, config } = error

    const bizCode = response?.data?.code

    // HTTP 401 但携带「非令牌类」业务码（如 40107 原密码不正确）：属于业务错误，
    // 直接提示即可，不刷新令牌、不退出登录
    if (response?.status === 401 && bizCode !== undefined && !TOKEN_ERROR_CODES.includes(bizCode)) {
      ElMessage.error(response.data?.message || '请求失败')
      return Promise.reject(error)
    }

    // HTTP 401：访问令牌过期，尝试用刷新令牌换发并重放原请求（仅重试一次）
    if (response?.status === 401 && config && !config._retry && getRefreshToken()) {
      config._retry = true
      try {
        const token = await refreshAccessToken()
        config.headers['Authorization'] = `Bearer ${token}`
        return service(config)
      } catch (e) {
        await forceLogout('登录已过期，请重新登录')
        return Promise.reject(e)
      }
    }

    // 其余 HTTP 错误
    let message = '网络异常，请稍后重试'
    if (response) {
      switch (response.status) {
        case 401:
          await forceLogout('登录已过期，请重新登录')
          return Promise.reject(error)
        case 403:
          message = '没有访问权限'
          break
        case 404:
          message = '请求的资源不存在'
          break
        case 500:
          message = '服务器内部错误'
          break
        default:
          message = response.data?.message || message
      }
    } else if (error.code === 'ECONNABORTED') {
      message = '请求超时，请检查网络'
    }
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

export default service
