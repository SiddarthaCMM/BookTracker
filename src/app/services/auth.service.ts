import { Injectable } from '@angular/core';
import axios from 'axios';
import { Preferences } from '@capacitor/preferences';
import { Storage } from '@ionic/storage-angular';
import {
  RegisterCredentials,
  LoginResponse,
  Sesion,
  AuthApiError,
  FieldErrors,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from './auth.models';

/**
 * Servicio de autenticación. RF-AUT-01, RF-AUT-03.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'login.php';
  private registerUrl = 'register.php';
  private forgotUrl = 'forgot_password.php';
  private resetUrl = 'reset_password.php';

  constructor(private storage: Storage) {}

  // ---------------------------------------------------------------
  // LOGIN (heredado)
  // ---------------------------------------------------------------
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await axios.post<LoginResponse>(this.apiUrl, { email, password });
    return res.data;
  }

  // ---------------------------------------------------------------
  // REGISTRO — RF-AUT-01
  // ---------------------------------------------------------------
  async register(data: RegisterCredentials): Promise<LoginResponse> {
    try {
      const res = await axios.post<LoginResponse>(this.registerUrl, data);
      return res.data;
    } catch (err: any) {
      throw this.normalizeError(err);
    }
  }

  // ---------------------------------------------------------------
  // RECUPERAR CONTRASEÑA — RF-AUT-03
  // ---------------------------------------------------------------

  /** Paso 1: solicitar el código de recuperación por correo. */
  async solicitarRecuperacion(email: string): Promise<ForgotPasswordResponse> {
    try {
      const res = await axios.post<ForgotPasswordResponse>(this.forgotUrl, { email } as ForgotPasswordRequest);
      return res.data;
    } catch (err: any) {
      throw this.normalizeError(err);
    }
  }

  /** Paso 3: cambiar la contraseña usando el código recibido. */
  async restablecerContrasena(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    try {
      const res = await axios.post<ResetPasswordResponse>(this.resetUrl, data);
      return res.data;
    } catch (err: any) {
      throw this.normalizeError(err);
    }
  }

  /** Convierte el error de axios en un objeto tipado y predecible. */
  private normalizeError(err: any): AuthRequestError {
    const status = err?.response?.status ?? 0;
    const body: AuthApiError = err?.response?.data ?? {
      success: false,
      message: 'Error de red o de servidor',
    };
    return new AuthRequestError(body.message ?? 'Error inesperado', status, body.errors ?? {}, body.retry_after);
  }

  // ---------------------------------------------------------------
  // SESIÓN
  // ---------------------------------------------------------------
  async guardarSesion(userId: number, token: string, role: string): Promise<void> {
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
    try {
      await this.storage.create();
      await this.storage.clear();
    } catch (e) {
      console.warn('No se pudo limpiar la caché local', e);
    }
  }

  async obtenerSesion(): Promise<Sesion> {
    const [token, rol, userId] = await Promise.all([
      Preferences.get({ key: 'auth_token' }),
      Preferences.get({ key: 'user_role' }),
      Preferences.get({ key: 'user_id' }),
    ]);
    return {
      token: token.value,
      rol: rol.value,
      userId: userId.value !== null ? Number(userId.value) : null,
    };
  }
}

export class AuthRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors: FieldErrors = {},
    public readonly retryAfter?: number,
  ) {
    super(message);
    this.name = 'AuthRequestError';
  }

  get isValidation(): boolean { return this.status === 422; }
  get isConflict(): boolean { return this.status === 409; }
  get isRateLimited(): boolean { return this.status === 429; }
  get isGone(): boolean { return this.status === 410; }
}