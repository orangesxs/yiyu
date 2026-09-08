import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** 应用壳菜单归属:ledger 记账本 / notes 记事本 / profile 个人中心 */
    app?: 'ledger' | 'notes' | 'profile'
    /** 页面标题(document.title) */
    title?: string
    /** 是否需要登录态 */
    requiresAuth?: boolean
  }
}

export {}
