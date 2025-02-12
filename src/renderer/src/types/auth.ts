export enum UserRole {
  USER = 0,
  SERVICE_ACCOUNT = 1,
  ADMINISTRATOR = 2,
  SUPER_ADMINISTRATOR = 3
}

export interface User {
  id: string
  email: string
  role: UserRole
  first_name: string
  last_name: string
  company_id: string
  company_name: string
  garage_id: string | null
  is_service_account: boolean
  card_uid: string | null
  task_id: string | null
  record_task_id: string | null
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  user: User
}

export interface LoginCredentials {
  email: string
  password: string
}
