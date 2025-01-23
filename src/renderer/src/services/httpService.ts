// src/services/httpService.ts
import axios from 'axios'

const httpClient = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json'
  }
})

httpClient.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('access_token')
  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`
  }
  return config
})

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const originalRequest = error.config
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken && !originalRequest._retry) {
        originalRequest._retry = true
        try {
          const response = await axios.post('http://localhost:3000/auth/refresh', {
            refresh_token: refreshToken
          })
          localStorage.setItem('access_token', response.data.access_token)
          originalRequest.headers['Authorization'] = `Bearer ${response.data.access_token}`
          return httpClient(originalRequest)
        } catch (refreshError) {
          localStorage.clear()
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      }
    }
    return Promise.reject(error)
  }
)

export default httpClient
