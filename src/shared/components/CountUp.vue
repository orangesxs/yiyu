import { ref, onMounted, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    value: number
    duration?: number
    prefix?: string
    suffix?: string
    decimals?: number
  }>(),
  { duration: 500, prefix: '', suffix: '', decimals: 0 },
)

const display = ref(0)

function animate(from: number, to: number) {
  if (from === to) return
  const start = performance.now()
  const tick = (now: number) => {
    const p = Math.min(1, (now - start) / props.duration)
    const eased = 1 - Math.pow(1 - p, 3) // ease-out cubic
    display.value = from + (to - from) * eased
    if (p < 1) requestAnimationFrame(tick)
    else display.value = to
  }
  requestAnimationFrame(tick)
}

onMounted(() => animate(0, props.value))
watch(() => props.value, (v, old) => animate(old ?? 0, v))

function fmt(n: number) {
  return n.toLocaleString('zh-CN', {
    minimumFractionDigits: props.decimals,
    maximumFractionDigits: props.decimals,
  })
}
