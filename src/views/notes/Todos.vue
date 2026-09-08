<script setup>
import { ref, reactive, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useTodosStore } from "../../stores/todos";
import { statusMeta, priorityMeta } from "../../mock/todos";

const store = useTodosStore();

/* 筛选 Tab */
const tabs = [
  { key: "all", label: "全部" },
  { key: "todo", label: "待开始" },
  { key: "doing", label: "进行中" },
  { key: "overdue", label: "已逾期" },
  { key: "done", label: "已完成" },
  { key: "cancelled", label: "已取消" },
];

const showGroups = computed(() => (store.filter === "all" ? store.grouped : [{ key: store.filter, items: store.filtered }]));

/* 时间显示 */
function fmtTime(s) {
  return s ? s.slice(5, 16).replace(" ", " ") : "";
}
function sameDay(a, b) {
  return a && b && a.slice(0, 10) === b.slice(0, 10);
}
function timeRange(t) {
  if (!t.start) return "";
  const s = fmtTime(t.start);
  if (!t.end) return s;
  return sameDay(t.start, t.end) ? `${s} → ${t.end.slice(11, 16)}` : `${s} → ${fmtTime(t.end)}`;
}
const isToday = "2026-09-07";
function dayTag(t) {
  const d = t.start?.slice(0, 10);
  if (!d) return "";
  if (d === isToday) return "今天";
  if (d === "2026-09-08") return "明天";
  if (d < isToday && t.status !== "done") return "";
  return "";
}
function remainText(t) {
  if (t.status !== "doing") return "";
  if (!t.end || !t.end.startsWith(isToday)) return "";
  return "进行中";
}

/* 新建 / 编辑 */
const dialog = ref(false);
const editingId = ref(null);
const form = reactive({
  title: "",
  note: "",
  date: "2026-09-07",
  start: "09:00",
  end: "10:00",
  priority: "mid",
  remind: null,
});
const priorities = [
  { key: "high", label: "高" },
  { key: "mid", label: "中" },
  { key: "low", label: "低" },
];

function openCreate() {
  editingId.value = null;
  Object.assign(form, { title: "", note: "", date: isToday, start: "09:00", end: "10:00", priority: "mid", remind: null });
  dialog.value = true;
}
function openEdit(t) {
  editingId.value = t.id;
  Object.assign(form, {
    title: t.title,
    note: t.note || "",
    date: t.start?.slice(0, 10) || isToday,
    start: t.start?.slice(11, 16) || "09:00",
    end: t.end?.slice(11, 16) || "10:00",
    priority: t.priority,
    remind: t.remind?.slice(11, 16) || null,
  });
  dialog.value = true;
}
function save() {
  if (!form.title.trim()) return ElMessage.warning("给待办起个名字");
  if (!form.date) return ElMessage.warning("选择日期");
  if (form.end && form.start && form.end < form.start) return ElMessage.warning("结束时间不能早于开始时间");
  const payload = {
    title: form.title.trim(),
    note: form.note,
    start: `${form.date} ${form.start || "09:00"}`,
    end: `${form.date} ${form.end || "10:00"}`,
    priority: form.priority,
    remind: form.remind ? `${form.date} ${form.remind}` : null,
  };
  if (editingId.value) {
    store.updateTodo(editingId.value, payload);
    ElMessage.success("已保存");
  } else {
    store.createTodo(payload);
    ElMessage.success("已创建待办 ✓");
  }
  dialog.value = false;
}

/* 状态操作 */
function act(t, action) {
  if (action === "start") { store.start(t.id); ElMessage.success(`「${t.title}」开始推进`); }
  if (action === "done") { store.complete(t.id); ElMessage.success(`完成「${t.title}」🎉`); }
  if (action === "reopen") { store.reopen(t.id); }
  if (action === "cancel") {
    store.cancel(t.id);
    ElMessage.info(`已取消「${t.title}」`);
  }
}
function remove(t) {
  ElMessageBox.confirm(`删除待办「${t.title}」？`, "删除待办", {
    type: "warning", confirmButtonText: "删除",
  }).then(() => {
    store.remove(t.id);
    ElMessage.success("已删除");
  }).catch(() => {});
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
          <!-- 状态圆点（可点击完成/取消） -->
          <el-dropdown v-if="!['done', 'cancelled'].includes(t.status)" trigger="click" @command="(cmd) => act(t, cmd)">
            <button class="state-dot" title="点击完成，右侧菜单可取消">
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
        <input v-model="form.title" class="dlg-title" placeholder="要做什么？" maxlength="30" />
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
          placeholder="备注（可选）"
          maxlength="100"
          class="dlg-note"
          resize="none"
        />
      </div>
      <template #footer>
        <el-button @click="dialog = false">取消</el-button>
        <el-button type="primary" @click="save">{{ editingId ? "保存" : "创建" }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.todo-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-width: 980px;
  width: 100%;
  margin: 0 auto;
  padding: var(--gap-page);
  padding-bottom: 0;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

/* 状态 Tab */
.tab-bar {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  padding-bottom: 14px;
}
.tab-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-regular);
  border-radius: 999px;
  padding: 7px 16px;
  font-size: 13px;
  cursor: pointer;
  transition: all var(--dur-base) ease;
}
.tab-item:hover { border-color: var(--card-border-on-hover); color: var(--text-primary); }
.tab-item.active {
  border-color: var(--app-notes);
  background: color-mix(in srgb, var(--app-notes) 10%, transparent);
  color: var(--app-notes);
  font-weight: 500;
}
.tab-count {
  font-size: 11px;
  background: var(--bg-soft);
  border-radius: 999px;
  padding: 1px 7px;
  color: var(--text-secondary);
}
.tab-item.active .tab-count {
  background: color-mix(in srgb, var(--app-notes) 16%, transparent);
  color: var(--app-notes);
}

/* 滚动区 */
.todo-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-bottom: var(--gap-page);
}

.group { margin-bottom: 20px; }
.group-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.group-dot { width: 8px; height: 8px; border-radius: 50%; }
.group-dot.doing { background: var(--color-primary); }
.group-dot.todo { background: var(--border-strong); }
.group-dot.overdue { background: var(--color-expense); }
.group-dot.done { background: var(--color-income); }
.group-dot.cancelled { background: var(--text-secondary); }
.group-title { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
.group-count { font-size: 11px; color: var(--text-secondary); }

/* 行 */
.todo-row {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 18px;
  margin-bottom: 8px;
  transition: transform var(--dur-base) ease, box-shadow var(--dur-base) ease;
}
.todo-row:hover { transform: translateY(-1px); }
.todo-row.st-done .todo-title { text-decoration: line-through; color: var(--text-secondary); }
.todo-row.st-done { opacity: 0.72; }
.todo-row.st-cancelled .todo-title { text-decoration: line-through; color: var(--text-secondary); }
.todo-row.st-cancelled { opacity: 0.55; }
.st-cancelled .p-flag { filter: grayscale(1); }

.state-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid var(--border-strong);
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
  margin-top: 2px;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 12px;
  transition: all var(--dur-base) ease var(--ease-spring);
}
.state-dot:hover { border-color: var(--app-notes); }
.state-dot .half {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-primary);
}
.st-doing .state-dot { border-color: var(--color-primary); }
.st-done .state-dot {
  background: var(--color-income);
  border-color: var(--color-income);
}
.st-cancelled .state-dot {
  border-style: dashed;
  border-color: var(--text-secondary);
}
.st-cancelled .state-dot .cancel-mark { color: var(--text-secondary); font-size: 13px; }

.todo-main { flex: 1; min-width: 0; }
.todo-title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.todo-title { font-size: 14.5px; font-weight: 600; }
.p-flag {
  font-size: 10.5px;
  border-radius: 999px;
  padding: 1px 8px;
  white-space: nowrap;
}
.day-flag {
  font-size: 10.5px;
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  border-radius: 999px;
  padding: 1px 8px;
}

.todo-sub {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-secondary);
  flex-wrap: wrap;
}
.time { display: inline-flex; align-items: center; gap: 4px; }
.remind { display: inline-flex; align-items: center; gap: 4px; color: var(--color-warning); }

.todo-note {
  margin: 8px 0 0;
  font-size: 12.5px;
  color: var(--text-secondary);
  background: var(--bg-soft);
  border-radius: var(--radius-input);
  padding: 7px 10px;
}

.todo-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.done-at { font-size: 11.5px; color: var(--text-secondary); }
.row-cancel, .row-edit, .row-del {
  color: var(--text-secondary);
  cursor: pointer;
  padding: 5px;
  border-radius: 6px;
}
.row-cancel:hover { color: var(--text-regular); background: var(--bg-soft); }
.row-edit:hover { color: var(--color-primary); background: var(--bg-soft); }
.row-del:hover { color: var(--expense-ink); background: var(--bg-soft); }

.empty-box {
  padding: 70px 0;
  text-align: center;
  color: var(--text-secondary);
}
.empty-icon { font-size: 40px; }
.empty-box p { margin-top: 10px; }

/* 新建弹窗 */
.dlg { display: flex; flex-direction: column; gap: 16px; }
.dlg-title {
  border: none;
  outline: none;
  background: transparent;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  font-family: var(--font-body);
  padding: 0;
}
.dlg-title::placeholder { color: var(--border-strong); font-weight: 500; }

.dlg-quick { display: flex; align-items: center; gap: 12px; }
.dq-label, .dg-label { font-size: var(--fs-caption); color: var(--text-secondary); }
.dq-prio { display: flex; gap: 6px; }
.dq-prio-btn {
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-regular);
  border-radius: 999px;
  padding: 5px 16px;
  font-size: 13px;
  cursor: pointer;
  transition: all var(--dur-base) ease;
}
.dq-prio-btn.high.active { border-color: #e5484d; background: color-mix(in srgb, #e5484d 10%, transparent); color: #d63841; }
.dq-prio-btn.mid.active { border-color: #f59b0e; background: color-mix(in srgb, #f59b0e 10%, transparent); color: #b47309; }
.dq-prio-btn.low.active { border-color: var(--border-strong); background: var(--bg-soft); color: var(--text-primary); }

.dlg-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 10px;
}
.dg-item { display: flex; flex-direction: column; gap: 6px; }
.dlg-note { margin-top: 2px; }

@media (max-width: 640px) {
  .todo-row { flex-wrap: wrap; }
  .todo-actions { width: 100%; justify-content: flex-end; }
}
</style>
