import axios from 'axios';
import type { AuthResponse, LoginCredentials } from '../types/auth';

const API_URL = import.meta.env.VITE_API_URL;

class AuthService {
  private static instance: AuthService;
  private readonly storageKeys = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER: 'user'
  };

  private constructor() {
    // Singleton
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await axios.post<AuthResponse>(
        `${API_URL}/auth/login`,
        credentials
      );
      console.log(response.status)
      console.log(response.data)
      this.setSession(response.data);
      return response.data;
    } catch (error) {
      this.clearSession();
      throw error;
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    try {
      const refresh_token = this.getRefreshToken();
      if (!refresh_token) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post<AuthResponse>(`${API_URL}/auth/refresh`, {
        refresh_token
      });

      this.setSession(response.data);
      return response.data;
    } catch (error) {
      this.clearSession();
      throw error;
    }
  }

  setSession(authResponse: AuthResponse): void {
    sessionStorage.setItem(this.storageKeys.ACCESS_TOKEN, authResponse.access_token);
    sessionStorage.setItem(this.storageKeys.REFRESH_TOKEN, authResponse.refresh_token);
    sessionStorage.setItem(this.storageKeys.USER, JSON.stringify(authResponse.user));
  }

  clearSession(): void {
    sessionStorage.removeItem(this.storageKeys.ACCESS_TOKEN);
    sessionStorage.removeItem(this.storageKeys.REFRESH_TOKEN);
    sessionStorage.removeItem(this.storageKeys.USER);
  }

  getAccessToken(): string | null {
    return sessionStorage.getItem(this.storageKeys.ACCESS_TOKEN);
  }

  getRefreshToken(): string | null {
    return sessionStorage.getItem(this.storageKeys.REFRESH_TOKEN);
  }

  getUser(): any | null {
    const user = sessionStorage.getItem(this.storageKeys.USER);
    return user ? JSON.parse(user) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

export default AuthService.getInstance(); 