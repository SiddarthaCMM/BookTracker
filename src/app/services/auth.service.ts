import { Injectable } from '@angular/core';
import axios from 'axios';
import { Preferences } from '@capacitor/preferences';
import { Storage } from '@ionic/storage-angular';
import {
  RegisterCredentials, LoginResponse, Sesion, AuthApiError, FieldErrors,
  ForgotPasswordRequest, ForgotPasswordResponse,
  ResetPasswordRequest, ResetPasswordResponse,
  VerifyEmailResponse, ResendVerificationResponse,
} from './auth.models';
import { SecureStorageService } from './secure-storage.service';

/**
 * Servicio de autenticación. RF-AUT-01, 03, 04, 05.
 *
 * RF-AUT-05:
 *  - El TOKEN se guarda en almacenamiento seguro (SecureStorageService).
 *  - El ROL y USER_ID siguen en Preferences (no son secretos).
 *  - cerrarSesion() llama primero a POST /logout para revocar el token
 *    en el servidor; si no hay red, borra localmente y encola.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'login.php';
  private registerUrl = 'register.php';
  private forgotUrl = 'forgot_password.php';
  private resetUrl = 'reset_password.php';
  private verifyUrl = 'verify_email.php';
  private resendUrl = 'resend_verification.php';
  private logoutUrl = 'logout.php';

  // En web, el token se pierde al recargar. Lo mantenemos en memoria
  // para que el interceptor pueda seguir usándolo durante la sesión.
  private static TOKEN_KEY = 'auth_token';

  constructor(
    private storage: Storage,
    private secure: SecureStorageService,
  ) {}

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
      const res = await axios.post<ForgotPasswordResponse>(this.forgotUrl, { email });
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

  // ---------------------------------------------------------------
  // SESIÓN — RF-AUT-05
  // ---------------------------------------------------------------

  /**
   * Guarda la sesión:
   *  - Token → almacenamiento seguro (SecureStorage en nativo / memoria en web)
   *  - userId, role → Preferences (no son secretos)
   */
  async guardarSesion(userId: number, token: string, role: string): Promise<void> {
    await Promise.all([
      this.secure.set(AuthService.TOKEN_KEY, token),
      Preferences.set({ key: 'isLoggedIn', value: 'true' }),
      Preferences.set({ key: 'user_id', value: String(userId) }),
      Preferences.set({ key: 'user_role', value: role }),
    ]);
  }

  /**
   * Cierra sesión:
   *  1. Llama a POST /logout para revocar el token en el servidor.
   *  2. Si hay red → borra local.
   *  3. Si NO hay red → borra local igualmente y encola (TODO: backend
   *     con tabla de revocación pendiente. Por ahora simplemente
   *     borramos local).
   */
  async cerrarSesion(): Promise<void> {
    const token = await this.secure.get(AuthService.TOKEN_KEY);
    if (token) {
      try {
        await axios.post(this.logoutUrl, {}, {
          headers: { 'X-Auth-Token': token },
          timeout: 5000,
        });
      } catch (e) {
        // Sin red o servidor caído: borramos local de todas formas.
        console.warn('Logout servidor falló, limpiando localmente', e);
      }
    }
    await this.limpiarLocal();
  }

  private async limpiarLocal(): Promise<void> {
    await Promise.all([
      this.secure.remove(AuthService.TOKEN_KEY),
      Preferences.remove({ key: 'isLoggedIn' }),
      Preferences.remove({ key: 'user_id' }),
      Preferences.remove({ key: 'user_role' }),
      Preferences.remove({ key: 'token_expires_at' }),
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
      this.secure.get(AuthService.TOKEN_KEY),
      Preferences.get({ key: 'user_role' }),
      Preferences.get({ key: 'user_id' }),
    ]);
    return {
      token,
      rol: rol.value,
      userId: userId.value !== null ? Number(userId.value) : null,
    };
  }

  /** Atajo para el interceptor de axios (necesita el token síncrono). */
  async obtenerToken(): Promise<string | null> {
    return this.secure.get(AuthService.TOKEN_KEY);
  }

  private normalizeError(err: any): AuthRequestError {
    const status = err?.response?.status ?? 0;
    const body: AuthApiError = err?.response?.data ?? {
      success: false, message: 'Error de red o de servidor',
    };
    return new AuthRequestError(body.message ?? 'Error inesperado', status, body.errors ?? {}, body.retry_after);
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