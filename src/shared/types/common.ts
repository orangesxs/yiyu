/** 通用时间字符串,格式 YYYY-MM-DD HH:mm(排序直接用字符串比较) */
export type DateTimeStr = string

/** 报表/广场共用的 mock 基准日(2026-09-07 周一)。mock 流水锚定此日期,用 new Date() 会与数据错位 */
export const mockToday = new Date(2026, 8, 7)

/** 当前登录用户 */
export interface User {
  id: string
  username: string
  nickname: string
  /** 头像 emoji(可选,兼容旧登录态;缺省按 🧑‍💻 展示) */
  avatar?: string
}
