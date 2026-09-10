import { get, post, put, patch, del } from './http'
import type { User } from '../types/common'
import type { Profile } from '@/modules/profile/types'

/* ── 认证 ── */

export interface AuthResult {
  token: string
  user: User
}

export const authApi = {
  register: (data: { username: string; nickname: string; password: string; inviteCode: string }) =>
    post<AuthResult>('/auth/register', data),
  login: (data: { username: string; password: string }) => post<AuthResult>('/auth/login', data),
  logout: () => post<{ ok: boolean }>('/auth/logout'),
  me: () => get<User>('/auth/me'),
}

/* ── 个人档案 ── */

export const profileApi = {
  get: () => get<Profile>('/profile'),
  update: (data: Partial<Pick<Profile, 'nickname' | 'avatar' | 'bio' | 'gender' | 'birthday' | 'region'>>) =>
    put<Profile>('/profile', data),
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    put<{ ok: boolean }>('/profile/password', data),
}

/* ── 邀请码(我的) ── */

export interface InviteCodeItem {
  id: string
  code: string
  createdAt: string
  usedAt: string | null
  usedBy: { id: string; nickname: string; avatar: string } | null
}

export const inviteApi = {
  listMine: () => get<InviteCodeItem[]>('/invite-codes'),
  create: () => post<InviteCodeItem>('/invite-codes'),
}

/* ── 记账本 ── */

export interface BookDto {
  id: string
  name: string
  icon: string
  monthExpense: number
  isDefault: boolean
}

export interface CategoryDto {
  id: string
  name: string
  icon: string
  children: { id: string; name: string }[]
  custom?: boolean
}

export interface TransactionDto {
  id: string
  type: 'expense' | 'income'
  amount: number
  categoryId: string
  categoryName: string
  bookId: string
  date: string
  note?: string | null
}

export interface NewTransactionInput {
  type: 'expense' | 'income'
  amount: number
  categoryId: string
  date: string
  note?: string
  bookId?: string
}

export const ledgerApi = {
  listBooks: () => get<BookDto[]>('/books'),
  createBook: (data: { name: string; icon: string }) => post<BookDto>('/books', data),
  listCategories: (type?: 'expense' | 'income') =>
    get<CategoryDto[]>('/categories', type ? { type } : undefined),
  createCategory: (data: { type: 'expense' | 'income'; name: string; icon: string }) =>
    post<CategoryDto>('/categories', data),
  removeCategory: (id: string) => del<{ ok: boolean }>(`/categories/${id}`),
  listTransactions: (params: { bookId: string; from?: string; to?: string }) =>
    get<TransactionDto[]>('/transactions', params),
  createTransaction: (data: NewTransactionInput) => post<TransactionDto>('/transactions', data),
  updateTransaction: (id: string, data: Partial<NewTransactionInput>) =>
    patch<TransactionDto>(`/transactions/${id}`, data),
  removeTransaction: (id: string) => del<{ ok: boolean }>(`/transactions/${id}`),
}

/* ── 管理后台 ── */

export interface SystemUserDto {
  id: string
  username: string
  name: string
  avatar: string
  role: 'admin' | 'user'
  status: 'active' | 'disabled'
  registeredAt: string
  lastActiveAt: string
}

export interface AdminLogDto {
  id: string
  time: string
  moduleId: 'auth' | 'ledger' | 'profile' | 'admin'
  action: 'login' | 'create' | 'update' | 'delete' | 'security'
  operatorId: string
  summary: string
  operator: { id: string; nickname: string; avatar: string } | null
}

export interface AdminLogsPage {
  total: number
  page: number
  pageSize: number
  items: AdminLogDto[]
}

export interface AdminDashboardDto {
  userCount: number
  adminCount: number
  activeCount: number
  disabledCount: number
  bookCount: number
  logCount: number
  logTodayCount: number
  logSecurityCount: number
  logCountByDay: { date: string; label: string; count: number }[]
  latestLogs: AdminLogDto[]
}

export interface AdminInviteDto {
  id: string
  code: string
  createdAt: string
  usedAt: string | null
  creator: { id: string; nickname: string; avatar: string } | null
  usedBy: { id: string; nickname: string; avatar: string } | null
}

export const adminApi = {
  listUsers: (params?: { keyword?: string; role?: string; status?: string }) =>
    get<SystemUserDto[]>('/admin/users', params),
  createUser: (data: { username: string; name: string; avatar: string; role: 'admin' | 'user'; password: string }) =>
    post<SystemUserDto>('/admin/users', data),
  updateUser: (id: string, data: { role?: 'admin' | 'user'; status?: 'active' | 'disabled' }) =>
    patch<{ ok: boolean }>(`/admin/users/${id}`, data),
  listLogs: (params: {
    page?: number
    pageSize?: number
    module?: string
    action?: string
    operatorId?: string
  }) => get<AdminLogsPage>('/admin/logs', params),
  dashboard: () => get<AdminDashboardDto>('/admin/dashboard'),
  listInvites: () => get<AdminInviteDto[]>('/admin/invite-codes'),
  createInvite: () => post<{ id: string; code: string; createdAt: string }>('/admin/invite-codes'),
}
