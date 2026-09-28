import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MenuItem } from '../../../../core/models/menu.model';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { OrderItemFormGroup } from '../../order-form.types';

@Component({
  selector: 'app-order-item-row',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-item-row.component.html',
  styleUrl: './order-item-row.component.scss',
})
export class OrderItemRowComponent {
  protected readonly i18n = inject(TranslationService);

  readonly group = input.required<OrderItemFormGroup>();
  readonly menu = input.required<MenuItem[]>();
  readonly canRemove = input(true);
  readonly index = input.required<number>();

  readonly remove = output<void>();
}
