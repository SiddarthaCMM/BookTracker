import { Routes } from '@angular/router';
import { adminGuard } from './admin.guard';
import { userGuard } from './user.guard';
import { guestGuard } from './guest.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
  },
  // ───────────────────────────────────────────────────────────────
  // RF-AUT-01: registro público, protegido por guestGuard.
  // ───────────────────────────────────────────────────────────────
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'tabs',
    canActivate: [adminGuard],
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'user-tabs',
    canActivate: [userGuard],
    loadChildren: () => import('./user-tabs/user-tabs.routes').then((m) => m.routes),
  },
  {
    // Cualquier ruta desconocida vuelve al login
    path: '**',
    redirectTo: 'login',
  },
];