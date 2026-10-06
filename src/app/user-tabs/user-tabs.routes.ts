import { Routes } from '@angular/router';
import { UserTabsPage } from './user-tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: UserTabsPage,
    children: [
      {
        path: 'inicio',
        loadComponent: () => import('../user-inicio/user-inicio.page').then((m) => m.UserInicioPage),
      },
      {
        path: 'biblioteca',
        loadComponent: () => import('../user-biblioteca/user-biblioteca.page').then((m) => m.UserBibliotecaPage),
      },
      {
        path: 'perfil',
        loadComponent: () => import('../user-perfil/user-perfil.page').then((m) => m.UserPerfilPage),
      },
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full',
      },
    ],
  },
];