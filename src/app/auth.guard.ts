import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from './login/login.service'; // Ajusta la ruta

export const authGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const loginService = inject(LoginService);

  const isLoggedIn = await loginService.estaLogueado();

  if (isLoggedIn) {
    return true;
  } else {
    router.navigateByUrl('/login');
    return false;
  }
};