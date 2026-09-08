import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { notes as mockNotes, trashedNotes, folders, allTags, versions } from '../mock/notes'
import type { Folder, Note, NoteVersion, TrashedNote } from '../types'

type ActiveFolder = string // 'all' / 'tag:xx' / 文件夹 id

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<Note[]>(mockNotes.map((n) => ({ ...n, tags: [...n.tags] })))
  const trash = ref<TrashedNote[]>(trashedNotes.map((n) => ({ ...n, tags: [...n.tags] })))
  const folderList = ref<Folder[]>(folders.map((f) => ({ ...f })))
  const tags = ref<string[]>([...allTags])
  const versionList = ref<NoteVersion[]>(versions)
  const keyword = ref('')
  const activeFolder = ref<ActiveFolder>('all') // all / tag:xx / f1
  const activeNoteId = ref<string | null>('n1')

  const activeNote = computed(
    () => notes.value.find((n) => n.id === activeNoteId.value) || null
  )

  const filtered = computed(() => {
    let list = notes.value
    if (activeFolder.value === 'all') {
      // 全部笔记
    } else if (activeFolder.value.startsWith('tag:')) {
      const tag = activeFolder.value.slice(4)
      list = list.filter((n) => n.tags.includes(tag))
    } else {
      list = list.filter((n) => n.folderId === activeFolder.value)
    }
    if (keyword.value.trim()) {
      const k = keyword.value.trim().toLowerCase()
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(k) ||
          plain(n.content).toLowerCase().includes(k)
      )
    }
    const pinned = list.filter((n) => n.pinned)
    const normal = list.filter((n) => !n.pinned)
    return [...pinned, ...normal]
  })

  function plain(html: string) {
    return html.replace(/<[^>]+>/g, '')
  }

  function now() {
    const d = new Date()
    const pad = (n: number) => (n < 10 ? '0' + n : '' + n)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  function createNote(): Note {
    const n: Note = {
      id: 'n' + Date.now(),
      type: 'richtext',
      title: '无标题笔记',
      folderId: activeFolder.value.match(/^f/) ? activeFolder.value : 'f1',
      tags: [], pinned: false,
      createdAt: now(), updatedAt: now(),
      content: '',
      items: [], reminder: null,
    }
    notes.value.unshift(n)
    activeNoteId.value = n.id
    return n
  }

  function updateNote(id: string, patch: Partial<Note>) {
    const n = notes.value.find((x) => x.id === id)
    if (n) Object.assign(n, patch, { updatedAt: now() })
  }

  function togglePin(id: string) {
    const n = notes.value.find((x) => x.id === id)
    if (n) n.pinned = !n.pinned
  }

  function moveToTrash(id: string) {
    const i = notes.value.findIndex((n) => n.id === id)
    if (i > -1) {
      const [n] = notes.value.splice(i, 1)
      trash.value.unshift({ ...n, deletedAt: now(), remainDays: 30 })
      if (activeNoteId.value === id) activeNoteId.value = notes.value[0]?.id || null
    }
  }

  function restore(id: string) {
    const i = trash.value.findIndex((n) => n.id === id)
    if (i > -1) {
      const { deletedAt: _d, remainDays: _r, pinned, ...n } = trash.value[i]
      trash.value.splice(i, 1)
      notes.value.unshift({ ...n, pinned: pinned ?? false })
    }
  }

  function destroy(id: string) {
    trash.value = trash.value.filter((n) => n.id !== id)
  }

  function addFolder(name: string) {
    folderList.value.push({ id: 'f' + Date.now(), name, count: 0 })
  }

  function renameFolder(id: string, name: string) {
    const f = folderList.value.find((x) => x.id === id)
    if (f && name.trim()) f.name = name.trim()
  }

  /* 删除文件夹:其下笔记迁入其它可用文件夹 */
  function deleteFolder(id: string): boolean {
    if (folderList.value.length <= 1) return false
    const fallback =
      folderList.value.find((f) => f.id !== id && f.id !== 'f1')?.id ||
      folderList.value.find((f) => f.id !== id)?.id
    if (!fallback) return false
    notes.value.forEach((n) => {
      if (n.folderId === id) n.folderId = fallback
    })
    folderList.value = folderList.value.filter((f) => f.id !== id)
    if (activeFolder.value === id) activeFolder.value = 'all'
    return true
  }

  function addTag(name: string) {
    const t = name.trim()
    if (t && !tags.value.includes(t)) tags.value.push(t)
    return t
  }

  /* 重命名标签:同步所有笔记上的引用 */
  function renameTag(oldName: string, newName: string): boolean {
    const t = newName.trim()
    if (!t || oldName === t) return false
    if (tags.value.includes(t)) return false // 目标名已存在
    const i = tags.value.indexOf(oldName)
    if (i === -1) return false
    tags.value.splice(i, 1, t)
    notes.value.forEach((n) => {
      const j = n.tags.indexOf(oldName)
      if (j > -1) n.tags.splice(j, 1, t)
    })
    if (activeFolder.value === 'tag:' + oldName) activeFolder.value = 'tag:' + t
    return true
  }

  /* 删除标签:同步移除所有笔记上的引用 */
  function deleteTag(name: string) {
    const i = tags.value.indexOf(name)
    if (i === -1) return
    tags.value.splice(i, 1)
    notes.value.forEach((n) => {
      const j = n.tags.indexOf(name)
      if (j > -1) n.tags.splice(j, 1)
    })
    if (activeFolder.value === 'tag:' + name) activeFolder.value = 'all'
  }

  /* 编辑器 allow-create 的标签同步进标签云 */
  function syncTags(list: string[]) {
    for (const t of list) {
      if (!tags.value.includes(t)) tags.value.push(t)
    }
  }

  return {
    notes, trash, folders: folderList, tags, versions: versionList,
    keyword, activeFolder, activeNoteId, activeNote, filtered,
    createNote, updateNote, togglePin, moveToTrash, restore, destroy,
    addFolder, renameFolder, deleteFolder, addTag, renameTag, deleteTag, syncTags,
  }
})
