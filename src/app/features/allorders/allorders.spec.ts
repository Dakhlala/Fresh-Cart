import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal, Component } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Allorders } from './allorders';
import { AuthService } from '../../core/services/auth.service';
import { OrdersService, OrderService } from '../../core/services/orders.service';
import { CartService } from '../../core/services/cart.service';
import { Order } from '../../core/models/order-model';
import { DecodedUser } from '../../core/models/auth-model';

@Component({ selector: 'dummy-products', template: `<div>Mock Products View</div>` })
class DummyProductsComponent {}

describe('Allorders Component — Milestone M4 Hermetic Unit Test Suite', () => {
  let fixture: ComponentFixture<Allorders>;
  let component: Allorders;
  let orderServiceMock: any;
  let authServiceMock: any;
  let cartServiceMock: any;

  const mockDecodedUser: DecodedUser = {
    id: 'user-789',
    name: 'Ahmed Hassan',
    role: 'user',
    iat: 1700000000,
    exp: 1800000000,
  };

  const sampleOrders: Order[] = [
    {
      _id: '64a0f123456789abcdef0001',
      id: 101,
      user: {
        _id: 'user-789',
        name: 'Ahmed Hassan',
        email: 'ahmed@example.com',
        phone: '01012345678',
      },
      cartItems: [
        {
          _id: 'item-1',
          count: 2,
          price: 150,
          product: {
            _id: 'prod-1',
            id: 'prod-1',
            title: 'Fresh Egyptian Strawberries',
            imageCover: 'https://example.com/strawberries.jpg',
            price: 150,
          } as any,
        },
        {
          _id: 'item-2',
          count: 1,
          price: 300,
          product: {
            _id: 'prod-2',
            id: 'prod-2',
            title: 'Extra Virgin Olive Oil',
            imageCover: 'https://example.com/oil.jpg',
            price: 300,
          } as any,
        },
      ],
      shippingAddress: {
        city: 'Cairo',
        details: '12 Al-Tahrir St, Apt 4B',
        phone: '01012345678',
      },
      taxPrice: 0,
      shippingPrice: 0,
      totalOrderPrice: 600,
      paymentMethodType: 'cash',
      isPaid: false,
      isDelivered: false,
      createdAt: '2026-11-01T10:00:00.000Z',
      updatedAt: '2026-11-01T10:00:00.000Z',
    },
    {
      _id: '64a0f123456789abcdef0002',
      id: 102,
      user: {
        _id: 'user-789',
        name: 'Ahmed Hassan',
        email: 'ahmed@example.com',
        phone: '01012345678',
      },
      cartItems: [
        {
          _id: 'item-3',
          count: 3,
          price: 80,
          product: {
            _id: 'prod-3',
            id: 'prod-3',
            title: 'Organic Cow Milk 1L',
            imageCover: 'https://example.com/milk.jpg',
            price: 80,
          } as any,
        },
      ],
      shippingAddress: {
        city: 'Giza',
        details: '45 Al-Ahram St',
        phone: '01123456789',
      },
      taxPrice: 0,
      shippingPrice: 0,
      totalOrderPrice: 240,
      paymentMethodType: 'card',
      isPaid: true,
      paidAt: '2026-11-05T14:30:00.000Z',
      isDelivered: true,
      deliveredAt: '2026-11-06T11:00:00.000Z',
      createdAt: '2026-11-05T14:00:00.000Z',
      updatedAt: '2026-11-06T11:00:00.000Z',
    },
  ];

  beforeEach(async () => {
    orderServiceMock = {
      getUserOrders: vi.fn().mockReturnValue(of(sampleOrders)),
      createCashOrder: vi.fn(),
      checkoutSession: vi.fn(),
      createCheckoutSession: vi.fn(),
    };

    authServiceMock = {
      userId: signal<string>('user-789'),
      userData: signal<DecodedUser | null>(mockDecodedUser),
      currentUser: signal<DecodedUser | null>(mockDecodedUser),
      userToken: signal<string | null>('dummy.jwt.token'),
      isAuthenticated: signal<boolean>(true),
    };

    cartServiceMock = {
      getLoggedUserCart: vi.fn().mockReturnValue(of({ data: { products: [] } })),
      resetCart: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Allorders],
      providers: [
        provideRouter([
          { path: 'products', component: DummyProductsComponent },
        ]),
        { provide: OrdersService, useValue: orderServiceMock },
        { provide: OrderService, useValue: orderServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: CartService, useValue: cartServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Allorders);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('1. should create Allorders component successfully', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('2. should display loading spinner initially while isLoading() is true', () => {
    orderServiceMock.getUserOrders.mockReturnValue(new Subject());
    fixture = TestBed.createComponent(Allorders);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const spinner = compiled.querySelector('[data-testid="orders-loading"]');
    expect(spinner).toBeTruthy();
    expect(compiled.textContent).toContain('Retrieving your order history...');
  });

  it('3. should derive userId from auth.userId signal and call orderService.getUserOrders', () => {
    fixture.detectChanges();

    expect(orderServiceMock.getUserOrders).toHaveBeenCalledWith('user-789');
    expect(component.isLoading()).toBe(false);
    expect(component.orders().length).toBe(2);
  });

  it('4. should fallback to auth.userData when auth.userId signal is empty', () => {
    authServiceMock.userId.set('');
    authServiceMock.userData.set(mockDecodedUser);

    fixture.detectChanges();

    expect(orderServiceMock.getUserOrders).toHaveBeenCalledWith('user-789');
  });

  it('5. should handle unauthenticated state (no userId) without calling getUserOrders', () => {
    authServiceMock.userId.set('');
    authServiceMock.userData.set(null);
    authServiceMock.currentUser.set(null);
    authServiceMock.userToken.set(null);

    fixture.detectChanges();

    expect(orderServiceMock.getUserOrders).not.toHaveBeenCalled();
    expect(component.isLoading()).toBe(false);
    expect(component.orders().length).toBe(0);
  });

  it('6. should sort orders descending by createdAt (latest first)', () => {
    fixture.detectChanges();

    const orders = component.orders();
    expect(orders[0]._id).toBe('64a0f123456789abcdef0002'); // Nov 5
    expect(orders[1]._id).toBe('64a0f123456789abcdef0001'); // Nov 1
  });

  it('7. should render empty state with "No orders placed yet!" and "Explore Products" CTA when orders list is empty', () => {
    orderServiceMock.getUserOrders.mockReturnValue(of([]));

    fixture.detectChanges();

    expect(component.orders().length).toBe(0);
    const compiled = fixture.nativeElement as HTMLElement;
    const emptyState = compiled.querySelector('[data-testid="empty-orders-state"]');
    expect(emptyState).toBeTruthy();
    expect(compiled.textContent).toContain('No orders placed yet!');
    expect(compiled.textContent).toContain('Explore Products');

    const exploreLink = compiled.querySelector('a[href="/products"]');
    expect(exploreLink).toBeTruthy();
  });

  it('8. should render header banner with "My Orders", "Order History", and total orders badge', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const heading = compiled.querySelector('h1');
    expect(heading?.textContent).toContain('My Orders');
    expect(compiled.textContent).toContain('Order History');

    const badge = compiled.querySelector('[data-testid="orders-count-badge"]');
    expect(badge?.textContent).toContain('2 Orders');
  });

  it('9. should render order card header with ID, formatted date (mediumDate), and total price highlight in EGP (#0aad0a)', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const orderCards = compiled.querySelectorAll('[data-testid="order-card"]');
    expect(orderCards.length).toBe(2);

    const firstCard = orderCards[0];
    expect(firstCard.textContent).toContain('#cdef0002');
    expect(firstCard.textContent).toContain('Nov 5, 2026');
    expect(firstCard.textContent).toContain('240');
    expect(firstCard.textContent).toContain('EGP');
  });

  it('10. should render payment method badge: "Cash" vs "Card / Stripe"', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const badges = compiled.querySelectorAll('[data-testid="payment-method-badge"]');
    expect(badges.length).toBe(2);

    // Order 2 (card) is first because sorted descending
    expect(badges[0].textContent).toContain('Card / Stripe');
    // Order 1 (cash) is second
    expect(badges[1].textContent).toContain('Cash');
  });

  it('11. should render payment status badge: "Paid" (green) vs "Not Paid" (amber)', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const badges = compiled.querySelectorAll('[data-testid="payment-status-badge"]');
    expect(badges.length).toBe(2);

    // Order 2 is paid
    expect(badges[0].textContent).toContain('Paid');
    expect(badges[0].className).toContain('bg-emerald-100');

    // Order 1 is unpaid
    expect(badges[1].textContent).toContain('Not Paid');
    expect(badges[1].className).toContain('bg-amber-100');
  });

  it('12. should render delivery status badge: "Delivered" (green) vs "Processing" (blue)', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const badges = compiled.querySelectorAll('[data-testid="delivery-status-badge"]');
    expect(badges.length).toBe(2);

    // Order 2 is delivered
    expect(badges[0].textContent).toContain('Delivered');
    expect(badges[0].className).toContain('bg-emerald-100');

    // Order 1 is in progress
    expect(badges[1].textContent).toContain('Processing');
    expect(badges[1].className).toContain('bg-blue-100');
  });

  it('13. should render purchased items list with thumbnail, product title, item count, and unit price in EGP', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Organic Cow Milk 1L');
    expect(compiled.textContent).toContain('Qty: 3 × 80 EGP');
    expect(compiled.textContent).toContain('Fresh Egyptian Strawberries');
    expect(compiled.textContent).toContain('Qty: 2 × 150 EGP');

    const images = compiled.querySelectorAll('[data-testid="order-items-grid"] img');
    expect(images.length).toBe(3); // 1 item in order 2 + 2 items in order 1
  });

  it('14. should render shipping address details (city, street details, and Egyptian phone number)', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const shippingAddresses = compiled.querySelectorAll('[data-testid="shipping-address"]');
    expect(shippingAddresses.length).toBe(2);

    expect(shippingAddresses[0].textContent).toContain('Giza');
    expect(shippingAddresses[0].textContent).toContain('45 Al-Ahram St');
    expect(shippingAddresses[0].textContent).toContain('01123456789');

    expect(shippingAddresses[1].textContent).toContain('Cairo');
    expect(shippingAddresses[1].textContent).toContain('12 Al-Tahrir St, Apt 4B');
    expect(shippingAddresses[1].textContent).toContain('01012345678');
  });

  it('15. should handle HTTP error gracefully with safe error handler without throwing unhandled exceptions', () => {
    orderServiceMock.getUserOrders.mockReturnValue(throwError(() => new Error('Server error')));

    expect(() => {
      fixture.detectChanges();
    }).not.toThrow();

    expect(component.isLoading()).toBe(false);
    expect(component.orders().length).toBe(0);
  });
});
