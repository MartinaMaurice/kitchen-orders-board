import { MenuItem } from '../../core/models/menu.model';
import { Order, OrderItem } from '../../core/models/order.model';

export const SERVICE_CHARGE_RATE = 0.12;
export const VAT_RATE = 0.14;

export interface PricedOrderLine {
  menuId: string;
  name: string;
  qty: number;
  note: string;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderPricing {
  lines: PricedOrderLine[];
  subtotal: number;
  service: number;
  vat: number;
  total: number;
}

/** Rounds to 2 decimal places, avoiding common floating point artefacts (e.g. 70.55999999). */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Joins raw order items against the menu and computes the full price breakdown:
 * subtotal, 12% service (dine-in only), 14% VAT on subtotal + service, and grand total.
 * Unknown menu items are skipped defensively rather than throwing, since the mock API
 * has no referential-integrity guarantee between `orders.items[].menuId` and `menu`.
 */
export function priceOrderItems(items: readonly OrderItem[], menu: readonly MenuItem[]): OrderPricing {
  const menuById = new Map(menu.map((item) => [item.id, item]));

  const lines: PricedOrderLine[] = items.reduce<PricedOrderLine[]>((acc, item) => {
    const menuItem = menuById.get(item.menuId);
    if (!menuItem) {
      return acc;
    }
    acc.push({
      menuId: item.menuId,
      name: menuItem.name,
      qty: item.qty,
      note: item.note,
      unitPrice: menuItem.price,
      lineTotal: roundMoney(menuItem.price * item.qty),
    });
    return acc;
  }, []);

  const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.lineTotal, 0));
  return { lines, subtotal, ...priceFromSubtotal(subtotal, false) };
}

function priceFromSubtotal(subtotal: number, isDineIn: boolean): Omit<OrderPricing, 'lines' | 'subtotal'> {
  const service = isDineIn ? roundMoney(subtotal * SERVICE_CHARGE_RATE) : 0;
  const vat = roundMoney((subtotal + service) * VAT_RATE);
  const total = roundMoney(subtotal + service + vat);
  return { service, vat, total };
}

/** Full pricing for an order: joins items to the menu and applies dine-in service charge rules. */
export function priceOrder(order: Pick<Order, 'type' | 'items'>, menu: readonly MenuItem[]): OrderPricing {
  const { lines, subtotal } = priceOrderItems(order.items, menu);
  const isDineIn = order.type === 'dine-in';
  return { lines, subtotal, ...priceFromSubtotal(subtotal, isDineIn) };
}

/** Item count shown on board cards — sum of quantities, not line count. */
export function orderItemCount(items: readonly OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.qty, 0);
}
