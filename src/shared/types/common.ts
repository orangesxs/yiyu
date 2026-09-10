/** 通用时间字符串,格式 YYYY-MM-DD HH:mm(排序直接用字符串比较) */
export type DateTimeStr = string

/** 报表/广场共用的 mock 基准日(2026-09-07 周一)。mock 流水锚定此日期,用 new Date() 会与数据错位 */
export const mockToday = new Date(2026, 8, 7)

/**
 * 用户操作时间戳(新建笔记/记一笔的默认时间):日期锚定 mockToday,
 * 时分取真实时钟,保证 YYYY-MM-DD HH:mm 格式且与 mock 数据同日不漂移
 */
export function mockNowStr(): DateTimeStr {
  const d = new Date()
  const p = (n: number) => (n < 10 ? '0' + n : '' + n)
  return `${mockToday.getFullYear()}-${p(mockToday.getMonth() + 1)}-${p(mockToday.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/** 全局用户角色(mock 阶段登录即 admin,真实角色体系见 docs/后台管理/需求设计.md §7) */
export type UserRole = 'admin' | 'user'

/** 当前登录用户 */
export interface User {
  id: string
  username: string
  nickname: string
  /** 头像 emoji(可选,兼容旧登录态;缺省按 🧑‍💻 展示) */
  avatar?: string
  /** 全局角色(可选,兼容旧登录态;缺省视为普通用户) */
  role?: UserRole
}
