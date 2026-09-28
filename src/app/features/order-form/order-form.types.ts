import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { OrderType } from '../../core/models/order.model';

export interface OrderItemFormValue {
  menuId: string;
  qty: number;
  note: string;
}

export type OrderItemFormGroup = FormGroup<{
  menuId: FormControl<string>;
  qty: FormControl<number>;
  note: FormControl<string>;
}>;

export type OrderFormGroup = FormGroup<{
  type: FormControl<OrderType>;
  table: FormControl<number | null>;
  phone: FormControl<string>;
  items: FormArray<OrderItemFormGroup>;
}>;
