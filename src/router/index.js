import { createRouter, createWebHashHistory } from "vue-router";
import { useUserStore } from "../stores/user";

const routes = [
  {
    path: "/auth",
    component: () => import("../layouts/AuthLayout.vue"),
    redirect: "/auth/login",
    children: [
      { path: "login", name: "login", component: () => import("../views/auth/Login.vue"), meta: { title: "登录 · 一隅" } },
      { path: "register", name: "register", component: () => import("../views/auth/Register.vue"), meta: { title: "注册 · 一隅" } },
    ],
  },
  {
    path: "/",
    component: () => import("../layouts/PortalLayout.vue"),
    children: [
      { path: "", name: "portal", component: () => import("../views/portal/PortalHome.vue"), meta: { title: "广场 · 一隅", requiresAuth: true } },
    ],
  },
  /* 记账本 */
  {
    path: "/ledger",
    component: () => import("../layouts/AppShellLayout.vue"),
    meta: { app: "ledger" },
    children: [
      { path: "", redirect: "/ledger/transactions" },
      { path: "transactions", name: "ledger-transactions", component: () => import("../views/ledger/Transactions.vue"), meta: { app: "ledger", title: "流水明细", requiresAuth: true } },
      { path: "reports", name: "ledger-reports", component: () => import("../views/ledger/Reports.vue"), meta: { app: "ledger", title: "报表统计", requiresAuth: true } },
      { path: "books", name: "ledger-books", component: () => import("../views/ledger/Books.vue"), meta: { app: "ledger", title: "账本管理", requiresAuth: true } },
    ],
  },
  /* 记事本 */
  {
    path: "/notes",
    component: () => import("../layouts/AppShellLayout.vue"),
    meta: { app: "notes" },
    children: [
      { path: "", redirect: "/notes/list" },
      { path: "list", name: "notes-list", component: () => import("../views/notes/NoteList.vue"), meta: { app: "notes", title: "笔记", requiresAuth: true } },
      { path: "todos", name: "notes-todos", component: () => import("../views/notes/Todos.vue"), meta: { app: "notes", title: "待办提醒", requiresAuth: true } },
      { path: "edit/:id?", name: "notes-edit", component: () => import("../views/notes/NoteEditor.vue"), meta: { app: "notes", title: "编辑笔记", requiresAuth: true } },
      { path: "trash", name: "notes-trash", component: () => import("../views/notes/Trash.vue"), meta: { app: "notes", title: "回收站", requiresAuth: true } },
    ],
  },
  /* 设置 */
  {
    path: "/settings",
    component: () => import("../layouts/AppShellLayout.vue"),
    meta: { app: "settings" },
    children: [
      { path: "", redirect: "/settings/profile" },
      { path: "profile", name: "settings-profile", component: () => import("../views/settings/Profile.vue"), meta: { app: "settings", title: "个人设置", requiresAuth: true } },
    ],
  },
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach((to) => {
  const userStore = useUserStore();
  if (to.meta.requiresAuth && !userStore.user) {
    return { name: "login" };
  }
  if ((to.name === "login" || to.name === "register") && userStore.user) {
    return { name: "portal" };
  }
  document.title = to.meta.title || "一隅";
});

export default router;
