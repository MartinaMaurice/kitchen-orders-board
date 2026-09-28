import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, exhaustMap, filter, merge, of, tap, timer } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NewOrderPayload, Order, OrderStatus } from '../models/order.model';
import { VisibilityService } from './visibility.service';

export const POLL_INTERVAL_MS = 15_000;

/**
 * Owns the board's order list: polling, manual refresh, and status mutation with
 * optimistic updates. Components read `orders`/`loading`/`error` signals and never
 * touch HttpClient directly.
 */
@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly visibility = inject(VisibilityService);
  private readonly baseUrl = `${environment.apiUrl}/orders`;

  readonly orders = signal<Order[]>([]);
  readonly loading = signal(true);
  readonly refreshing = signal(false);
  readonly error = signal<string | null>(null);

  /**
   * Polling stream: ticks every 15s (plus once immediately, and once whenever the
   * tab regains visibility), but a tick is dropped while the tab is hidden or while
   * a previous fetch is still in flight (`exhaustMap`), so requests never overlap.
   * The caller (the board component) owns the subscription lifetime via
   * `takeUntilDestroyed`, so polling stops the moment the board is navigated away from.
   */
  readonly pollOrders$: Observable<Order[]> = merge(timer(0, POLL_INTERVAL_MS), this.visibility.becameVisible$).pipe(
    filter(() => !this.visibility.hidden()),
    exhaustMap(() => this.fetchAll()),
  );

  refreshNow(): void {
    this.fetchAll().subscribe();
  }

  getOrder(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/${id}`);
  }

  /** One-off fetch used to compute the next order number for the new-order form. */
  listOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.baseUrl);
  }

  createOrder(payload: NewOrderPayload): Observable<Order> {
    return this.http.post<Order>(this.baseUrl, payload).pipe(
      tap((order) => {
        // Add it to local state straight from the POST response rather than relying on
        // a follow-up fetch to find it: some backends (e.g. the deployed demo's
        // multi-instance my-json-server) don't reliably serve back what was just
        // written, so a GET-by-id/refetch immediately after creating isn't trustworthy.
        this.orders.update((list) => [...list, order]);
      }),
    );
  }

  /**
   * Optimistically moves `order` to `status` in local state, then persists it.
   * On failure, the local change is rolled back and the caller is notified via
   * the returned observable's error channel so it can surface a message.
   */
  updateStatus(order: Order, status: OrderStatus): Observable<Order> {
    const previous = order.status;
    this.patchLocal(order.id, status);

    return this.http.patch<Order>(`${this.baseUrl}/${order.id}`, { status }).pipe(
      catchError((err: HttpErrorResponse) => {
        this.patchLocal(order.id, previous);
        throw err;
      }),
    );
  }

  private patchLocal(id: string, status: OrderStatus): void {
    this.orders.update((list) => list.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  private fetchAll(): Observable<Order[]> {
    const isFirstLoad = this.orders().length === 0;
    if (isFirstLoad) {
      this.loading.set(true);
    }
    this.refreshing.set(true);

    return this.http.get<Order[]>(this.baseUrl).pipe(
      tap((orders) => {
        // Nothing in this app ever deletes an order, so if one we already know about is
        // missing from a fresh fetch, that's a backend read-consistency hiccup (seen on
        // the deployed demo's multi-instance mock API), not a real deletion — keep it
        // rather than silently dropping it off the board a poll cycle after it appeared.
        const knownIds = new Set(orders.map((o) => o.id));
        const stillMissing = this.orders().filter((o) => !knownIds.has(o.id));
        this.orders.set([...orders, ...stillMissing]);
        this.loading.set(false);
        this.refreshing.set(false);
        this.error.set(null);
      }),
      catchError(() => {
        this.loading.set(false);
        this.refreshing.set(false);
        this.error.set('board.error.title');
        return of([] as Order[]);
      }),
    );
  }
}
