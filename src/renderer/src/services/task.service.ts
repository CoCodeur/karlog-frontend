import apiService from './api.service'
import type { Task } from '@renderer/types/task'

class TaskService {
  async getCompanyActiveTasks(companyId: string): Promise<Task[]> {
    const response = await apiService.get(`/tasks/company/${companyId}/active`)
    return response.data
  }

  async getGarageActiveTasks(garageId: string): Promise<Task[]> {
    const response = await apiService.get(`/tasks/garage/${garageId}/active`)
    return response.data
  }

  async completeTask(taskId: string): Promise<Task> {
    const response = await apiService.patch(`/tasks/${taskId}/status`, {
      status: 1
    })
    return response.data
  }
}

export const taskService = new TaskService()
