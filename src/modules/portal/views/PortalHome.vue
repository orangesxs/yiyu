<script setup lang="ts">
import { useUserStore } from '../../../shared/stores/user'
import { useLedgerStore } from '../../ledger/stores/ledger'
import { useNotesStore } from '../../notes/stores/notes'
import { useTodosStore } from '../../notes/stores/todos'
import { useProfileStore } from '../../profile/stores/profile'
import { mockToday } from '../../../shared/types/common'

const userStore = useUserStore()
const ledgerStore = useLedgerStore()
const notesStore = useNotesStore()
const todosStore = useTodosStore()
const profileStore = useProfileStore()

/* 问候 */
const hour = mockToday.getHours()
const greeting = hour < 6 ? '夜深了' : hour < 11 ? '早上好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好'
const dateText = `${mockToday.getFullYear()} 年 ${mockToday.getMonth() + 1} 月 ${mockToday.getDate()} 日 · 星期${'日一二三四五六'[mockToday.getDay()]}`
const dailyQuote = '把日子过成自己喜欢的样子,是一件值得练习的事。'

/* 应用摘要数据 */
const monthStats = ledgerStore.monthStats('2026-09')
const openTodos = todosStore.counts.todo + todosStore.counts.doing + todosStore.counts.overdue

/* 个人名片统计:参与账本数 = 当前人出现在成员中的账本 */
const joinedBooks = ledgerStore.books.filter((b) => b.memberIds.includes(profileStore.profile.id)).length

interface AppEntry { label: string; value: string; cls: string }
interface AppCard {
  key: string
  icon: string
  name: string
  sub: string
  color: string
  entries: AppEntry[]
  to: string
}

const apps: AppCard[] = [
  {
    key: 'ledger',
    icon: '💰',
    name: '记账本',
    sub: '把每一笔都记得清楚',
    color: 'var(--app-ledger)',
    entries: [
      { label: '本月支出', value: `¥ ${monthStats.expense.toFixed(0)}`, cls: 'money-out' },
      { label: '结余', value: `¥ ${monthStats.balance.toFixed(0)}`, cls: 'money-in' },
    ],
    to: '/ledger/transactions',
  },
  {
    key: 'notes',
    icon: '📝',
    name: '记事本',
    sub: '随手记下,不再忘记',
    color: 'var(--app-notes)',
    entries: [
      { label: '笔记', value: `${notesStore.notes.length} 篇`, cls: '' },
      { label: '待办', value: `${openTodos} 项`, cls: '' },
    ],
    to: '/notes/list',
  },
]
</script>

<template>
  <div class="portal page">
    <!-- 氛围背景 -->
    <div class="portal-glow g1"></div>
    <div class="portal-glow g2"></div>

    <!-- 问候区(左问候 + 右个人名片) -->
    <section class="greet-wrap rise-in">
      <div class="greet">
        <h1>{{ greeting }},{{ userStore.user?.nickname }} <span class="wave">👋</span></h1>
        <p class="date num">{{ dateText }}</p>
        <div class="quote">
          <span class="quote-mark">“</span>
          <span>{{ dailyQuote }}</span>
          <span class="quote-mark end">”</span>
        </div>
      </div>

      <!-- 个人名片:语义是"我"而非应用,不进应用卡栅格 -->
      <div class="yiyu-card yiyu-card--hover me-card" @click="$router.push('/profile')">
        <div class="me-head">
          <span class="me-avatar">{{ profileStore.profile.avatar }}</span>
          <div class="me-info">
            <span class="me-name">{{ profileStore.profile.nickname }}</span>
            <span class="me-bio">{{ profileStore.profile.bio || '完善资料,让大家更了解你' }}</span>
          </div>
        </div>
        <div class="me-stats num">
          <span>好友 <b>{{ profileStore.friendCount }}</b> 位</span>
          <span class="sep">·</span>
          <span>参与账本 <b>{{ joinedBooks }}</b> 本</span>
        </div>
        <span class="me-enter">进入个人中心 →</span>
      </div>
    </section>

    <!-- 应用卡 -->
    <section class="app-cards">
      <div
        v-for="(a, i) in apps"
        :key="a.key"
        class="yiyu-card yiyu-card--hover app-card rise-in"
        :style="{ animationDelay: `${0.12 + i * 0.06}s` }"
        @click="$router.push(a.to)"
      >
        <div class="app-card-head">
          <span class="app-icon" :style="{ background: `color-mix(in srgb, ${a.color} 13%, transparent)` }">{{ a.icon }}</span>
          <div>
            <div class="app-card-name">{{ a.name }}</div>
            <div class="app-card-sub">{{ a.sub }}</div>
          </div>
          <span class="enter">进入 →</span>
        </div>
        <div class="app-card-data">
          <div v-for="e in a.entries" :key="e.label" class="entry">
            <span class="entry-label">{{ e.label }}</span>
            <span class="entry-value num" :class="e.cls">{{ e.value }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style src="./PortalHome.css" scoped></style>
