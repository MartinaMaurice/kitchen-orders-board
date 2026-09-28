import { AbstractControl, FormArray, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Egyptian mobile numbers: 01 then a 0/1/2/5 network digit, then 8 more digits (11 digits total). */
export const EGYPTIAN_PHONE_PATTERN = /^01[0125]\d{8}$/;

/** Custom validator: requires at least one row in a FormArray of order items. */
export function minItemsValidator(min = 1): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const array = control as FormArray;
    if (!(array instanceof FormArray)) {
      return null;
    }
    return array.length >= min ? null : { minItems: { required: min, actual: array.length } };
  };
}

/** Custom validator: validates an Egyptian mobile number when a value is present. */
export function egyptianPhoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value ?? '').toString().trim();
    if (!value) {
      return null;
    }
    return EGYPTIAN_PHONE_PATTERN.test(value) ? null : { egyptianPhone: true };
  };
}

/** Custom validator: table number must be an integer between 1 and 40. */
export function tableNumberValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const num = Number(value);
    return Number.isInteger(num) && num >= 1 && num <= 40 ? null : { tableRange: true };
  };
}
