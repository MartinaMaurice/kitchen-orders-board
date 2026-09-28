import { MenuItem } from '../../core/models/menu.model';
import { OrderItem } from '../../core/models/order.model';
import { orderItemCount, priceOrder, priceOrderItems, roundMoney } from './pricing.util';

const menu: MenuItem[] = [
  { id: 'm1', name: 'Koshary', category: 'Mains', price: 85 },
  { id: 'm2', name: 'Chicken Shawarma Plate', category: 'Mains', price: 165 },
  { id: 'm5', name: 'Om Ali', category: 'Desserts', price: 75 },
  { id: 'm6', name: 'Fresh Mango Juice', category: 'Drinks', price: 60 },
];

describe('pricing.util', () => {
  describe('roundMoney', () => {
    it('rounds to 2 decimal places without floating point drift', () => {
      expect(roundMoney(70.555)).toBeCloseTo(70.56, 2);
      expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    });
  });

  describe('priceOrder — matches the task brief worked examples', () => {
    it('#1041: dine-in, 450.00 subtotal -> 54.00 service, 70.56 VAT, 574.56 total', () => {
      const items: OrderItem[] = [
        { menuId: 'm2', qty: 2, note: 'no garlic sauce' },
        { menuId: 'm6', qty: 2, note: '' },
      ];

      const pricing = priceOrder({ type: 'dine-in', items }, menu);

      expect(pricing.subtotal).toBe(450);
      expect(pricing.service).toBe(54);
      expect(pricing.vat).toBe(70.56);
      expect(pricing.total).toBe(574.56);
    });

    it('#1044: delivery, 240.00 subtotal -> no service, 33.60 VAT, 273.60 total', () => {
      const items: OrderItem[] = [
        { menuId: 'm2', qty: 1, note: '' },
        { menuId: 'm5', qty: 1, note: '' },
      ];

      const pricing = priceOrder({ type: 'delivery', items }, menu);

      expect(pricing.subtotal).toBe(240);
      expect(pricing.service).toBe(0);
      expect(pricing.vat).toBe(33.6);
      expect(pricing.total).toBe(273.6);
    });

    it('applies no service charge for takeaway either', () => {
      const items: OrderItem[] = [{ menuId: 'm1', qty: 1, note: '' }];
      const pricing = priceOrder({ type: 'takeaway', items }, menu);
      expect(pricing.service).toBe(0);
    });
  });

  describe('priceOrderItems', () => {
    it('skips items referencing a menuId that no longer exists', () => {
      const items: OrderItem[] = [
        { menuId: 'm1', qty: 1, note: '' },
        { menuId: 'does-not-exist', qty: 5, note: '' },
      ];

      const { lines, subtotal } = priceOrderItems(items, menu);

      expect(lines.length).toBe(1);
      expect(subtotal).toBe(85);
    });

    it('computes a line total per item as unit price times quantity', () => {
      const items: OrderItem[] = [{ menuId: 'm1', qty: 3, note: '' }];
      const { lines } = priceOrderItems(items, menu);
      expect(lines[0].lineTotal).toBe(255);
    });
  });

  describe('orderItemCount', () => {
    it('sums quantities across all lines, not the number of distinct lines', () => {
      const items: OrderItem[] = [
        { menuId: 'm1', qty: 2, note: '' },
        { menuId: 'm2', qty: 3, note: '' },
      ];
      expect(orderItemCount(items)).toBe(5);
    });
  });
});
