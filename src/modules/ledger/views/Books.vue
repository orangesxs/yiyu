<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useLedgerStore } from '../stores/ledger'
import { useProfileStore } from '../../profile/stores/profile'
import type { Book, Member, MemberRole } from '../types'
import type { Friend } from '../../profile/types'

const store = useLedgerStore()
const profileStore = useProfileStore()

const roleLabels: Record<MemberRole, string> = { admin: '管理员', member: '成员', viewer: '只读' }

/* 新建账本 */
const createVisible = ref(false)
const form = reactive({ name: '', icon: '📘' })
const icons = ['📘', '🏗️', '✈️', '🏡', '🎓', '🏥', '🚗', '💎', '🧾', '🎯']

function createBook() {
  if (!form.name.trim()) return ElMessage.warning('请输入账本名称')
  store.addBook({ name: form.name.trim(), icon: form.icon })
  createVisible.value = false
  form.name = ''
  ElMessage.success('账本已创建')
}

function selectBook(b: Book) {
  if (b.id === store.currentBookId) return
  store.switchBook(b.id)
  ElMessage.success(`已切换到「${b.name}」`)
}

/* 成员管理 */
const memberVisible = ref(false)
const memberBook = ref<Book | null>(null)
const inviteIds = ref<string[]>([])

function openMembers(b: Book) {
  memberBook.value = b
  inviteIds.value = []
  memberVisible.value = true
}
const bookMembers = (): Member[] =>
  store.members.filter((m) => memberBook.value?.memberIds.includes(m.id))

/* 邀请候选:全部好友,过滤账本已有成员 */
const friendCandidates = () =>
  profileStore.friends.filter((f) => !memberBook.value?.memberIds.includes(f.id))
const friendName = (f: Friend) => f.remark || f.name

function invite() {
  if (!inviteIds.value.length) return ElMessage.warning('请选择要邀请的好友')
  if (!memberBook.value) return
  const picked = profileStore.friends.filter((f) => inviteIds.value.includes(f.id))
  store.addMembers(memberBook.value.id, picked.map((f) => ({ id: f.id, name: friendName(f), avatar: f.avatar })))
  ElMessage.success(`已邀请 ${picked.map(friendName).join('、')} 加入账本`)
  inviteIds.value = []
}

function changeRole(m: Member, role: MemberRole) {
  m.role = role
  ElMessage.success(`已将 ${m.name} 设为${roleLabels[role]}`)
}

function removeMember(m: Member) {
  if (!memberBook.value) return
  ElMessageBox.confirm(`确定将「${m.name}」移出账本吗?其历史流水将保留。`, '移除成员', {
    type: 'warning',
    confirmButtonText: '移除',
  }).then(() => {
    memberBook.value!.memberIds = memberBook.value!.memberIds.filter((id) => id !== m.id)
    ElMessage.success('已移除')
  }).catch(() => {})
}
</script>

<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h2 class="page-title">账本管理</h2>
        <p class="page-sub">不同场景分开记,互不打扰</p>
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
            >{{ store.members.find((m) => m.id === mid)?.avatar || '🙂' }}</span>
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
          <el-input v-model="form.name" placeholder="如:装修账、宝宝账" maxlength="12" />
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
        <el-select
          v-model="inviteIds"
          multiple
          collapse-tags
          placeholder="从好友中选择"
          size="large"
          style="width: calc(100% - 84px)"
          no-data-text="好友都已在账本中"
        >
          <el-option v-for="f in friendCandidates()" :key="f.id" :value="f.id" :label="friendName(f)">
            <span class="invite-opt"><span class="opt-avatar">{{ f.avatar }}</span>{{ friendName(f) }}</span>
          </el-option>
        </el-select>
        <el-button type="primary" size="large" style="margin-left: 8px" @click="invite">邀请</el-button>
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
              @change="(r: MemberRole) => changeRole(m, r)"
            >
              <el-option value="member" label="设为成员" />
              <el-option value="viewer" label="设为只读" />
            </el-select>
            <el-button v-if="m.role !== 'admin'" size="small" text type="danger" @click="removeMember(m)">移除</el-button>
          </div>
        </div>
      </div>
      <p class="role-tip">管理员可管理成员与分类;成员可记账及管理自己的流水;只读仅可查看。</p>
    </el-dialog>
  </div>
</template>

<style src="./Books.css" scoped></style>
