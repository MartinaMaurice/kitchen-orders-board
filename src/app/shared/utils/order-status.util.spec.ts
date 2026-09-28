import { formatElapsed, isOrderLate, nextStatus } from './order-status.util';

describe('order-status.util', () => {
  describe('nextStatus', () => {
    it('advances new -> preparing -> ready -> served', () => {
      expect(nextStatus('new')).toBe('preparing');
      expect(nextStatus('preparing')).toBe('ready');
      expect(nextStatus('ready')).toBe('served');
    });

    it('returns null once an order is served', () => {
      expect(nextStatus('served')).toBeNull();
    });
  });

  describe('isOrderLate', () => {
    const now = new Date('2026-01-01T12:00:00.000Z').getTime();

    it('is late once a non-ready order has waited 20+ minutes', () => {
      const createdAt = new Date(now - 21 * 60 * 1000).toISOString();
      expect(isOrderLate({ status: 'preparing', createdAt }, now)).toBe(true);
    });

    it('is not late before the 20 minute threshold', () => {
      const createdAt = new Date(now - 19 * 60 * 1000).toISOString();
      expect(isOrderLate({ status: 'preparing', createdAt }, now)).toBe(false);
    });

    it('is never late once ready, regardless of wait time', () => {
      const createdAt = new Date(now - 60 * 60 * 1000).toISOString();
      expect(isOrderLate({ status: 'ready', createdAt }, now)).toBe(false);
    });

    it('is never late once served', () => {
      const createdAt = new Date(now - 60 * 60 * 1000).toISOString();
      expect(isOrderLate({ status: 'served', createdAt }, now)).toBe(false);
    });
  });

  describe('formatElapsed', () => {
    it('formats sub-hour durations as mm:ss', () => {
      expect(formatElapsed(75 * 1000)).toBe('01:15');
    });

    it('formats durations past an hour as hh:mm:ss', () => {
      expect(formatElapsed(3661 * 1000)).toBe('01:01:01');
    });
  });
});
