import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from './login/login.service';

/** Si ya hay sesión iniciada, salta el login y manda a cada rol a su pantalla. */
export const guestGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const loginService = inject(LoginService);

  const { token, rol } = await loginService.obtenerSesion();

  if (token && rol === 'admin') {
    return router.parseUrl('/tabs');
  }
  if (token && rol === 'user') {
    return router.parseUrl('/user-tabs');
  }
  return true;
};
