import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CartService } from './cart.service';
import { environment } from '../../../environments/environment';
import { CartResponse } from '../models/cart-model';

describe('CartService (Hermetic Reactive Signals Suite)', () => {
  let service: CartService;
  let httpTesting: HttpTestingController;
  const baseUrl = `${environment.baseUrl}/api/v1/cart`;

  const mockCartResponse: CartResponse = {
    status: 'success',
    numOfCartItems: 2,
    cartId: 'cart-123',
    data: {
      _id: 'cart-123',
      cartOwner: 'user-456',
      totalCartPrice: 250,
      products: [
        {
          _id: 'item-1',
          count: 2,
          price: 100,
          product: { _id: 'prod-1', id: 'prod-1', title: 'Product 1', imageCover: '', price: 100 } as any,
        },
        {
          _id: 'item-2',
          count: 1,
          price: 50,
          product: { _id: 'prod-2', id: 'prod-2', title: 'Product 2', imageCover: '', price: 50 } as any,
        },
      ],
    },
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        CartService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(CartService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('initializes with default empty signals', () => {
    expect(service.cartId()).toBeNull();
    expect(service.numOfCartItems()).toBe(0);
    expect(service.cartData()).toBeNull();
    expect(service.totalCartPrice()).toBe(0);
    expect(service.isLoading()).toBe(false);
    expect(service.isCartEmpty()).toBe(true);
    expect(service.cartProducts()).toEqual([]);
  });

  it('resetCart resets all signals to default state', () => {
    service.numOfCartItems.set(5);
    service.cartId.set('some-id');
    service.cartData.set(mockCartResponse);

    expect(service.numOfCartItems()).toBe(5);
    expect(service.cartId()).toBe('some-id');
    expect(service.isCartEmpty()).toBe(false);

    service.resetCart();

    expect(service.numOfCartItems()).toBe(0);
    expect(service.cartId()).toBeNull();
    expect(service.cartData()).toBeNull();
    expect(service.totalCartPrice()).toBe(0);
    expect(service.isCartEmpty()).toBe(true);
  });

  it('getLoggedUserCart: updates signals on 200 OK success', () => {
    service.getLoggedUserCart().subscribe({ error: () => {} });

    const req = httpTesting.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockCartResponse);

    expect(service.cartId()).toBe('cart-123');
    expect(service.numOfCartItems()).toBe(2);
    expect(service.cartData()).toEqual(mockCartResponse);
    expect(service.totalCartPrice()).toBe(250);
    expect(service.isCartEmpty()).toBe(false);
    expect(service.cartProducts().length).toBe(2);
    expect(service.isLoading()).toBe(false);
  });

  it('getLoggedUserCart: gracefully catches 404 empty cart and resets signals without throwing', () => {
    let emittedResult: any = 'not-called';
    let errorCaught = false;

    service.getLoggedUserCart().subscribe({
      next: (val) => { emittedResult = val; },
      error: () => { errorCaught = true; },
    });

    const req = httpTesting.expectOne(baseUrl);
    req.flush(
      { statusMsg: 'fail', message: 'No cart exist for this user id' },
      { status: 404, statusText: 'Not Found' }
    );

    expect(errorCaught).toBe(false);
    expect(emittedResult).toBeNull();
    expect(service.cartId()).toBeNull();
    expect(service.numOfCartItems()).toBe(0);
    expect(service.cartData()).toBeNull();
    expect(service.totalCartPrice()).toBe(0);
    expect(service.isCartEmpty()).toBe(true);
    expect(service.isLoading()).toBe(false);
  });

  it('getLoggedUserCart: handles 500 error, resets signals, and propagates error', () => {
    let errorCaught = false;

    service.getLoggedUserCart().subscribe({
      error: () => { errorCaught = true; },
    });

    const req = httpTesting.expectOne(baseUrl);
    req.flush({ message: 'Internal Server Error' }, { status: 500, statusText: 'Server Error' });

    expect(errorCaught).toBe(true);
    expect(service.cartId()).toBeNull();
    expect(service.numOfCartItems()).toBe(0);
    expect(service.isLoading()).toBe(false);
  });

  it('addProductToCart (and addToCart alias): posts productId and updates signals', () => {
    service.addProductToCart('prod-1').subscribe({ error: () => {} });

    const req = httpTesting.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ productId: 'prod-1' });
    req.flush(mockCartResponse);

    expect(service.cartId()).toBe('cart-123');
    expect(service.numOfCartItems()).toBe(2);
    expect(service.totalCartPrice()).toBe(250);

    // Test alias addToCart
    service.addToCart('prod-2').subscribe({ error: () => {} });
    const req2 = httpTesting.expectOne(baseUrl);
    expect(req2.request.method).toBe('POST');
    expect(req2.request.body).toEqual({ productId: 'prod-2' });
    req2.flush(mockCartResponse);
  });

  it('updateProductQuantity: delegates to removeProductFromCart when count <= 0', () => {
    service.updateProductQuantity('prod-1', 0).subscribe({ error: () => {} });

    const deleteReq = httpTesting.expectOne(`${baseUrl}/prod-1`);
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush(mockCartResponse);

    service.updateProductQuantity('prod-1', -1).subscribe({ error: () => {} });
    const deleteReq2 = httpTesting.expectOne(`${baseUrl}/prod-1`);
    expect(deleteReq2.request.method).toBe('DELETE');
    deleteReq2.flush(mockCartResponse);
  });

  it('updateProductQuantity (and updateCartProductQuantity alias): sends PUT request when count > 0', () => {
    service.updateProductQuantity('prod-1', 4).subscribe({ error: () => {} });

    const putReq = httpTesting.expectOne(`${baseUrl}/prod-1`);
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body).toEqual({ count: 4 });
    putReq.flush(mockCartResponse);

    expect(service.numOfCartItems()).toBe(2);
    expect(service.totalCartPrice()).toBe(250);

    // Test alias
    service.updateCartProductQuantity('prod-1', 5).subscribe({ error: () => {} });
    const putReq2 = httpTesting.expectOne(`${baseUrl}/prod-1`);
    expect(putReq2.request.method).toBe('PUT');
    expect(putReq2.request.body).toEqual({ count: 5 });
    putReq2.flush(mockCartResponse);
  });

  it('removeProductFromCart (and removeSpecificCartItem alias): sends DELETE request and updates signals', () => {
    service.removeProductFromCart('prod-1').subscribe({ error: () => {} });

    const req = httpTesting.expectOne(`${baseUrl}/prod-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(mockCartResponse);

    expect(service.numOfCartItems()).toBe(2);

    // Test alias
    service.removeSpecificCartItem('prod-2').subscribe({ error: () => {} });
    const req2 = httpTesting.expectOne(`${baseUrl}/prod-2`);
    expect(req2.request.method).toBe('DELETE');
    req2.flush(mockCartResponse);
  });

  it('clearUserCart (and clearCart alias): resets all signals to initial empty state', () => {
    service.numOfCartItems.set(5);
    service.cartId.set('old-id');

    service.clearUserCart().subscribe({ error: () => {} });

    const req = httpTesting.expectOne(baseUrl);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'success' });

    expect(service.numOfCartItems()).toBe(0);
    expect(service.cartId()).toBeNull();
    expect(service.cartData()).toBeNull();
    expect(service.totalCartPrice()).toBe(0);

    // Test alias clearCart
    service.numOfCartItems.set(3);
    service.clearCart().subscribe({ error: () => {} });
    const req2 = httpTesting.expectOne(baseUrl);
    expect(req2.request.method).toBe('DELETE');
    req2.flush({ message: 'success' });
    expect(service.numOfCartItems()).toBe(0);
  });
});
