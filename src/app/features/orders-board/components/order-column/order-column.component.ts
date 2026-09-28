import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { MenuItem } from '../../../../core/models/menu.model';
import { Order, OrderStatus } from '../../../../core/models/order.model';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { nextStatus } from '../../../../shared/utils/order-status.util';
import { OrderCardComponent } from '../order-card/order-card.component';

@Component({
  selector: 'app-order-column',
  standalone: true,
  imports: [OrderCardComponent, EmptyStateComponent, CdkDropList, CdkDrag, CdkDragPlaceholder],
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

  /** Only accept a card dragged from the column whose status advances into this one. */
  protected readonly enterPredicate = (drag: CdkDrag<Order>): boolean => nextStatus(drag.data.status) === this.status();

  onDropped(event: CdkDragDrop<Order[], Order[], Order>): void {
    if (event.previousContainer === event.container) {
      return;
    }
    this.advance.emit(event.item.data);
  }
}
