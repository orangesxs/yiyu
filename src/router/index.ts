import { createRouter, createWebHashHistory } from 'vue-router'
import { authRoutes } from '../modules/auth/routes'
import { portalRoutes } from '../modules/portal/routes'
import { ledgerRoutes } from '../modules/ledger/routes'
import { notesRoutes } from '../modules/notes/routes'
import { profileRoutes } from '../modules/profile/routes'
import { useUserStore } from '../shared/stores/user'

const routes = [
  ...authRoutes,
  ...portalRoutes,
  ...ledgerRoutes,
  ...notesRoutes,
  ...profileRoutes,
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to) => {
  const userStore = useUserStore()
  if (to.meta.requiresAuth && !userStore.user) {
    return { name: 'login' }
  }
  if ((to.name === 'login' || to.name === 'register') && userStore.user) {
    return { name: 'portal' }
  }
  document.title = to.meta.title || '一隅'
})

export default router
