<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTodosStore, type TodoFilter } from '../stores/todos'
import { statusMeta, priorityMeta } from '../types'
import type { Todo, TodoStatus, TodoPriority } from '../types'

const store = useTodosStore()

/* 筛选 Tab */
const tabs: { key: TodoFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'todo', label: '待开始' },
  { key: 'doing', label: '进行中' },
  { key: 'overdue', label: '已逾期' },
  { key: 'done', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
]

const showGroups = computed(() => (store.filter === 'all' ? store.grouped : [{ key: store.filter as TodoStatus, items: store.filtered }]))

/* 时间显示 */
function fmtTime(s: string) {
  return s ? s.slice(5, 16).replace(' ', ' ') : ''
}
function sameDay(a: string | null, b: string | null) {
  return !!a && !!b && a.slice(0, 10) === b.slice(0, 10)
}
function timeRange(t: Todo) {
  if (!t.start) return ''
  const s = fmtTime(t.start)
  if (!t.end) return s
  return sameDay(t.start, t.end) ? `${s} → ${t.end.slice(11, 16)}` : `${s} → ${fmtTime(t.end)}`
}
const isToday = '2026-09-07'
function dayTag(t: Todo) {
  const d = t.start?.slice(0, 10)
  if (!d) return ''
  if (d === isToday) return '今天'
  if (d === '2026-09-08') return '明天'
  if (d < isToday && t.status !== 'done') return ''
  return ''
}

/* 新建 / 编辑 */
const dialog = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({
  title: '',
  note: '',
  date: '2026-09-07',
  start: '09:00',
  end: '10:00',
  priority: 'mid' as TodoPriority,
  remind: null as string | null,
})
const priorities: { key: TodoPriority; label: string }[] = [
  { key: 'high', label: '高' },
  { key: 'mid', label: '中' },
  { key: 'low', label: '低' },
]

function openCreate() {
  editingId.value = null
  Object.assign(form, { title: '', note: '', date: isToday, start: '09:00', end: '10:00', priority: 'mid', remind: null })
  dialog.value = true
}
function openEdit(t: Todo) {
  editingId.value = t.id
  Object.assign(form, {
    title: t.title,
    note: t.note || '',
    date: t.start?.slice(0, 10) || isToday,
    start: t.start?.slice(11, 16) || '09:00',
    end: t.end?.slice(11, 16) || '10:00',
    priority: t.priority,
    remind: t.remind?.slice(11, 16) || null,
  })
  dialog.value = true
}
function save() {
  if (!form.title.trim()) return ElMessage.warning('给待办起个名字')
  if (!form.date) return ElMessage.warning('选择日期')
  if (form.end && form.start && form.end < form.start) return ElMessage.warning('结束时间不能早于开始时间')
  const payload = {
    title: form.title.trim(),
    note: form.note,
    start: `${form.date} ${form.start || '09:00'}`,
    end: `${form.date} ${form.end || '10:00'}`,
    priority: form.priority,
    remind: form.remind ? `${form.date} ${form.remind}` : null,
  }
  if (editingId.value) {
    store.updateTodo(editingId.value, payload)
    ElMessage.success('已保存')
  } else {
    store.createTodo(payload)
    ElMessage.success('已创建待办 ✓')
  }
  dialog.value = false
}

/* 状态操作 */
function act(t: Todo, action: string) {
  if (action === 'start') { store.start(t.id); ElMessage.success(`「${t.title}」开始推进`) }
  if (action === 'done') { store.complete(t.id); ElMessage.success(`完成「${t.title}」🎉`) }
  if (action === 'reopen') { store.reopen(t.id) }
  if (action === 'cancel') {
    store.cancel(t.id)
    ElMessage.info(`已取消「${t.title}」`)
  }
}
function remove(t: Todo) {
  ElMessageBox.confirm(`删除待办「${t.title}」?`, '删除待办', {
    type: 'warning', confirmButtonText: '删除',
  }).then(() => {
    store.remove(t.id)
    ElMessage.success('已删除')
  }).catch(() => {})
}
</script>

<template>
  <div class="todo-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">待办提醒</h2>
        <p class="page-sub">{{ store.counts.doing }} 个进行中 · {{ store.counts.todo }} 个待开始 · {{ store.counts.overdue }} 个逾期</p>
      </div>
      <el-button type="primary" @click="openCreate">
        <el-icon style="margin-right: 4px"><Plus /></el-icon>新建待办
      </el-button>
    </div>

    <!-- 状态筛选 -->
    <div class="tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-item"
        :class="{ active: store.filter === tab.key }"
        @click="store.filter = tab.key"
      >
        {{ tab.label }}
        <span class="tab-count num">{{ store.counts[tab.key] }}</span>
      </button>
    </div>

    <!-- 状态分组清单 -->
    <div class="todo-scroll">
      <div v-for="g in showGroups" :key="g.key" class="group">
        <div class="group-head">
          <span class="group-dot" :class="g.key"></span>
          <span class="group-title">{{ statusMeta[g.key].label }}</span>
          <span class="group-count num">{{ g.items.length }}</span>
        </div>

        <div
          v-for="t in g.items"
          :key="t.id"
          class="yiyu-card todo-row"
          :class="['st-' + t.status]"
          :style="{ '--p-color': priorityMeta[t.priority].color }"
        >
          <!-- 状态圆点(可点击完成/取消) -->
          <el-dropdown v-if="!['done', 'cancelled'].includes(t.status)" trigger="click" @command="(cmd: string) => act(t, cmd)">
            <button class="state-dot" title="点击完成,右侧菜单可取消">
              <span v-if="t.status === 'doing'" class="half"></span>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="done">标记完成</el-dropdown-item>
                <el-dropdown-item command="cancel">取消待办</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <button v-else class="state-dot" :title="t.status === 'done' ? '重新打开' : '恢复待办'" @click="act(t, 'reopen')">
            <el-icon v-if="t.status === 'done'"><Check /></el-icon>
            <el-icon v-else class="cancel-mark"><Close /></el-icon>
          </button>

          <div class="todo-main">
            <div class="todo-title-row">
              <span class="todo-title">{{ t.title }}</span>
              <span class="p-flag" :style="{ background: `color-mix(in srgb, ${priorityMeta[t.priority].color} 12%, transparent)`, color: priorityMeta[t.priority].color }">
                {{ priorityMeta[t.priority].label }}优先
              </span>
              <span v-if="dayTag(t)" class="day-flag">{{ dayTag(t) }}</span>
            </div>
            <div class="todo-sub">
              <span class="time num">
                <el-icon><Clock /></el-icon>{{ timeRange(t) }}
              </span>
              <el-tag size="small" :type="statusMeta[t.status].type" effect="light">{{ statusMeta[t.status].label }}</el-tag>
              <span v-if="t.remind" class="remind">
                <el-icon><Bell /></el-icon>{{ t.remind.slice(5, 16) }}
              </span>
            </div>
            <p v-if="t.note" class="todo-note">{{ t.note }}</p>
          </div>

          <div class="todo-actions">
            <template v-if="t.status === 'todo'">
              <el-button size="small" round @click="act(t, 'start')">开始</el-button>
            </template>
            <template v-else-if="t.status === 'doing'">
              <el-button size="small" round type="success" plain @click="act(t, 'done')">完成</el-button>
            </template>
            <template v-else-if="t.status === 'overdue'">
              <el-button size="small" round type="danger" plain @click="act(t, 'done')">补完成</el-button>
            </template>
            <template v-else-if="t.status === 'done' && t.doneAt">
              <span class="done-at num">{{ t.doneAt.slice(5, 16) }} 完成</span>
            </template>
            <el-icon v-if="!['done', 'cancelled'].includes(t.status)" class="row-cancel" title="取消待办" @click="act(t, 'cancel')"><CircleClose /></el-icon>
            <el-icon class="row-edit" title="编辑" @click="openEdit(t)"><EditPen /></el-icon>
            <el-icon class="row-del" title="删除" @click="remove(t)"><Delete /></el-icon>
          </div>
        </div>
      </div>

      <div v-if="!store.filtered.length" class="empty-box">
        <span class="empty-icon">🗒️</span>
        <p>这里没有待办</p>
      </div>
    </div>

    <!-- 新建 / 编辑对话框 -->
    <el-dialog v-model="dialog" :title="editingId ? '编辑待办' : '新建待办'" width="460px" :close-on-click-modal="false" class="todo-dialog">
      <div class="dlg">
        <input v-model="form.title" class="dlg-title" placeholder="要做什么?" maxlength="30" />
        <div class="dlg-quick">
          <span class="dq-label">优先级</span>
          <div class="dq-prio">
            <button
              v-for="p in priorities"
              :key="p.key"
              class="dq-prio-btn"
              :class="[p.key, { active: form.priority === p.key }]"
              @click="form.priority = p.key"
            >{{ p.label }}</button>
          </div>
        </div>
        <div class="dlg-grid">
          <div class="dg-item">
            <span class="dg-label">日期</span>
            <el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" size="large" style="width: 100%" />
          </div>
          <div class="dg-item">
            <span class="dg-label">开始</span>
            <el-time-select v-model="form.start" start="00:00" step="00:15" end="23:45" placeholder="开始" size="large" style="width: 100%" />
          </div>
          <div class="dg-item">
            <span class="dg-label">结束</span>
            <el-time-select v-model="form.end" :start="form.start || '00:00'" step="00:15" end="23:45" placeholder="结束" size="large" style="width: 100%" />
          </div>
          <div class="dg-item">
            <span class="dg-label">提醒</span>
            <el-time-select v-model="form.remind" start="00:00" step="00:15" end="23:45" placeholder="不提醒" size="large" style="width: 100%" clearable />
          </div>
        </div>
        <el-input
          v-model="form.note"
          type="textarea"
          :rows="2"
          placeholder="备注(可选)"
          maxlength="100"
          class="dlg-note"
          resize="none"
        />
      </div>
      <template #footer>
        <el-button @click="dialog = false">取消</el-button>
        <el-button type="primary" @click="save">{{ editingId ? '保存' : '创建' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style src="./Todos.css" scoped></style>
