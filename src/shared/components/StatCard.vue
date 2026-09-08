<script setup lang="ts">
import CountUp from './CountUp.vue'

withDefaults(
  defineProps<{
    label?: string
    value?: number
    prefix?: string
    suffix?: string
    decimals?: number
    /** income / expense / plain */
    tone?: string
    /** 环比文案 如 "+12%" */
    delta?: string
    deltaUp?: boolean
  }>(),
  { label: undefined, value: undefined, prefix: '', suffix: '', decimals: 0, tone: '', delta: undefined, deltaUp: false },
)
</script>

<template>
  <div class="yiyu-card stat-card">
    <div class="stat-label">{{ label }}</div>
    <div class="stat-num" :class="tone">
      <CountUp :value="value ?? 0" :prefix="prefix" :suffix="suffix" :decimals="decimals" />
    </div>
    <div v-if="delta" class="stat-delta" :class="deltaUp ? 'up' : 'down'">
      <span>{{ deltaUp ? '▲' : '▼' }}</span> {{ delta }}
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  padding: var(--gap-card);
}
.stat-label {
  font-size: var(--fs-caption);
  color: var(--text-secondary);
  margin-bottom: 6px;
}
.stat-num.income { color: var(--income-ink); }
.stat-num.expense { color: var(--expense-ink); }
.stat-delta {
  margin-top: 6px;
  font-size: var(--fs-caption);
  color: var(--text-secondary);
}
.stat-delta.up { color: var(--income-ink); }
.stat-delta.down { color: var(--expense-ink); }
</style>
