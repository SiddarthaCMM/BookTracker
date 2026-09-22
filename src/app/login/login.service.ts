import { Injectable } from '@angular/core';
import axios from 'axios';
import { Preferences } from '@capacitor/preferences'; 

export interface UserCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user_id?: string;
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private apiUrl = 'http://127.0.0.1/api/login.php';

  constructor() {}

  async login(credentials: UserCredentials): Promise<LoginResponse> {
    const response = await axios.post<LoginResponse>(this.apiUrl, credentials);
    return response.data;
  }

  // Métodos para manejar la persistencia con Capacitor Preferences
  async guardarSesion(userId: string, token: string) {
    await Preferences.set({ key: 'isLoggedIn', value: 'true' });
    await Preferences.set({ key: 'user_id', value: userId });
    await Preferences.set({ key: 'auth_token', value: token });
  }

  async cerrarSesion() {
    await Preferences.remove({ key: 'isLoggedIn' });
    await Preferences.remove({ key: 'user_id' });
    await Preferences.remove({ key: 'auth_token' });
  }

  // Un método rápido para que el Guard verifique si hay sesión
  async estaLogueado(): Promise<boolean> {
    const { value } = await Preferences.get({ key: 'isLoggedIn' });
    return value === 'true';
  }
}