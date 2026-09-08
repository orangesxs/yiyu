import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  generateTransactions, expenseCategories, incomeCategories,
  accounts as mockAccounts, books as mockBooks, members,
} from "../mock/ledger";

export const useLedgerStore = defineStore("ledger", () => {
  const transactions = ref(generateTransactions());
  const accounts = ref(mockAccounts.map((a) => ({ ...a })));
  const books = ref(mockBooks.map((b) => ({ ...b })));
  const currentBookId = ref("b1");
  /* 分类（响应式，支持自定义新增） */
  const categories = ref({
    expense: JSON.parse(JSON.stringify(expenseCategories)),
    income: JSON.parse(JSON.stringify(incomeCategories)),
  });

  /* 新增自定义分类（同名去重），返回新分类 id */
  function addCustomCategory(type, name, icon) {
    const pool = categories.value[type];
    const id = "custom-" + type + "-" + Date.now();
    pool.push({ id, name, icon: icon || "🏷️", children: [], custom: true });
    return id;
  }
  function removeCustomCategory(type, id) {
    const pool = categories.value[type];
    const i = pool.findIndex((c) => c.id === id);
    if (i > -1 && pool[i].custom) pool.splice(i, 1);
  }

  /* 当前账本流水 */
  const bookTransactions = computed(() =>
    transactions.value.filter((t) => t.bookId === currentBookId.value)
  );

  /* 月度统计 */
  function monthStats(ym) {
    return rangeStats((t) => t.date.startsWith(ym));
  }

  /* 通用区间统计（报表 周/月/年 用） */
  function rangeStats(matchFn) {
    const list = bookTransactions.value.filter(matchFn);
    const income = list.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = list.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense, count: list.length };
  }

  /* 按日聚合（报表 周/月 趋势用）：返回 [{key:'09-01', income, expense}] */
  function dailyTotals(fromYmd, toYmd) {
    const map = {};
    for (const t of bookTransactions.value) {
      const d = t.date.slice(0, 10);
      if (d < fromYmd || d > toYmd) continue;
      if (!map[d]) map[d] = { key: d.slice(5), income: 0, expense: 0 };
      if (t.type === "income") map[d].income += t.amount;
      if (t.type === "expense") map[d].expense += t.amount;
    }
    return Object.keys(map).sort().map((k) => ({
      key: map[k].key,
      income: +map[k].income.toFixed(2),
      expense: +map[k].expense.toFixed(2),
    }));
  }

  /* 按天分组 */
  const groupedByDay = computed(() => {
    const groups = [];
    let cur = null;
    for (const t of bookTransactions.value) {
      const day = t.date.slice(0, 10);
      if (!cur || cur.day !== day) {
        cur = { day, items: [], expense: 0, income: 0 };
        groups.push(cur);
      }
      cur.items.push(t);
      if (t.type === "expense") cur.expense += t.amount;
      else cur.income += t.amount;
    }
    return groups;
  });

  /* 账户余额 = 期初 + 收 − 支 */
  const accountBalances = computed(() => {
    const map = {};
    for (const a of accounts.value) map[a.id] = a.initial;
    for (const t of transactions.value) {
      if (t.type === "income") map[t.accountId] += t.amount;
      if (t.type === "expense") map[t.accountId] -= t.amount;
    }
    return map;
  });

  /* 分类统计（报表用，某月某类型） */
  function categoryStats(ym, type = "expense") {
    const list = bookTransactions.value.filter(
      (t) => t.date.startsWith(ym) && t.type === type
    );
    const byRoot = {};
    for (const t of list) {
      const root = categories.value[type].find((c) =>
        c.children.some((ch) => ch.id === t.categoryId) || c.id === t.categoryId
      );
      const name = root ? root.name : t.categoryName;
      byRoot[name] = (byRoot[name] || 0) + t.amount;
    }
    return Object.entries(byRoot)
      .map(([name, value]) => ({ name, value: +value.toFixed(2) }))
      .sort((a, b) => b.value - a.value);
  }

  /* 操作 */
  function addTransaction(t) {
    transactions.value.unshift({
      id: "t" + Date.now(),
      bookId: currentBookId.value,
      date: t.date,
      ...t,
    });
  }
  function updateTransaction(id, patch) {
    const i = transactions.value.findIndex((t) => t.id === id);
    if (i > -1) transactions.value[i] = { ...transactions.value[i], ...patch };
  }
  function removeTransaction(id) {
    transactions.value = transactions.value.filter((t) => t.id !== id);
  }
  function switchBook(id) {
    currentBookId.value = id;
  }
  function addBook(b) {
    books.value.push({ ...b, id: "b" + Date.now(), monthExpense: 0, isDefault: false, memberIds: ["u1"] });
  }
  function transfer({ fromId, toId, amount, fee }) {
    transactions.value.unshift({
      id: "t" + Date.now(), type: "transfer", amount,
      categoryId: "transfer", categoryName: "转账",
      accountId: fromId, toAccountId: toId,
      fee, memberId: "u1",
      date: fmt(new Date()), note: `${nameOf(fromId)} → ${nameOf(toId)}`,
      bookId: currentBookId.value,
    });
  }
  function nameOf(id) {
    return accounts.value.find((a) => a.id === id)?.name || id;
  }

  const currentBook = computed(() =>
    books.value.find((b) => b.id === currentBookId.value)
  );

  return {
    transactions, accounts, books, members, categories,
    currentBookId, currentBook, bookTransactions, groupedByDay, accountBalances,
    monthStats, rangeStats, dailyTotals, categoryStats,
    addTransaction, updateTransaction, removeTransaction,
    switchBook, addBook, transfer, addCustomCategory, removeCustomCategory,
  };
});

function pad(n) { return n < 10 ? "0" + n : "" + n; }
function fmt(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`; }
