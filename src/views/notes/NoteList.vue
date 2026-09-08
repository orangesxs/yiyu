<script setup>
import { ref, nextTick } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { useNotesStore } from "../../stores/notes";

const router = useRouter();
const store = useNotesStore();

const showFolderInput = ref(false);
const newFolderName = ref("");

function plain(html) {
  return html.replace(/<[^>]+>/g, "");
}

function snippet(n) {
  return plain(n.content);
}

function select(n) {
  router.push(`/notes/edit/${n.id}`);
}

function openEditor() {
  router.push("/notes/edit/new");
}

function addFolder() {
  if (newFolderName.value.trim()) {
    store.addFolder(newFolderName.value.trim());
    newFolderName.value = "";
  }
  showFolderInput.value = false;
}

function setFolder(key) {
  store.activeFolder = key;
}

/* 文件夹重命名：行内输入框 */
const renamingFolderId = ref(null);
const renameInput = ref(null);
const folderDraftName = ref("");

function startRenameFolder(f) {
  renamingFolderId.value = f.id;
  folderDraftName.value = f.name;
  nextTick(() => {
    /* v-for 内的模板 ref 是数组，且同时只有一个在重命名 */
    const el = Array.isArray(renameInput.value) ? renameInput.value[0] : renameInput.value;
    el?.focus();
    el?.select();
  });
}

function commitRenameFolder(f) {
  if (renamingFolderId.value === f.id) {
    if (folderDraftName.value.trim() && folderDraftName.value.trim() !== f.name) {
      store.renameFolder(f.id, folderDraftName.value);
    }
    renamingFolderId.value = null;
  }
}

async function removeFolder(f) {
  const count = store.notes.filter((n) => n.folderId === f.id).length;
  try {
    await ElMessageBox.confirm(
      count > 0
        ? `「${f.name}」里有 ${count} 篇笔记，删除后笔记将移入其它文件夹。`
        : `确定删除文件夹「${f.name}」吗？`,
      "删除文件夹",
      { confirmButtonText: "删除", cancelButtonText: "取消", type: "warning" }
    );
  } catch {
    return;
  }
  if (store.deleteFolder(f.id)) {
    ElMessage.success("文件夹已删除");
  } else {
    ElMessage.warning("至少保留一个文件夹");
  }
}

/* 标签管理弹窗：增 / 改 / 删 */
const tagPanelVisible = ref(false);
const newTagName = ref("");
const editingTag = ref(null); // 正在改名的标签
const tagDraftName = ref("");

function openTagPanel() {
  newTagName.value = "";
  editingTag.value = null;
  tagPanelVisible.value = true;
}

function addTag() {
  const t = store.addTag(newTagName.value);
  if (t && store.tags.includes(t)) newTagName.value = "";
}

function startRenameTag(t) {
  editingTag.value = t;
  tagDraftName.value = t;
}

function commitRenameTag() {
  if (!editingTag.value) return;
  const ok = store.renameTag(editingTag.value, tagDraftName.value);
  if (!ok && tagDraftName.value.trim() && tagDraftName.value.trim() !== editingTag.value) {
    ElMessage.warning("该标签名已存在");
  }
  editingTag.value = null;
}

async function removeTag(t) {
  try {
    await ElMessageBox.confirm(
      `删除标签「${t}」会从所有笔记中移除该标记。`,
      "删除标签",
      { confirmButtonText: "删除", cancelButtonText: "取消", type: "warning" }
    );
  } catch {
    return;
  }
  store.deleteTag(t);
}
</script>

<template>
  <div class="notes-page">
    <!-- 左栏：文件夹/标签 -->
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

    <!-- 中栏：列表（独立滚动） -->
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
              <p class="ni-snippet">{{ snippet(n) || "空笔记" }}</p>
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

<style scoped>
.notes-page {
  display: grid;
  grid-template-columns: 230px 1fr;
  height: 100%;
  min-height: 0;
}
.notes-page > * {
  min-height: 0;
  min-width: 0;
}

.side-col {
  border-right: 1px solid var(--border-color);
  padding: 16px 12px;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: var(--bg-card);
  min-height: 0;
}
.side-section { margin-bottom: 22px; }
.side-title {
  font-size: var(--fs-caption);
  color: var(--text-secondary);
  margin: 0 10px 8px;
  letter-spacing: 0.06em;
}
.new-btn { width: calc(100% - 8px); margin: 0 4px 6px; border-radius: var(--radius-input); }

.side-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 10px;
  border-radius: var(--radius-input);
  font-size: 13.5px;
  color: var(--text-regular);
  cursor: pointer;
  transition: all var(--dur-base) ease;
}
.side-item:hover { background: var(--bg-hover); }
.side-item.active {
  background: color-mix(in srgb, var(--app-notes) 10%, transparent);
  color: var(--app-notes);
  font-weight: 500;
}
.side-item .count { margin-left: auto; font-size: 11px; color: var(--text-secondary); }

/* 行内重命名输入框 */
.folder-rename-input {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--app-notes);
  outline: none;
  background: var(--bg-card);
  color: var(--text-primary);
  border-radius: 4px;
  font-size: 13px;
  padding: 2px 6px;
}

/* 悬停出现的行内操作 */
.row-actions {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
  opacity: 0;
  transition: opacity var(--dur-base) ease;
}
.side-item:hover .row-actions,
.tag-manage-row:hover .row-actions { opacity: 1; }
.side-item .row-actions { margin-left: 0; }
.row-btn {
  padding: 3px;
  border-radius: 4px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--dur-base) ease;
}
.row-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
.row-btn.danger:hover { color: var(--color-danger, #f56c6c); }

.folder-input { padding: 4px 6px; }
.add-folder {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  border: 1px dashed var(--border-strong);
  background: transparent;
  color: var(--text-secondary);
  border-radius: var(--radius-input);
  padding: 8px 10px;
  font-size: 12.5px;
  cursor: pointer;
  transition: all var(--dur-base) ease;
}
.add-folder:hover { color: var(--app-notes); border-color: var(--app-notes); }

.tag-cloud { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 6px; }
.tag-chip {
  font-size: 12px;
  padding: 4px 11px;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  color: var(--text-regular);
  cursor: pointer;
  transition: all var(--dur-base) ease;
}
.tag-chip:hover { border-color: var(--app-notes); color: var(--app-notes); }
.tag-chip.active {
  background: color-mix(in srgb, var(--app-notes) 12%, transparent);
  border-color: var(--app-notes);
  color: var(--app-notes);
}

/* 列表栏 */
.list-col {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: var(--bg-page);
}
.search-bar { padding: 14px; flex-shrink: 0; }
.list-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-bottom: 20px;
}

.group-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-secondary);
  padding: 4px 16px;
}

.note-item {
  padding: 13px 16px;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: background var(--dur-base) ease, border-color var(--dur-base) ease;
}
.note-item:hover { background: var(--bg-hover); }
.note-item.active { background: var(--bg-card); border-left-color: var(--app-notes); }
.note-item.pinned { background: color-mix(in srgb, var(--app-notes) 3%, transparent); }
.note-item.active.pinned { background: var(--bg-card); }

.ni-head { display: flex; align-items: center; gap: 6px; }
.ni-title {
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.ni-pin { color: var(--text-secondary); opacity: 0; transition: opacity var(--dur-base) ease; padding: 2px; }
.note-item:hover .ni-pin { opacity: 1; }
.note-item.pinned .ni-pin { opacity: 1; color: var(--app-notes); }

.ni-snippet {
  font-size: 12.5px;
  color: var(--text-secondary);
  margin: 5px 0 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

.ni-foot { display: flex; align-items: center; gap: 10px; font-size: 11px; color: var(--text-secondary); }
.ni-remind { display: flex; align-items: center; gap: 3px; color: var(--color-warning); }
.ni-chip {
  border: 1px solid var(--border-color);
  border-radius: 999px;
  padding: 1px 8px;
}

.empty-box {
  padding: 60px 0;
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
}
.empty-icon { font-size: 38px; }

/* 标签区标题旁的管理按钮 */
.side-title { display: flex; align-items: center; justify-content: space-between; }
.side-title-btn {
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 3px;
  border-radius: 4px;
  transition: all var(--dur-base) ease;
}
.side-title-btn:hover { color: var(--app-notes); background: var(--bg-hover); }

/* 标签管理弹窗 */
.tag-add-row { display: flex; gap: 8px; margin-bottom: 14px; }
.tag-manage-list {
  max-height: 320px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.tag-manage-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 4px;
  border-radius: var(--radius-input);
}
.tag-manage-row:hover { background: var(--bg-hover); }
.tag-name-chip { flex: 1; font-size: 13px; color: var(--text-regular); }

@media (max-width: 768px) {
  .notes-page { grid-template-columns: 1fr; }
  .side-col { display: none; }
}
</style>
