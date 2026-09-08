import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { todos as mockTodos } from '../mock/todos'
import type { Todo, TodoStatus } from '../types'

export type TodoFilter = 'all' | TodoStatus

export const useTodosStore = defineStore('todos', () => {
  const todos = ref<Todo[]>(mockTodos.map((t) => ({ ...t })))
  const filter = ref<TodoFilter>('all') // all / todo / doing / done / overdue / cancelled

  const filtered = computed(() => {
    const order: Record<TodoStatus, number> = { doing: 0, todo: 1, overdue: 2, done: 3, cancelled: 4 }
    const list = [...todos.value].sort(
      (a, b) => order[a.status] - order[b.status] || a.start.localeCompare(b.start)
    )
    if (filter.value === 'all') return list
    return list.filter((t) => t.status === filter.value)
  })

  /* 按状态分组(状态分组清单视图) */
  interface TodoGroup { key: TodoStatus; items: Todo[] }
  const grouped = computed<TodoGroup[]>(() => {
    const groups: TodoGroup[] = [
      { key: 'doing', items: [] },
      { key: 'todo', items: [] },
      { key: 'overdue', items: [] },
      { key: 'done', items: [] },
      { key: 'cancelled', items: [] },
    ]
    const map = Object.fromEntries(groups.map((g) => [g.key, g.items])) as Record<TodoStatus, Todo[]>
    for (const t of todos.value) map[t.status]?.push(t)
    for (const g of groups) g.items.sort((a, b) => a.start.localeCompare(b.start))
    return groups.filter((g) => g.items.length)
  })

  const counts = computed<Record<TodoFilter, number>>(() => {
    const c: Record<TodoFilter, number> = { all: todos.value.length, todo: 0, doing: 0, done: 0, overdue: 0, cancelled: 0 }
    for (const t of todos.value) c[t.status]++
    return c
  })

  function createTodo(data: Pick<Todo, 'title' | 'start' | 'end'> & Partial<Pick<Todo, 'note' | 'priority' | 'remind'>>) {
    const t: Todo = {
      id: 'td' + Date.now(),
      title: data.title,
      note: data.note || '',
      start: data.start,
      end: data.end,
      status: 'todo',
      priority: data.priority || 'mid',
      remind: data.remind || null,
      doneAt: null,
      createdAt: '2026-09-07',
    }
    todos.value.unshift(t)
    return t
  }

  function updateTodo(id: string, patch: Partial<Todo>) {
    const t = todos.value.find((x) => x.id === id)
    if (t) Object.assign(t, patch)
  }

  /* 状态流转 */
  function start(id: string) {
    updateTodo(id, { status: 'doing' })
  }
  function complete(id: string) {
    updateTodo(id, { status: 'done', doneAt: '2026-09-07 12:00' })
  }
  function reopen(id: string) {
    updateTodo(id, { status: 'todo', doneAt: null })
  }
  function cancel(id: string) {
    updateTodo(id, { status: 'cancelled', doneAt: null })
  }
  function remove(id: string) {
    todos.value = todos.value.filter((t) => t.id !== id)
  }

  return {
    todos, filter, filtered, grouped, counts,
    createTodo, updateTodo, start, complete, reopen, cancel, remove,
  }
})
