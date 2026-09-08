import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { candidateUsers, initialFriends, initialPendingRequests, initialProfile } from '../mock/profile'
import type { CandidateUser, Friend, Profile } from '../types'
import { useUserStore } from '../../../shared/stores/user'

/**
 * 个人中心:全站共享的用户档案与好友关系唯一数据源。
 * 子应用不得自建用户资料副本;展示成员时优先 friendById 解析。
 */
export const useProfileStore = defineStore('profile', () => {
  const userStore = useUserStore()

  const profile = ref<Profile>(initialProfile())
  const friends = ref<Friend[]>(initialFriends())
  const pendingRequests = ref(initialPendingRequests())

  /* ---- 档案 ---- */

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

  /* ---- 好友 ---- */

  const friendCount = computed(() => friends.value.length)

  /** 按 id 解析好友;展示名 remark > name,未收录返回 null(调用方 fallback 到 ledger members) */
  function friendById(id: string): (Friend & { displayName: string }) | null {
    const f = friends.value.find((x) => x.id === id)
    return f ? { ...f, displayName: f.remark || f.name } : null
  }

  /** 搜索候选:过滤已是好友或已在待处理申请中的用户 */
  function searchCandidates(keyword: string): (CandidateUser & { disabled: boolean })[] {
    const kw = keyword.trim().toLowerCase()
    if (!kw) return []
    return candidateUsers
      .filter((c) => c.username.includes(kw) || c.name.includes(kw))
      .map((c) => ({
        ...c,
        disabled: friends.value.some((f) => f.id === c.id) || pendingRequests.value.some((r) => r.id === c.id),
      }))
  }

  /** mock 简化:发送申请即通过,即时入列 */
  function addFriend(c: CandidateUser) {
    friends.value.push({ id: c.id, name: c.name, avatar: c.avatar, remark: '', source: 'search', addedAt: '2026-09-07 09:00' })
  }

  /** 接受申请(source: request) */
  function acceptRequest(r: (typeof pendingRequests.value)[number]) {
    friends.value.push({ id: r.id, name: r.name, avatar: r.avatar, remark: '', source: 'request', addedAt: '2026-09-07 09:00' })
    pendingRequests.value = pendingRequests.value.filter((x) => x.id !== r.id)
  }

  function rejectRequest(id: string) {
    pendingRequests.value = pendingRequests.value.filter((x) => x.id !== id)
  }

  function updateRemark(id: string, remark: string) {
    const f = friends.value.find((x) => x.id === id)
    if (f) f.remark = remark
  }

  /** 删除好友:不移出其已参与的账本,历史流水保留 */
  function removeFriend(id: string) {
    friends.value = friends.value.filter((x) => x.id !== id)
  }

  return {
    profile, friends, pendingRequests, friendCount,
    updateProfile, friendById, searchCandidates, addFriend,
    acceptRequest, rejectRequest, updateRemark, removeFriend,
  }
})
