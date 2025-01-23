import { defineStore } from 'pinia'
import { login, logout, refreshToken } from '../services/authService'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as null | {
      id: string
      email: string
      first_name: string
      last_name: string
      role: number
    },
    isAuthenticated: false
  }),
  actions: {
    async login(email: string, password: string) {
      const response = await login(email, password)
      this.user = response.user
      this.isAuthenticated = true
    },
    logout() {
      logout()
      this.user = null
      this.isAuthenticated = false
    },
    async refreshToken() {
      await refreshToken()
    }
  }
})
