/* 待办提醒 mock 数据 */
/* status: todo 待开始 / doing 进行中 / done 已完成 / overdue 已逾期 / cancelled 已取消 */

import type { Todo } from '../types'

export const todos: Todo[] = [
  { id: 'td1', title: '完成原型评审意见修改', note: '重点:报表页的时间段切换交互', start: '2026-09-07 14:00', end: '2026-09-07 16:00', status: 'doing', priority: 'high', remind: '2026-09-07 13:45', doneAt: null, createdAt: '2026-09-05' },
  { id: 'td2', title: '给客户发周报', note: '', start: '2026-09-07 18:00', end: '2026-09-07 18:30', status: 'todo', priority: 'mid', remind: '2026-09-07 17:50', doneAt: null, createdAt: '2026-09-06' },
  { id: 'td3', title: '买打印机墨盒', note: '京东自营,看下有没有满减', start: '2026-09-08 09:00', end: '2026-09-08 10:00', status: 'todo', priority: 'low', remind: null, doneAt: null, createdAt: '2026-09-06' },
  { id: 'td4', title: '预约下周三体检', note: '空腹,带身份证', start: '2026-09-09 08:00', end: '2026-09-09 08:30', status: 'todo', priority: 'mid', remind: '2026-09-08 20:00', doneAt: null, createdAt: '2026-09-04' },
  { id: 'td5', title: '提交报销单', note: '', start: '2026-09-06 10:00', end: '2026-09-06 12:00', status: 'done', priority: 'mid', remind: null, doneAt: '2026-09-06 11:20', createdAt: '2026-09-01' },
  { id: 'td6', title: '取快递', note: '菜鸟驿站 3-2-101', start: '2026-09-05 19:00', end: '2026-09-05 19:30', status: 'done', priority: 'low', remind: null, doneAt: '2026-09-05 19:10', createdAt: '2026-09-05' },
  { id: 'td7', title: '续签健身房会员', note: '年卡 2600,谈送两个月', start: '2026-09-01 10:00', end: '2026-09-01 20:00', status: 'overdue', priority: 'mid', remind: null, doneAt: null, createdAt: '2026-08-28' },
  { id: 'td8', title: '还信用卡账单', note: '招商银行 ¥4,320', start: '2026-09-03 00:00', end: '2026-09-03 23:59', status: 'overdue', priority: 'high', remind: null, doneAt: null, createdAt: '2026-08-30' },
  { id: 'td9', title: '整理书架', note: '', start: '2026-09-07 20:00', end: '2026-09-07 21:00', status: 'todo', priority: 'low', remind: null, doneAt: null, createdAt: '2026-09-07' },
  { id: 'td10', title: '回妈妈电话', note: '', start: '2026-09-07 21:00', end: '2026-09-07 21:30', status: 'todo', priority: 'high', remind: '2026-09-07 20:55', doneAt: null, createdAt: '2026-09-07' },
  { id: 'td11', title: '参加行业沙龙', note: '时间冲突,不去了', start: '2026-09-06 14:00', end: '2026-09-06 17:00', status: 'cancelled', priority: 'low', remind: null, doneAt: null, createdAt: '2026-09-04' },
]
