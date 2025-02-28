import { UserRole, type User } from '../types/auth'
import authService from './auth.service'
import api from './api.service'

interface NewUser {
  first_name: string
  last_name: string
  email: string
  password: string
  role: number
  company_id?: string
  is_service_account?: boolean
  card_uid?: string | null
}

class UserService {
  private readonly CACHE_KEY = 'users_cache'

  public saveToCache(users: User[]) {
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(users))
  }

  public getFromCache(): User[] {
    const cached = localStorage.getItem(this.CACHE_KEY)
    return cached ? JSON.parse(cached) : []
  }

  public updateUserInCache(userId: string, updates: Partial<User>) {
    const users = this.getFromCache()
    const userIndex = users.findIndex((u) => u.id === userId)
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updates }
      this.saveToCache(users)
    }
  }

  async fetchUsers(): Promise<User[]> {
    try {
      const user = authService.getUser()
      if (!user?.company_id) throw new Error('Non authentifié')

      const response = await api.get(`/users/company/${user.company_id}`)
      const users = response.data.users || []

      // Sauvegarder dans le cache
      this.saveToCache(users)

      return users
    } catch (error) {
      console.error('Erreur:', error)
      throw error
    }
  }

  async getUsers(): Promise<User[]> {
    const cachedUsers = this.getFromCache()
    if (cachedUsers.length === 0) {
      return this.fetchUsers()
    }
    return cachedUsers
  }

  async findUserByCardUid(cardUid: string): Promise<User | null> {
    const users = await this.getUsers()
    return (
      users.find(
        (user) =>
          user.role != UserRole.SERVICE_ACCOUNT &&
          user.role != UserRole.SUPER_ADMINISTRATOR &&
          user.card_uid === cardUid
      ) || null
    )
  }

  clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY)
  }

  async associateCard(userId: string, cardUid: string): Promise<User> {
    try {
      const response = await api.patch(`/users/${userId}/associate-card`, { card_uid: cardUid })
      const updatedUser = response.data.user

      // Mettre à jour le cache
      const users = this.getFromCache()
      const userIndex = users.findIndex((u) => u.id === userId)
      if (userIndex !== -1) {
        users[userIndex] = updatedUser
      } else {
        users.push(updatedUser)
      }
      this.saveToCache(users)

      return updatedUser
    } catch (error) {
      console.error('Erreur:', error)
      throw error
    }
  }

  async dissociateCard(userId: string): Promise<User> {
    try {
      const response = await api.patch(`/users/${userId}/dissociate-card`)
      const updatedUser = response.data.user

      // Mettre à jour le cache
      const users = this.getFromCache()
      const userIndex = users.findIndex((u) => u.id === userId)
      if (userIndex !== -1) {
        users[userIndex] = updatedUser
      }
      this.saveToCache(users)

      return updatedUser
    } catch (error) {
      console.error('Erreur:', error)
      throw error
    }
  }

  async getUnassignedUsers(): Promise<User[]> {
    const users = await this.getUsers()
    // Filtrer pour exclure les comptes de service et les super admin, et ne garder que ceux sans carte
    return users.filter(
      (user) =>
        user.role != UserRole.SERVICE_ACCOUNT &&
        user.role != UserRole.SUPER_ADMINISTRATOR &&
        !user.card_uid
    )
  }

  async createUser(userData: NewUser): Promise<User> {
    try {
      const response = await api.post('/users', userData)
      return response.data.user
    } catch (error) {
      console.error('Erreur:', error)
      throw error
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await api.delete(`/users/${userId}`)
    } catch (error) {
      console.error('Erreur:', error)
      throw error
    }
  }
}

export const userService = new UserService()
