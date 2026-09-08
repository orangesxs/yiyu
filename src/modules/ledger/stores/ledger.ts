import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  generateTransactions, expenseCategories, incomeCategories,
  accounts as mockAccounts, books as mockBooks, members,
} from '../mock/ledger'
import type { Book, Category, DailyTotal, RangeStats, Transaction, TxType } from '../types'

export const useLedgerStore = defineStore('ledger', () => {
  const transactions = ref<Transaction[]>(generateTransactions())
  const accounts = ref(mockAccounts.map((a) => ({ ...a })))
  const books = ref<Book[]>(mockBooks.map((b) => ({ ...b })))
  const currentBookId = ref('b1')
  /* 分类(响应式,支持自定义新增) */
  const categories = ref<Record<TxType, Category[]>>({
    expense: JSON.parse(JSON.stringify(expenseCategories)),
    income: JSON.parse(JSON.stringify(incomeCategories)),
  })

  /* 新增自定义分类(同名去重),返回新分类 id */
  function addCustomCategory(type: TxType, name: string, icon: string): string {
    const pool = categories.value[type]
    const id = 'custom-' + type + '-' + Date.now()
    pool.push({ id, name, icon: icon || '🏷️', children: [], custom: true })
    return id
  }
  function removeCustomCategory(type: TxType, id: string) {
    const pool = categories.value[type]
    const i = pool.findIndex((c) => c.id === id)
    if (i > -1 && pool[i].custom) pool.splice(i, 1)
  }

  /* 当前账本流水 */
  const bookTransactions = computed(() =>
    transactions.value.filter((t) => t.bookId === currentBookId.value)
  )

  /* 月度统计 */
  function monthStats(ym: string): RangeStats {
    return rangeStats((t) => t.date.startsWith(ym))
  }

  /* 通用区间统计(报表 周/月/年 用) */
  function rangeStats(matchFn: (t: Transaction) => boolean): RangeStats {
    const list = bookTransactions.value.filter(matchFn)
    const income = list.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expense = list.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    return { income, expense, balance: income - expense, count: list.length }
  }

  /* 按日聚合(报表 周/月 趋势用):返回 [{key:'09-01', income, expense}] */
  function dailyTotals(fromYmd: string, toYmd: string): DailyTotal[] {
    const map: Record<string, { key: string; income: number; expense: number }> = {}
    for (const t of bookTransactions.value) {
      const d = t.date.slice(0, 10)
      if (d < fromYmd || d > toYmd) continue
      if (!map[d]) map[d] = { key: d.slice(5), income: 0, expense: 0 }
      if (t.type === 'income') map[d].income += t.amount
      if (t.type === 'expense') map[d].expense += t.amount
    }
    return Object.keys(map).sort().map((k) => ({
      key: map[k].key,
      income: +map[k].income.toFixed(2),
      expense: +map[k].expense.toFixed(2),
    }))
  }

  /* 按天分组 */
  interface DayGroup { day: string; items: Transaction[]; expense: number; income: number }
  const groupedByDay = computed<DayGroup[]>(() => {
    const groups: DayGroup[] = []
    let cur: DayGroup | null = null
    for (const t of bookTransactions.value) {
      const day = t.date.slice(0, 10)
      if (!cur || cur.day !== day) {
        cur = { day, items: [], expense: 0, income: 0 }
        groups.push(cur)
      }
      cur.items.push(t)
      if (t.type === 'expense') cur.expense += t.amount
      else cur.income += t.amount
    }
    return groups
  })

  /* 账户余额 = 期初 + 收 − 支 */
  const accountBalances = computed<Record<string, number>>(() => {
    const map: Record<string, number> = {}
    for (const a of accounts.value) map[a.id] = a.initial
    for (const t of transactions.value) {
      if (t.type === 'income') map[t.accountId] += t.amount
      if (t.type === 'expense') map[t.accountId] -= t.amount
    }
    return map
  })

  /* 分类统计(报表用,某月某类型) */
  function categoryStats(ym: string, type: TxType = 'expense') {
    const list = bookTransactions.value.filter(
      (t) => t.date.startsWith(ym) && t.type === type
    )
    const byRoot: Record<string, number> = {}
    for (const t of list) {
      const root = categories.value[type].find((c) =>
        c.children.some((ch) => ch.id === t.categoryId) || c.id === t.categoryId
      )
      const name = root ? root.name : t.categoryName
      byRoot[name] = (byRoot[name] || 0) + t.amount
    }
    return Object.entries(byRoot)
      .map(([name, value]) => ({ name, value: +value.toFixed(2) }))
      .sort((a, b) => b.value - a.value)
  }

  /* 操作 */
  function addTransaction(t: Omit<Transaction, 'id' | 'bookId'> & { bookId?: string }) {
    transactions.value.unshift({
      id: 't' + Date.now(),
      bookId: t.bookId ?? currentBookId.value,
      ...t,
    })
  }
  function updateTransaction(id: string, patch: Partial<Transaction>) {
    const i = transactions.value.findIndex((t) => t.id === id)
    if (i > -1) transactions.value[i] = { ...transactions.value[i], ...patch }
  }
  function removeTransaction(id: string) {
    transactions.value = transactions.value.filter((t) => t.id !== id)
  }
  function switchBook(id: string) {
    currentBookId.value = id
  }
  function addBook(b: { name: string; icon: string }) {
    books.value.push({ ...b, id: 'b' + Date.now(), monthExpense: 0, isDefault: false, memberIds: ['u1'] })
  }

  /* 从好友邀请入账本:memberIds 与 members 平铺数组都要写,否则成员列表不渲染、角色不可改 */
  function addMembers(bookId: string, friends: { id: string; name: string; avatar: string }[]) {
    const book = books.value.find((b) => b.id === bookId)
    if (!book) return
    for (const f of friends) {
      if (!book.memberIds.includes(f.id)) book.memberIds.push(f.id)
      if (!members.some((m) => m.id === f.id)) members.push({ id: f.id, name: f.name, avatar: f.avatar, role: 'member' })
    }
  }

  const currentBook = computed(() =>
    books.value.find((b) => b.id === currentBookId.value)
  )

  return {
    transactions, accounts, books, members, categories,
    currentBookId, currentBook, bookTransactions, groupedByDay, accountBalances,
    monthStats, rangeStats, dailyTotals, categoryStats,
    addTransaction, updateTransaction, removeTransaction,
    switchBook, addBook, addMembers, addCustomCategory, removeCustomCategory,
  }
})
