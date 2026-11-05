import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from './login/login.service';

/**
 * authGuard — acepta cualquier usuario autenticado (user o admin).
 * Usado por rutas que no son exclusivas de un rol, como /verify-email.
 */
export const authGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const loginService = inject(LoginService);
  const { token } = await loginService.obtenerSesion();
  if (token) return true;
  return router.parseUrl('/login');
};