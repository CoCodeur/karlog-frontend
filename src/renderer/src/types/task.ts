export interface ActiveWorker {
  id: string
  firstName: string
  lastName: string
  startDate: string
}

export interface Task {
  id: string
  name: string
  immatriculation: string
  vehicle_model: string
  hours: number
  price: number
  status: number
  activeWorkers: ActiveWorker[]
}

export interface TaskRecord {
  id: string
  taskId: string
  workerId: string
  startDate: string
  endDate: string | null
} 