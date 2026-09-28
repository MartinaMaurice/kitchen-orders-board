import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Order } from '../../../../core/models/order.model';
import { OrderColumnComponent } from './order-column.component';

function buildOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: '1',
    number: 1041,
    type: 'dine-in',
    table: 7,
    phone: null,
    status: 'preparing',
    createdAt: new Date().toISOString(),
    items: [],
    ...overrides,
  };
}

describe('OrderColumnComponent — drag-and-drop rules', () => {
  let fixture: ComponentFixture<OrderColumnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderColumnComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderColumnComponent);
    fixture.componentRef.setInput('status', 'ready');
    fixture.componentRef.setInput('title', 'Ready');
    fixture.componentRef.setInput('orders', []);
    fixture.componentRef.setInput('menu', []);
    fixture.detectChanges();
  });

  it('accepts a card entering from the immediately preceding status (preparing -> ready)', () => {
    const drag = { data: buildOrder({ status: 'preparing' }) } as CdkDrag<Order>;
    expect(fixture.componentInstance['enterPredicate'](drag)).toBe(true);
  });

  it('rejects a card that is not one step behind this column (new -> ready)', () => {
    const drag = { data: buildOrder({ status: 'new' }) } as CdkDrag<Order>;
    expect(fixture.componentInstance['enterPredicate'](drag)).toBe(false);
  });

  it('rejects a served card, which has no further status to advance to', () => {
    const drag = { data: buildOrder({ status: 'served' }) } as CdkDrag<Order>;
    expect(fixture.componentInstance['enterPredicate'](drag)).toBe(false);
  });

  it('emits advance when a card is dropped into a different container', () => {
    const order = buildOrder({ status: 'preparing' });
    const emitted: Order[] = [];
    fixture.componentInstance.advance.subscribe((o) => emitted.push(o));

    const event = {
      previousContainer: { id: 'preparing' } as unknown as CdkDropList,
      container: { id: 'ready' } as unknown as CdkDropList,
      item: { data: order } as CdkDrag<Order>,
    } as CdkDragDrop<Order[], Order[], Order>;

    fixture.componentInstance.onDropped(event);
    expect(emitted).toEqual([order]);
  });

  it('does nothing when dropped back into the same container', () => {
    const sameList = { id: 'ready' } as unknown as CdkDropList;
    const emitted: Order[] = [];
    fixture.componentInstance.advance.subscribe((o) => emitted.push(o));

    const event = {
      previousContainer: sameList,
      container: sameList,
      item: { data: buildOrder() } as CdkDrag<Order>,
    } as CdkDragDrop<Order[], Order[], Order>;

    fixture.componentInstance.onDropped(event);
    expect(emitted).toEqual([]);
  });
});
