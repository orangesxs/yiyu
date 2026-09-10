import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { SystemUser, AdminLog, UserRole, UserStatus } from '../types'
import { initialSystemUsers } from '../mock/users'
import { initialLogs } from '../mock/logs'

export const useAdminStore = defineStore('admin', () => {
  const users = ref<SystemUser[]>(initialSystemUsers())
  const logs = ref<AdminLog[]>(initialLogs())

  const userCount = computed(() => users.value.length)
  const adminCount = computed(() => users.value.filter((u) => u.role === 'admin').length)
  const activeCount = computed(() => users.value.filter((u) => u.status === 'active').length)
  const disabledCount = computed(() => users.value.filter((u) => u.status === 'disabled').length)

  /** 按 id 找系统用户(供日志列表显示操作人昵称/头像) */
  function userById(id: string): SystemUser | null {
    return users.value.find((u) => u.id === id) || null
  }

  /** mock 简化:直接生成 u + 时间戳,与全站 ID 惯例一致 */
  function addUser(u: { username: string; name: string; avatar: string; role: UserRole }) {
    users.value.unshift({
      ...u,
      id: 'u' + Date.now(),
      status: 'active',
      registeredAt: '2026-09-07',
      lastActiveAt: '2026-09-07 21:36',
    })
  }

  function setUserRole(id: string, role: UserRole) {
    const u = users.value.find((x) => x.id === id)
    if (u) u.role = role
  }

  function setUserStatus(id: string, status: UserStatus) {
    const u = users.value.find((x) => x.id === id)
    if (u) u.status = status
  }

  /** 日志总数(列表已按时间倒序存储) */
  const logCount = computed(() => logs.value.length)
  const logTodayCount = computed(() => logs.value.filter((l) => l.time.startsWith('2026-09-07')).length)
  const logSecurityCount = computed(() => logs.value.filter((l) => l.action === 'security').length)

  /** 最新 n 条日志(概览页「最近操作」) */
  function latestLogs(n: number): AdminLog[] {
    return logs.value.slice(0, n)
  }

  /** 近 7 日(09-01 ~ 09-07)每日日志条数,供概览页趋势柱状图 */
  const logCountByDay = computed<{ label: string; count: number }[]>(() => {
    const days: { label: string; count: number }[] = []
    for (let d = 1; d <= 7; d++) {
      const key = `2026-09-0${d}`
      days.push({ label: `9/${d}`, count: logs.value.filter((l) => l.time.startsWith(key)).length })
    }
    return days
  })

  return {
    users, logs,
    userCount, adminCount, activeCount, disabledCount,
    userById, addUser, setUserRole, setUserStatus,
    logCount, logTodayCount, logSecurityCount, latestLogs, logCountByDay,
  }
})
