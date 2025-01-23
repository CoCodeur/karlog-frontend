export enum UserRole {
  USER = 0,
  SERVICE_ACCOUNT = 1,
  ADMINISTRATOR = 2,
  SUPER_ADMINISTRATOR = 3,
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  companyName?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
} 