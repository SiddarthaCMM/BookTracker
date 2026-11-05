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
  VerifyEmailResponse,
  ResendVerificationResponse,
} from './auth.models';

/**
 * Servicio de autenticación. RF-AUT-01, RF-AUT-03, RF-AUT-04.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'login.php';
  private registerUrl = 'register.php';
  private forgotUrl = 'forgot_password.php';
  private resetUrl = 'reset_password.php';
  private verifyUrl = 'verify_email.php';
  private resendUrl = 'resend_verification.php';

  constructor(private storage: Storage) {}

  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await axios.post<LoginResponse>(this.apiUrl, { email, password });
    return res.data;
  }

  async register(data: RegisterCredentials): Promise<LoginResponse> {
    try {
      const res = await axios.post<LoginResponse>(this.registerUrl, data);
      return res.data;
    } catch (err: any) {
      throw this.normalizeError(err);
    }
  }

  async solicitarRecuperacion(email: string): Promise<ForgotPasswordResponse> {
    try {
      const res = await axios.post<ForgotPasswordResponse>(this.forgotUrl, { email } as ForgotPasswordRequest);
      return res.data;
    } catch (err: any) {
      throw this.normalizeError(err);
    }
  }

  async restablecerContrasena(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    try {
      const res = await axios.post<ResetPasswordResponse>(this.resetUrl, data);
      return res.data;
    } catch (err: any) {
      throw this.normalizeError(err);
    }
  }

  // ---------------------------------------------------------------
  // RF-AUT-04 — Verificación de correo
  // ---------------------------------------------------------------
  async verifyEmail(code: string): Promise<VerifyEmailResponse> {
    try {
      const res = await axios.post<VerifyEmailResponse>(this.verifyUrl, { code });
      return res.data;
    } catch (err: any) {
      throw this.normalizeError(err);
    }
  }

  async resendVerification(): Promise<ResendVerificationResponse> {
    try {
      const res = await axios.post<ResendVerificationResponse>(this.resendUrl, {});
      return res.data;
    } catch (err: any) {
      throw this.normalizeError(err);
    }
  }

  private normalizeError(err: any): AuthRequestError {
    const status = err?.response?.status ?? 0;
    const body: AuthApiError = err?.response?.data ?? {
      success: false,
      message: 'Error de red o de servidor',
    };
    return new AuthRequestError(body.message ?? 'Error inesperado', status, body.errors ?? {}, body.retry_after);
  }

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