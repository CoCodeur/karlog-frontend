import type { GarageAnalytics } from '../types/analytics'
import authService from './auth.service'

class AnalyticsService {
  private readonly CACHE_KEY = 'analytics_cache'

  public saveToCache(analytics: GarageAnalytics[]) {
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(analytics))
  }

  public getFromCache(): GarageAnalytics[] {
    const cached = localStorage.getItem(this.CACHE_KEY)
    return cached ? JSON.parse(cached) : []
  }

  public clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY)
  }

  async fetchAnalytics(): Promise<GarageAnalytics[]> {
    try {
      const token = authService.getAccessToken()
      const user = authService.getUser()
      if (!token || !user?.company_id) throw new Error('Non authentifié')

      const response = await fetch(`/api/analytics/company/${user.company_id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des analytics')
      }

      const analytics = await response.json()
      this.saveToCache(analytics)
      return analytics
    } catch (error) {
      console.error('Erreur:', error)
      throw error
    }
  }

  async getAnalytics(): Promise<GarageAnalytics[]> {
    const cachedAnalytics = this.getFromCache()
    if (cachedAnalytics.length === 0) {
      return this.fetchAnalytics()
    }
    return cachedAnalytics
  }
}

export const analyticsService = new AnalyticsService() 