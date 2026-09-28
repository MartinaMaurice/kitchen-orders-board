import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MenuItem } from '../../../../core/models/menu.model';
import { Order } from '../../../../core/models/order.model';
import { OrderCardComponent } from './order-card.component';

const menu: MenuItem[] = [
  { id: 'm1', name: 'Koshary', category: 'Mains', price: 85 },
  { id: 'm4', name: 'Fattoush', category: 'Salads', price: 70 },
];

function buildOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: '1',
    number: 1042,
    type: 'dine-in',
    table: 2,
    phone: null,
    status: 'preparing',
    createdAt: new Date().toISOString(),
    items: [
      { menuId: 'm1', qty: 1, note: '' },
      { menuId: 'm4', qty: 1, note: '' },
    ],
    ...overrides,
  };
}

describe('OrderCardComponent', () => {
  let fixture: ComponentFixture<OrderCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderCardComponent);
    fixture.componentRef.setInput('order', buildOrder());
    fixture.componentRef.setInput('menu', menu);
    fixture.detectChanges();
  });

  it('renders the order number and computed subtotal (85 + 70 = 155.00)', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('#1042');
    expect(text).toContain('155.00');
  });

  it('shows an advance button for a non-terminal status and emits the order on click', () => {
    const emitted: Order[] = [];
    fixture.componentInstance.advance.subscribe((order) => emitted.push(order));

    const button = (fixture.nativeElement as HTMLElement).querySelector('button');
    expect(button).toBeTruthy();
    button?.click();

    expect(emitted.length).toBe(1);
    expect(emitted[0].id).toBe('1');
  });

  it('hides the advance button once an order is served', () => {
    fixture.componentRef.setInput('order', buildOrder({ status: 'served' }));
    fixture.detectChanges();
    const button = (fixture.nativeElement as HTMLElement).querySelector('button');
    expect(button).toBeFalsy();
  });
});
