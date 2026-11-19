import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

export const userGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const { token, rol } = await authService.obtenerSesion();

  if (!token) {
    return router.parseUrl('/login');
  }
  if (rol === 'user') {
    return true;
  }
  return router.parseUrl(rol === 'admin' ? '/tabs' : '/login');
};