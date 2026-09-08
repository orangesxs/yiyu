<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useProfileStore } from '../stores/profile'
import { useLedgerStore } from '../../ledger/stores/ledger'
import { sourceLabels } from '../types'
import type { CandidateUser, Friend, PendingRequest } from '../types'

const profileStore = useProfileStore()
const ledgerStore = useLedgerStore()

/* 列表搜索(昵称/备注,大小写不敏感) */
const keyword = ref('')
const filteredFriends = () => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return profileStore.friends
  return profileStore.friends.filter(
    (f) => f.name.toLowerCase().includes(kw) || f.remark.toLowerCase().includes(kw)
  )
}

/* 共同账本数:该好友与当前人共同出现在哪些账本 */
function sharedBookCount(f: Friend): number {
  const me = profileStore.profile.id
  return ledgerStore.books.filter((b) => b.memberIds.includes(me) && b.memberIds.includes(f.id)).length
}
const displayName = (f: Friend) => f.remark || f.name

/* 申请 */
function accept(r: PendingRequest) {
  profileStore.acceptRequest(r)
  ElMessage.success(`已添加 ${r.name} 为好友`)
}
function reject(r: PendingRequest) {
  ElMessageBox.confirm(`拒绝 ${r.name} 的好友申请吗?`, '拒绝申请', {
    type: 'warning',
    confirmButtonText: '拒绝',
  }).then(() => {
    profileStore.rejectRequest(r.id)
    ElMessage.success('已拒绝')
  }).catch(() => {})
}

/* 备注 */
const remarkEdit = ref<{ id: string; value: string } | null>(null)
const remarkAnchor = ref<HTMLElement | null>(null)
function openRemark(f: Friend, e: MouseEvent) {
  remarkEdit.value = { id: f.id, value: f.remark }
  remarkAnchor.value = e.currentTarget as HTMLElement
}
function saveRemark() {
  if (remarkEdit.value) {
    profileStore.updateRemark(remarkEdit.value.id, remarkEdit.value.value.trim().slice(0, 8))
    ElMessage.success('备注已保存')
  }
  remarkEdit.value = null
}

/* 删除 */
function removeFriend(f: Friend) {
  ElMessageBox.confirm(
    `删除后 ${displayName(f)} 将从你的好友列表移除;已共同参与的账本不受影响,历史流水保留。`,
    '删除好友',
    { type: 'warning', confirmButtonText: '删除' }
  ).then(() => {
    profileStore.removeFriend(f.id)
    ElMessage.success('已删除')
  }).catch(() => {})
}

/* 添加好友(mock:发送申请即通过) */
const addVisible = ref(false)
const searchKw = ref('')
const candidates = () => profileStore.searchCandidates(searchKw.value)
function sendRequest(c: CandidateUser & { disabled: boolean }) {
  if (c.disabled) return
  profileStore.addFriend(c)
  ElMessage.success(`已添加 ${c.name} 为好友`)
  searchKw.value = ''
}
</script>

<template>
  <div class="page">
    <div class="page-head">
      <div>
        <h2 class="page-title">我的好友</h2>
        <p class="page-sub">
          好友 {{ profileStore.friendCount }} 位
          <template v-if="profileStore.pendingRequests.length">
            <span class="dot">·</span> 待处理申请 {{ profileStore.pendingRequests.length }} 条
          </template>
        </p>
      </div>
      <el-button type="primary" @click="addVisible = true">+ 添加好友</el-button>
    </div>

    <!-- 好友申请区 -->
    <div v-if="profileStore.pendingRequests.length" class="yiyu-card req-card">
      <h3 class="card-title">好友申请</h3>
      <div v-for="r in profileStore.pendingRequests" :key="r.id" class="req-row">
        <span class="f-avatar">{{ r.avatar }}</span>
        <div class="req-info">
          <span class="f-name">{{ r.name }}</span>
          <span class="req-msg">"{{ r.message }}"</span>
        </div>
        <div class="req-actions">
          <el-button size="small" type="primary" @click="accept(r)">接受</el-button>
          <el-button size="small" @click="reject(r)">拒绝</el-button>
        </div>
      </div>
    </div>

    <!-- 好友列表 -->
    <div class="yiyu-card list-card">
      <div class="list-toolbar">
        <el-input v-model="keyword" placeholder="搜索昵称或备注" clearable style="max-width: 240px">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
      </div>

      <template v-if="profileStore.friends.length">
        <div v-for="f in filteredFriends()" :key="f.id" class="f-row">
          <span class="f-avatar">{{ f.avatar }}</span>
          <div class="f-info">
            <span class="f-name">
              {{ displayName(f) }}
              <span v-if="f.remark" class="f-origin-name">{{ f.name }}</span>
            </span>
            <span class="f-meta">
              <el-tag size="small" :type="f.source === 'book' ? 'primary' : f.source === 'request' ? 'success' : 'info'">
                {{ sourceLabels[f.source] }}
              </el-tag>
              <span class="num">{{ f.addedAt }}</span>
              <span>共同账本 {{ sharedBookCount(f) }} 本</span>
            </span>
          </div>
          <div class="f-actions">
            <el-button size="small" text type="primary" @click="openRemark(f, $event)">改备注</el-button>
            <el-button size="small" text type="danger" @click="removeFriend(f)">删除</el-button>
          </div>
        </div>
        <p v-if="!filteredFriends().length" class="empty-hint">没有匹配的好友</p>
      </template>

      <!-- 空态 -->
      <div v-else class="empty">
        <span class="empty-icon">🫂</span>
        <p>还没有好友,添加一位一起记录生活吧</p>
        <el-button type="primary" plain @click="addVisible = true">添加好友</el-button>
      </div>
    </div>

    <!-- 备注 popover -->
    <el-popover
      :visible="remarkEdit !== null"
      :virtual-ref="remarkAnchor"
      virtual-triggering
      placement="top"
      width="240"
    >
      <div v-if="remarkEdit" class="remark-pop">
        <el-input v-model="remarkEdit.value" maxlength="8" placeholder="备注名(≤8 字)" size="small" @keyup.enter="saveRemark" />
        <div class="remark-pop-actions">
          <el-button size="small" text @click="remarkEdit = null">取消</el-button>
          <el-button size="small" type="primary" @click="saveRemark">保存</el-button>
        </div>
      </div>
    </el-popover>

    <!-- 添加好友 -->
    <el-dialog v-model="addVisible" title="添加好友" width="420px">
      <el-input v-model="searchKw" placeholder="输入用户名或昵称搜索" clearable size="large">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <div class="cand-list">
        <template v-if="searchKw.trim()">
          <div v-for="c in candidates()" :key="c.id" class="cand-row" :class="{ disabled: c.disabled }">
            <span class="f-avatar">{{ c.avatar }}</span>
            <div class="cand-info">
              <span class="f-name">{{ c.name }}</span>
              <span class="cand-username num">@{{ c.username }}</span>
            </div>
            <el-button v-if="!c.disabled" size="small" type="primary" plain @click="sendRequest(c)">发申请</el-button>
            <span v-else class="cand-flag">已是好友</span>
          </div>
          <p v-if="!candidates().length" class="empty-hint">没有找到该用户</p>
        </template>
        <p v-else class="empty-hint">试试搜索:biaomei / laozhou / aze</p>
      </div>
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
.dot { margin: 0 4px; }

.req-card, .list-card { padding: var(--gap-card); }
.req-card { margin-bottom: var(--gap-module); }
.card-title { font-size: var(--fs-card-title); font-weight: 600; margin-bottom: 12px; }

.f-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--bg-soft);
  display: grid;
  place-items: center;
  font-size: 19px;
  flex-shrink: 0;
}

.req-row, .f-row, .cand-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px dashed var(--border-color);
}
.f-row:last-of-type, .req-row:last-of-type { border-bottom: none; }

.req-info, .f-info, .cand-info { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.f-name { font-size: 14px; font-weight: 500; }
.f-origin-name { font-size: 12px; color: var(--text-secondary); font-weight: 400; margin-left: 6px; }
.req-msg { font-size: var(--fs-caption); color: var(--text-secondary); }
.cand-username { font-size: var(--fs-caption); color: var(--text-secondary); }

.f-meta { display: flex; align-items: center; gap: 10px; font-size: var(--fs-caption); color: var(--text-secondary); }

.req-actions, .f-actions, .cand-row > .el-button { margin-left: auto; }
.f-actions { margin-left: auto; display: flex; gap: 0; }

.list-toolbar { margin-bottom: 6px; }

.empty-hint { padding: 14px 0; text-align: center; font-size: var(--fs-caption); color: var(--text-secondary); }

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 36px 0 20px;
  color: var(--text-secondary);
  font-size: 13px;
}
.empty-icon { font-size: 40px; }

.remark-pop { display: flex; flex-direction: column; gap: 8px; }
.remark-pop-actions { display: flex; justify-content: flex-end; }

.cand-list { margin-top: 12px; min-height: 60px; }
.cand-row.disabled { opacity: 0.55; }
.cand-flag { margin-left: auto; font-size: var(--fs-caption); color: var(--text-secondary); }
</style>
