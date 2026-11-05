export interface UserCredentials {
  email: string;
  password: string;
  remember_me?: boolean;
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