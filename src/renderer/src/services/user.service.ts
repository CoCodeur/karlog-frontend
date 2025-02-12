import { UserRole, type User } from '../types/auth'
import authService from './auth.service'

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
    const userIndex = users.findIndex(u => u.id === userId)
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updates }
      this.saveToCache(users)
    }
  }

  async fetchUsers(): Promise<User[]> {
    try {
      const token = authService.getAccessToken()
      const user = authService.getUser()
      if (!token || !user?.company_id) throw new Error('Non authentifié')

      const response = await fetch(`/api/users/company/${user.company_id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des utilisateurs')
      }

      const data = await response.json()
      const users =
        data.users && Array.isArray(data.users) ? data.users : Array.isArray(data) ? data : []

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
      const token = authService.getAccessToken()
      if (!token) throw new Error('Non authentifié')

      const response = await fetch(`/api/users/${userId}/associate-card`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ card_uid: cardUid })
      })

      if (!response.ok) {
        throw new Error("Erreur lors de l'association de la carte")
      }

      const data = await response.json()
      const updatedUser = data.user // Extraire l'utilisateur de la réponse

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
      const token = authService.getAccessToken()
      if (!token) throw new Error('Non authentifié')

      const response = await fetch(`/api/users/${userId}/dissociate-card`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la dissociation de la carte')
      }

      const data = await response.json()
      const updatedUser = data.user // Extraire l'utilisateur de la réponse

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
}

export const userService = new UserService()
