import { defineStore } from 'pinia'
import { ref } from 'vue'
import { initialProfile } from '../mock/profile'
import type { Profile } from '../types'
import { useUserStore } from '@/shared/stores/user'

/**
 * 个人中心:全站共享的用户档案唯一数据源。
 * 子应用不得自建用户资料副本。
 */
export const useProfileStore = defineStore('profile', () => {
  const userStore = useUserStore()

  const profile = ref<Profile>(initialProfile())

  /** 保存档案:昵称/头像同步写回 yiyu-user(持久化),其余仅内存 */
  function updateProfile(patch: Partial<Omit<Profile, 'id' | 'username'>>) {
    profile.value = { ...profile.value, ...patch, updatedAt: '2026-09-07 09:00' }
    if (patch.nickname !== undefined || patch.avatar !== undefined) {
      userStore.updateProfile({
        nickname: profile.value.nickname,
        ...(patch.avatar !== undefined ? { avatar: profile.value.avatar } : {}),
      })
    }
  }

  return { profile, updateProfile }
})
