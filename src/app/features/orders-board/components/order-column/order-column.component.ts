import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { MenuItem } from '../../../../core/models/menu.model';
import { Order, OrderStatus } from '../../../../core/models/order.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { OrderCardComponent } from '../order-card/order-card.component';

@Component({
  selector: 'app-order-column',
  standalone: true,
  imports: [OrderCardComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-column.component.html',
  styleUrl: './order-column.component.scss',
})
export class OrderColumnComponent {
  protected readonly i18n = inject(TranslationService);

  readonly status = input.required<OrderStatus>();
  readonly title = input.required<string>();
  readonly orders = input.required<Order[]>();
  readonly menu = input.required<MenuItem[]>();
  readonly hasActiveFilters = input(false);
  readonly advancingId = input<string | null>(null);

  readonly advance = output<Order>();
}
