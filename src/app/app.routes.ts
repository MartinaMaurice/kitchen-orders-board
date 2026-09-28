import { Routes } from '@angular/router';
import { OrdersBoardComponent } from './features/orders-board/orders-board.component';

/**
 * `orders/new` and `orders/:id` are children of the board route rather than
 * top-level routes: the board stays mounted (polling keeps running, no flicker)
 * and the child renders into the board's own `<router-outlet>`, styled as a
 * modal overlay on top of it. The board is also aliased at `/` so the app
 * doesn't force the URL to `/orders` on first load.
 */
export const routes: Routes = [
  { path: '', component: OrdersBoardComponent, pathMatch: 'full', title: 'Kitchen Orders Board' },
  {
    path: 'orders',
    component: OrdersBoardComponent,
    title: 'Kitchen Orders Board',
    children: [
      {
        path: 'new',
        loadComponent: () => import('./features/order-form/order-form.component').then((m) => m.OrderFormComponent),
        title: 'New order · Kitchen Orders Board',
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/order-details/order-details.component').then((m) => m.OrderDetailsComponent),
        title: 'Order details · Kitchen Orders Board',
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
