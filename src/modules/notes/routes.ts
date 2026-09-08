import type { RouteRecordRaw } from 'vue-router'

/* 记事本模块路由 */
export const notesRoutes: RouteRecordRaw[] = [
  {
    path: '/notes',
    component: () => import('../../shared/layouts/AppShellLayout.vue'),
    meta: { app: 'notes' },
    children: [
      { path: '', redirect: '/notes/list' },
      { path: 'list', name: 'notes-list', component: () => import('./views/NoteList.vue'), meta: { app: 'notes', title: '笔记', requiresAuth: true } },
      { path: 'todos', name: 'notes-todos', component: () => import('./views/Todos.vue'), meta: { app: 'notes', title: '待办提醒', requiresAuth: true } },
      { path: 'edit/:id?', name: 'notes-edit', component: () => import('./views/NoteEditor.vue'), meta: { app: 'notes', title: '编辑笔记', requiresAuth: true } },
      { path: 'trash', name: 'notes-trash', component: () => import('./views/Trash.vue'), meta: { app: 'notes', title: '回收站', requiresAuth: true } },
    ],
  },
]
