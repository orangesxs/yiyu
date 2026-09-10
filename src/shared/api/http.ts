import axios from 'axios'
import { ElMessage } from 'element-plus'

/** 登录 token 的 localStorage key(与旧 yiyu-user 登录态共存期互不干扰) */
export const TOKEN_KEY = 'yiyu-token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

/**
 * 统一请求实例:
 * - baseURL:本地走 vite proxy(/api 同源);生产由 VITE_API_BASE 指向后端
 * - 自动注入 Bearer token;401 时清登录态并送回登录页(只在初始化完成后再跳)
 * - 业务错误直接 ElMessage 中文 toast,调用方拿到的 Promise 永远 reject,不必重复提示
 */
const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 15000,
})

http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let routerPush: ((path: string) => void) | null = null
/** main.ts 注入路由跳转(避免 http 层循环依赖 router) */
export function bindRouterPush(fn: (path: string) => void) {
  routerPush = fn
}

http.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const status = err.response?.status
    const message = err.response?.data?.message || '网络异常,请稍后再试'
    // 401:登录态失效(过期/被停用/被删除),清 token 回登录页;避免登录页自身 401 死循环
    if (status === 401 && !err.config?.url?.includes('/auth/login')) {
      clearToken()
      ElMessage.warning(typeof message === 'string' ? message : '请先登录')
      routerPush?.('/auth/login')
    } else if (status === 429) {
      ElMessage.warning('操作太频繁,请稍后再试')
    } else {
      ElMessage.error(typeof message === 'string' ? message : '请求失败')
    }
    return Promise.reject(err)
  },
)

/** 类型工具:拦截器已剥掉 AxiosResponse,直接给业务类型 */
export function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  return http.get(url, { params }) as Promise<T>
}
export function post<T>(url: string, data?: unknown): Promise<T> {
  return http.post(url, data) as Promise<T>
}
export function put<T>(url: string, data?: unknown): Promise<T> {
  return http.put(url, data) as Promise<T>
}
export function patch<T>(url: string, data?: unknown): Promise<T> {
  return http.patch(url, data) as Promise<T>
}
export function del<T>(url: string): Promise<T> {
  return http.delete(url) as Promise<T>
}
