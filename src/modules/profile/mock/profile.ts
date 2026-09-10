/* 个人中心 mock 数据(锚定 mockToday 2026-09-07,不得使用 new Date()) */
import type { Profile } from '../types'
import { useUserStore } from '@/shared/stores/user'

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
    joinedAt: '2026-05-04',
    updatedAt: '2026-09-07 09:00',
  }
}
