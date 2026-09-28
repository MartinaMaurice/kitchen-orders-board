import { ORDER_STATUS_SEQUENCE, Order, OrderStatus } from '../../core/models/order.model';

export const LATE_THRESHOLD_MS = 20 * 60 * 1000;

/** The status an order moves to when advanced one step, or null once it's served. */
export function nextStatus(current: OrderStatus): OrderStatus | null {
  const index = ORDER_STATUS_SEQUENCE.indexOf(current);
  return index === -1 || index === ORDER_STATUS_SEQUENCE.length - 1 ? null : ORDER_STATUS_SEQUENCE[index + 1];
}

/** An order is late once it has waited 20+ minutes and hasn't reached Ready yet. */
export function isOrderLate(order: Pick<Order, 'status' | 'createdAt'>, now: number = Date.now()): boolean {
  if (order.status === 'ready' || order.status === 'served') {
    return false;
  }
  return now - new Date(order.createdAt).getTime() >= LATE_THRESHOLD_MS;
}

export function elapsedMillis(createdAt: string, now: number = Date.now()): number {
  return Math.max(0, now - new Date(createdAt).getTime());
}

/** Formats elapsed time as mm:ss, or hh:mm:ss past one hour. */
export function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}
