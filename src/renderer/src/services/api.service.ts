import axios from 'axios'
import authService from './auth.service'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = authService.getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Try to refresh the token
        const authResponse = await authService.refreshToken()

        // Update the request header with new token
        originalRequest.headers.Authorization = `Bearer ${authResponse.access_token}`

        // Retry the original request
        return api(originalRequest)
      } catch (refreshError) {
        // If refresh fails, clear session and reject
        authService.clearSession()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
