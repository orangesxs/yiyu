/* 个人中心 mock 数据(锚定 mockToday 2026-09-07,不得使用 new Date()) */
import type { CandidateUser, Friend, PendingRequest, Profile } from '../types'
import { useUserStore } from '../../../shared/stores/user'

/** 初始好友:与 ledger mock 的 members 对齐,使账本邀请能直接命中 */
export function initialFriends(): Friend[] {
  return [
    { id: 'u2', name: '小林', avatar: '👩', remark: '', source: 'book', addedAt: '2026-03-12 10:24' },
    { id: 'u3', name: '妈妈', avatar: '👩‍🦳', remark: '妈', source: 'book', addedAt: '2026-01-02 19:40' },
  ]
}

/** 待处理好友申请(mock 预置 1 条) */
export function initialPendingRequests(): PendingRequest[] {
  return [
    { id: 'u6', name: '阿俊', avatar: '👨‍🎤', message: '我是阿俊,记得记账那会儿见过~,加个好友吧', createdAt: '2026-09-05 21:18' },
  ]
}

/** 可添加用户池:username 为搜索键;id 与姓名不与待处理申请的 u6 阿俊混用 */
export const candidateUsers: CandidateUser[] = [
  { id: 'u4', username: 'biaomei', name: '表妹', avatar: '👧' },
  { id: 'u5', username: 'laozhou', name: '老周', avatar: '🧔' },
  { id: 'u7', username: 'aze', name: '阿泽', avatar: '👨‍🎤' },
]

/** 初始档案:yiyu-user 登录态 + 演示资料(昵称/头像以登录态为准) */
export function initialProfile(): Profile {
  const user = useUserStore().user
  return {
    id: user?.id ?? 'u1',
    username: user?.username ?? 'an',
    nickname: user?.nickname ?? '一隅用户',
    avatar: user?.avatar ?? '🧑‍💻',
    bio: '认真记账,好好生活。',
    gender: 'secret',
    birthday: '',
    region: '',
    updatedAt: '2026-09-07 09:00',
  }
}
