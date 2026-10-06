import { Injectable } from '@angular/core';
import axios from 'axios';
import { Preferences } from '@capacitor/preferences';
import { environment } from '../../environments/environment';

export interface UserCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user_id?: string;
  token?: string;
  role?: string; 
}

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private apiUrl = `${environment.apiUrl}login.php`;

  constructor() {}

  async login(credentials: UserCredentials): Promise<LoginResponse> {
    const response = await axios.post<LoginResponse>(this.apiUrl, credentials);
    return response.data;
  }

  async guardarSesion(userId: string, token: string, role: string) {
    await Preferences.set({ key: 'isLoggedIn', value: 'true' });
    await Preferences.set({ key: 'user_id', value: userId });
    await Preferences.set({ key: 'auth_token', value: token });
    await Preferences.set({ key: 'user_role', value: role }); 
  }

  async cerrarSesion() {
    await Preferences.remove({ key: 'isLoggedIn' });
    await Preferences.remove({ key: 'user_id' });
    await Preferences.remove({ key: 'auth_token' });
    await Preferences.remove({ key: 'user_role' }); 
  }

  async obtenerRol(): Promise<string | null> {
    const { value } = await Preferences.get({ key: 'user_role' });
    return value;
  }
}