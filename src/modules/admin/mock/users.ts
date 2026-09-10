import type { SystemUser } from '../types'

/**
 * 系统用户目录 mock(u1~u7)。
 * u5 老周预置停用,供状态筛选演示。
 */
export function initialSystemUsers(): SystemUser[] {
  return [
    { id: 'u1', username: 'an', name: '安', avatar: '🧑‍💻', role: 'admin', status: 'active', registeredAt: '2026-05-04', lastActiveAt: '2026-09-07 21:36' },
    { id: 'u2', username: 'xiaolin', name: '小林', avatar: '👩', role: 'user', status: 'active', registeredAt: '2026-05-18', lastActiveAt: '2026-09-07 19:02' },
    { id: 'u3', username: 'mama', name: '妈妈', avatar: '👩‍🦳', role: 'user', status: 'active', registeredAt: '2026-06-01', lastActiveAt: '2026-09-06 20:15' },
    { id: 'u4', username: 'biaomei', name: '表妹', avatar: '👧', role: 'user', status: 'active', registeredAt: '2026-06-20', lastActiveAt: '2026-09-04 12:48' },
    { id: 'u5', username: 'laozhou', name: '老周', avatar: '🧔', role: 'user', status: 'disabled', registeredAt: '2026-07-02', lastActiveAt: '2026-08-11 09:30' },
    { id: 'u6', username: 'ajun', name: '阿俊', avatar: '👨‍🎤', role: 'user', status: 'active', registeredAt: '2026-08-15', lastActiveAt: '2026-09-05 21:20' },
    { id: 'u7', username: 'aze', name: '阿泽', avatar: '👨‍🎤', role: 'user', status: 'active', registeredAt: '2026-08-30', lastActiveAt: '2026-09-02 18:44' },
  ]
}
