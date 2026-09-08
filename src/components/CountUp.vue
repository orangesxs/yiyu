<script setup>
import { ref, onMounted, watch } from "vue";

const props = defineProps({
  value: { type: Number, required: true },
  duration: { type: Number, default: 500 },
  prefix: { type: String, default: "" },
  suffix: { type: String, default: "" },
  decimals: { type: Number, default: 0 },
});

const display = ref(0);

function animate(from, to) {
  if (from === to) return;
  const start = performance.now();
  const tick = (now) => {
    const p = Math.min(1, (now - start) / props.duration);
    const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
    display.value = from + (to - from) * eased;
    if (p < 1) requestAnimationFrame(tick);
    else display.value = to;
  };
  requestAnimationFrame(tick);
}

onMounted(() => animate(0, props.value));
watch(() => props.value, (v, old) => animate(old ?? 0, v));

function fmt(n) {
  return n.toLocaleString("zh-CN", {
    minimumFractionDigits: props.decimals,
    maximumFractionDigits: props.decimals,
  });
}
</script>

<template>
  <span class="num">{{ prefix }}{{ fmt(display) }}{{ suffix }}</span>
</template>
