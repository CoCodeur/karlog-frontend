import type { Task } from '@renderer/types/task'
import authService from './auth.service'
import { userService } from './user.service'
import api from './api.service'

class TaskService {
  private readonly CACHE_KEY = 'active_tasks_cache'

  public saveToCache(tasks: Task[]) {
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(tasks))
  }

  public getFromCache(): Task[] {
    const cached = localStorage.getItem(this.CACHE_KEY)
    return cached ? JSON.parse(cached) : []
  }

  public updateTaskInCache(task: Task) {
    const tasks = this.getFromCache()
    const taskIndex = tasks.findIndex((t) => t.id === task.id)

    if (taskIndex !== -1) {
      tasks[taskIndex] = task
    } else {
      tasks.push(task)
    }

    this.saveToCache(tasks)
    return task
  }

  public clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY)
  }

  async fetchTasks(): Promise<Task[]> {
    try {
      const user = authService.getUser()
      if (!user) throw new Error('Non authentifié')

      let endpoint: string
      if (user.role >= 2) {
        if (!user.company_id) throw new Error('company_id manquant')
        endpoint = `/tasks/company/${user.company_id}/active`
      } else {
        if (!user.garage_id) throw new Error('garage_id manquant')
        endpoint = `/tasks/garage/${user.garage_id}/active`
      }

      const response = await api.get(endpoint)
      const tasks = response.data
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

  async completeTask(taskId: string): Promise<Task> {
    try {
      const response = await api.patch(`/tasks/${taskId}/status`, { status: 1 })
      const tasks = this.getFromCache().filter((task) => task.id !== taskId)
      this.saveToCache(tasks)
      return response.data.task
    } catch (error) {
      console.error('Erreur:', error)
      throw error
    }
  }

  async startTask(taskId: string, userId: string): Promise<Task> {
    try {
      const response = await api.post(`/tasks/${taskId}/records`, {
        user_id: userId
      })

      const data = response.data
      this.updateTaskInCache(data.task)

      // Mettre à jour l'utilisateur dans le cache
      userService.updateUserInCache(userId, {
        task_id: taskId,
        record_task_id: data.task.task_records[data.task.task_records.length - 1]._id
      })

      return data.task
    } catch (error) {
      console.error('Erreur:', error)
      throw error
    }
  }

  async stopTask(taskId: string, recordId: string): Promise<Task> {
    try {
      const response = await api.patch(`/tasks/${taskId}/records/${recordId}/complete`)
      const data = response.data
      this.updateTaskInCache(data.task)

      // Réinitialiser les IDs de tâche de l'utilisateur dans le cache
      const users = userService.getFromCache()
      const userIndex = users.findIndex(
        (u) => u.task_id === taskId && u.record_task_id === recordId
      )
      if (userIndex !== -1) {
        userService.updateUserInCache(users[userIndex].id, {
          task_id: null,
          record_task_id: null
        })
      }

      return data.task
    } catch (error) {
      console.error('Erreur:', error)
      throw error
    }
  }

  async cancelTask(taskId: string): Promise<Task> {
    try {
      // Récupérer la tâche pour avoir les records actifs
      const task = this.getFromCache().find((t) => t.id === taskId)
      if (!task) throw new Error('Tâche non trouvée')

      // Arrêter tous les records actifs
      if (task.task_records && task.task_records.length > 0) {
        const activeRecords = task.task_records.filter((record) => !record.end_date)
        for (const record of activeRecords) {
          await this.stopTask(taskId, record._id)
        }
      }

      // Changer le statut de la tâche
      const response = await api.patch(`/tasks/${taskId}/status`, { status: -1 })
      const data = response.data
      const tasks = this.getFromCache().filter((t) => t.id !== taskId)
      this.saveToCache(tasks)
      return data.task
    } catch (error) {
      console.error('Erreur:', error)
      throw error
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    try {
      await api.delete(`/tasks/${taskId}`)
      // Mettre à jour le cache en retirant la tâche supprimée
      const tasks = this.getFromCache().filter((t) => t.id !== taskId)
      this.saveToCache(tasks)
    } catch (error) {
      console.error('Erreur:', error)
      throw error
    }
  }

  async createTask(taskData: Omit<Task, 'id' | 'status' | 'task_records'>): Promise<{ task: Task }> {
    try {
      const response = await api.post('/tasks', taskData)
      return response.data
    } catch (error) {
      console.error('Erreur:', error)
      throw error
    }
  }
}

export const taskService = new TaskService()
