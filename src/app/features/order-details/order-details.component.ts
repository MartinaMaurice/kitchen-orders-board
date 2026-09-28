import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { MenuService } from '../../core/services/menu.service';
import { OrdersService } from '../../core/services/orders.service';
import { Order } from '../../core/models/order.model';
import { MenuItem } from '../../core/models/menu.model';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';
import { ModalOverlayComponent } from '../../shared/components/modal-overlay/modal-overlay.component';
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
  imports: [DatePipe, LoadingStateComponent, ErrorStateComponent, EmptyStateComponent, ModalOverlayComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-details.component.html',
  styleUrl: './order-details.component.scss',
})
export class OrderDetailsComponent {
  private readonly router = inject(Router);
  private readonly ordersService = inject(OrdersService);
  private readonly menuService = inject(MenuService);
  protected readonly i18n = inject(TranslationService);

  /** Bound directly from the `:id` route param via `withComponentInputBinding()`. */
  readonly id = input.required<string>();

  private readonly state = toSignal(
    toObservable(this.id).pipe(
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

  close(): void {
    this.router.navigate(['/orders'], { queryParamsHandling: 'preserve' });
  }
}
