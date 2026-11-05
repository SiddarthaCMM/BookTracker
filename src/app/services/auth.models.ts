/**
 * Modelos de datos para autenticación.
 * RF-AUT-01, RF-AUT-03, RF-AUT-04.
 */

export interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
  confirm_password: string;
  birth_date?: string;
  accept_terms: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user_id?: number;
  token?: string;
  role?: 'user' | 'admin';
  token_expires_in?: number;
  attempts_remaining?: number;
  retry_after?: number;
  /** Solo en DEV_MODE — código de verificación de correo tras registro. */
  dev_code?: string;
}

export interface Sesion {
  token: string | null;
  rol: string | null;
  userId: number | null;
}

export interface FieldErrors {
  [campo: string]: string[];
}

export interface AuthApiError {
  success: false;
  message: string;
  errors?: FieldErrors;
  retry_after?: number;
}

// RF-AUT-03 — Recuperar contraseña
export interface ForgotPasswordRequest { email: string; }
export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  dev_code?: string;
  dev_email?: string;
}
export interface ResetPasswordRequest {
  code: string;
  password: string;
  confirm_password: string;
}
export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

// ---------------------------------------------------------------
// RF-AUT-04 — Verificación de correo
// ---------------------------------------------------------------
export interface VerifyEmailResponse {
  success: boolean;
  message: string;
}

export interface ResendVerificationResponse {
  success: boolean;
  message: string;
  dev_code?: string;
}