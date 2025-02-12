import api from './api.service'
import type { Company } from '../types/company'

class CompanyService {
  private static instance: CompanyService
  private readonly storageKey = 'company'
  private company: Company | null = null

  private constructor() {
    // Charger l'entreprise depuis le sessionStorage au démarrage
    const storedCompany = sessionStorage.getItem(this.storageKey)
    if (storedCompany) {
      try {
        this.company = JSON.parse(storedCompany)
      } catch (error) {
        console.error('Error parsing stored company:', error)
      }
    }
  }

  public static getInstance(): CompanyService {
    if (!CompanyService.instance) {
      CompanyService.instance = new CompanyService()
    }
    return CompanyService.instance
  }

  async fetchCompany(company_id: string): Promise<Company> {
    try {
      const response = await api.get(`/companies/${company_id}`)
      this.company = response.data.company
      sessionStorage.setItem(this.storageKey, JSON.stringify(this.company))
      return this.company
    } catch (error) {
      console.error('Error fetching company:', error)
      throw error
    }
  }

  getCompany(): Company | null {
    return this.company
  }

  clearCompany(): void {
    this.company = null
    sessionStorage.removeItem(this.storageKey)
  }
}

export default CompanyService.getInstance() 