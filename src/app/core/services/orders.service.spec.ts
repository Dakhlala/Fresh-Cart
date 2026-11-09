import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OrdersService } from './orders.service';
import { environment } from '../../../environments/environment';
import {
  CashOrderResponse,
  Order,
  ShippingAddress,
  StripeSessionResponse,
} from '../models/order-model';

describe('OrdersService (Hermetic Angular v21 Zoneless Suite)', () => {
  let service: OrdersService;
  let httpTesting: HttpTestingController;
  const baseUrl = `${environment.baseUrl}/api/v1/orders`;

  const mockShippingAddress: ShippingAddress = {
    details: '123 Market St, Apt 4B',
    phone: '01012345678',
    city: 'Cairo',
    postalCode: '11511',
  };

  const mockOrder: Order = {
    _id: 'order-101',
    id: 101,
    user: {
      _id: 'user-001',
      name: 'Ahmed Test',
      email: 'ahmed@test.com',
      phone: '01012345678',
    },
    cartItems: [
      {
        _id: 'item-1',
        count: 2,
        price: 50,
        product: { _id: 'prod-1', id: 'prod-1', title: 'Fresh Milk', imageCover: '', price: 50 } as any,
      },
    ],
    shippingAddress: mockShippingAddress,
    taxPrice: 0,
    shippingPrice: 0,
    totalOrderPrice: 100,
    paymentMethodType: 'cash',
    isPaid: false,
    isDelivered: false,
    createdAt: '2026-11-08T20:00:00.000Z',
    updatedAt: '2026-11-08T20:00:00.000Z',
  };

  const mockCashOrderResponse: CashOrderResponse = {
    status: 'success',
    data: mockOrder,
  };

  const mockStripeResponse: StripeSessionResponse = {
    status: 'success',
    session: {
      url: 'https://checkout.stripe.com/c/pay/cs_test_mock123',
      success_url: 'http://localhost:4200/allorders',
      cancel_url: 'http://localhost:4200/cart',
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OrdersService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(OrdersService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    TestBed.resetTestingModule();
  });

  it('initializes with default zoneless signals', () => {
    expect(service.orders()).toEqual([]);
    expect(service.isLoading()).toBe(false);
    expect(service.error()).toBeNull();
  });

  describe('createCashOrder', () => {
    it('sends POST /api/v1/orders/:cartId with shippingAddress and returns CashOrderResponse', () => {
      let result: CashOrderResponse | undefined;
      service.createCashOrder('cart-999', mockShippingAddress).subscribe({
        next: (res) => (result = res),
        error: () => {},
      });

      const req = httpTesting.expectOne(`${baseUrl}/cart-999`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ shippingAddress: mockShippingAddress });

      req.flush(mockCashOrderResponse, { status: 201, statusText: 'Created' });
      expect(result).toEqual(mockCashOrderResponse);
    });

    it('propagates error gracefully on HTTP 400/500 failure', () => {
      let errorOccurred = false;
      service.createCashOrder('cart-999', mockShippingAddress).subscribe({
        next: () => {},
        error: (err) => {
          errorOccurred = true;
          expect(err.status).toBe(400);
        },
      });

      const req = httpTesting.expectOne(`${baseUrl}/cart-999`);
      req.flush({ message: 'Cart not found' }, { status: 400, statusText: 'Bad Request' });
      expect(errorOccurred).toBe(true);
    });
  });

  describe('createCheckoutSession / checkoutSession', () => {
    it('sends POST /api/v1/orders/checkout-session/:cartId with encoded URL query param', () => {
      let result: StripeSessionResponse | undefined;
      const customUrl = 'http://localhost:4200';
      service.createCheckoutSession('cart-999', mockShippingAddress, customUrl).subscribe({
        next: (res) => (result = res),
        error: () => {},
      });

      const req = httpTesting.expectOne(`${baseUrl}/checkout-session/cart-999?url=${encodeURIComponent(customUrl)}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ shippingAddress: mockShippingAddress });

      req.flush(mockStripeResponse);
      expect(result).toEqual(mockStripeResponse);
      expect(result?.session.url).toContain('stripe.com');
    });

    it('checkoutSession alias delegates correctly to createCheckoutSession', () => {
      let result: StripeSessionResponse | undefined;
      service.checkoutSession('cart-999', mockShippingAddress, 'http://localhost:4200').subscribe({
        next: (res) => (result = res),
        error: () => {},
      });

      const req = httpTesting.expectOne(`${baseUrl}/checkout-session/cart-999?url=${encodeURIComponent('http://localhost:4200')}`);
      req.flush(mockStripeResponse);
      expect(result).toEqual(mockStripeResponse);
    });
  });

  describe('getUserOrders', () => {
    it('sends GET /api/v1/orders/user/:userId, updates orders signal, and handles array response', () => {
      let result: Order[] | undefined;
      service.getUserOrders('user-001').subscribe({
        next: (orders) => (result = orders),
        error: () => {},
      });

      expect(service.isLoading()).toBe(true);
      const req = httpTesting.expectOne(`${baseUrl}/user/user-001`);
      expect(req.request.method).toBe('GET');

      req.flush([mockOrder]);
      expect(result).toEqual([mockOrder]);
      expect(service.orders()).toEqual([mockOrder]);
      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBeNull();
    });

    it('handles error gracefully and sets error signal', () => {
      let errorHandled = false;
      service.getUserOrders('user-001').subscribe({
        next: () => {},
        error: () => {
          errorHandled = true;
        },
      });

      const req = httpTesting.expectOne(`${baseUrl}/user/user-001`);
      req.flush({ message: 'User has no orders' }, { status: 404, statusText: 'Not Found' });

      expect(errorHandled).toBe(true);
      expect(service.isLoading()).toBe(false);
      expect(service.error()).toBe('User has no orders');
    });
  });
});
