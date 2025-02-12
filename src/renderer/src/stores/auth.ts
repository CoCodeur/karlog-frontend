import { defineStore } from 'pinia'
import type { User } from '@renderer/types/auth'
import authService from '@renderer/services/auth.service'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: authService.getUser()
  }),
  getters: {
    isAuthenticated: (state) => !!state.user,
    user: (state) => state.user,
    company_id: (state) => state.user?.company_id ?? '',
    garage_id: (state) => state.user?.garage_id ?? ''
  },
  actions: {
    setUser(user: User | null) {
      this.user = user
    },
    logout() {
      authService.clearSession()
      this.user = null
    }
  }
}) 