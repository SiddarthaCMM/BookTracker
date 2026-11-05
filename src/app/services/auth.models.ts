/**
 * Modelos de datos para autenticación.
 * RF-AUT-01 (P1) — Registro de cuenta.
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