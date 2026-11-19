import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

export const guestGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const { token, rol } = await authService.obtenerSesion();

  if (token && rol === 'admin') {
    return router.parseUrl('/tabs');
  }
  if (token && rol === 'user') {
    return router.parseUrl('/user-tabs');
  }
  return true;
};