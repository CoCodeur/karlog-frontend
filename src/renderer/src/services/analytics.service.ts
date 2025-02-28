import type { GarageAnalytics } from '../types/analytics'
import authService from './auth.service'
import api from './api.service'

class AnalyticsService {
  private readonly CACHE_KEY = 'analytics_cache'
  private readonly COMPANY_ID_CACHE_KEY = 'analytics_company_id'

  public saveToCache(analytics: GarageAnalytics[]) {
    const user = authService.getUser()
    if (user?.company_id) {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(analytics))
      localStorage.setItem(this.COMPANY_ID_CACHE_KEY, user.company_id)
    }
  }

  public getFromCache(): GarageAnalytics[] {
    const cached = localStorage.getItem(this.CACHE_KEY)
    const cachedCompanyId = localStorage.getItem(this.COMPANY_ID_CACHE_KEY)
    const user = authService.getUser()

    // Si l'ID de l'entreprise dans le cache ne correspond pas à l'utilisateur actuel,
    // on retourne un tableau vide pour forcer un nouveau chargement
    if (!cached || !cachedCompanyId || cachedCompanyId !== user?.company_id) {
      return []
    }

    return JSON.parse(cached)
  }

  public clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY)
    localStorage.removeItem(this.COMPANY_ID_CACHE_KEY)
  }

  async fetchAnalytics(): Promise<GarageAnalytics[]> {
    try {
      const user = authService.getUser()
      if (!user?.company_id) throw new Error('Non authentifié')

      const response = await api.get(`/analytics/company/${user.company_id}`)
      const analytics = response.data
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
