import { create } from 'zustand'
import { api } from './api'

interface UserProfile {
  id: string
  email: string
  username: string
  display_name: string | null
  avatar_url: string | null
  email_verified: boolean
  created_at: string
}

interface AuthState {
  user: UserProfile | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string, displayName?: string) => Promise<void>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
  updateProfile: (data: { display_name?: string; avatar_url?: string }) => Promise<void>
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      set({ user: data.user, loading: false })
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Login failed'
      set({ error: msg, loading: false })
      throw e
    }
  },

  register: async (email, username, password, displayName) => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.post('/auth/register', {
        email,
        username,
        password,
        display_name: displayName,
      })
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      set({ user: data.user, loading: false })
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Registration failed'
      set({ error: msg, loading: false })
      throw e
    }
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refresh_token')
    try {
      await api.post('/auth/logout', { refresh_token: refreshToken })
    } catch {
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      set({ user: null })
    }
  },

  fetchMe: async () => {
    const token = localStorage.getItem('access_token')
    if (!token) return
    set({ loading: true })
    try {
      const { data } = await api.get('/auth/me')
      set({ user: data, loading: false })
    } catch {
      set({ user: null, loading: false })
    }
  },

  updateProfile: async (data) => {
    set({ loading: true, error: null })
    try {
      const { data: updated } = await api.put('/users/profile', data)
      set({ user: updated, loading: false })
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Update failed'
      set({ error: msg, loading: false })
      throw e
    }
  },

  changePassword: async (oldPassword, newPassword) => {
    set({ loading: true, error: null })
    try {
      await api.put('/users/password', { old_password: oldPassword, new_password: newPassword })
      // 密码修改成功后撤销所有 refresh_token（后端已执行），清空本地凭证并跳转登录
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      set({ user: null, loading: false })
      window.location.href = '/login'
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Password change failed'
      set({ error: msg, loading: false })
      throw e
    }
  },

  clearError: () => set({ error: null }),
}))
