import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  // Revisamos si el usuario tiene la sesión guardada en el localStorage
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  if (isLoggedIn) {
    // Si está logueado, lo deja pasar a la vista
    return true;
  } else {
    // Si no está logueado, lo manda de vuelta al login
    router.navigateByUrl('/login');
    return false;
  }
};