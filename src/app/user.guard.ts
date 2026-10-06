import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from './login/login.service';

export const userGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const loginService = inject(LoginService);

  const rol = await loginService.obtenerRol();

  if (rol === 'user') {
    return true; // Es user, deja entrar
  } else if (rol === 'admin') {
    router.navigateByUrl('/tabs'); // Es admin, mándalo a los tabs de admin
    return false;
  } else {
    router.navigateByUrl('/login'); // No hay sesión
    return false;
  }
};