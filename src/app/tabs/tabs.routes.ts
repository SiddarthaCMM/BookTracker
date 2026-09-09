import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { authGuard } from '../auth.guard'; // Importa el guard

export const routes: Routes = [
  {
    path: '', // <--- AQUÍ DEBE IR VACÍO, NO 'tabs'
    component: TabsPage,
    children: [
      {
        path: 'tab1',
        canActivate: [authGuard], // Protegido
        loadComponent: () => import('../tab1/tab1.page').then((m) => m.Tab1Page),
      },
      {
        path: 'tab2',
        canActivate: [authGuard], // Protegido
        loadComponent: () => import('../tab2/tab2.page').then((m) => m.Tab2Page),
      },
      {
        path: 'tab3',
        canActivate: [authGuard], // Protegido
        loadComponent: () => import('../tab3/tab3.page').then((m) => m.Tab3Page),
      },
      {
        path: '',
        redirectTo: 'tab1',
        pathMatch: 'full',
      },
    ],
  },
];