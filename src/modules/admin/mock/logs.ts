import type { AdminLog } from '../types'

/**
 * 系统日志 mock(纯预置,约 21 条):覆盖 2026-09-01 ~ 09-07(mockToday)、
 * 多位操作人、全部模块与类型,保证筛选与概览页 7 日趋势图都有数据。刷新重置。
 */
export function initialLogs(): AdminLog[] {
  const raw: Omit<AdminLog, 'id'>[] = [
    // 09-07(mockToday)
    { time: '2026-09-07 21:36', moduleId: 'auth', action: 'login', operatorId: 'u1', summary: '「安」登录了一隅' },
    { time: '2026-09-07 21:40', moduleId: 'ledger', action: 'create', operatorId: 'u1', summary: '记了一笔支出「早餐 · ¥9.00」' },
    { time: '2026-09-07 19:05', moduleId: 'ledger', action: 'update', operatorId: 'u2', summary: '修改了流水「地铁通勤」的金额' },
    { time: '2026-09-07 10:31', moduleId: 'ledger', action: 'create', operatorId: 'u3', summary: '记了一笔支出「农贸市场 · ¥68.50」' },
    { time: '2026-09-07 09:02', moduleId: 'profile', action: 'update', operatorId: 'u2', summary: '更新了个性签名' },
    // 09-06
    { time: '2026-09-06 22:18', moduleId: 'auth', action: 'login', operatorId: 'u3', summary: '「妈妈」登录了一隅' },
    { time: '2026-09-06 20:15', moduleId: 'ledger', action: 'delete', operatorId: 'u3', summary: '删除了一笔重复记的支出' },
    { time: '2026-09-06 14:26', moduleId: 'ledger', action: 'create', operatorId: 'u1', summary: '在旅行基金记了一笔收入「退款 ¥320.00」' },
    // 09-05
    { time: '2026-09-05 21:20', moduleId: 'auth', action: 'login', operatorId: 'u6', summary: '「阿俊」首次登录了一隅' },
    { time: '2026-09-05 16:40', moduleId: 'ledger', action: 'update', operatorId: 'u1', summary: '调整了「小林」在装修账的角色' },
    // 09-04
    { time: '2026-09-04 20:55', moduleId: 'auth', action: 'login', operatorId: 'u1', summary: '「安」登录了一隅' },
    { time: '2026-09-04 19:30', moduleId: 'ledger', action: 'create', operatorId: 'u2', summary: '记了一笔收入「兼职结算 ¥1,200.00」' },
    { time: '2026-09-04 12:48', moduleId: 'profile', action: 'update', operatorId: 'u4', summary: '更换了头像' },
    // 09-03
    { time: '2026-09-03 23:05', moduleId: 'admin', action: 'security', operatorId: 'u1', summary: '管理员停用了「老周」的账号' },
    { time: '2026-09-03 17:22', moduleId: 'ledger', action: 'create', operatorId: 'u1', summary: '新建了账本「宠物开支」' },
    { time: '2026-09-03 09:15', moduleId: 'auth', action: 'login', operatorId: 'u4', summary: '「表妹」登录了一隅' },
    // 09-02
    { time: '2026-09-02 18:44', moduleId: 'auth', action: 'login', operatorId: 'u7', summary: '「阿泽」登录了一隅' },
    { time: '2026-09-02 15:08', moduleId: 'ledger', action: 'update', operatorId: 'u1', summary: '重命名了账本「日常」为「日常开支」' },
    // 09-01
    { time: '2026-09-01 22:40', moduleId: 'admin', action: 'update', operatorId: 'u1', summary: '管理员把「小林」降为普通用户' },
    { time: '2026-09-01 20:12', moduleId: 'auth', action: 'login', operatorId: 'u1', summary: '「安」登录了一隅' },
    { time: '2026-09-01 09:30', moduleId: 'admin', action: 'security', operatorId: 'u1', summary: '管理员新增了用户「阿泽」' },
  ]
  // 原始数组已按时间新→旧排列,直接用作倒序列表
  return raw.map((r, i) => ({ ...r, id: `log-${String(i + 1).padStart(3, '0')}` }))
}
