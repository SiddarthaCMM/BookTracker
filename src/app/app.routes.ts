import { Routes } from '@angular/router';
import { adminGuard } from './admin.guard';
import { userGuard } from './user.guard';
import { guestGuard } from './guest.guard';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./login/login.page').then((m) => m.LoginPage) },
  { path: 'register', canActivate: [guestGuard], loadComponent: () => import('./register/register.page').then((m) => m.RegisterPage) },
  { path: 'forgot-password', canActivate: [guestGuard], loadComponent: () => import('./forgot-password/forgot-password.page').then((m) => m.ForgotPasswordPage) },
  { path: 'reset-password', canActivate: [guestGuard], loadComponent: () => import('./reset-password/reset-password.page').then((m) => m.ResetPasswordPage) },
  { path: 'verify-email', canActivate: [authGuard], loadComponent: () => import('./verify-email/verify-email.page').then((m) => m.VerifyEmailPage) },
  // RF-AUT-05 (P3): pantalla de sesiones activas.
  { path: 'sessions', canActivate: [authGuard], loadComponent: () => import('./sessions/sessions.page').then((m) => m.SessionsPage) },
  { path: 'tabs', canActivate: [adminGuard], loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes) },
  { path: 'user-tabs', canActivate: [userGuard], loadChildren: () => import('./user-tabs/user-tabs.routes').then((m) => m.routes) },
  { path: '**', redirectTo: 'login' },
];