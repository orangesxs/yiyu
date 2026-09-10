<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useUserStore } from '@/shared/stores/user'
import { useLedgerStore } from '@/modules/ledger/stores/ledger'
import { nowYM } from '@/shared/types/common'

const userStore = useUserStore()
const ledgerStore = useLedgerStore()

onMounted(() => {
  ledgerStore.init().catch(() => {})
})

/* 问候(真实时钟) */
const now = new Date()
const greeting = now.getHours() < 6 ? '夜深了' : now.getHours() < 11 ? '早上好' : now.getHours() < 14 ? '中午好' : now.getHours() < 18 ? '下午好' : '晚上好'
const dateText = `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日 · 星期${'日一二三四五六'[now.getDay()]}`
const dailyQuote = '把日子过成自己喜欢的样子,是一件值得练习的事。'

/* 应用摘要数据(本月统计;ledger 数据未加载完成时显示占位 0) */
const monthStats = computed(() => ledgerStore.monthStats(nowYM()))

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

const apps = computed<AppCard[]>(() => [
  {
    key: 'ledger',
    icon: '💰',
    name: '记账本',
    sub: '把每一笔都记得清楚',
    color: 'var(--app-ledger)',
    entries: [
      { label: '本月支出', value: `¥ ${monthStats.value.expense.toFixed(0)}`, cls: 'money-out' },
      { label: '结余', value: `¥ ${monthStats.value.balance.toFixed(0)}`, cls: 'money-in' },
    ],
    to: '/ledger/transactions',
  },
])
</script>

<template>
  <div class="portal page">
    <!-- 氛围背景 -->
    <div class="portal-glow g1"></div>
    <div class="portal-glow g2"></div>

    <!-- 问候区 -->
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
            <span class="entry-value num" :class="e.cls">{{ ledgerStore.loaded ? e.value : '— —' }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style src="./PortalHome.css" scoped></style>
