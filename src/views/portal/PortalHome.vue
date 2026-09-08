<script setup>
import { useUserStore } from "../../stores/user";
import { useLedgerStore } from "../../stores/ledger";
import { useNotesStore } from "../../stores/notes";
import { useTodosStore } from "../../stores/todos";
import { today } from "../../mock/ledgerDate";

const userStore = useUserStore();
const ledgerStore = useLedgerStore();
const notesStore = useNotesStore();
const todosStore = useTodosStore();

/* 问候 */
const hour = today.getHours();
const greeting = hour < 6 ? "夜深了" : hour < 11 ? "早上好" : hour < 14 ? "中午好" : hour < 18 ? "下午好" : "晚上好";
const dateText = `${today.getFullYear()} 年 ${today.getMonth() + 1} 月 ${today.getDate()} 日 · 星期${"日一二三四五六"[today.getDay()]}`;
const dailyQuote = "把日子过成自己喜欢的样子，是一件值得练习的事。";

/* 应用摘要数据 */
const monthStats = ledgerStore.monthStats("2026-09");
const openTodos = todosStore.counts.todo + todosStore.counts.doing + todosStore.counts.overdue;

const apps = [
  {
    key: "ledger",
    icon: "💰",
    name: "记账本",
    sub: "把每一笔都记得清楚",
    color: "var(--app-ledger)",
    entries: [
      { label: "本月支出", value: `¥ ${monthStats.expense.toFixed(0)}`, cls: "money-out" },
      { label: "结余", value: `¥ ${(monthStats.balance).toFixed(0)}`, cls: "money-in" },
    ],
    to: "/ledger/transactions",
  },
  {
    key: "notes",
    icon: "📝",
    name: "记事本",
    sub: "随手记下，不再忘记",
    color: "var(--app-notes)",
    entries: [
      { label: "笔记", value: `${notesStore.notes.length} 篇`, cls: "" },
      { label: "待办", value: `${openTodos} 项`, cls: "" },
    ],
    to: "/notes/list",
  },
];
</script>

<template>
  <div class="portal page">
    <!-- 氛围背景 -->
    <div class="portal-glow g1"></div>
    <div class="portal-glow g2"></div>

    <!-- 问候区 -->
    <section class="greet rise-in">
      <h1>{{ greeting }}，{{ userStore.user?.nickname }} <span class="wave">👋</span></h1>
      <p class="date num">{{ dateText }}</p>
      <div class="quote">
        <span class="quote-mark">“</span>
        <span>{{ dailyQuote }}</span>
        <span class="quote-mark end">”</span>
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

<style scoped>
.portal {
  position: relative;
  padding-top: 48px;
  padding-bottom: 48px;
  overflow: hidden;
}

/* 氛围光晕 */
.portal-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: var(--glow-opacity);
  pointer-events: none;
}
.g1 { width: 500px; height: 500px; background: var(--app-ledger); top: -180px; left: -100px; }
.g2 { width: 420px; height: 420px; background: var(--app-notes); top: -140px; right: 8%; }

/* 问候 */
.greet h1 {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 0.01em;
}
.wave { display: inline-block; animation: wave 2.4s ease-in-out infinite; transform-origin: 70% 70%; }
@keyframes wave { 0%, 55%, 100% { transform: rotate(0); } 60% { transform: rotate(18deg); } 70% { transform: rotate(-8deg); } 80% { transform: rotate(14deg); } 90% { transform: rotate(-4deg); } }

.greet .date {
  color: var(--text-secondary);
  font-size: var(--fs-caption);
  margin: 8px 0 18px;
  letter-spacing: 0.02em;
}

.quote {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  border-radius: 999px;
  padding: 10px 18px;
  font-size: 13px;
  color: var(--text-regular);
}
.quote-mark { color: var(--color-primary); font-size: 18px; font-family: Georgia, serif; line-height: 1; }
.quote-mark.end { font-size: 14px; align-self: flex-end; }

/* 应用卡 */
.app-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--gap-module);
  margin-top: 30px;
  max-width: 980px;
}

.app-card {
  padding: 22px;
  cursor: pointer;
}

.app-card-head {
  display: flex;
  align-items: center;
  gap: 12px;
}
.app-icon {
  width: 46px;
  height: 46px;
  border-radius: 13px;
  display: grid;
  place-items: center;
  font-size: 22px;
  flex-shrink: 0;
}
.app-card-name { font-size: 16px; font-weight: 600; }
.app-card-sub { font-size: var(--fs-caption); color: var(--text-secondary); margin-top: 2px; }
.enter {
  margin-left: auto;
  font-size: var(--fs-caption);
  color: var(--text-secondary);
  transition: color var(--dur-base) ease, transform var(--dur-base) ease;
}
.app-card:hover .enter { color: var(--color-primary); transform: translateX(3px); }

.app-card-data {
  display: flex;
  gap: 28px;
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px dashed var(--border-color);
}
.entry { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.entry-label { font-size: var(--fs-caption); color: var(--text-secondary); }
.entry-value { font-size: 19px; font-weight: 600; }

@media (max-width: 768px) {
  .app-cards { grid-template-columns: 1fr; }
}
</style>
