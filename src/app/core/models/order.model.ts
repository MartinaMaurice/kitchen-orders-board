export type OrderType = 'dine-in' | 'takeaway' | 'delivery';

export type OrderStatus = 'new' | 'preparing' | 'ready' | 'served';

export interface OrderItem {
  menuId: string;
  qty: number;
  note: string;
}

export interface Order {
  id: string;
  number: number;
  type: OrderType;
  table: number | null;
  phone: string | null;
  status: OrderStatus;
  createdAt: string;
  items: OrderItem[];
}

/** Payload for creating a new order — the server assigns `id`. */
export type NewOrderPayload = Omit<Order, 'id'>;

export const ORDER_STATUS_SEQUENCE: readonly OrderStatus[] = ['new', 'preparing', 'ready', 'served'];

export const ORDER_TYPES: readonly OrderType[] = ['dine-in', 'takeaway', 'delivery'];
