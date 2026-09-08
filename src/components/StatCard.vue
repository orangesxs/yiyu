<script setup>
defineProps({
  label: String,
  value: Number,
  prefix: { type: String, default: "" },
  suffix: { type: String, default: "" },
  decimals: { type: Number, default: 0 },
  tone: { type: String, default: "" }, // income / expense / plain
  delta: String, // 环比文案 如 "+12%"
  deltaUp: Boolean,
});
</script>

<template>
  <div class="yiyu-card stat-card">
    <div class="stat-label">{{ label }}</div>
    <div class="stat-num" :class="tone">
      <CountUp :value="value" :prefix="prefix" :suffix="suffix" :decimals="decimals" />
    </div>
    <div v-if="delta" class="stat-delta" :class="deltaUp ? 'up' : 'down'">
      <span>{{ deltaUp ? "▲" : "▼" }}</span> {{ delta }}
    </div>
  </div>
</template>

<script>
import CountUp from "./CountUp.vue";
export default { components: { CountUp } };
</script>

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
