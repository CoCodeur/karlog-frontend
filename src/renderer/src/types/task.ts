export interface TaskRecord {
  _id: string;
  user_id: string;
  start_date: string;
  end_date: string | null;
  user?: {
    first_name: string;
    last_name: string;
  };
}

export interface ActiveWorker {
  id: string;
  userId: string;
  startDate: string;
  firstName: string;
  lastName: string;
}

export interface Task {
  id: string;
  name: string;
  immatriculation: string;
  vehicle_model: string;
  hours: number;
  price: number;
  status: number;
  schedule_number: string;
  task_records: TaskRecord[];
  activeWorkers?: ActiveWorker[];
}

export interface APITask {
  id: string;
  name: string;
  immatriculation: string;
  vehicle_model: string;
  hours: number;
  price: number;
  status: number;
  schedule_number: string;
  garage_id: string;
  task_records: TaskRecord[];
}

export interface APIResponse {
  message: string;
  task: Task;
} 