import type { AuthResponse, LoginCredentials, User } from '../types/auth'
import garageService from './garage.service'
import api from './api.service'

class AuthService {
  private static instance: AuthService
  private readonly storageKeys = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER: 'user'
  }

  private constructor() {
    // Singleton
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials)
      console.log(response.status)
      console.log(response.data)
      this.setSession(response.data)

      // Fetch garages if user has a company
      if (response.data.user.companyId) {
        await garageService.fetchCompanyGarages(response.data.user.companyId)
      }

      return response.data
    } catch (error) {
      this.clearSession()
      throw error
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    try {
      const refresh_token = this.getRefreshToken()
      if (!refresh_token) {
        throw new Error('No refresh token available')
      }

      const response = await api.post<AuthResponse>('/auth/refresh', {
        refresh_token
      })

      this.setSession(response.data)
      return response.data
    } catch (error) {
      this.clearSession()
      throw error
    }
  }

  setSession(authResponse: AuthResponse): void {
    sessionStorage.setItem(this.storageKeys.ACCESS_TOKEN, authResponse.access_token)
    sessionStorage.setItem(this.storageKeys.REFRESH_TOKEN, authResponse.refresh_token)
    sessionStorage.setItem(this.storageKeys.USER, JSON.stringify(authResponse.user))
  }

  clearSession(): void {
    sessionStorage.removeItem(this.storageKeys.ACCESS_TOKEN)
    sessionStorage.removeItem(this.storageKeys.REFRESH_TOKEN)
    sessionStorage.removeItem(this.storageKeys.USER)
    garageService.clearGarages()
  }

  getAccessToken(): string | null {
    return sessionStorage.getItem(this.storageKeys.ACCESS_TOKEN)
  }

  getRefreshToken(): string | null {
    return sessionStorage.getItem(this.storageKeys.REFRESH_TOKEN)
  }

  getUser(): User | null {
    const userStr = sessionStorage.getItem(this.storageKeys.USER)
    if (!userStr) return null
    try {
      return JSON.parse(userStr) as User
    } catch {
      return null
    }
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken()
  }
}

export default AuthService.getInstance()
