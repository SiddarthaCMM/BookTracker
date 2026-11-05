/**
 * Modelos de datos para autenticación.
 * RF-AUT-01 (P1) — Registro de cuenta.
 * RF-AUT-03 (P1) — Recuperar contraseña.
 */

export interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
  confirm_password: string;
  birth_date?: string; // YYYY-MM-DD, opcional
  accept_terms: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user_id?: number;
  token?: string;
  role?: 'user' | 'admin';
  /** Segundos hasta que caduque el token (24h o 30 días). */
  token_expires_in?: number;
  /** Intentos restantes antes del bloqueo (en 401). */
  attempts_remaining?: number;
  /** Segundos hasta poder reintentar (en 429). */
  retry_after?: number;
}

export interface Sesion {
  token: string | null;
  rol: string | null;
  userId: number | null;
}

/** Errores por campo devueltos por el servidor en 422/409. */
export interface FieldErrors {
  [campo: string]: string[];
}

export interface AuthApiError {
  success: false;
  message: string;
  errors?: FieldErrors;
  retry_after?: number; // segundos, en 429
}

// ---------------------------------------------------------------
// RF-AUT-03 — Recuperar contraseña
// ---------------------------------------------------------------

/** Petición al endpoint /forgot-password */
export interface ForgotPasswordRequest {
  email: string;
}

/** Respuesta del endpoint /forgot-password */
export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  /** Solo en DEV_MODE — el código generado, para que el dev lo vea. */
  dev_code?: string;
  dev_email?: string;
}

/** Petición al endpoint /reset-password */
export interface ResetPasswordRequest {
  code: string;        // 6 dígitos
  password: string;
  confirm_password: string;
}

/** Respuesta del endpoint /reset-password */
export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}