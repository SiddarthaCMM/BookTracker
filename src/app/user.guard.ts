import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from './login/login.service';

export const userGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const loginService = inject(LoginService);

  const { token, rol } = await loginService.obtenerSesion();

  if (!token) {
    return router.parseUrl('/login'); // Sin sesión
  }
  if (rol === 'user') {
    return true;
  }
  return router.parseUrl(rol === 'admin' ? '/tabs' : '/login');
};
