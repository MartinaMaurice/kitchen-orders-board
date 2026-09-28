import { CdkDropListGroup } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { MenuService } from '../../core/services/menu.service';
import { OrdersService } from '../../core/services/orders.service';
import { ToastService } from '../../core/services/toast.service';
import { VisibilityService } from '../../core/services/visibility.service';
import { Order, ORDER_STATUS_SEQUENCE, OrderStatus } from '../../core/models/order.model';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { LoadingStateComponent } from '../../shared/components/loading-state/loading-state.component';
import { TranslationService } from '../../shared/i18n/translation.service';
import { BoardFiltersComponent, TypeFilter } from './components/board-filters/board-filters.component';
import { OrderColumnComponent } from './components/order-column/order-column.component';

@Component({
  selector: 'app-orders-board',
  standalone: true,
  imports: [
    RouterLink,
    RouterOutlet,
    CdkDropListGroup,
    BoardFiltersComponent,
    OrderColumnComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './orders-board.component.html',
  styleUrl: './orders-board.component.scss',
})
export class OrdersBoardComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ordersService = inject(OrdersService);
  private readonly menuService = inject(MenuService);
  private readonly toast = inject(ToastService);
  protected readonly i18n = inject(TranslationService);
  protected readonly visibility = inject(VisibilityService);

  protected readonly statuses: readonly OrderStatus[] = ORDER_STATUS_SEQUENCE;

  private readonly queryParamMap = toSignal(this.route.queryParamMap, { requireSync: true });

  protected readonly search = computed(() => this.queryParamMap().get('search') ?? '');
  protected readonly type = computed<TypeFilter>(() => (this.queryParamMap().get('type') as TypeFilter) || 'all');
  protected readonly hasActiveFilters = computed(() => !!this.search() || this.type() !== 'all');

  protected readonly menu = toSignal(this.menuService.getMenu(), { initialValue: [] });
  protected readonly orders = this.ordersService.orders;
  protected readonly loading = this.ordersService.loading;
  protected readonly error = this.ordersService.error;
  protected readonly advancingId = signal<string | null>(null);

  protected readonly filteredOrders = computed(() => {
    const search = this.search().trim().toLowerCase();
    const type = this.type();
    return this.orders().filter((order) => {
      const matchesType = type === 'all' || order.type === type;
      if (!matchesType) return false;
      if (!search) return true;
      const numberMatch = order.number.toString().includes(search);
      const tableMatch = order.table !== null && order.table.toString().includes(search);
      return numberMatch || tableMatch;
    });
  });

  constructor() {
    this.ordersService.pollOrders$.pipe(takeUntilDestroyed()).subscribe();
  }

  ordersFor(status: OrderStatus): Order[] {
    return this.filteredOrders().filter((order) => order.status === status);
  }

  onSearchChange(value: string): void {
    this.updateQueryParams({ search: value || null });
  }

  onTypeChange(value: TypeFilter): void {
    this.updateQueryParams({ type: value === 'all' ? null : value });
  }

  clearFilters(): void {
    this.updateQueryParams({ search: null, type: null });
  }

  retry(): void {
    this.ordersService.refreshNow();
  }

  closeModal(): void {
    this.router.navigate(['/orders'], { queryParamsHandling: 'preserve' });
  }

  onAdvance(order: Order): void {
    const target = ORDER_STATUS_SEQUENCE[ORDER_STATUS_SEQUENCE.indexOf(order.status) + 1];
    if (!target || this.advancingId()) {
      return;
    }
    this.advancingId.set(order.id);
    this.ordersService.updateStatus(order, target).subscribe({
      next: () => this.advancingId.set(null),
      error: () => {
        this.advancingId.set(null);
        this.toast.error(this.i18n.t('card.moveFailed', { number: order.number }));
      },
    });
  }

  private updateQueryParams(params: Record<string, string | null>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
