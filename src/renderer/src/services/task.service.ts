import type { Task, APIResponse } from '@renderer/types/task'
import authService from './auth.service'
import { UserRole } from '@renderer/types/auth'
import { userService } from './user.service'

class TaskService {
  private readonly CACHE_KEY = 'tasks_cache'

  public saveToCache(tasks: Task[]) {
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(tasks))
  }

  public getFromCache(): Task[] {
    const cached = localStorage.getItem(this.CACHE_KEY)
    return cached ? JSON.parse(cached) : []
  }

  async fetchTasks(): Promise<Task[]> {
    try {
      const token = authService.getAccessToken()
      const user = authService.getUser()
      if (!token || !user) throw new Error('Non authentifié')

      let endpoint: string
      if (user.role >= UserRole.ADMINISTRATOR) {
        if (!user.company_id) throw new Error('company_id manquant')
        endpoint = `/api/tasks/company/${user.company_id}/active`
      } else {
        if (!user.garage_id) throw new Error('garage_id manquant')
        endpoint = `/api/tasks/garage/${user.garage_id}/active`
      }

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des tâches')
      }

      const tasks = await response.json()
      this.saveToCache(tasks)
      return tasks
    } catch (error) {
      console.error('Erreur:', error)
      throw error
    }
  }

  async getActiveTasks(): Promise<Task[]> {
    const cachedTasks = this.getFromCache()
    if (cachedTasks.length === 0) {
      return this.fetchTasks()
    }
    return cachedTasks
  }

  async refreshTasks(): Promise<void> {
    await this.fetchTasks()
  }

  clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY)
  }

  async completeTask(taskId: string): Promise<Task> {
    try {
      const token = authService.getAccessToken()
      if (!token) throw new Error('Non authentifié')

      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 1 })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la terminaison de la tâche')
      }

      const updatedTask = await response.json()

      // Mettre à jour le cache
      const tasks = this.getFromCache()
      const taskIndex = tasks.findIndex((t) => t.id === taskId)
      if (taskIndex !== -1) {
        tasks[taskIndex] = updatedTask
        this.saveToCache(tasks)
      }

      return updatedTask
    } catch (error) {
      console.error('Erreur:', error)
      throw error
    }
  }

  async startTask(taskId: string, userId: string): Promise<Task> {
    try {
      const token = authService.getAccessToken()
      if (!token) throw new Error('Non authentifié')

      const response = await fetch(`/api/tasks/${taskId}/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: userId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erreur lors du démarrage de la tâche')
      }

      const data = (await response.json()) as APIResponse
      console.log('Réponse API startTask:', data)

      // Récupérer les informations de l'utilisateur
      const users = userService.getFromCache()
      const user = users.find(u => u.id === userId)
      if (!user) {
        throw new Error('Utilisateur non trouvé dans le cache')
      }

      // Transformer la structure de la tâche
      const task = data.task
      const activeWorkers = task.task_records
        .filter((record) => record.end_date === null)
        .map((record) => {
          const worker = users.find(u => u.id === record.user_id)
          return {
            id: record._id,
            userId: record.user_id,
            startDate: record.start_date,
            firstName: worker?.first_name || '',
            lastName: worker?.last_name || ''
          }
        })

      const transformedTask: Task = {
        id: task.id,
        name: task.name,
        immatriculation: task.immatriculation,
        vehicle_model: task.vehicle_model,
        hours: task.hours,
        price: task.price,
        status: task.status,
        schedule_number: task.schedule_number,
        activeWorkers: activeWorkers
      }

      console.log('Tâche transformée:', transformedTask)

      // Mettre à jour le cache des tâches
      const tasks = this.getFromCache()
      const taskIndex = tasks.findIndex((t) => t.id === taskId)
      if (taskIndex !== -1) {
        tasks[taskIndex] = transformedTask
      } else {
        tasks.push(transformedTask)
      }

      this.saveToCache(tasks)

      // Mettre à jour l'utilisateur dans le cache avec les nouveaux IDs
      const userRecord = activeWorkers.find((w) => w.userId === userId)
      if (userRecord) {
        userService.updateUserInCache(userId, {
          task_id: taskId,
          record_task_id: userRecord.id
        })
      }

      return transformedTask
    } catch (error) {
      console.error('Erreur:', error)
      throw error
    }
  }

  async stopTask(taskId: string, recordId: string): Promise<Task> {
    try {
      const token = authService.getAccessToken()
      if (!token) throw new Error('Non authentifié')

      const response = await fetch(`/api/tasks/${taskId}/records/${recordId}/complete`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error("Erreur lors de l'arrêt de la tâche")
      }

      const data = await response.json()
      console.log('Réponse API stopTask:', data)

      // Récupérer les informations des utilisateurs
      const users = userService.getFromCache()

      // Transformer la structure de la tâche
      const task = data.task
      const activeWorkers = task.task_records
        .filter((record) => record.end_date === null)
        .map((record) => {
          const worker = users.find(u => u.id === record.user_id)
          return {
            id: record._id,
            userId: record.user_id,
            startDate: record.start_date,
            firstName: worker?.first_name || '',
            lastName: worker?.last_name || ''
          }
        })

      const transformedTask: Task = {
        id: task.id,
        name: task.name,
        immatriculation: task.immatriculation,
        vehicle_model: task.vehicle_model,
        hours: task.hours,
        price: task.price,
        status: task.status,
        schedule_number: task.schedule_number,
        activeWorkers: activeWorkers
      }

      // Mettre à jour le cache des tâches
      const tasks = this.getFromCache()
      const taskIndex = tasks.findIndex((t) => t.id === taskId)
      if (taskIndex !== -1) {
        tasks[taskIndex] = transformedTask
        this.saveToCache(tasks)
      }

      // Réinitialiser les IDs de tâche de l'utilisateur dans le cache
      const userIndex = users.findIndex(
        (u) => u.task_id === taskId && u.record_task_id === recordId
      )
      if (userIndex !== -1) {
        userService.updateUserInCache(users[userIndex].id, {
          task_id: null,
          record_task_id: null
        })
      }

      return transformedTask
    } catch (error) {
      console.error('Erreur:', error)
      throw error
    }
  }
}

export const taskService = new TaskService()
