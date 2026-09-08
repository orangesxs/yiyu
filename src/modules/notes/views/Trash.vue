<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { useNotesStore } from '../stores/notes'
import type { TrashedNote } from '../types'

const store = useNotesStore()

function restore(n: TrashedNote) {
  store.restore(n.id)
  ElMessage.success(`「${n.title}」已恢复`)
}
function destroy(n: TrashedNote) {
  ElMessageBox.confirm(`彻底删除后无法恢复,确定删除「${n.title}」吗?`, '彻底删除', {
    type: 'warning',
    confirmButtonText: '彻底删除',
  }).then(() => {
    store.destroy(n.id)
    ElMessage.success('已彻底删除')
  }).catch(() => {})
}
</script>

<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h2 class="page-title">回收站</h2>
        <p class="page-sub">已删除的笔记保留 30 天,到期自动清除</p>
      </div>
    </div>

    <div v-if="!store.trash.length" class="empty-box yiyu-card">
      <span class="empty-icon">🧹</span>
      <p>回收站是空的</p>
      <p class="empty-sub">删除的笔记会在这里等你 30 天</p>
    </div>

    <div v-else class="trash-list">
      <div v-for="n in store.trash" :key="n.id" class="yiyu-card trash-row">
        <div class="tr-main">
          <span class="tr-title">{{ n.title }}</span>
          <span class="tr-meta num">删除于 {{ n.deletedAt.slice(5, 16) }} · 剩余 {{ n.remainDays }} 天</span>
        </div>
        <div class="tr-actions">
          <el-progress type="circle" :percentage="Math.round((n.remainDays / 30) * 100)" :width="34" :stroke-width="3" :show-text="false" />
          <el-button size="small" type="primary" plain @click="restore(n)">恢复</el-button>
          <el-button size="small" text type="danger" @click="destroy(n)">彻底删除</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-head { margin-bottom: 18px; }

.empty-box {
  padding: 70px 0;
  text-align: center;
  color: var(--text-secondary);
}
.empty-icon { font-size: 42px; }
.empty-box p { margin-top: 12px; font-size: 14px; }
.empty-sub { font-size: var(--fs-caption) !important; margin-top: 6px !important; }

.trash-list { display: flex; flex-direction: column; gap: 10px; }
.trash-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
}
.tr-main { display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1; }
.tr-title { font-size: 14.5px; font-weight: 600; }
.tr-meta { font-size: var(--fs-caption); color: var(--text-secondary); }
.tr-actions { display: flex; align-items: center; gap: 10px; }
</style>
