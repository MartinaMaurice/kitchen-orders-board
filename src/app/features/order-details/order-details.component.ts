import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { MenuService } from '../../core/services/menu.service';
import { OrdersService } from '../../core/services/orders.service';
import { Order } from '../../core/models/order.model';
import { MenuItem } from '../../core/models/menu.model';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';
import { TranslationService } from '../../shared/i18n/translation.service';
import { priceOrder } from '../../shared/utils/pricing.util';

type DetailsState =
  | { kind: 'loading' }
  | { kind: 'not-found'; id: string }
  | { kind: 'error' }
  | { kind: 'ready'; order: Order; menu: MenuItem[] };

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [RouterLink, DatePipe, LoadingStateComponent, ErrorStateComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-details.component.html',
  styleUrl: './order-details.component.scss',
})
export class OrderDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly ordersService = inject(OrdersService);
  private readonly menuService = inject(MenuService);
  protected readonly i18n = inject(TranslationService);

  private readonly state = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('id') ?? ''),
      switchMap((id) =>
        this.ordersService.getOrder(id).pipe(
          switchMap((order) => this.menuService.getMenu().pipe(map((menu) => ({ order, menu })))),
          map(({ order, menu }): DetailsState => ({ kind: 'ready', order, menu })),
          catchError((err: HttpErrorResponse) =>
            of<DetailsState>(err.status === 404 ? { kind: 'not-found', id } : { kind: 'error' }),
          ),
        ),
      ),
    ),
    { initialValue: { kind: 'loading' } as DetailsState },
  );

  protected readonly kind = computed(() => this.state().kind);

  protected readonly order = computed(() => {
    const state = this.state();
    return state.kind === 'ready' ? state.order : null;
  });

  protected readonly notFoundId = computed(() => {
    const state = this.state();
    return state.kind === 'not-found' ? state.id : '';
  });

  protected readonly pricing = computed(() => {
    const state = this.state();
    return state.kind === 'ready' ? priceOrder(state.order, state.menu) : null;
  });
}
