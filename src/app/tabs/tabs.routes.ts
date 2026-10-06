import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { adminGuard } from '../admin.guard'; // <--- Cambiado a adminGuard

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'tab1',
        canActivate: [adminGuard], // <--- Cambiado a adminGuard
        loadComponent: () => import('../tab1/tab1.page').then((m) => m.Tab1Page),
      },
      {
        path: 'tab2',
        canActivate: [adminGuard], // <--- Cambiado a adminGuard
        loadComponent: () => import('../tab2/tab2.page').then((m) => m.Tab2Page),
      },
      {
        path: 'tab3',
        canActivate: [adminGuard], // <--- Cambiado a adminGuard
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