<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { useAdminStore } from '../stores/admin'
import { useLedgerStore } from '@/modules/ledger/stores/ledger'
import { moduleLabels, actionLabels, actionTagTypes } from '../types'
import type { AdminLog } from '../types'

use([CanvasRenderer, BarChart, PieChart, GridComponent, TooltipComponent])

const adminStore = useAdminStore()
const ledgerStore = useLedgerStore()

/* ---- 统计卡(资源口径跨模块只读消费,遵循 PortalHome 先例;不展示流水/收支等业务数据) ---- */
const statCards = computed(() => [
  { label: '注册用户', value: `${adminStore.userCount}`, unit: '人', cls: '' },
  { label: '账本', value: `${ledgerStore.books.length}`, unit: '本', cls: '' },
])

/* ---- 近 7 日操作趋势(柱状,由日志按日聚合) ---- */
const trendOption = computed(() => {
  const axisColor = '#909399'
  const splitColor = 'rgba(144,147,153,0.18)'
  const days = adminStore.logCountByDay
  return {
    tooltip: { trigger: 'axis', formatter: (ps: { marker: string; axisValue: string; value: number }[]) => ps.map((p) => `${p.marker}${p.axisValue} ${p.value} 条`).join('') },
    grid: { left: 40, right: 20, top: 20, bottom: 28 },
    xAxis: { type: 'category', data: days.map((d) => d.label), axisLine: { lineStyle: { color: splitColor } }, axisLabel: { color: axisColor, fontSize: 11 } },
    yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: splitColor } }, axisLabel: { color: axisColor, fontSize: 11 } },
    series: [{
      name: '操作数',
      type: 'bar',
      barWidth: 22,
      itemStyle: { color: '#64748B', borderRadius: [4, 4, 0, 0] },
      data: days.map((d) => d.count),
    }],
  }
})

/* ---- 数据分布(环形:账本/用户/日志计数,不含流水等业务数据) ---- */
const distOption = computed(() => {
  const data = [
    { name: '账本', value: ledgerStore.books.length, itemStyle: { color: '#18A058' } },
    { name: '用户', value: adminStore.userCount, itemStyle: { color: '#7C6AF0' } },
    { name: '日志', value: adminStore.logCount, itemStyle: { color: '#F59B0E' } },
  ]
  return {
    tooltip: { trigger: 'item', formatter: (p: { name: string; value: number; percent: number }) => `${p.name} ${p.value}(${p.percent}%)` },
    series: [{
      type: 'pie',
      radius: ['58%', '82%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: 'transparent', borderWidth: 2 },
      label: { show: false },
      emphasis: { scaleSize: 6 },
      data,
    }],
  }
})

/* ---- 最近操作(最新 8 条) ---- */
const recentLogs = computed<AdminLog[]>(() => adminStore.latestLogs(8))
function operatorOf(l: AdminLog) {
  return adminStore.userById(l.operatorId)
}
</script>

<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h2 class="page-title">数据概览</h2>
        <p class="page-sub">系统资源与操作态势 · 截至 2026-09-07</p>
      </div>
    </div>

    <!-- 统计卡行 -->
    <div class="stat-grid">
      <div v-for="s in statCards" :key="s.label" class="yiyu-card stat-card">
        <span class="sum-label">{{ s.label }}</span>
        <span class="stat-num num" :class="s.cls">{{ s.value }}<small v-if="s.unit" class="unit"> {{ s.unit }}</small></span>
      </div>
    </div>

    <!-- 双图表区 -->
    <div class="chart-grid">
      <div class="yiyu-card chart-card">
        <div class="chart-head">
          <span class="chart-title">近 7 日操作趋势</span>
          <span class="chart-sub">09-01 ~ 09-07</span>
        </div>
        <v-chart :option="trendOption" class="chart" autoresize />
      </div>
      <div class="yiyu-card chart-card">
        <div class="chart-head">
          <span class="chart-title">数据分布</span>
          <span class="chart-sub">按资源类型</span>
        </div>
        <v-chart :option="distOption" class="chart chart--pie" autoresize />
      </div>
    </div>

    <!-- 最近操作 -->
    <div class="yiyu-card recent-card">
      <div class="chart-head">
        <span class="chart-title">最近操作</span>
        <router-link class="recent-more" to="/admin/logs">查看全部 →</router-link>
      </div>
      <div class="recent-list">
        <div v-for="l in recentLogs" :key="l.id" class="recent-row slide-in-row">
          <span class="recent-time num">{{ l.time.slice(5, 16) }}</span>
          <span class="recent-avatar">{{ operatorOf(l)?.avatar || '👤' }}</span>
          <span class="recent-name">{{ operatorOf(l)?.name || '未知用户' }}</span>
          <el-tag size="small" effect="plain" class="recent-module">{{ moduleLabels[l.moduleId] }}</el-tag>
          <el-tag size="small" :type="actionTagTypes[l.action]" effect="light">{{ actionLabels[l.action] }}</el-tag>
          <span class="recent-summary">{{ l.summary }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style src="./AdminDashboard.css" scoped></style>
