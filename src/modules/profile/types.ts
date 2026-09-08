import type { DateTimeStr } from '../../shared/types/common'

/** 性别(保密为默认值) */
export type Gender = 'secret' | 'male' | 'female'

/** 头像 emoji 固定候选(12 选 1,不做图片上传) */
export const avatarOptions = ['🧑‍💻', '👩', '👨‍🦰', '👩‍🦳', '🧕', '🐱', '🐰', '🦊', '🐻', '🌻', '☘️', '🌙'] as const

/** 个人档案(yiyu-user 登录态的扩展;昵称/头像持久化,其余刷新重置) */
export interface Profile {
  id: string
  username: string
  nickname: string
  avatar: string
  bio: string
  gender: Gender
  /** YYYY-MM-DD,空串表示未填写 */
  birthday: string
  region: string
  updatedAt: DateTimeStr
}

/** 好友添加来源 */
export type FriendSource = 'book' | 'search' | 'request'

/** 好友(与账本成员同一 ID 空间) */
export interface Friend {
  id: string
  name: string
  avatar: string
  /** 备注名,空串表示未设置;展示优先级 remark > name */
  remark: string
  source: FriendSource
  addedAt: DateTimeStr
}

/** 待处理好友申请 */
export interface PendingRequest {
  id: string
  name: string
  avatar: string
  /** 申请语 */
  message: string
  /** 申请时间 */
  createdAt: DateTimeStr
}

/** 可添加用户池(搜索用,username 为搜索键) */
export interface CandidateUser {
  id: string
  username: string
  name: string
  avatar: string
}

/** 来源展示文案 */
export const sourceLabels: Record<FriendSource, string> = {
  book: '账本协同',
  search: '搜索添加',
  request: '他人申请',
}
