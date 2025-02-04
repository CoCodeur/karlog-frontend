import { defineStore } from 'pinia'
import type { User } from '@renderer/types/auth'
import { UserRole } from '@renderer/types/auth'
import authService from '@renderer/services/auth.service'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: authService.getUser()
  }),
  getters: {
    isAuthenticated: (state) => !!state.user,
    userRole: (state) => state.user?.role ?? UserRole.USER,
    companyId: (state) => state.user?.companyId ?? '',
    garageId: (state) => state.user?.garageId ?? ''
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