import { Routes } from '@angular/router';
import { OrdersBoardComponent } from './features/orders-board/orders-board.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'orders' },
  { path: 'orders', component: OrdersBoardComponent, title: 'Kitchen Orders Board' },
  {
    path: 'orders/new',
    loadComponent: () => import('./features/order-form/order-form.component').then((m) => m.OrderFormComponent),
    title: 'New order · Kitchen Orders Board',
  },
  {
    path: 'orders/:id',
    loadComponent: () =>
      import('./features/order-details/order-details.component').then((m) => m.OrderDetailsComponent),
    title: 'Order details · Kitchen Orders Board',
  },
  { path: '**', redirectTo: 'orders' },
];
