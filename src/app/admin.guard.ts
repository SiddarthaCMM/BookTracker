import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginService } from './login/login.service';

export const adminGuard: CanActivateFn = async (route, state) => {
  const router = inject(Router);
  const loginService = inject(LoginService);

  const rol = await loginService.obtenerRol();

  if (rol === 'admin') {
    return true; // Es admin, deja entrar a los tabs de admin
  } else if (rol === 'user') {
    router.navigateByUrl('/user-tabs'); // Es user, mándalo a sus tabs
    return false;
  } else {
    router.navigateByUrl('/login'); // No hay sesión, al login
    return false;
  }
};