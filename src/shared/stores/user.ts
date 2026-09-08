import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User } from '../types/common'

const USER_KEY = 'yiyu-user'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(normalize(JSON.parse(localStorage.getItem(USER_KEY) || 'null')))

  function normalize(u: User | null): User | null {
    // 旧登录态无 id,补默认 u1(mock 成员安)
    return u && !u.id ? { ...u, id: 'u1' } : u
  }

  function login({ username, nickname }: { username: string; nickname?: string }) {
    user.value = { id: 'u1', username, nickname: nickname || username, avatar: user.value?.avatar }
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

  return { user, login, logout, updateProfile }
})
