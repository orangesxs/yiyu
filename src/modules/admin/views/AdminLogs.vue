<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { useAdminStore } from '../stores/admin'
import { moduleLabels, actionLabels, actionTagTypes } from '../types'
import type { AdminLog, LogModule, LogAction } from '../types'

const adminStore = useAdminStore()

/* ---- 统计行 ---- */
const stats = computed(() => [
  { label: '日志总数', value: adminStore.logCount },
  { label: '今日(09-07)', value: adminStore.logTodayCount },
  { label: '安全类', value: adminStore.logSecurityCount },
])

/* ---- 筛选(模块 + 类型 + 关键词) ---- */
const moduleFilter = ref<LogModule | ''>('')
const actionFilter = ref<LogAction | ''>('')
const keyword = ref('')

function filteredLogs(): AdminLog[] {
  const kw = keyword.value.trim().toLowerCase()
  return adminStore.logs.filter((l) => {
    if (moduleFilter.value && l.moduleId !== moduleFilter.value) return false
    if (actionFilter.value && l.action !== actionFilter.value) return false
    if (kw) {
      const op = adminStore.userById(l.operatorId)
      const hit = l.summary.toLowerCase().includes(kw) || (op ? op.name.toLowerCase().includes(kw) : false)
      if (!hit) return false
    }
    return true
  })
}
const hasFilter = computed(() => !!moduleFilter.value || !!actionFilter.value || !!keyword.value.trim())
function clearFilters() {
  moduleFilter.value = ''
  actionFilter.value = ''
  keyword.value = ''
}

function operatorOf(l: AdminLog) {
  return adminStore.userById(l.operatorId)
}
</script>

<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h2 class="page-title">系统日志</h2>
        <p class="page-sub">只读操作审计 · 最新在前</p>
      </div>
    </div>

    <!-- 统计行 -->
    <div class="log-stats">
      <div v-for="s in stats" :key="s.label" class="user-stat">
        <span class="stat-num num">{{ s.value }}</span>
        <span class="user-stat-label">{{ s.label }}</span>
      </div>
    </div>

    <!-- 筛选区 -->
    <div class="yiyu-card filter-bar">
      <el-select v-model="moduleFilter" placeholder="模块" clearable class="filter-select">
        <el-option v-for="(label, key) in moduleLabels" :key="key" :label="label" :value="key" />
      </el-select>
      <el-select v-model="actionFilter" placeholder="类型" clearable class="filter-select">
        <el-option v-for="(label, key) in actionLabels" :key="key" :label="label" :value="key" />
      </el-select>
      <el-input v-model="keyword" placeholder="搜索摘要或操作人" :prefix-icon="Search" clearable class="filter-search" />
    </div>

    <!-- 日志列表(只读,无操作列) -->
    <div class="yiyu-card log-list">
      <div v-for="l in filteredLogs()" :key="l.id" class="log-row slide-in-row">
        <span class="log-time num">{{ l.time }}</span>
        <span class="log-avatar">{{ operatorOf(l)?.avatar || '👤' }}</span>
        <span class="log-name">{{ operatorOf(l)?.name || '未知用户' }}</span>
        <el-tag size="small" effect="plain" class="log-module">{{ moduleLabels[l.moduleId] }}</el-tag>
        <el-tag size="small" :type="actionTagTypes[l.action]" effect="light">{{ actionLabels[l.action] }}</el-tag>
        <span class="log-summary">{{ l.summary }}</span>
      </div>

      <div v-if="!filteredLogs().length" class="empty">
        <span class="empty-icon">📭</span>
        <p>没有符合条件的日志</p>
        <el-button v-if="hasFilter" size="small" @click="clearFilters">清空筛选</el-button>
      </div>
    </div>
  </div>
</template>

<style src="./AdminLogs.css" scoped></style>
