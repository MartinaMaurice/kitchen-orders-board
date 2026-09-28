import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MenuService } from '../../core/services/menu.service';
import { NewOrderPayload, ORDER_TYPES, OrderType } from '../../core/models/order.model';
import { OrdersService } from '../../core/services/orders.service';
import { ToastService } from '../../core/services/toast.service';
import { TranslationService } from '../../shared/i18n/translation.service';
import { egyptianPhoneValidator, minItemsValidator, tableNumberValidator } from '../../shared/validators/order-form.validators';
import { priceOrderItems } from '../../shared/utils/pricing.util';
import { OrderFormGroup, OrderItemFormGroup } from './order-form.types';
import { OrderItemRowComponent } from './components/order-item-row/order-item-row.component';
import { ModalOverlayComponent } from '../../shared/components/modal-overlay/modal-overlay.component';

const STARTING_ORDER_NUMBER = 1000;

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [ReactiveFormsModule, OrderItemRowComponent, ModalOverlayComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-form.component.html',
  styleUrl: './order-form.component.scss',
})
export class OrderFormComponent {
  private readonly ordersService = inject(OrdersService);
  private readonly menuService = inject(MenuService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  protected readonly i18n = inject(TranslationService);

  protected readonly types = ORDER_TYPES;
  protected readonly menu = toSignal(this.menuService.getMenu(), { initialValue: [] });
  protected readonly submitting = signal(false);

  private nextOrderNumber = STARTING_ORDER_NUMBER + 1;

  protected readonly form: OrderFormGroup = new FormGroup({
    type: new FormControl<OrderType>('dine-in', { nonNullable: true, validators: Validators.required }),
    table: new FormControl<number | null>(null, [Validators.required, tableNumberValidator()]),
    phone: new FormControl('', { nonNullable: true, validators: [egyptianPhoneValidator()] }),
    items: new FormArray<OrderItemFormGroup>([this.createItemGroup()], minItemsValidator(1)),
  });

  protected readonly selectedType = toSignal(this.form.controls.type.valueChanges, {
    initialValue: this.form.controls.type.value,
  });

  private readonly formSnapshot = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  protected readonly runningTotal = computed(() => {
    // Read the snapshot to establish reactivity, then always price off live control
    // values so a mid-edit qty/menu change is reflected immediately.
    this.formSnapshot();
    const validItems = this.form.controls.items.controls
      .map((group) => group.getRawValue())
      .filter((item) => item.menuId && item.qty > 0);
    return priceOrderItems(validItems, this.menu()).subtotal;
  });

  constructor() {
    this.ordersService
      .listOrders()
      .subscribe((orders) => {
        const highest = orders.reduce((max, order) => Math.max(max, order.number), STARTING_ORDER_NUMBER);
        this.nextOrderNumber = highest + 1;
      });

    this.form.controls.type.valueChanges.pipe(takeUntilDestroyed()).subscribe((type) => this.applyTypeValidators(type));
    this.applyTypeValidators(this.form.controls.type.value);
  }

  get itemGroups(): OrderItemFormGroup[] {
    return this.form.controls.items.controls;
  }

  setType(type: OrderType): void {
    this.form.controls.type.setValue(type);
  }

  addItem(): void {
    this.form.controls.items.push(this.createItemGroup());
  }

  removeItem(index: number): void {
    if (this.form.controls.items.length > 1) {
      this.form.controls.items.removeAt(index);
    }
  }

  submit(): void {
    if (this.submitting()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const value = this.form.getRawValue();
    const payload: NewOrderPayload = {
      number: this.nextOrderNumber,
      type: value.type,
      table: value.type === 'dine-in' ? value.table : null,
      phone: value.type === 'delivery' ? value.phone : null,
      status: 'new',
      createdAt: new Date().toISOString(),
      items: value.items.map((item) => ({ menuId: item.menuId, qty: item.qty, note: item.note.trim() })),
    };

    this.ordersService.createOrder(payload).subscribe({
      next: (order) => {
        this.toast.success(this.i18n.t('form.success', { number: order.number }));
        this.ordersService.refreshNow();
        this.router.navigate(['/orders', order.id]);
      },
      error: () => {
        this.submitting.set(false);
        this.toast.error(this.i18n.t('form.error'));
      },
    });
  }

  close(): void {
    this.router.navigate(['/orders'], { queryParamsHandling: 'preserve' });
  }

  private createItemGroup(): OrderItemFormGroup {
    return new FormGroup({
      menuId: new FormControl('', { nonNullable: true, validators: Validators.required }),
      qty: new FormControl(1, { nonNullable: true, validators: [Validators.required, Validators.min(1), Validators.max(20)] }),
      note: new FormControl('', { nonNullable: true }),
    });
  }

  private applyTypeValidators(type: OrderType): void {
    const table = this.form.controls.table;
    const phone = this.form.controls.phone;

    table.setValidators(type === 'dine-in' ? [Validators.required, tableNumberValidator()] : [tableNumberValidator()]);
    phone.setValidators(type === 'delivery' ? [Validators.required, egyptianPhoneValidator()] : [egyptianPhoneValidator()]);

    table.updateValueAndValidity({ emitEvent: false });
    phone.updateValueAndValidity({ emitEvent: false });
  }
}
