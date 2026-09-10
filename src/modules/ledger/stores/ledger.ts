import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ledgerApi } from '@/shared/api'
import type { TransactionDto } from '@/shared/api'
import type { Book, Category, DailyTotal, RangeStats, Transaction, TxType } from '../types'

/**
 * 记账本数据源:books/categories/transactions 全部来自后端 API,
 * CRUD 调 API 成功后本地同步;报表聚合(monthStats/dailyTotals/…)仍是客户端计算。
 */
export const useLedgerStore = defineStore('ledger', () => {
  const transactions = ref<Transaction[]>([])
  const books = ref<Book[]>([])
  const currentBookId = ref('')
  /* loaded:首次加载完成(为 false 时视图可显示空态而非误导性的"无记录") */
  const loaded = ref(false)
  const loading = ref(false)
  /* 分类(预置+我的自定义,后端返回根分类带子分类) */
  const categories = ref<Record<TxType, Category[]>>({ expense: [], income: [] })

  /** 服务端 DTO → 前端 Transaction(note null 归一为 undefined,类型兼容) */
function normalizeTx(t: TransactionDto): Transaction {
  return { ...t, note: t.note ?? undefined }
}

/** 拉取全部基础数据(登录后/进入应用时调用一次) */
  async function init() {
    if (loading.value) return
    loading.value = true
    try {
      const [bookList, expenseCats, incomeCats] = await Promise.all([
        ledgerApi.listBooks(),
        ledgerApi.listCategories('expense'),
        ledgerApi.listCategories('income'),
      ])
      books.value = bookList
      categories.value = { expense: expenseCats, income: incomeCats }
      /* 当前账本:优先默认账本,否则第一本 */
      if (!currentBookId.value || !bookList.some((b) => b.id === currentBookId.value)) {
        currentBookId.value = bookList.find((b) => b.isDefault)?.id || bookList[0]?.id || ''
      }
      /* 流水:当前账本全量(个人量级,聚合留前端) */
      if (currentBookId.value) {
        transactions.value = (await ledgerApi.listTransactions({ bookId: currentBookId.value })).map(normalizeTx)
      }
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  /* 新增自定义分类(后端去重),成功后返回新分类 id */
  async function addCustomCategory(type: TxType, name: string, icon: string): Promise<string> {
    const row = await ledgerApi.createCategory({ type, name, icon: icon || '🏷️' })
    categories.value[type].push({ id: row.id, name: row.name, icon: row.icon, children: [], custom: true })
    return row.id
  }
  async function removeCustomCategory(type: TxType, id: string) {
    await ledgerApi.removeCategory(id)
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

  /* 操作(API 成功后本地同步) */
  async function addTransaction(t: Omit<Transaction, 'id' | 'bookId'> & { bookId?: string }) {
    const row = await ledgerApi.createTransaction({
      type: t.type,
      amount: t.amount,
      categoryId: t.categoryId,
      date: t.date,
      note: t.note,
      bookId: t.bookId ?? currentBookId.value,
    })
    transactions.value.unshift({ ...t, bookId: row.bookId, id: row.id })
  }
  async function updateTransaction(id: string, patch: Partial<Transaction>) {
    const row = await ledgerApi.updateTransaction(id, {
      ...patch,
      categoryId: patch.categoryId,
    })
    const i = transactions.value.findIndex((t) => t.id === id)
    if (i > -1) transactions.value[i] = { ...transactions.value[i], ...patch, categoryName: row.categoryName }
  }
  async function removeTransaction(id: string) {
    await ledgerApi.removeTransaction(id)
    transactions.value = transactions.value.filter((t) => t.id !== id)
  }
  async function switchBook(id: string) {
    if (id === currentBookId.value) return
    currentBookId.value = id
    /* 切账本重拉该账本流水 */
    transactions.value = (await ledgerApi.listTransactions({ bookId: id })).map(normalizeTx)
  }
  async function addBook(b: { name: string; icon: string }) {
    const row = await ledgerApi.createBook(b)
    books.value.push({ ...b, id: row.id, monthExpense: 0, isDefault: false })
  }

  const currentBook = computed(() =>
    books.value.find((b) => b.id === currentBookId.value)
  )

  return {
    transactions, books, categories, loaded, loading,
    currentBookId, currentBook, bookTransactions, groupedByDay,
    monthStats, rangeStats, dailyTotals, categoryStats,
    init, addTransaction, updateTransaction, removeTransaction,
    switchBook, addBook, addCustomCategory, removeCustomCategory,
  }
})
