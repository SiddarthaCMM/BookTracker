import { Injectable } from '@angular/core';
import axios from 'axios';
import { Preferences } from '@capacitor/preferences';
import { Storage } from '@ionic/storage-angular';
import { LoginResponse, UserCredentials } from './login.models';

/**
 * LoginService — RF-AUT-02
 * --------------------------------------------------------------
 * Inicio de sesión robusto. Mantiene la API pública existente
 * (login / guardarSesion / cerrarSesion / obtenerSesion) y añade
 * soporte para:
 *  - remember_me (token de 24h si false, 30 días si true)
 *  - guardar el momento de expiración del token en Preferences
 *  - exponer el token y su expiración para el futuro interceptor
 *    que validará sesiones expiradas (RF-AUT-05)
 */
@Injectable({ providedIn: 'root' })
export class LoginService {
  private apiUrl = 'login.php';

  constructor(private storage: Storage) {}

  async login(credentials: UserCredentials): Promise<LoginResponse> {
    const response = await axios.post<LoginResponse>(this.apiUrl, {
      email: credentials.email,
      password: credentials.password,
      remember_me: credentials.remember_me ?? false,
    });
    return response.data;
  }

  /**
   * Guarda la sesión y, si viene token_expires_in, calcula y guarda
   * el timestamp de expiración para que el futuro interceptor de
   * axios (RF-AUT-05) pueda decidir cuándo cerrar la sesión.
   */
  async guardarSesion(
    userId: string | number,
    token: string,
    role: string,
    expiresIn?: number,
  ): Promise<void> {
    const expiresAt = expiresIn
      ? String(Date.now() + expiresIn * 1000)
      : null;

    await Promise.all([
      Preferences.set({ key: 'isLoggedIn', value: 'true' }),
      Preferences.set({ key: 'user_id', value: String(userId) }),
      Preferences.set({ key: 'auth_token', value: token }),
      Preferences.set({ key: 'user_role', value: role }),
      ...(expiresAt
        ? [Preferences.set({ key: 'token_expires_at', value: expiresAt })]
        : [Preferences.remove({ key: 'token_expires_at' })]),
    ]);
  }

  async cerrarSesion(): Promise<void> {
    await Promise.all([
      Preferences.remove({ key: 'isLoggedIn' }),
      Preferences.remove({ key: 'user_id' }),
      Preferences.remove({ key: 'auth_token' }),
      Preferences.remove({ key: 'user_role' }),
      Preferences.remove({ key: 'token_expires_at' }),
    ]);
    try {
      await this.storage.create();
      await this.storage.clear();
    } catch (error) {
      console.warn('No se pudo limpiar la caché local', error);
    }
  }

  async obtenerSesion() {
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