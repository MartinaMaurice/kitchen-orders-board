import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MenuItem } from '../../../../core/models/menu.model';
import { Order } from '../../../../core/models/order.model';
import { ElapsedTimerComponent } from '../../../../shared/components/elapsed-timer/elapsed-timer.component';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { nextStatus } from '../../../../shared/utils/order-status.util';
import { orderItemCount, priceOrderItems } from '../../../../shared/utils/pricing.util';

@Component({
  selector: 'app-order-card',
  standalone: true,
  imports: [RouterLink, ElapsedTimerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-card.component.html',
  styleUrl: './order-card.component.scss',
})
export class OrderCardComponent {
  protected readonly i18n = inject(TranslationService);

  readonly order = input.required<Order>();
  readonly menu = input.required<MenuItem[]>();
  readonly advancing = input(false);

  readonly advance = output<Order>();

  readonly itemCount = computed(() => orderItemCount(this.order().items));
  readonly subtotal = computed(() => priceOrderItems(this.order().items, this.menu()).subtotal);
  readonly nextStatus = computed(() => nextStatus(this.order().status));

  readonly advanceLabel = computed(() => {
    const status = this.order().status;
    return status === 'new' || status === 'preparing' || status === 'ready'
      ? this.i18n.t(`card.advance.${status}`)
      : '';
  });

  readonly typeMeta = computed(() => {
    const order = this.order();
    if (order.type === 'dine-in') {
      return this.i18n.t('card.table', { table: order.table ?? '?' });
    }
    return this.i18n.t(`type.${order.type}`);
  });

  onAdvance(): void {
    if (this.nextStatus()) {
      this.advance.emit(this.order());
    }
  }
}
