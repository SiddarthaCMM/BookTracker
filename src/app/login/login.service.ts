import { Injectable } from '@angular/core';
import axios from 'axios';
import { Preferences } from '@capacitor/preferences';
import { Storage } from '@ionic/storage-angular';

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

export interface Sesion {
  token: string | null;
  rol: string | null;
  userId: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private apiUrl = 'login.php';

  constructor(private storage: Storage) {}

  async login(credentials: UserCredentials): Promise<LoginResponse> {
    const response = await axios.post<LoginResponse>(this.apiUrl, credentials);
    return response.data;
  }

  async guardarSesion(userId: string, token: string, role: string): Promise<void> {
    await Promise.all([
      Preferences.set({ key: 'isLoggedIn', value: 'true' }),
      Preferences.set({ key: 'user_id', value: String(userId) }),
      Preferences.set({ key: 'auth_token', value: token }),
      Preferences.set({ key: 'user_role', value: role }),
    ]);
  }

  async cerrarSesion(): Promise<void> {
    await Promise.all([
      Preferences.remove({ key: 'isLoggedIn' }),
      Preferences.remove({ key: 'user_id' }),
      Preferences.remove({ key: 'auth_token' }),
      Preferences.remove({ key: 'user_role' }),
    ]);
    // Limpia la caché offline para que otro usuario no vea datos del anterior
    try {
      await this.storage.create();
      await this.storage.clear();
    } catch (error) {
      console.warn('No se pudo limpiar la caché local', error);
    }
  }

  async obtenerSesion(): Promise<Sesion> {
    const [token, rol, userId] = await Promise.all([
      Preferences.get({ key: 'auth_token' }),
      Preferences.get({ key: 'user_role' }),
      Preferences.get({ key: 'user_id' }),
    ]);
    return { token: token.value, rol: rol.value, userId: userId.value };
  }

  async obtenerRol(): Promise<string | null> {
    const { value } = await Preferences.get({ key: 'user_role' });
    return value;
  }
}
