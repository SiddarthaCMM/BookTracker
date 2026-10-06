import { Routes } from '@angular/router';
import { adminGuard } from './admin.guard';
import { userGuard } from './user.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'tabs',
    canActivate: [adminGuard], // <--- Protegido para admins
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'user-tabs',
    canActivate: [userGuard], // <--- Protegido para usuarios
    loadChildren: () => import('./user-tabs/user-tabs.routes').then((m) => m.routes),
  },
  {
    path: 'user-inicio',
    loadComponent: () => import('./user-inicio/user-inicio.page').then( m => m.UserInicioPage)
  },
  {
    path: 'user-biblioteca',
    loadComponent: () => import('./user-biblioteca/user-biblioteca.page').then( m => m.UserBibliotecaPage)
  },
  {
    path: 'user-perfil',
    loadComponent: () => import('./user-perfil/user-perfil.page').then( m => m.UserPerfilPage)
  },

];