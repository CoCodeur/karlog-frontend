/* eslint-disable prettier/prettier */
import api from './api.service'
import type { Garage, NewGarage, UpdateGarage, GarageCreateResponse } from '../types/garage'
import authService from './auth.service'

class GarageService {
  private static instance: GarageService
  private readonly storageKey = 'garages'
  private garages: Garage[] = []
  private readonly CACHE_KEY = 'garages_cache'

  private constructor() {
    // Charger les garages depuis le sessionStorage au démarrage
    const storedGarages = sessionStorage.getItem(this.storageKey)
    if (storedGarages) {
      try {
        this.garages = JSON.parse(storedGarages)
      } catch (error) {
        console.error('Error parsing stored garages:', error)
      }
    }
  }

  public static getInstance(): GarageService {
    if (!GarageService.instance) {
      GarageService.instance = new GarageService()
    }
    return GarageService.instance
  }

  async fetchCompanyGarages(company_id: string): Promise<Garage[]> {
    try {
      const response = await api.get(`/garages/company/${company_id}`)
      this.garages = response.data.garages
      // Sauvegarder les garages dans le sessionStorage
      sessionStorage.setItem(this.storageKey, JSON.stringify(this.garages))
      return this.garages
    } catch (error) {
      console.error('Error fetching garages:', error)
      throw error
    }
  }

  getGarages(): Garage[] {
    return this.garages
  }

  clearGarages(): void {
    this.garages = []
    sessionStorage.removeItem(this.storageKey)
  }

  public saveToCache(garages: Garage[]) {
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(garages))
  }

  public getFromCache(): Garage[] {
    const cached = localStorage.getItem(this.CACHE_KEY)
    return cached ? JSON.parse(cached) : []
  }

  public clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY)
  }

  async fetchGarages(): Promise<Garage[]> {
    try {
      const user = authService.getUser()
      if (!user?.company_id) throw new Error('Non authentifié')

      const response = await api.get(`/garages/company/${user.company_id}`)
      const garages = response.data.garages || []

      // Sauvegarder dans le cache
      this.saveToCache(garages)

      return garages
    } catch (error) {
      console.error('Erreur:', error)
      throw error
    }
  }

  async getGaragess(): Promise<Garage[]> {
    const cachedGarages = this.getFromCache()
    if (cachedGarages.length === 0) {
      return this.fetchGarages()
    }
    return cachedGarages
  }

  async createGarage(garageData: NewGarage): Promise<GarageCreateResponse> {
    try {
      const response = await api.post('/garages', garageData)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la création du garage:', error)
      throw error
    }
  }

  async updateGarage(id: string, garageData: UpdateGarage): Promise<Garage> {
    try {
      const response = await api.patch(`/garages/${id}`, garageData)
      return response.data.garage
    } catch (error) {
      console.error('Erreur lors de la modification du garage:', error)
      throw error
    }
  }

  async deleteGarage(id: string): Promise<void> {
    try {
      await api.delete(`/garages/${id}`)
      // Mettre à jour le cache
      const garages = this.getFromCache()
      this.saveToCache(garages.filter(garage => garage.id !== id))
    } catch (error) {
      console.error('Erreur lors de la suppression du garage:', error)
      throw error
    }
  }
}

export default GarageService.getInstance() 