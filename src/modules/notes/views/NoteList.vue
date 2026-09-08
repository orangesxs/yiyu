<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useNotesStore } from '../stores/notes'
import type { Folder, Note } from '../types'

const router = useRouter()
const store = useNotesStore()

const showFolderInput = ref(false)
const newFolderName = ref('')

function plain(html: string) {
  return html.replace(/<[^>]+>/g, '')
}

function snippet(n: Note) {
  return plain(n.content)
}

function select(n: Note) {
  router.push(`/notes/edit/${n.id}`)
}

function openEditor() {
  router.push('/notes/edit/new')
}

function addFolder() {
  if (newFolderName.value.trim()) {
    store.addFolder(newFolderName.value.trim())
    newFolderName.value = ''
  }
  showFolderInput.value = false
}

function setFolder(key: string) {
  store.activeFolder = key
}

/* 文件夹重命名:行内输入框 */
const renamingFolderId = ref<string | null>(null)
const renameInput = ref<HTMLInputElement | HTMLInputElement[] | null>(null)
const folderDraftName = ref('')

function startRenameFolder(f: Folder) {
  renamingFolderId.value = f.id
  folderDraftName.value = f.name
  nextTick(() => {
    /* v-for 内的模板 ref 是数组,且同时只有一个在重命名 */
    const el = Array.isArray(renameInput.value) ? renameInput.value[0] : renameInput.value
    el?.focus()
    el?.select()
  })
}

function commitRenameFolder(f: Folder) {
  if (renamingFolderId.value === f.id) {
    if (folderDraftName.value.trim() && folderDraftName.value.trim() !== f.name) {
      store.renameFolder(f.id, folderDraftName.value)
    }
    renamingFolderId.value = null
  }
}

async function removeFolder(f: Folder) {
  const count = store.notes.filter((n) => n.folderId === f.id).length
  try {
    await ElMessageBox.confirm(
      count > 0
        ? `「${f.name}」里有 ${count} 篇笔记,删除后笔记将移入其它文件夹。`
        : `确定删除文件夹「${f.name}」吗?`,
      '删除文件夹',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    return
  }
  if (store.deleteFolder(f.id)) {
    ElMessage.success('文件夹已删除')
  } else {
    ElMessage.warning('至少保留一个文件夹')
  }
}

/* 标签管理弹窗:增 / 改 / 删 */
const tagPanelVisible = ref(false)
const newTagName = ref('')
const editingTag = ref<string | null>(null) // 正在改名的标签
const tagDraftName = ref('')

function openTagPanel() {
  newTagName.value = ''
  editingTag.value = null
  tagPanelVisible.value = true
}

function addTag() {
  const t = store.addTag(newTagName.value)
  if (t && store.tags.includes(t)) newTagName.value = ''
}

function startRenameTag(t: string) {
  editingTag.value = t
  tagDraftName.value = t
}

function commitRenameTag() {
  if (!editingTag.value) return
  const ok = store.renameTag(editingTag.value, tagDraftName.value)
  if (!ok && tagDraftName.value.trim() && tagDraftName.value.trim() !== editingTag.value) {
    ElMessage.warning('该标签名已存在')
  }
  editingTag.value = null
}

async function removeTag(t: string) {
  try {
    await ElMessageBox.confirm(
      `删除标签「${t}」会从所有笔记中移除该标记。`,
      '删除标签',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    return
  }
  store.deleteTag(t)
}
</script>

<template>
  <div class="notes-page">
    <!-- 左栏:文件夹/标签 -->
    <aside class="side-col">
      <div class="side-section">
        <el-button type="primary" class="new-btn" @click="openEditor">
          <el-icon style="margin-right: 4px"><Plus /></el-icon>新建笔记
        </el-button>
      </div>

      <div class="side-section">
        <p class="side-title">笔记</p>
        <div
          class="side-item"
          :class="{ active: store.activeFolder === 'all' }"
          @click="setFolder('all')"
        >
          <el-icon><Document /></el-icon>全部笔记
          <span class="count num">{{ store.notes.length }}</span>
        </div>
        <div
          v-for="f in store.folders"
          :key="f.id"
          class="side-item"
          :class="{ active: store.activeFolder === f.id }"
          @click="setFolder(f.id)"
        >
          <template v-if="renamingFolderId === f.id">
            <el-icon><FolderOpened /></el-icon>
            <input
              ref="renameInput"
              v-model="folderDraftName"
              class="folder-rename-input"
              maxlength="20"
              @keyup.enter="commitRenameFolder(f)"
              @blur="commitRenameFolder(f)"
              @click.stop
              @keyup.esc="renamingFolderId = null"
            />
          </template>
          <template v-else>
            <el-icon><FolderOpened /></el-icon>{{ f.name }}
            <span class="count num">{{ store.notes.filter((n) => n.folderId === f.id).length }}</span>
            <span class="row-actions" @click.stop>
              <el-icon class="row-btn" title="重命名" @click="startRenameFolder(f)"><EditPen /></el-icon>
              <el-icon class="row-btn danger" title="删除" @click="removeFolder(f)"><Delete /></el-icon>
            </span>
          </template>
        </div>
        <div v-if="showFolderInput" class="folder-input">
          <el-input v-model="newFolderName" size="small" placeholder="文件夹名" @keyup.enter="addFolder" @blur="addFolder" autofocus />
        </div>
        <button v-else class="add-folder" @click="showFolderInput = true">
          <el-icon><FolderAdd /></el-icon>新建文件夹
        </button>
      </div>

      <div class="side-section">
        <p class="side-title">
          标签
          <el-icon class="side-title-btn" title="管理标签" @click="openTagPanel"><Setting /></el-icon>
        </p>
        <div class="tag-cloud">
          <span
            v-for="t in store.tags"
            :key="t"
            class="tag-chip"
            :class="{ active: store.activeFolder === 'tag:' + t }"
            @click="setFolder('tag:' + t)"
          >{{ t }}</span>
        </div>
      </div>
    </aside>

    <!-- 中栏:列表(独立滚动) -->
    <section class="list-col">
      <div class="search-bar">
        <el-input v-model="store.keyword" placeholder="搜索标题 / 正文…" clearable :prefix-icon="'Search'" />
      </div>

      <div class="list-scroll">
        <div v-if="store.filtered.length === 0" class="empty-box">
          <span class="empty-icon">🗒️</span>
          <p>没有找到笔记</p>
        </div>

        <template v-else>
          <template v-for="n in store.filtered" :key="n.id">
            <div v-if="n === store.filtered.filter((x) => x.pinned)[0]" class="group-label">
              <el-icon><Top /></el-icon>置顶
            </div>
            <div
              class="note-item"
              :class="{ active: store.activeNoteId === n.id, pinned: n.pinned }"
              @click="select(n)"
            >
              <div class="ni-head">
                <span class="ni-title">{{ n.title }}</span>
                <span class="ni-pin" @click.stop="store.togglePin(n.id)" :title="n.pinned ? '取消置顶' : '置顶'">
                  <el-icon><Top /></el-icon>
                </span>
              </div>
              <p class="ni-snippet">{{ snippet(n) || '空笔记' }}</p>
              <div class="ni-foot">
                <span class="ni-date num">{{ n.updatedAt.slice(5, 10) }}</span>
                <span v-if="n.reminder" class="ni-remind">
                  <el-icon><Bell /></el-icon>{{ n.reminder.time.slice(5, 16) }}
                  <template v-if="n.reminder.repeat === 'daily'"> · 每天</template>
                </span>
                <span v-for="t in n.tags.slice(0, 2)" :key="t" class="ni-chip">{{ t }}</span>
              </div>
            </div>
          </template>
        </template>
      </div>
    </section>

    <!-- 标签管理弹窗 -->
    <el-dialog v-model="tagPanelVisible" title="管理标签" width="400px">
      <div class="tag-add-row">
        <el-input
          v-model="newTagName"
          size="small"
          placeholder="新标签名"
          maxlength="20"
          @keyup.enter="addTag"
        />
        <el-button type="primary" size="small" @click="addTag">
          <el-icon><Plus /></el-icon>添加
        </el-button>
      </div>
      <div class="tag-manage-list">
        <div v-for="t in store.tags" :key="t" class="tag-manage-row">
          <template v-if="editingTag === t">
            <el-input
              v-model="tagDraftName"
              size="small"
              maxlength="20"
              @keyup.enter="commitRenameTag"
              @keyup.esc="editingTag = null"
            />
            <el-button size="small" type="primary" text @click="commitRenameTag">确定</el-button>
            <el-button size="small" text @click="editingTag = null">取消</el-button>
          </template>
          <template v-else>
            <span class="tag-name-chip">{{ t }}</span>
            <span class="row-actions">
              <el-icon class="row-btn" title="重命名" @click="startRenameTag(t)"><EditPen /></el-icon>
              <el-icon class="row-btn danger" title="删除" @click="removeTag(t)"><Delete /></el-icon>
            </span>
          </template>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style src="./NoteList.css" scoped></style>
