<script setup>
import { reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useLedgerStore } from "../../stores/ledger";

const store = useLedgerStore();

const roleLabels = { admin: "管理员", member: "成员", viewer: "只读" };

/* 新建账本 */
const createVisible = ref(false);
const form = reactive({ name: "", icon: "📘" });
const icons = ["📘", "🏗️", "✈️", "🏡", "🎓", "🏥", "🚗", "💎", "🧾", "🎯"];

function createBook() {
  if (!form.name.trim()) return ElMessage.warning("请输入账本名称");
  store.addBook({ name: form.name.trim(), icon: form.icon });
  createVisible.value = false;
  form.name = "";
  ElMessage.success("账本已创建");
}

function selectBook(b) {
  if (b.id === store.currentBookId) return;
  store.switchBook(b.id);
  ElMessage.success(`已切换到「${b.name}」`);
}

/* 成员管理 */
const memberVisible = ref(false);
const memberBook = ref(null);
const inviteName = ref("");

function openMembers(b) {
  memberBook.value = b;
  inviteName.value = "";
  memberVisible.value = true;
}
const bookMembers = () =>
  store.members.filter((m) => memberBook.value?.memberIds.includes(m.id));

function invite() {
  if (!inviteName.value.trim()) return ElMessage.warning("请输入用户名");
  memberBook.value.memberIds.push("u_new");
  ElMessage.success(`已向 ${inviteName.value} 发送邀请`);
  inviteName.value = "";
}

function changeRole(m, role) {
  m.role = role;
  ElMessage.success(`已将 ${m.name} 设为${roleLabels[role]}`);
}

function removeMember(m) {
  ElMessageBox.confirm(`确定将「${m.name}」移出账本吗？其历史流水将保留。`, "移除成员", {
    type: "warning",
    confirmButtonText: "移除",
  }).then(() => {
    memberBook.value.memberIds = memberBook.value.memberIds.filter((id) => id !== m.id);
    ElMessage.success("已移除");
  }).catch(() => {});
}
</script>

<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h2 class="page-title">账本管理</h2>
        <p class="page-sub">不同场景分开记，互不打扰</p>
      </div>
      <el-button type="primary" @click="createVisible = true">+ 新建账本</el-button>
    </div>

    <div class="book-grid">
      <div
        v-for="b in store.books"
        :key="b.id"
        class="yiyu-card yiyu-card--hover book-card"
        :class="{ current: b.id === store.currentBookId }"
        @click="selectBook(b)"
      >
        <span v-if="b.id === store.currentBookId" class="cur-badge">当前账本</span>
        <div class="book-top">
          <span class="book-icon">{{ b.icon }}</span>
          <div class="book-name-wrap">
            <span class="book-name">{{ b.name }}</span>
            <span class="book-stat num">本月支出 ¥{{ b.monthExpense.toLocaleString() }}</span>
          </div>
        </div>
        <div class="book-foot">
          <div class="avatars">
            <span
              v-for="mid in b.memberIds"
              :key="mid"
              class="mini-avatar"
            >{{ store.members.find((m) => m.id === mid)?.avatar || "🙂" }}</span>
            <span class="member-count">{{ b.memberIds.length }} 人协同</span>
          </div>
          <el-button size="small" text type="primary" @click.stop="openMembers(b)">成员管理</el-button>
        </div>
      </div>
    </div>

    <!-- 新建账本 -->
    <el-dialog v-model="createVisible" title="新建账本" width="420px">
      <el-form label-position="top" size="large">
        <el-form-item label="账本名称">
          <el-input v-model="form.name" placeholder="如：装修账、宝宝账" maxlength="12" />
        </el-form-item>
        <el-form-item label="封面图标">
          <div class="icon-row">
            <button
              v-for="ic in icons"
              :key="ic"
              class="icon-pick"
              :class="{ active: form.icon === ic }"
              @click="form.icon = ic"
            >{{ ic }}</button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="createBook">创建</el-button>
      </template>
    </el-dialog>

    <!-- 成员管理 -->
    <el-dialog v-model="memberVisible" :title="`成员管理 · ${memberBook?.name}`" width="480px">
      <div class="invite-row">
        <el-input v-model="inviteName" placeholder="输入用户名邀请" size="large">
          <template #append>
            <el-button type="primary" @click="invite">邀请</el-button>
          </template>
        </el-input>
      </div>
      <div class="member-list">
        <div v-for="m in bookMembers()" :key="m.id" class="member-row">
          <span class="m-avatar">{{ m.avatar }}</span>
          <span class="m-name">{{ m.name }}</span>
          <el-tag size="small" :type="m.role === 'admin' ? 'primary' : m.role === 'viewer' ? 'info' : 'success'">
            {{ roleLabels[m.role] }}
          </el-tag>
          <div class="m-actions">
            <el-select
              v-if="m.role !== 'admin'"
              :model-value="m.role"
              size="small"
              style="width: 96px"
              @change="(r) => changeRole(m, r)"
            >
              <el-option value="member" label="设为成员" />
              <el-option value="viewer" label="设为只读" />
            </el-select>
            <el-button v-if="m.role !== 'admin'" size="small" text type="danger" @click="removeMember(m)">移除</el-button>
          </div>
        </div>
      </div>
      <p class="role-tip">管理员可管理成员与分类；成员可记账及管理自己的流水；只读仅可查看。</p>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 18px;
}

.book-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--gap-module);
}

.book-card {
  position: relative;
  padding: var(--gap-card);
  cursor: pointer;
  border: 1px solid var(--border-color);
}
.book-card.current {
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 3%, var(--bg-card));
}
.cur-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 11px;
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  border-radius: 999px;
  padding: 3px 10px;
}

.book-top { display: flex; align-items: center; gap: 14px; }
.book-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: var(--bg-soft);
  display: grid;
  place-items: center;
  font-size: 26px;
}
.book-name-wrap { display: flex; flex-direction: column; gap: 3px; }
.book-name { font-size: 16px; font-weight: 600; }
.book-stat { font-size: var(--fs-caption); color: var(--text-secondary); }

.book-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed var(--border-color);
}
.avatars { display: flex; align-items: center; }
.mini-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--bg-soft);
  border: 2px solid var(--bg-card);
  display: grid;
  place-items: center;
  font-size: 13px;
  margin-left: -6px;
}
.mini-avatar:first-child { margin-left: 0; }
.member-count { margin-left: 8px; font-size: var(--fs-caption); color: var(--text-secondary); }

.icon-row { display: flex; gap: 8px; flex-wrap: wrap; }
.icon-pick {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  font-size: 20px;
  cursor: pointer;
  transition: all var(--dur-base) ease;
}
.icon-pick:hover { border-color: var(--card-border-on-hover); }
.icon-pick.active { border-color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 8%, transparent); }

.invite-row { margin-bottom: 14px; }
.member-list { display: flex; flex-direction: column; }
.member-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px dashed var(--border-color);
}
.m-avatar { width: 34px; height: 34px; border-radius: 50%; background: var(--bg-soft); display: grid; place-items: center; font-size: 17px; }
.m-name { font-size: 14px; min-width: 56px; }
.m-actions { margin-left: auto; display: flex; gap: 8px; align-items: center; }
.role-tip { margin-top: 12px; font-size: var(--fs-caption); color: var(--text-secondary); line-height: 1.6; }
</style>
