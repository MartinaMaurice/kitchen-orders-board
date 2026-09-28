import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, startWith } from 'rxjs';
import { OrderStatus } from '../../../core/models/order.model';
import { elapsedMillis, formatElapsed, isOrderLate } from '../../utils/order-status.util';

/**
 * Ticks its own 1-second clock so a single card's elapsed time updates without
 * forcing change detection over the entire board (kept as its own OnPush leaf).
 */
@Component({
  selector: 'app-elapsed-timer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="elapsed" [class.elapsed--late]="late()">
      {{ display() }}
      @if (late()) {
        <span class="elapsed__late-tag">{{ lateLabel() }}</span>
      }
    </span>
  `,
  styleUrl: './elapsed-timer.component.scss',
})
export class ElapsedTimerComponent {
  readonly createdAt = input.required<string>();
  readonly status = input.required<OrderStatus>();
  readonly lateLabel = input('late');
  readonly doneLabel = input('done');

  private readonly now = signal(Date.now());

  readonly display = computed(() => {
    if (this.status() === 'served') {
      return this.doneLabel();
    }
    return formatElapsed(elapsedMillis(this.createdAt(), this.now()));
  });

  readonly late = computed(() => isOrderLate({ status: this.status(), createdAt: this.createdAt() }, this.now()));

  constructor() {
    interval(1000)
      .pipe(startWith(0), takeUntilDestroyed())
      .subscribe(() => this.now.set(Date.now()));
  }
}
