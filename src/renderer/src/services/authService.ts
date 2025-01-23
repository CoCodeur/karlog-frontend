// src/services/authService.ts
import httpClient from './httpService'

interface LoginResponse {
  access_token: string
  refresh_token: string
  user: {
    id: string
    email: string
    role: number
    first_name: string
    last_name: string
  }
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await httpClient.post<LoginResponse>('/auth/login', { email, password })
  localStorage.setItem('access_token', response.data.access_token)
  localStorage.setItem('refresh_token', response.data.refresh_token)
  return response.data
}

export function logout() {
  localStorage.clear()
  window.location.href = '/login'
}

export async function refreshToken(): Promise<void> {
  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken) throw new Error('No refresh token available')
  const response = await httpClient.post<{ access_token: string }>('/auth/refresh', {
    refresh_token: refreshToken
  })
  localStorage.setItem('access_token', response.data.access_token)
}
