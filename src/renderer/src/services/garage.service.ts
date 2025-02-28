/* eslint-disable prettier/prettier */
import api from './api.service'
import type { Garage, NewGarage, UpdateGarage, GarageCreateResponse } from '../types/garage'
import authService from './auth.service'

class GarageService {
  private static instance: GarageService
  //private readonly storageKey = 'garages'
  private garages: Garage[] = []
  private readonly CACHE_KEY = 'garages_cache'

  private constructor() {
    // Charger les garages depuis le localStorage
    const cached = localStorage.getItem(this.CACHE_KEY)
    if (cached) {
      this.garages = JSON.parse(cached)
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
      this.saveToCache(this.garages)
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
    this.clearCache()
  }

  public saveToCache(garages: Garage[]) {
    this.garages = garages
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(garages))
  }

  public getFromCache(): Garage[] {
    return this.garages
  }

  public clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY)
    this.garages = []
  }

  async fetchGarages(): Promise<Garage[]> {
    try {
      const user = authService.getUser()
      if (!user?.company_id) throw new Error('Non authentifié')

      const response = await api.get(`/garages/company/${user.company_id}`)
      const garages = response.data.garages || []
      this.saveToCache(garages)
      return garages
    } catch (error) {
      console.error('Erreur:', error)
      throw error
    }
  }

  async getGaragess(): Promise<Garage[]> {
    if (this.garages.length === 0) {
      return this.fetchGarages()
    }
    return this.garages
  }

  async createGarage(newGarage: NewGarage): Promise<GarageCreateResponse> {
    try {
      const response = await api.post('/garages', newGarage)
      const createdGarage = response.data
      // On met à jour le cache avec le nouveau garage qui inclut l'email du compte de service
      const updatedGarages = [...this.garages, createdGarage.garage]
      this.saveToCache(updatedGarages)
      return createdGarage
    } catch (error) {
      console.error('Error creating garage:', error)
      throw error
    }
  }

  async updateGarage(id: string, updateData: UpdateGarage): Promise<Garage> {
    try {
      const response = await api.put(`/garages/${id}`, updateData)
      const updatedGarage = response.data.garage
      const updatedGarages = this.garages.map(g => 
        g.id === id ? { ...g, ...updatedGarage } : g
      )
      this.saveToCache(updatedGarages)
      return updatedGarage
    } catch (error) {
      console.error('Error updating garage:', error)
      throw error
    }
  }

  async deleteGarage(id: string): Promise<void> {
    try {
      await api.delete(`/garages/${id}`)
      const updatedGarages = this.garages.filter(g => g.id !== id)
      this.saveToCache(updatedGarages)
    } catch (error) {
      console.error('Error deleting garage:', error)
      throw error
    }
  }
}

export default GarageService.getInstance() 