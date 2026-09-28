import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { egyptianPhoneValidator, minItemsValidator, tableNumberValidator } from './order-form.validators';

describe('order-form.validators', () => {
  describe('egyptianPhoneValidator (custom validator)', () => {
    const validator = egyptianPhoneValidator();

    it('accepts a valid Egyptian mobile number', () => {
      expect(validator(new FormControl('01012345678'))).toBeNull();
      expect(validator(new FormControl('01512345678'))).toBeNull();
    });

    it('rejects numbers with the wrong network digit', () => {
      expect(validator(new FormControl('01312345678'))).toEqual({ egyptianPhone: true });
    });

    it('rejects numbers that are too short or too long', () => {
      expect(validator(new FormControl('0101234567'))).toEqual({ egyptianPhone: true });
      expect(validator(new FormControl('010123456789'))).toEqual({ egyptianPhone: true });
    });

    it('treats an empty value as valid, leaving `required` to a separate validator', () => {
      expect(validator(new FormControl(''))).toBeNull();
    });
  });

  describe('tableNumberValidator', () => {
    const validator = tableNumberValidator();

    it('accepts table numbers within 1-40', () => {
      expect(validator(new FormControl(1))).toBeNull();
      expect(validator(new FormControl(40))).toBeNull();
    });

    it('rejects table numbers outside 1-40', () => {
      expect(validator(new FormControl(0))).toEqual({ tableRange: true });
      expect(validator(new FormControl(41))).toEqual({ tableRange: true });
    });

    it('rejects non-integer table numbers', () => {
      expect(validator(new FormControl(3.5))).toEqual({ tableRange: true });
    });
  });

  describe('minItemsValidator', () => {
    it('fails an empty FormArray', () => {
      const array = new FormArray<FormControl>([]);
      expect(minItemsValidator(1)(array)).toEqual({ minItems: { required: 1, actual: 0 } });
    });

    it('passes once the array has enough rows', () => {
      const array = new FormArray([new FormGroup({ menuId: new FormControl('m1') })]);
      expect(minItemsValidator(1)(array)).toBeNull();
    });
  });
});
