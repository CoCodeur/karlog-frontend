/* eslint-disable prettier/prettier */
import api from './api.service'
import type { Garage } from '../types/garage'

class GarageService {
  private static instance: GarageService
  private readonly storageKey = 'garages'
  private garages: Garage[] = []

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
}

export default GarageService.getInstance() 