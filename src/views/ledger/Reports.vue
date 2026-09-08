<script setup>
import { ref, computed } from "vue";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { PieChart, LineChart, BarChart, ScatterChart } from "echarts/charts";
import {
  GridComponent, TooltipComponent, LegendComponent,
  VisualMapComponent, CalendarComponent,
} from "echarts/components";
import VChart from "vue-echarts";
import { useLedgerStore } from "../../stores/ledger";
import { today } from "../../mock/ledgerDate";

use([CanvasRenderer, PieChart, LineChart, BarChart, ScatterChart, GridComponent, TooltipComponent, LegendComponent, VisualMapComponent, CalendarComponent]);

const store = useLedgerStore();

/* 维度：支出 / 收入 / 总计（全部图表联动） */
const type = ref("expense");
/* 时间段：周 / 月 / 年，默认月 */
const range = ref("month");
/* 区间偏移：0=本期，-1=上一期… */
const offset = ref(0);
/* 报表归属账本 */
const bookId = ref(store.currentBookId);
const bookOptions = computed(() => store.books);
const activeBook = computed(() => store.books.find((b) => b.id === bookId.value));
const scopedTx = computed(() => store.transactions.filter((t) => t.bookId === bookId.value));

function pad(n) { return n < 10 ? "0" + n : "" + n; }
function ymd(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
function fmtShort(d) { return `${d.getMonth() + 1}/${d.getDate()}`; }

/* 区间推导（mock 基准日 2026-09-07 周一） */
function rangeOf(off) {
  if (range.value === "week") {
    const end = new Date(today); end.setDate(today.getDate() + off * 7);
    const start = new Date(end); start.setDate(end.getDate() - 6);
    return { start, end };
  }
  if (range.value === "month") {
    const anchor = new Date(today.getFullYear(), today.getMonth() + off, 1);
    const endDay = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
    const end = new Date(anchor.getFullYear(), anchor.getMonth(), Math.min(endDay, off === 0 ? today.getDate() : endDay));
    return { start: anchor, end };
  }
  const start = new Date(today.getFullYear() + off, 0, 1);
  const end = off === 0 ? new Date(today) : new Date(today.getFullYear() + off, 11, 31);
  return { start, end };
}
const curRange = computed(() => rangeOf(offset.value));
const prevRange = computed(() => rangeOf(offset.value - 1));
const nextRange = computed(() => rangeOf(offset.value + 1));

const rangeLabel = computed(() => {
  const { start, end } = curRange.value;
  if (range.value === "year") return `${start.getFullYear()} 年`;
  if (range.value === "month") return `${start.getFullYear()} 年 ${start.getMonth() + 1} 月`;
  return `${fmtShort(start)} – ${fmtShort(end)}`;
});
const rangeSubLabel = computed(() => {
  if (offset.value === 0) return "本期";
  if (offset.value === -1) return "上期";
  return `${-offset.value} 期前`;
});
const canGoNext = computed(() => offset.value < 0);
const atLatest = computed(() => offset.value === 0);

function stepRange(dir) {
  offset.value += dir;
}

/* ---- 统计 ---- */
function statsOf(list) {
  const income = list.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = list.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  return { income, expense, balance: income - expense, count: list.length };
}
function slice(r) {
  const a = ymd(r.start), b = ymd(r.end);
  return scopedTx.value.filter((t) => { const d = t.date.slice(0, 10); return d >= a && d <= b; });
}
const stats = computed(() => statsOf(slice(curRange.value)));
const prevStats = computed(() => statsOf(slice(prevRange.value)));
const nextStats = computed(() => statsOf(slice(nextRange.value)));
function pct(cur, prev) {
  if (!prev) return null;
  return Math.round(((cur - prev) / prev) * 100);
}

/* 当前维度取值 */
const isTotal = computed(() => type.value === "total");
const typeColor = computed(() =>
  type.value === "income" ? "var(--color-income)" : type.value === "expense" ? "var(--color-expense)" : "var(--color-primary)"
);
const typeUnit = computed(() =>
  type.value === "income" ? "收入" : type.value === "expense" ? "支出" : "结余"
);
const typeKey = computed(() =>
  type.value === "income" ? "income" : type.value === "expense" ? "expense" : "balance"
);
const typeValue = computed(() => stats.value[typeKey.value]);
const prevTypeValue = computed(() => prevStats.value[typeKey.value]);
const nextTypeValue = computed(() => nextStats.value[typeKey.value]);
const diffPct = computed(() => pct(typeValue.value, prevTypeValue.value));
const diffAbs = computed(() => typeValue.value - prevTypeValue.value);

/* 日均 */
const dayCount = computed(() => {
  const { start, end } = curRange.value;
  if (range.value === "year") {
    const limit = Math.min(new Date(end.getFullYear(), 11, 31), today);
    return Math.round((limit - start) / 86400000) + 1;
  }
  return Math.round((end - start) / 86400000) + 1;
});
const avgText = computed(() => {
  const v = typeValue.value / dayCount.value;
  return "¥" + (Math.abs(v) >= 100 ? Math.round(v).toLocaleString() : v.toFixed(2));
});

/* 总计（当前账本全部流水，不随时间段变化） */
const bookTotal = computed(() => statsOf(scopedTx.value));

/* ---- 趋势图（周/月=按日，年=按月；total=双线） ---- */
function dayAgg(r) {
  const byDay = {};
  for (const t of slice(r)) {
    const d = t.date.slice(0, 10);
    if (!byDay[d]) byDay[d] = { income: 0, expense: 0 };
    byDay[d][t.type === "income" ? "income" : "expense"] += t.amount;
  }
  return byDay;
}
function monthAgg(r) {
  const byMonth = Array.from({ length: 12 }, () => ({ income: 0, expense: 0 }));
  for (const t of slice(r)) {
    const i = +t.date.slice(5, 7) - 1;
    byMonth[i][t.type === "income" ? "income" : "expense"] += t.amount;
  }
  return byMonth;
}

const trendOption = computed(() => {
  const axisColor = "#909399";
  const splitColor = "rgba(144,147,153,0.18)";
  const cIn = "#18A058", cOut = "#E5484D";
  let labels = [], main = [], other = [];

  if (range.value === "year") {
    const cur = monthAgg(curRange.value);
    const prev = offset.value !== 0 ? null : monthAgg({ start: new Date(today.getFullYear() - 1, 0, 1), end: new Date(today.getFullYear() - 1, 11, 31) });
    labels = cur.map((_, i) => `${i + 1}月`);
    const keyOf = (m) => (isTotal.value ? m.income - m.expense : m[typeKey.value]);
    main = cur.map(keyOf);
    other = prev ? prev.map(keyOf) : null;
  } else {
    const { start, end } = curRange.value;
    const cur = dayAgg(curRange.value);
    const prev = offset.value !== 0 ? null : dayAgg(prevRange.value);
    const days = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) days.push(ymd(d));
    labels = days.map((k) => k.slice(5));
    const keyOf = (o, k) => { const d = o[k] || { income: 0, expense: 0 }; return +(isTotal.value ? d.income - d.expense : d[typeKey.value]).toFixed(2); };
    main = days.map((k) => keyOf(cur, k));
    other = prev ? days.map((k) => keyOf(prev, k)) : null;
  }

  const series = [{
    name: typeUnit.value,
    type: "line",
    smooth: true,
    symbolSize: 5,
    showSymbol: labels.length <= 40,
    data: main,
    lineStyle: { width: 2.5 },
    areaStyle: { opacity: isTotal.value ? 0 : 0.12 },
    color: isTotal.value ? "#7C6AF0" : type.value === "income" ? cIn : cOut,
  }];
  // 本期视图追加上一期对照虚线
  if (other) {
    series.push({
      name: "上期",
      type: "line",
      smooth: true,
      symbol: "none",
      data: other,
      lineStyle: { width: 1.5, type: "dashed", opacity: 0.55 },
      color: "#909399",
    });
  }

  return {
    tooltip: {
      trigger: "axis",
      formatter: (ps) => ps.map((p) => `${p.marker}${p.seriesName} ${p.axisValue}<br/>¥${(+p.value).toLocaleString()}`).join("<br/>"),
    },
    legend: other ? { top: 0, right: 0, itemWidth: 14, textStyle: { color: axisColor, fontSize: 11 } } : undefined,
    grid: { left: 56, right: 20, top: other ? 34 : 20, bottom: 28 },
    xAxis: { type: "category", data: labels, boundaryGap: false, axisLine: { lineStyle: { color: splitColor } }, axisLabel: { color: axisColor, fontSize: 11, hideOverlap: true } },
    yAxis: { type: "value", splitLine: { lineStyle: { color: splitColor } }, axisLabel: { color: axisColor, formatter: (v) => (Math.abs(v) >= 10000 ? v / 10000 + "w" : v) } },
    series,
  };
});

/* ---- 分类占比 + 排行（total 模式下收支并列展示） ---- */
function catOf(typeName) {
  const list = slice(curRange.value).filter((t) => t.type === typeName);
  const byRoot = {};
  for (const t of list) {
    const pool = store.categories[typeName];
    const root = pool.find((c) => c.children.some((ch) => ch.id === t.categoryId) || c.id === t.categoryId);
    const name = root ? root.name : t.categoryName || "其他";
    byRoot[name] = (byRoot[name] || 0) + t.amount;
  }
  return Object.entries(byRoot)
    .map(([name, value]) => ({ name, value: +value.toFixed(2) }))
    .sort((a, b) => b.value - a.value);
}
const catData = computed(() => {
  if (isTotal.value) {
    const e = catOf("expense"), i = catOf("income");
    return [
      ...e.map((c) => ({ ...c, kind: "expense" })),
      ...i.map((c) => ({ ...c, kind: "income" })),
    ].sort((a, b) => b.value - a.value);
  }
  return catOf(type.value).map((c) => ({ ...c, kind: type.value }));
});

const paletteExpense = ["#E5484D", "#F59B0E", "#EC4899", "#C2410C", "#A855F7", "#EF4444", "#F97316", "#B45309"];
const paletteIncome = ["#18A058", "#14B8A6", "#10B981", "#0EA5E9", "#84CC16", "#22C55E", "#06B6D4", "#65A30D"];
const paletteTotal = ["#7C6AF0", "#E5484D", "#18A058", "#F59B0E", "#14B8A6", "#EC4899", "#8B5CF6", "#0EA5E9"];
function colorOf(c, i) {
  if (isTotal.value) return c.kind === "expense" ? paletteExpense[i % paletteExpense.length] : paletteIncome[i % paletteIncome.length];
  const p = type.value === "income" ? paletteIncome : paletteExpense;
  return p[i % p.length];
}

const pieOption = computed(() => ({
  tooltip: {
    trigger: "item",
    formatter: (p) => `${isTotal.value ? (p.data.kind === "expense" ? "支 · " : "收 · ") : ""}${p.name}<br/>¥${(+p.value).toLocaleString()}（${p.percent}%）`,
  },
  series: [{
    type: "pie",
    radius: ["58%", "82%"],
    center: ["50%", "50%"],
    avoidLabelOverlap: true,
    itemStyle: { borderRadius: 6, borderColor: "transparent", borderWidth: 2 },
    label: { show: false },
    emphasis: { scaleSize: 6 },
    data: catData.value.map((c, i) => ({ ...c, itemStyle: { color: colorOf(c, i) } })),
  }],
}));
function lgColor(c, i) { return colorOf(c, i); }
const catTotal = computed(() => catData.value.reduce((s, c) => s + c.value, 0));
const catCount = computed(() => catData.value.length);

/* 分类排行（横向条形，total 模式收/支各取前 6） */
const rankRows = computed(() => {
  if (!isTotal.value) return catData.value.slice(0, 8).map((c) => ({ ...c, kindLabel: "" }));
  const e = catOf("expense").slice(0, 6).map((c) => ({ ...c, kind: "expense", kindLabel: "支" }));
  const i = catOf("income").slice(0, 6).map((c) => ({ ...c, kind: "income", kindLabel: "收" }));
  return [...e, ...i].sort((a, b) => b.value - a.value);
});
const rankMax = computed(() => rankRows.value[0]?.value || 1);

/* ---- 收支日历：周=近 7 天条 / 月=整月热力 / 年=12 月格 ---- */
const calCells = computed(() => {
  if (range.value === "year") {
    const y = curRange.value.start.getFullYear();
    return monthAgg(curRange.value).map((m, i) => ({
      key: y + "-" + pad(i + 1),
      label: i + 1 + "月",
      foot: y + " 年 " + (i + 1) + " 月",
      income: +m.income.toFixed(2),
      expense: +m.expense.toFixed(2),
      net: +(m.income - m.expense).toFixed(2),
      isToday: y === today.getFullYear() && i === today.getMonth(),
      monthCell: true,
    }));
  }
  if (range.value === "month") {
    const { start } = curRange.value;
    const agg = dayAgg(curRange.value);
    const cells = [];
    for (let i = 0; i < start.getDay(); i++) cells.push(null); // 周日开头补位
    const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    for (let dom = 1; dom <= daysInMonth; dom++) {
      const d = new Date(start.getFullYear(), start.getMonth(), dom);
      if (d > today) {
        cells.push({ key: ymd(d), label: String(dom), foot: d.getMonth() + 1 + "/" + dom, future: true });
        continue;
      }
      const k = ymd(d);
      const a = agg[k] || { income: 0, expense: 0 };
      cells.push({
        key: k,
        label: String(dom),
        foot: +k.slice(5, 7) + "/" + +k.slice(8, 10),
        income: +a.income.toFixed(2),
        expense: +a.expense.toFixed(2),
        net: +(a.income - a.expense).toFixed(2),
        isToday: k === ymd(today),
      });
    }
    return cells;
  }
  /* week：滚动近 7 天 */
  const { start, end } = curRange.value;
  const agg = dayAgg(curRange.value);
  const cells = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const k = ymd(d);
    const a = agg[k] || { income: 0, expense: 0 };
    cells.push({
      key: k,
      label: d.getMonth() + 1 + "/" + d.getDate(),
      foot: d.getMonth() + 1 + "/" + d.getDate(),
      income: +a.income.toFixed(2),
      expense: +a.expense.toFixed(2),
      net: +(a.income - a.expense).toFixed(2),
      isToday: k === ymd(today),
    });
  }
  return cells;
});
const calMaxExpense = computed(() => Math.max(1, ...calCells.value.filter(Boolean).map((c) => c.expense)));
function calLevel(c) {
  if (!c) return "none";
  if (c.future) return "future";
  if (c.expense <= 0) return c.income > 0 ? "in" : "none";
  const r = c.expense / calMaxExpense.value;
  return r > 0.66 ? "e4" : r > 0.33 ? "e3" : r > 0.12 ? "e2" : "e1";
}
const calHover = ref(null);
const weekHeads = ["日", "一", "二", "三", "四", "五", "六"];

/* 峰值摘要：周/月=最贵的一天，年=支出最高的月份 */
const peakText = computed(() => {
  const cells = calCells.value.filter((c) => c && !c.future);
  if (!cells.length) return "";
  const top = [...cells].sort((a, b) => b.expense - a.expense)[0];
  if (!(top.expense > 0)) return "";
  const money = "¥" + Math.round(top.expense).toLocaleString();
  if (range.value === "year") return `支出最高 ${top.label} · ${money}`;
  return `最贵的一天 ${top.label}${range.value === "month" ? " 日" : ""} · ${money}`;
});
const calTitle = computed(() =>
  range.value === "year" ? "收支月历" : range.value === "week" ? "近 7 天收支" : "收支日历"
);
function fmtCell(v) {
  return v >= 100 ? Math.round(v).toLocaleString() : v;
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
          <span v-if="offset !== 0" class="range-offset">（{{ rangeSubLabel }}）</span>
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

    <!-- 总览：维度主卡 + 收支卡 + 总计 -->
    <div class="stat-grid">
      <div class="yiyu-card stat-card stat-card--main" :class="'k-' + type">
        <span class="sum-label">
          本{{ range === "week" ? "周" : range === "month" ? "月" : "年" }}{{ typeUnit }}
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
            <b :class="diffPct > 0 ? 'up' : 'down'">{{ diffPct > 0 ? "↑" : "↓" }} {{ Math.abs(diffPct) }}%</b>
            <span class="diff-abs">（{{ diffAbs >= 0 ? "+" : "−" }}¥{{ Math.abs(diffAbs).toLocaleString(undefined, { maximumFractionDigits: 0 }) }}）</span>
          </template>
        </span>
        <span class="sum-faint num">日均 ¥{{ avgText.replace("¥", "") }} · {{ stats.count }} 笔</span>
      </div>

      <div class="yiyu-card stat-card" :class="{ dim: type === 'income' }">
        <span class="sum-label">支出</span>
        <span class="stat-num money-out">¥{{ stats.expense.toLocaleString(undefined, { maximumFractionDigits: 2 }) }}</span>
        <span class="sum-sub num">
          <template v-if="pct(stats.expense, prevStats.expense) === null">上期无数据</template>
          <template v-else>
            上期 ¥{{ prevStats.expense.toLocaleString(undefined, { maximumFractionDigits: 0 }) }}
            · {{ pct(stats.expense, prevStats.expense) }}%{{ stats.expense - prevStats.expense >= 0 ? "↑" : "↓" }}
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
            · {{ pct(stats.income, prevStats.income) }}%{{ stats.income - prevStats.income >= 0 ? "↑" : "↓" }}
          </template>
        </span>
        <div class="mini-bar"><i class="inn" :style="{ width: Math.min(100, (stats.income / Math.max(stats.income, prevStats.income, 1)) * 100) + '%' }"></i><i class="inn prev" :style="{ width: Math.min(100, (prevStats.income / Math.max(stats.income, prevStats.income, 1)) * 100) + '%' }"></i></div>
      </div>

      <div class="yiyu-card stat-card stat-card--total">
        <span class="sum-label">累计总计（{{ activeBook?.name }}）</span>
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
          <span v-if="!isTotal" class="chart-sub num">峰值 ¥{{ Math.max(...trendOption.series[0].data.map((v) => Math.abs(v || 0))).toLocaleString() }}</span>
        </div>
        <v-chart :option="trendOption" class="chart" autoresize />
      </div>

      <!-- 收支日历：周=近 7 天条 / 月=整月热力 / 年=12 月格 -->
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
                <span v-if="c.expense > 0" class="cal-out num">-{{ fmtCell(c.expense) }}</span>
                <span v-if="c.income > 0" class="cal-in num">+{{ fmtCell(c.income) }}</span>
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
                · <b class="money-out">-{{ calHover.expense.toFixed(2) }}</b>
                <template v-if="calHover.income"> <b class="money-in">+{{ calHover.income.toFixed(2) }}</b></template>
              </template>
              <template v-else>· 无记录</template>
            </span>
            <span v-else class="cal-hover cal-muted">悬停查看单{{ range === "year" ? "月" : "日" }}收支</span>
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
            <template v-if="isTotal">{{ c.kind === "expense" ? "支" : "收" }} · </template>{{ c.name }}
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

<style scoped>
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 18px;
  gap: 12px;
  flex-wrap: wrap;
}
.head-switch { display: flex; gap: 10px; flex-wrap: wrap; }
.head-sep { margin: 0 4px; color: var(--border-strong); }

/* 区间前后导航 */
.range-nav {
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-regular);
  border-radius: 6px;
  width: 22px;
  height: 22px;
  display: inline-grid;
  place-items: center;
  cursor: pointer;
  font-size: 12px;
  vertical-align: middle;
  transition: all var(--dur-base) ease;
  padding: 0;
}
.range-nav:hover:not(:disabled) { color: var(--color-primary); border-color: var(--card-border-on-hover); }
.range-nav:disabled { opacity: 0.35; cursor: not-allowed; }
.range-text { font-weight: 500; color: var(--text-regular); margin: 0 2px; }
.range-offset { font-size: 11px; color: var(--color-warning); }

/* ---- 概览卡 ---- */
.stat-grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr 1fr 1.2fr;
  gap: var(--gap-module);
  margin-bottom: var(--gap-module);
}
.stat-card {
  padding: var(--gap-card);
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  overflow: hidden;
}
.stat-card--main::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: var(--color-expense);
}
.stat-card--main.k-income::before { background: var(--color-income); }
.stat-card--main.k-total::before { background: var(--color-primary); }
.stat-card--main .main-num { font-size: 30px; }
.sum-label { font-size: var(--fs-caption); color: var(--text-secondary); display: flex; align-items: center; gap: 6px; }
.sum-offset {
  font-size: 10.5px;
  color: var(--color-warning);
  border: 1px solid color-mix(in srgb, var(--color-warning) 40%, transparent);
  border-radius: 999px;
  padding: 0 7px;
}
.sum-sub { font-size: 11.5px; color: var(--text-secondary); }
.sum-sub b.up { color: var(--expense-ink); }
.sum-sub b.down { color: var(--income-ink); }
.diff-abs { opacity: 0.75; }
.sum-faint { font-size: 11px; color: var(--text-secondary); opacity: 0.8; }
.stat-card.dim { opacity: 0.55; }
.stat-card.dim:hover { opacity: 1; }

/* 收支卡上的本期/上期对比条 */
.mini-bar {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 4px;
}
.mini-bar i { display: block; height: 4px; border-radius: 2px; min-width: 3px; }
.mini-bar .out { background: color-mix(in srgb, var(--color-expense) 70%, transparent); }
.mini-bar .inn { background: color-mix(in srgb, var(--color-income) 70%, transparent); }
.mini-bar .prev { opacity: 0.3; }

.stat-card--total {
  background: linear-gradient(135deg, color-mix(in srgb, var(--app-ledger) 8%, var(--bg-card)), var(--bg-card));
  border-color: color-mix(in srgb, var(--app-ledger) 30%, var(--border-color));
}
.tt-num { font-size: 15px; font-weight: 400; display: flex; gap: 4px; flex-wrap: wrap; }
.tt-part { color: var(--text-secondary); display: inline-flex; align-items: baseline; gap: 4px; margin-right: 8px; }
.tt-part b { font-size: 17px; font-weight: 600; }

/* ---- 图表区 ---- */
.chart-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: var(--gap-module);
}
.chart-card { padding: var(--gap-card); }
.pie-card { }
.chart-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.chart-title { font-size: var(--fs-card-title); font-weight: 600; }
.chart-sub { font-size: var(--fs-caption); color: var(--text-secondary); }
.chart { height: 260px; }
.chart--pie { height: 220px; }
.chart-empty {
  height: 220px;
  display: grid;
  place-items: center;
  color: var(--text-secondary);
  font-size: 13px;
}

/* ---- 收支日历 ---- */
.cal-card { display: flex; flex-direction: column; }
.cal { display: flex; flex-direction: column; flex: 1; }
.cal-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 6px;
}
.cal-week span { text-align: center; font-size: 11px; color: var(--text-secondary); }
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  flex: 1;
}
/* 周=7 格一行；年=12 月 4 列（大格） */
.cal-grid--week { grid-template-columns: repeat(7, 1fr); }
.cal-grid--week .cal-cell { min-height: 96px; max-height: 130px; }
.cal-grid--year { grid-template-columns: repeat(4, 1fr); gap: 8px; }
.cal-grid--year .cal-cell { min-height: 74px; }
.cal-cell {
  min-height: 46px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  padding: 4px 6px;
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow: hidden;
  transition: border-color var(--dur-base) ease, transform var(--dur-base) ease;
}
.cal-cell:hover, .cal-cell.hover { border-color: var(--card-border-on-hover); transform: translateY(-1px); }
.cal-cell.today { border-color: var(--color-primary); }
.cal-cell.today .cal-dom { color: var(--primary-ink); font-weight: 700; }
.cal-cell:empty, .cal-cell.lv-none { background: transparent; border-style: dashed; opacity: 0.55; }
.cal-cell.lv-future { background: transparent; border-style: dashed; opacity: 0.4; }
.cal-future-dom { color: var(--text-secondary); font-weight: 400; }
.cal-cell.lv-in { background: color-mix(in srgb, var(--color-income) 8%, var(--bg-card)); }
.cal-cell.lv-e1 { background: color-mix(in srgb, var(--color-expense) 10%, var(--bg-card)); }
.cal-cell.lv-e2 { background: color-mix(in srgb, var(--color-expense) 20%, var(--bg-card)); }
.cal-cell.lv-e3 { background: color-mix(in srgb, var(--color-expense) 34%, var(--bg-card)); }
.cal-cell.lv-e4 { background: color-mix(in srgb, var(--color-expense) 52%, var(--bg-card)); }
.cal-cell.lv-e3 .cal-dom, .cal-cell.lv-e4 .cal-dom { color: var(--text-primary); }
.cal-dom {
  align-self: flex-start;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}
/* 今日：数字变主题蓝 */
.cal-cell.today .cal-dom { color: var(--primary-ink); }
.cal-cell.lv-future .cal-dom { color: var(--text-secondary); font-weight: 500; opacity: 0.7; }
.cal-out { font-size: 10.5px; color: var(--expense-ink); white-space: nowrap; }
.cal-in { font-size: 10.5px; color: var(--income-ink); white-space: nowrap; }
/* 周/年大格：数字加大 */
.cal-grid--week .cal-dom, .cal-grid--year .cal-dom { font-size: 13px; }

.cal-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  font-size: 11.5px;
  min-height: 18px;
}
.cal-hover b { font-weight: 600; margin-right: 6px; }
.cal-muted { color: var(--text-secondary); opacity: 0.7; }
.cal-legend { display: inline-flex; align-items: center; gap: 3px; color: var(--text-secondary); font-size: 10.5px; white-space: nowrap; }
.lg-cell { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }
.lg-cell.lv-in { background: color-mix(in srgb, var(--color-income) 12%, var(--bg-card)); border: 1px solid var(--border-color); }
.lg-cell.lv-e1 { background: color-mix(in srgb, var(--color-expense) 10%, var(--bg-card)); border: 1px solid var(--border-color); }
.lg-cell.lv-e2 { background: color-mix(in srgb, var(--color-expense) 20%, var(--bg-card)); }
.lg-cell.lv-e3 { background: color-mix(in srgb, var(--color-expense) 34%, var(--bg-card)); }
.lg-cell.lv-e4 { background: color-mix(in srgb, var(--color-expense) 52%, var(--bg-card)); }
.cal-legend .lg-cell + .lg-cell { margin-left: 2px; }
.cal-legend .lg-cell.lv-e4 + * { margin-left: 6px; }

/* ---- 排行列表 ---- */
.rank-list { display: flex; flex-direction: column; gap: 2px; padding-top: 4px; }
.rank-row {
  display: grid;
  grid-template-columns: 22px minmax(64px, auto) 1fr 92px 40px;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px dashed var(--border-color);
  font-size: 13px;
}
.rank-row:last-child { border-bottom: none; }
.rank-idx {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  background: var(--bg-soft);
  color: var(--text-secondary);
  font-size: 11px;
  display: grid;
  place-items: center;
}
.rank-idx.top { background: color-mix(in srgb, var(--color-warning) 16%, transparent); color: var(--color-warning); font-weight: 700; }
.rank-name { display: flex; align-items: center; gap: 5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rank-kind {
  font-style: normal;
  font-size: 10px;
  border-radius: 4px;
  padding: 0 4px;
}
.rank-kind.expense { color: var(--expense-ink); background: color-mix(in srgb, var(--color-expense) 10%, transparent); }
.rank-kind.income { color: var(--income-ink); background: color-mix(in srgb, var(--color-income) 10%, transparent); }
.rank-bar { height: 8px; border-radius: 4px; background: var(--bg-soft); overflow: hidden; }
.rank-bar i { display: block; height: 100%; border-radius: 4px; transition: width var(--dur-sidebar) ease; }
.rank-bar i.expense { background: linear-gradient(90deg, color-mix(in srgb, var(--color-expense) 65%, transparent), var(--color-expense)); }
.rank-bar i.income { background: linear-gradient(90deg, color-mix(in srgb, var(--color-income) 65%, transparent), var(--color-income)); }
.rank-val { text-align: right; color: var(--text-regular); font-weight: 500; }
.rank-pct { text-align: right; color: var(--text-secondary); font-size: 11px; }

/* ---- 响应式 ---- */
@media (max-width: 1100px) {
  .stat-grid { grid-template-columns: repeat(2, 1fr); }
  .chart-grid { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .stat-grid { grid-template-columns: 1fr 1fr; }
  .stat-card--main, .stat-card--total { grid-column: span 2; }
  .tt-num { flex-direction: column; gap: 0; }
  .rank-row { grid-template-columns: 22px auto 1fr 70px; }
  .rank-pct { display: none; }
  .cal-cell { min-height: 38px; padding: 3px 4px; }
  .cal-out, .cal-in { display: none; }
  .cal-grid--week .cal-cell { min-height: 64px; }
  .cal-grid--year { grid-template-columns: repeat(3, 1fr); }
  .cal-grid--year .cal-cell { min-height: 60px; }
}
</style>
