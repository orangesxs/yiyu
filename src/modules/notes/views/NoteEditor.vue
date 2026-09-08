<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'
import { useNotesStore } from '../stores/notes'
import type { Note, ReminderRepeat } from '../types'
import type { IDomEditor } from '@wangeditor/editor'

const route = useRoute()
const router = useRouter()
const store = useNotesStore()

const editorRef = ref<IDomEditor | null>(null)
/* 工具栏白名单:只留最常用的格式(H 标题/加粗/斜体/删除线/颜色/列表/待办/引用/撤销重做) */
const toolbarConfig = {
  toolbarKeys: [
    'headerSelect',
    '|',
    'bold', 'italic', 'through', 'color', 'bgColor',
    '|',
    'bulletedList', 'numberedList', 'todo',
    'blockquote',
    '|',
    'undo', 'redo',
  ],
}
const editorConfig = { placeholder: '开始记录…' }

let note: Note | null = null
const isNew = computed(() => route.params.id === 'new' || !route.params.id)

/* wangEditor 的 created 事件是异步派发的:若先渲染编辑器、onMounted 里再赋值 v-model,
   setHtml 会因 editor 未就绪被丢弃,正文空白。因此先备好数据,loaded 后才挂载编辑器。 */
const loaded = ref(false)

const state = reactive({
  title: '',
  html: '',
  tags: [] as string[],
  reminderTime: '',
  reminderRepeat: 'none' as ReminderRepeat,
})
const tagOptions = computed(() => store.tags)
const folderOptions = computed(() => store.folders)
const folderId = ref('f1')

onMounted(async () => {
  if (!isNew.value) {
    note = store.notes.find((n) => n.id === route.params.id) ?? null
    if (!note) {
      ElMessage.warning('笔记不存在或已删除')
      router.replace('/notes/list')
      return
    }
    state.title = note.title
    state.html = note.content || ''
    state.tags = [...note.tags]
    state.reminderTime = note.reminder?.time || ''
    state.reminderRepeat = note.reminder?.repeat || 'none'
    folderId.value = note.folderId
  } else {
    note = store.createNote()
    folderId.value = note.folderId
    router.replace(`/notes/edit/${note.id}`)
  }
  /* 等装载赋值触发的 watch 以 loaded=false 先跑完,避免打开笔记就记一次自动保存 */
  await nextTick()
  loaded.value = true
})

function handleCreated(editor: IDomEditor) {
  editorRef.value = editor
}
onBeforeUnmount(() => {
  if (editorRef.value) editorRef.value.destroy()
})

/* 自动保存(标签等长替换 / 重复方式 / 文件夹切换也要触发) */
let saveTimer: ReturnType<typeof setTimeout> | null = null
watch(
  () => [state.title, state.html, state.tags.slice().sort().join(' '), state.reminderTime, state.reminderRepeat, folderId.value],
  () => {
    if (!loaded.value) return
    savedTip.value = ''
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(save, 800)
  }
)
const savedTip = ref('')

function save(silent = true) {
  if (!note || !loaded.value) return
  store.syncTags(state.tags)
  store.updateNote(note.id, {
    title: state.title || (note.type === 'checklist' ? '新建清单' : '无标题笔记'),
    content: state.html,
    tags: state.tags,
    folderId: folderId.value,
    reminder: state.reminderTime
      ? { time: state.reminderTime, repeat: state.reminderRepeat }
      : null,
  })
  savedTip.value = '已自动保存 ' + new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  if (!silent) ElMessage.success('已保存')
}

/* 历史版本(暂未开放,入口已简化移除) */
const versionVisible = ref(false)
const versions = computed(() => store.versions)
function restoreVersion(v: { time: string }) {
  versionVisible.value = false
  ElMessage.success(`已回滚到 ${v.time} 的版本`)
}

function moveToTrash() {
  if (!note) return
  store.moveToTrash(note.id)
  ElMessage.success('已移入回收站')
  router.push('/notes/list')
}
</script>

<template>
  <div class="editor-page">
    <!-- 顶栏 -->
    <div class="ed-topbar">
      <el-button text @click="router.push('/notes/list')">
        <el-icon><ArrowLeft /></el-icon>返回
      </el-button>
      <span class="saved-tip">{{ savedTip }}</span>
      <span class="flex-spacer"></span>
      <el-select v-model="folderId" size="small" style="width: 110px">
        <el-option v-for="f in folderOptions" :key="f.id" :label="f.name" :value="f.id" />
      </el-select>
      <el-button size="small" text type="danger" @click="moveToTrash">
        <el-icon><Delete /></el-icon>删除
      </el-button>
      <el-button type="primary" size="small" @click="save(false)">保存</el-button>
    </div>

    <div class="ed-body">
      <!-- 标题 -->
      <input v-model="state.title" class="ed-title" placeholder="无标题笔记" maxlength="60" />

      <!-- 标签 + 提醒 -->
      <div class="ed-meta">
        <div class="meta-row">
          <span class="meta-label">标签</span>
          <el-select v-model="state.tags" multiple filterable allow-create size="small" placeholder="选择或输入标签" style="width: 260px">
            <el-option v-for="t in tagOptions" :key="t" :label="t" :value="t" />
          </el-select>
        </div>
        <div class="meta-row">
          <span class="meta-label">提醒</span>
          <el-date-picker v-model="state.reminderTime" type="datetime" size="small" format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DD HH:mm" placeholder="不提醒" style="width: 190px" />
          <el-select v-if="state.reminderTime" v-model="state.reminderRepeat" size="small" style="width: 110px">
            <el-option value="none" label="仅一次" />
            <el-option value="daily" label="每天" />
            <el-option value="weekly" label="每周" />
          </el-select>
        </div>
      </div>

      <!-- 富文本(loaded 后才挂载,保证 wangEditor 用已有正文初始化而非空串) -->
      <div v-if="loaded" class="ed-editor">
        <Toolbar class="ed-toolbar" :editor="editorRef" :defaultConfig="toolbarConfig" mode="default" />
        <Editor
          class="ed-content"
          v-model="state.html"
          :defaultConfig="editorConfig"
          mode="default"
          @onCreated="handleCreated"
        />
      </div>
    </div>

    <!-- 历史版本(入口已简化移除,保留弹窗结构备用) -->
    <el-dialog v-if="false" v-model="versionVisible" title="历史版本" width="420px">
      <div class="ver-list">
        <div v-for="v in versions" :key="v.id" class="ver-row">
          <div class="ver-info">
            <span class="ver-time num">{{ v.time }}</span>
            <span class="ver-note">{{ v.note }} · {{ v.words }} 字</span>
          </div>
          <el-button v-if="v.note !== '当前版本'" size="small" text type="primary" @click="restoreVersion(v)">回滚</el-button>
          <el-tag v-else size="small">当前</el-tag>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style src="./NoteEditor.css" scoped></style>
