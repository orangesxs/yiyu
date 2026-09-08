import type { RouteRecordRaw } from 'vue-router'

/* 个人中心路由(平台级用户模块,不设独立身份色) */
export const profileRoutes: RouteRecordRaw[] = [
  {
    path: '/profile',
    component: () => import('../../shared/layouts/AppShellLayout.vue'),
    meta: { app: 'profile' },
    children: [
      { path: '', redirect: '/profile/friends' },
      { path: 'info', name: 'profile-info', component: () => import('./views/ProfileInfo.vue'), meta: { app: 'profile', title: '基本信息', requiresAuth: true } },
      { path: 'friends', name: 'profile-friends', component: () => import('./views/ProfileFriends.vue'), meta: { app: 'profile', title: '我的好友', requiresAuth: true } },
    ],
  },
]
