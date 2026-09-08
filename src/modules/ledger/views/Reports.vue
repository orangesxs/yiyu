<script setup lang="ts">
import { ref, computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, LineChart, BarChart, ScatterChart } from 'echarts/charts'
import {
  GridComponent, TooltipComponent, LegendComponent,
  VisualMapComponent, CalendarComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'
import { useLedgerStore } from '../stores/ledger'
import { mockToday } from '../../../shared/types/common'
import type { TxType, Transaction } from '../types'

use([CanvasRenderer, PieChart, LineChart, BarChart, ScatterChart, GridComponent, TooltipComponent, LegendComponent, VisualMapComponent, CalendarComponent])

const store = useLedgerStore()

/* 维度:支出 / 收入 / 总计(全部图表联动) */
const type = ref<'expense' | 'income' | 'total'>('expense')
/* 时间段:周 / 月 / 年,默认月 */
const range = ref<'week' | 'month' | 'year'>('month')
/* 区间偏移:0=本期,-1=上一期… */
const offset = ref(0)
/* 报表归属账本 */
const bookId = ref(store.currentBookId)
const bookOptions = computed(() => store.books)
const activeBook = computed(() => store.books.find((b) => b.id === bookId.value))
const scopedTx = computed<Transaction[]>(() => store.transactions.filter((t) => t.bookId === bookId.value))

function pad(n: number) { return n < 10 ? '0' + n : '' + n }
function ymd(d: Date) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) }
function fmtShort(d: Date) { return `${d.getMonth() + 1}/${d.getDate()}` }

interface DateRange { start: Date; end: Date }

/* 区间推导(mock 基准日 2026-09-07 周一) */
function rangeOf(off: number): DateRange {
  if (range.value === 'week') {
    const end = new Date(mockToday); end.setDate(mockToday.getDate() + off * 7)
    const start = new Date(end); start.setDate(end.getDate() - 6)
    return { start, end }
  }
  if (range.value === 'month') {
    const anchor = new Date(mockToday.getFullYear(), mockToday.getMonth() + off, 1)
    const endDay = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate()
    const end = new Date(anchor.getFullYear(), anchor.getMonth(), Math.min(endDay, off === 0 ? mockToday.getDate() : endDay))
    return { start: anchor, end }
  }
  const start = new Date(mockToday.getFullYear() + off, 0, 1)
  const end = off === 0 ? new Date(mockToday) : new Date(mockToday.getFullYear() + off, 11, 31)
  return { start, end }
}
const curRange = computed(() => rangeOf(offset.value))
const prevRange = computed(() => rangeOf(offset.value - 1))

const rangeLabel = computed(() => {
  const { start, end } = curRange.value
  if (range.value === 'year') return `${start.getFullYear()} 年`
  if (range.value === 'month') return `${start.getFullYear()} 年 ${start.getMonth() + 1} 月`
  return `${fmtShort(start)} – ${fmtShort(end)}`
})
const rangeSubLabel = computed(() => {
  if (offset.value === 0) return '本期'
  if (offset.value === -1) return '上期'
  return `${-offset.value} 期前`
})
const canGoNext = computed(() => offset.value < 0)
const atLatest = computed(() => offset.value === 0)

function stepRange(dir: number) {
  offset.value += dir
}

/* ---- 统计 ---- */
interface Stats { income: number; expense: number; balance: number; count: number }
function statsOf(list: Transaction[]): Stats {
  const income = list.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = list.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  return { income, expense, balance: income - expense, count: list.length }
}
function slice(r: DateRange): Transaction[] {
  const a = ymd(r.start), b = ymd(r.end)
  return scopedTx.value.filter((t) => { const d = t.date.slice(0, 10); return d >= a && d <= b })
}
const stats = computed(() => statsOf(slice(curRange.value)))
const prevStats = computed(() => statsOf(slice(prevRange.value)))
function pct(cur: number, prev: number): number | null {
  if (!prev) return null
  return Math.round(((cur - prev) / prev) * 100)
}

/* 当前维度取值 */
const isTotal = computed(() => type.value === 'total')
const typeUnit = computed(() =>
  type.value === 'income' ? '收入' : type.value === 'expense' ? '支出' : '结余'
)
const typeKey = computed<'income' | 'expense' | 'balance'>(() =>
  type.value === 'income' ? 'income' : type.value === 'expense' ? 'expense' : 'balance'
)
const typeValue = computed(() => stats.value[typeKey.value])
const prevTypeValue = computed(() => prevStats.value[typeKey.value])
const diffPct = computed(() => pct(typeValue.value, prevTypeValue.value))
const diffAbs = computed(() => typeValue.value - prevTypeValue.value)

/* 日均 */
const dayCount = computed(() => {
  const { start, end } = curRange.value
  if (range.value === 'year') {
    const limit = Math.min(new Date(end.getFullYear(), 11, 31).getTime(), mockToday.getTime())
    return Math.round((limit - start.getTime()) / 86400000) + 1
  }
  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1
})
const avgText = computed(() => {
  const v = typeValue.value / dayCount.value
  return '¥' + (Math.abs(v) >= 100 ? Math.round(v).toLocaleString() : v.toFixed(2))
})

/* 总计(当前账本全部流水,不随时间段变化) */
const bookTotal = computed(() => statsOf(scopedTx.value))

/* ---- 趋势图(周/月=按日,年=按月;total=收支相抵单线) ---- */
type DayAgg = { income: number; expense: number }
function dayAgg(r: DateRange): Record<string, DayAgg> {
  const byDay: Record<string, DayAgg> = {}
  for (const t of slice(r)) {
    const d = t.date.slice(0, 10)
    if (!byDay[d]) byDay[d] = { income: 0, expense: 0 }
    byDay[d][t.type === 'income' ? 'income' : 'expense'] += t.amount
  }
  return byDay
}
function monthAgg(r: DateRange): { income: number; expense: number }[] {
  const byMonth = Array.from({ length: 12 }, () => ({ income: 0, expense: 0 }))
  for (const t of slice(r)) {
    const i = +t.date.slice(5, 7) - 1
    byMonth[i][t.type === 'income' ? 'income' : 'expense'] += t.amount
  }
  return byMonth
}

interface TrendSeries {
  name: string
  type: 'line'
  smooth: boolean
  symbolSize?: number
  symbol?: string
  showSymbol?: boolean
  data: number[]
  lineStyle: { width: number; type?: string; opacity?: number }
  areaStyle?: { opacity: number } | null
  color: string
}

const trendOption = computed(() => {
  const axisColor = '#909399'
  const splitColor = 'rgba(144,147,153,0.18)'
  const cIn = '#18A058', cOut = '#E5484D'
  let labels: string[] = [], main: number[] = [], other: number[] | null = null

  if (range.value === 'year') {
    const cur = monthAgg(curRange.value)
    const prev = offset.value !== 0 ? null : monthAgg({ start: new Date(mockToday.getFullYear() - 1, 0, 1), end: new Date(mockToday.getFullYear() - 1, 11, 31) })
    labels = cur.map((_, i) => `${i + 1}月`)
    const keyOf = (m: DayAgg) => (isTotal.value ? m.income - m.expense : m[typeKey.value as 'income' | 'expense'])
    main = cur.map(keyOf)
    other = prev ? prev.map(keyOf) : null
  } else {
    const { start, end } = curRange.value
    const cur = dayAgg(curRange.value)
    const prev = offset.value !== 0 ? null : dayAgg(prevRange.value)
    const days: string[] = []
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) days.push(ymd(d))
    labels = days.map((k) => k.slice(5))
    const keyOf = (o: Record<string, DayAgg>, k: string) => { const d = o[k] || { income: 0, expense: 0 }; return +(isTotal.value ? d.income - d.expense : d[typeKey.value as 'income' | 'expense']).toFixed(2) }
    main = days.map((k) => keyOf(cur, k))
    other = prev ? days.map((k) => keyOf(prev, k)) : null
  }

  const series: TrendSeries[] = [{
    name: typeUnit.value,
    type: 'line',
    smooth: true,
    symbolSize: 5,
    showSymbol: labels.length <= 40,
    data: main,
    lineStyle: { width: 2.5 },
    areaStyle: { opacity: isTotal.value ? 0 : 0.12 },
    color: isTotal.value ? '#7C6AF0' : type.value === 'income' ? cIn : cOut,
  }]
  // 本期视图追加上一期对照虚线
  if (other) {
    series.push({
      name: '上期',
      type: 'line',
      smooth: true,
      symbol: 'none',
      data: other,
      lineStyle: { width: 1.5, type: 'dashed', opacity: 0.55 },
      color: '#909399',
    })
  }

  return {
    tooltip: {
      trigger: 'axis',
      formatter: (ps: { marker: string; seriesName: string; axisValue: string; value: number }[]) => ps.map((p) => `${p.marker}${p.seriesName} ${p.axisValue}<br/>¥${(+p.value).toLocaleString()}`).join('<br/>'),
    },
    legend: other ? { top: 0, right: 0, itemWidth: 14, textStyle: { color: axisColor, fontSize: 11 } } : undefined,
    grid: { left: 56, right: 20, top: other ? 34 : 20, bottom: 28 },
    xAxis: { type: 'category', data: labels, boundaryGap: false, axisLine: { lineStyle: { color: splitColor } }, axisLabel: { color: axisColor, fontSize: 11, hideOverlap: true } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: splitColor } }, axisLabel: { color: axisColor, formatter: (v: number) => (Math.abs(v) >= 10000 ? v / 10000 + 'w' : v) } },
    series,
  }
})
const trendPeak = computed(() => {
  const data = (trendOption.value.series as TrendSeries[])[0].data
  return Math.max(...data.map((v) => Math.abs(v || 0)))
})

/* ---- 分类占比 + 排行(total 模式下收支并列展示) ---- */
interface CatItem { name: string; value: number; kind: 'expense' | 'income'; kindLabel?: string }

function catOf(typeName: TxType): { name: string; value: number }[] {
  const list = slice(curRange.value).filter((t) => t.type === typeName)
  const byRoot: Record<string, number> = {}
  for (const t of list) {
    const pool = store.categories[typeName]
    const root = pool.find((c) => c.children.some((ch) => ch.id === t.categoryId) || c.id === t.categoryId)
    const name = root ? root.name : t.categoryName || '其他'
    byRoot[name] = (byRoot[name] || 0) + t.amount
  }
  return Object.entries(byRoot)
    .map(([name, value]) => ({ name, value: +value.toFixed(2) }))
    .sort((a, b) => b.value - a.value)
}
const catData = computed<CatItem[]>(() => {
  if (isTotal.value) {
    const e = catOf('expense'), i = catOf('income')
    return [
      ...e.map((c) => ({ ...c, kind: 'expense' as const })),
      ...i.map((c) => ({ ...c, kind: 'income' as const })),
    ].sort((a, b) => b.value - a.value)
  }
  return catOf(type.value as TxType).map((c) => ({ ...c, kind: type.value as 'expense' | 'income' }))
})

const paletteExpense = ['#E5484D', '#F59B0E', '#EC4899', '#C2410C', '#A855F7', '#EF4444', '#F97316', '#B45309']
const paletteIncome = ['#18A058', '#14B8A6', '#10B981', '#0EA5E9', '#84CC16', '#22C55E', '#06B6D4', '#65A30D']
function colorOf(c: CatItem, i: number) {
  if (isTotal.value) return c.kind === 'expense' ? paletteExpense[i % paletteExpense.length] : paletteIncome[i % paletteIncome.length]
  const p = type.value === 'income' ? paletteIncome : paletteExpense
  return p[i % p.length]
}

const pieOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: (p: { name: string; value: number; percent: number; data: CatItem }) => `${isTotal.value ? (p.data.kind === 'expense' ? '支 · ' : '收 · ') : ''}${p.name}<br/>¥${(+p.value).toLocaleString()}(${p.percent}%)`,
  },
  series: [{
    type: 'pie',
    radius: ['58%', '82%'],
    center: ['50%', '50%'],
    avoidLabelOverlap: true,
    itemStyle: { borderRadius: 6, borderColor: 'transparent', borderWidth: 2 },
    label: { show: false },
    emphasis: { scaleSize: 6 },
    data: catData.value.map((c, i) => ({ ...c, itemStyle: { color: colorOf(c, i) } })),
  }],
}))
function lgColor(c: CatItem, i: number) { return colorOf(c, i) }
const catTotal = computed(() => catData.value.reduce((s, c) => s + c.value, 0))
const catCount = computed(() => catData.value.length)

/* 分类排行(横向条形,total 模式收/支各取前 6) */
const rankRows = computed<CatItem[]>(() => {
  if (!isTotal.value) return catData.value.slice(0, 8).map((c) => ({ ...c, kindLabel: '' }))
  const e = catOf('expense').slice(0, 6).map((c) => ({ ...c, kind: 'expense' as const, kindLabel: '支' }))
  const i = catOf('income').slice(0, 6).map((c) => ({ ...c, kind: 'income' as const, kindLabel: '收' }))
  return [...e, ...i].sort((a, b) => b.value - a.value)
})
const rankMax = computed(() => rankRows.value[0]?.value || 1)

/* ---- 收支日历:周=近 7 天条 / 月=整月热力 / 年=12 月格 ---- */
interface CalCell {
  key: string
  label: string
  foot: string
  income?: number
  expense?: number
  net?: number
  isToday?: boolean
  future?: boolean
  monthCell?: boolean
}

const calCells = computed<(CalCell | null)[]>(() => {
  if (range.value === 'year') {
    const y = curRange.value.start.getFullYear()
    return monthAgg(curRange.value).map((m, i) => ({
      key: y + '-' + pad(i + 1),
      label: i + 1 + '月',
      foot: y + ' 年 ' + (i + 1) + ' 月',
      income: +m.income.toFixed(2),
      expense: +m.expense.toFixed(2),
      net: +(m.income - m.expense).toFixed(2),
      isToday: y === mockToday.getFullYear() && i === mockToday.getMonth(),
      monthCell: true,
    }))
  }
  if (range.value === 'month') {
    const { start } = curRange.value
    const agg = dayAgg(curRange.value)
    const cells: (CalCell | null)[] = []
    for (let i = 0; i < start.getDay(); i++) cells.push(null) // 周日开头补位
    const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()
    for (let dom = 1; dom <= daysInMonth; dom++) {
      const d = new Date(start.getFullYear(), start.getMonth(), dom)
      if (d > mockToday) {
        cells.push({ key: ymd(d), label: String(dom), foot: d.getMonth() + 1 + '/' + dom, future: true })
        continue
      }
      const k = ymd(d)
      const a = agg[k] || { income: 0, expense: 0 }
      cells.push({
        key: k,
        label: String(dom),
        foot: +k.slice(5, 7) + '/' + +k.slice(8, 10),
        income: +a.income.toFixed(2),
        expense: +a.expense.toFixed(2),
        net: +(a.income - a.expense).toFixed(2),
        isToday: k === ymd(mockToday),
      })
    }
    return cells
  }
  /* week:滚动近 7 天 */
  const { start, end } = curRange.value
  const agg = dayAgg(curRange.value)
  const cells: (CalCell | null)[] = []
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const k = ymd(d)
    const a = agg[k] || { income: 0, expense: 0 }
    cells.push({
      key: k,
      label: d.getMonth() + 1 + '/' + d.getDate(),
      foot: d.getMonth() + 1 + '/' + d.getDate(),
      income: +a.income.toFixed(2),
      expense: +a.expense.toFixed(2),
      net: +(a.income - a.expense).toFixed(2),
      isToday: k === ymd(mockToday),
    })
  }
  return cells
})
const calMaxExpense = computed(() => Math.max(1, ...calCells.value.filter(Boolean).map((c) => c!.expense ?? 0)))
function calLevel(c: CalCell | null) {
  if (!c) return 'none'
  if (c.future) return 'future'
  if ((c.expense ?? 0) <= 0) return (c.income ?? 0) > 0 ? 'in' : 'none'
  const r = (c.expense ?? 0) / calMaxExpense.value
  return r > 0.66 ? 'e4' : r > 0.33 ? 'e3' : r > 0.12 ? 'e2' : 'e1'
}
const calHover = ref<CalCell | null>(null)
const weekHeads = ['日', '一', '二', '三', '四', '五', '六']

/* 峰值摘要:周/月=最贵的一天,年=支出最高的月份 */
const peakText = computed(() => {
  const cells = calCells.value.filter((c): c is CalCell => !!c && !c.future)
  if (!cells.length) return ''
  const top = [...cells].sort((a, b) => (b.expense ?? 0) - (a.expense ?? 0))[0]
  if (!(top.expense ?? 0)) return ''
  const money = '¥' + Math.round(top.expense ?? 0).toLocaleString()
  if (range.value === 'year') return `支出最高 ${top.label} · ${money}`
  return `最贵的一天 ${top.label}${range.value === 'month' ? ' 日' : ''} · ${money}`
})
const calTitle = computed(() =>
  range.value === 'year' ? '收支月历' : range.value === 'week' ? '近 7 天收支' : '收支日历'
)
function fmtCell(v: number) {
  return v >= 100 ? Math.round(v).toLocaleString() : v
}
</script>

<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h2 class="page-title">报表统计</h2>
        <p class="page-sub">
          {{ activeBook?.icon }} {{ activeBook?.name }}
          <span class="head-sep">·</span>
          <button class="range-nav" :disabled="atLatest" title="上一期" @click="stepRange(-1)"><el-icon><ArrowLeft /></el-icon></button>
          <span class="range-text">{{ rangeLabel }}</span>
          <button class="range-nav" :disabled="!canGoNext" title="下一期" @click="stepRange(1)"><el-icon><ArrowRight /></el-icon></button>
          <span v-if="offset !== 0" class="range-offset">({{ rangeSubLabel }})</span>
        </p>
      </div>
      <div class="head-switch">
        <el-select v-model="bookId" size="small" style="width: 130px">
          <el-option v-for="b in bookOptions" :key="b.id" :label="b.icon + ' ' + b.name" :value="b.id" />
        </el-select>
        <el-radio-group v-model="type" size="small">
          <el-radio-button value="expense">支出</el-radio-button>
          <el-radio-button value="income">收入</el-radio-button>
          <el-radio-button value="total">总计</el-radio-button>
        </el-radio-group>
        <el-radio-group v-model="range" size="small" @change="offset = 0">
          <el-radio-button value="week">周</el-radio-button>
          <el-radio-button value="month">月</el-radio-button>
          <el-radio-button value="year">年</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- 总览:维度主卡 + 收支卡 + 总计 -->
    <div class="stat-grid">
      <div class="yiyu-card stat-card stat-card--main" :class="'k-' + type">
        <span class="sum-label">
          本{{ range === 'week' ? '周' : range === 'month' ? '月' : '年' }}{{ typeUnit }}
          <span v-if="offset !== 0" class="sum-offset">{{ rangeSubLabel }}</span>
        </span>
        <span class="stat-num num main-num" :class="type === 'income' ? 'money-in' : type === 'expense' ? 'money-out' : ''">
          ¥{{ Math.abs(typeValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
        </span>
        <span class="sum-sub num">
          <template v-if="diffPct === null">上期无数据</template>
          <template v-else-if="diffPct === 0">与上期持平</template>
          <template v-else>
            较上期
            <b :class="diffPct > 0 ? 'up' : 'down'">{{ diffPct > 0 ? '↑' : '↓' }} {{ Math.abs(diffPct) }}%</b>
            <span class="diff-abs">({{ diffAbs >= 0 ? '+' : '−' }}¥{{ Math.abs(diffAbs).toLocaleString(undefined, { maximumFractionDigits: 0 }) }})</span>
          </template>
        </span>
        <span class="sum-faint num">日均 ¥{{ avgText.replace('¥', '') }} · {{ stats.count }} 笔</span>
      </div>

      <div class="yiyu-card stat-card" :class="{ dim: type === 'income' }">
        <span class="sum-label">支出</span>
        <span class="stat-num money-out">¥{{ stats.expense.toLocaleString(undefined, { maximumFractionDigits: 2 }) }}</span>
        <span class="sum-sub num">
          <template v-if="pct(stats.expense, prevStats.expense) === null">上期无数据</template>
          <template v-else>
            上期 ¥{{ prevStats.expense.toLocaleString(undefined, { maximumFractionDigits: 0 }) }}
            · {{ pct(stats.expense, prevStats.expense) }}%{{ stats.expense - prevStats.expense >= 0 ? '↑' : '↓' }}
          </template>
        </span>
        <div class="mini-bar"><i class="out" :style="{ width: Math.min(100, (stats.expense / Math.max(stats.expense, prevStats.expense, 1)) * 100) + '%' }"></i><i class="out prev" :style="{ width: Math.min(100, (prevStats.expense / Math.max(stats.expense, prevStats.expense, 1)) * 100) + '%' }"></i></div>
      </div>

      <div class="yiyu-card stat-card" :class="{ dim: type === 'expense' }">
        <span class="sum-label">收入</span>
        <span class="stat-num money-in">¥{{ stats.income.toLocaleString(undefined, { maximumFractionDigits: 2 }) }}</span>
        <span class="sum-sub num">
          <template v-if="pct(stats.income, prevStats.income) === null">上期无数据</template>
          <template v-else>
            上期 ¥{{ prevStats.income.toLocaleString(undefined, { maximumFractionDigits: 0 }) }}
            · {{ pct(stats.income, prevStats.income) }}%{{ stats.income - prevStats.income >= 0 ? '↑' : '↓' }}
          </template>
        </span>
        <div class="mini-bar"><i class="inn" :style="{ width: Math.min(100, (stats.income / Math.max(stats.income, prevStats.income, 1)) * 100) + '%' }"></i><i class="inn prev" :style="{ width: Math.min(100, (prevStats.income / Math.max(stats.income, prevStats.income, 1)) * 100) + '%' }"></i></div>
      </div>

      <div class="yiyu-card stat-card stat-card--total">
        <span class="sum-label">累计总计({{ activeBook?.name }})</span>
        <span class="stat-num num tt-num">
          <span class="tt-part">收 <b class="money-in">¥{{ bookTotal.income.toLocaleString(undefined, { maximumFractionDigits: 0 }) }}</b></span>
          <span class="tt-part">支 <b class="money-out">¥{{ bookTotal.expense.toLocaleString(undefined, { maximumFractionDigits: 0 }) }}</b></span>
        </span>
        <span class="sum-sub num">结余 ¥{{ bookTotal.balance.toLocaleString(undefined, { maximumFractionDigits: 0 }) }} · 共 {{ bookTotal.count }} 笔</span>
      </div>
    </div>

    <div class="chart-grid">
      <div class="yiyu-card chart-card">
        <div class="chart-head">
          <span class="chart-title">{{ typeUnit }}趋势</span>
          <span v-if="!isTotal" class="chart-sub num">峰值 ¥{{ trendPeak.toLocaleString() }}</span>
        </div>
        <v-chart :option="trendOption" class="chart" autoresize />
      </div>

      <!-- 收支日历:周=近 7 天条 / 月=整月热力 / 年=12 月格 -->
      <div class="yiyu-card chart-card cal-card">
        <div class="chart-head">
          <span class="chart-title">{{ calTitle }}</span>
          <span v-if="peakText" class="chart-sub num">{{ peakText }}</span>
        </div>
        <div class="cal">
          <div v-if="range === 'month'" class="cal-week">
            <span v-for="w in weekHeads" :key="w">{{ w }}</span>
          </div>
          <div class="cal-grid" :class="'cal-grid--' + range">
            <div
              v-for="(c, i) in calCells"
              :key="i"
              class="cal-cell"
              :class="[{ today: c?.isToday, hover: c && calHover && calHover.key === c.key, future: c?.future }, 'lv-' + calLevel(c)]"
              @mouseenter="calHover = c"
              @mouseleave="calHover = null"
            >
              <template v-if="c && !c.future">
                <span class="cal-dom num">{{ c.label }}</span>
                <span v-if="(c.expense ?? 0) > 0" class="cal-out num">-{{ fmtCell(c.expense ?? 0) }}</span>
                <span v-if="(c.income ?? 0) > 0" class="cal-in num">+{{ fmtCell(c.income ?? 0) }}</span>
              </template>
              <template v-else-if="c">
                <span class="cal-dom num cal-future-dom">{{ c.label }}</span>
              </template>
            </div>
          </div>
          <div class="cal-foot">
            <span class="cal-hover num" v-if="calHover">
              {{ calHover.foot }}
              <template v-if="calHover.expense || calHover.income">
                · <b class="money-out">-{{ (calHover.expense ?? 0).toFixed(2) }}</b>
                <template v-if="calHover.income"> <b class="money-in">+{{ calHover.income.toFixed(2) }}</b></template>
              </template>
              <template v-else>· 无记录</template>
            </span>
            <span v-else class="cal-hover cal-muted">悬停查看单{{ range === 'year' ? '月' : '日' }}收支</span>
            <span class="cal-legend">
              <i class="lg-cell lv-in"></i>有收入
              <i class="lg-cell lv-e1"></i><i class="lg-cell lv-e2"></i><i class="lg-cell lv-e3"></i><i class="lg-cell lv-e4"></i>支出由少到多
            </span>
          </div>
        </div>
      </div>

      <div class="yiyu-card chart-card pie-card">
        <div class="chart-head">
          <span class="chart-title">{{ typeUnit }}分类占比</span>
          <span class="chart-sub num">合计 ¥{{ catTotal.toLocaleString(undefined, { maximumFractionDigits: 2 }) }}</span>
        </div>
        <v-chart v-if="catCount" :option="pieOption" class="chart chart--pie" autoresize />
        <div v-else class="chart-empty">该时段暂无{{ typeUnit }}记录</div>
        <div class="pie-legend">
          <span v-for="(c, i) in catData" :key="c.kind + c.name" class="lg-item" :class="{ muted: isTotal && c.kind === 'income' }">
            <i :style="{ background: lgColor(c, i) }"></i>
            <template v-if="isTotal">{{ c.kind === 'expense' ? '支' : '收' }} · </template>{{ c.name }}
            <b class="num">¥{{ c.value.toLocaleString(undefined, { maximumFractionDigits: 0 }) }}</b>
            <em class="num">{{ catTotal ? Math.round((c.value / catTotal) * 100) : 0 }}%</em>
          </span>
        </div>
      </div>

      <div class="yiyu-card chart-card">
        <div class="chart-head">
          <span class="chart-title">{{ typeUnit }}分类排行</span>
          <span class="chart-sub num">Top {{ rankRows.length }}</span>
        </div>
        <div class="rank-list">
          <div v-for="(r, i) in rankRows" :key="r.kind + r.name" class="rank-row">
            <span class="rank-idx num" :class="{ top: i < 3 }">{{ i + 1 }}</span>
            <span class="rank-name">{{ r.name }}<i v-if="r.kindLabel" class="rank-kind" :class="r.kind">{{ r.kindLabel }}</i></span>
            <span class="rank-bar"><i :class="r.kind" :style="{ width: (r.value / rankMax) * 100 + '%' }"></i></span>
            <span class="rank-val num">¥{{ r.value.toLocaleString(undefined, { maximumFractionDigits: 0 }) }}</span>
            <span class="rank-pct num">{{ catTotal ? Math.round((r.value / catTotal) * 100) : 0 }}%</span>
          </div>
          <div v-if="!rankRows.length" class="chart-empty">该时段暂无记录</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style src="./Reports.css" scoped></style>
