import type { DateTimeStr } from '../../shared/types/common'

/** 提醒重复方式 */
export type ReminderRepeat = 'none' | 'daily' | 'weekly'

/** 笔记提醒 */
export interface Reminder {
  time: DateTimeStr
  repeat: ReminderRepeat
}

/** 笔记类型(清单字段预留未启用) */
export type NoteType = 'richtext' | 'checklist'

/** 笔记 */
export interface Note {
  id: string
  type: NoteType
  title: string
  folderId: string
  tags: string[]
  pinned: boolean
  createdAt: DateTimeStr
  updatedAt: DateTimeStr
  /** wangEditor HTML 正文 */
  content: string
  items: string[]
  reminder: Reminder | null
}

/** 回收站中的笔记 */
export interface TrashedNote extends Omit<Note, 'pinned'> {
  /** 回收站条目不保留置顶态 */
  pinned?: boolean
  deletedAt: DateTimeStr
  remainDays: number
}

/** 文件夹 */
export interface Folder {
  id: string
  name: string
  count: number
}

/** 笔记历史版本(入口已移除,数据预留) */
export interface NoteVersion {
  id: string
  time: DateTimeStr
  words: number
  note: string
}

/** 待办状态 */
export type TodoStatus = 'todo' | 'doing' | 'done' | 'overdue' | 'cancelled'

/** 待办优先级 */
export type TodoPriority = 'high' | 'mid' | 'low'

/** 待办 */
export interface Todo {
  id: string
  title: string
  note: string
  start: DateTimeStr
  end: DateTimeStr
  status: TodoStatus
  priority: TodoPriority
  remind: DateTimeStr | null
  doneAt: DateTimeStr | null
  createdAt: string
}

/** 状态展示元数据 */
export const statusMeta: Record<TodoStatus, { label: string; type: 'info' | 'primary' | 'success' | 'danger' }> = {
  todo: { label: '待开始', type: 'info' },
  doing: { label: '进行中', type: 'primary' },
  done: { label: '已完成', type: 'success' },
  overdue: { label: '已逾期', type: 'danger' },
  cancelled: { label: '已取消', type: 'info' },
}

/** 优先级展示元数据 */
export const priorityMeta: Record<TodoPriority, { label: string; color: string }> = {
  high: { label: '高', color: '#E5484D' },
  mid: { label: '中', color: '#F59B0E' },
  low: { label: '低', color: '#909399' },
}
