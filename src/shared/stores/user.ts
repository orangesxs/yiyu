import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { User } from '../types/common'

const USER_KEY = 'yiyu-user'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(normalize(JSON.parse(localStorage.getItem(USER_KEY) || 'null')))
  /** 是否管理员(后台入口与 requiresAdmin 守卫的唯一判定来源);旧登录态无 role 视为普通用户 */
  const isAdmin = computed(() => user.value?.role === 'admin')

  function normalize(u: User | null): User | null {
    // 旧登录态无 id,补默认 u1(mock 成员安)
    return u && !u.id ? { ...u, id: 'u1' } : u
  }

  function login({ username, nickname }: { username: string; nickname?: string }) {
    // mock 简化:登录即管理员,保留已选头像
    user.value = { id: 'u1', username, nickname: nickname || username, avatar: user.value?.avatar, role: 'admin' }
    localStorage.setItem(USER_KEY, JSON.stringify(user.value))
  }
  function logout() {
    user.value = null
    localStorage.removeItem(USER_KEY)
  }
  /** 只允许改昵称/头像;username 只读 */
  function updateProfile(patch: Partial<Pick<User, 'nickname' | 'avatar'>>) {
    if (!user.value) return
    user.value = { ...user.value, ...patch }
    localStorage.setItem(USER_KEY, JSON.stringify(user.value))
  }

  return { user, isAdmin, login, logout, updateProfile }
})
