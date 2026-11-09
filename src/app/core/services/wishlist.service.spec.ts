import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of } from 'rxjs';
import { WishlistService } from './wishlist.service';
import { ToastService } from './toast.service';
import { Product } from '../models/product-model';
import { WishlistResponse, WishlistActionResponse } from '../models/wishlist-model';
import { environment } from '../../../environments/environment';

describe('WishlistService (Hermetic Reactive Suite)', () => {
  let service: WishlistService;
  let httpTesting: HttpTestingController;
  let toast: ToastService;
  const baseUrl = `${environment.baseUrl}/api/v1/wishlist`;

  const mockProductA: Product = {
    _id: 'p-101',
    id: 'p-101',
    title: 'Organic Green Apples',
    description: 'Crisp green apples',
    quantity: 50,
    price: 45,
    imageCover: 'apples.jpg',
    images: ['apples.jpg'],
    category: { _id: 'cat-1', name: 'Produce', slug: 'produce', image: 'cat.jpg' },
    ratingsAverage: 4.8,
    ratingsQuantity: 80,
  };

  const mockProductB: Product = {
    _id: 'p-102',
    id: 'p-102',
    title: 'Fresh Strawberries',
    description: 'Sweet local strawberries',
    quantity: 30,
    price: 60,
    imageCover: 'strawberries.jpg',
    images: ['strawberries.jpg'],
    category: { _id: 'cat-1', name: 'Produce', slug: 'produce', image: 'cat.jpg' },
    ratingsAverage: 4.9,
    ratingsQuantity: 120,
  };

  const mockRes: WishlistResponse = {
    status: 'success',
    count: 2,
    data: [mockProductA, mockProductB],
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        WishlistService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(WishlistService);
    httpTesting = TestBed.inject(HttpTestingController);
    toast = TestBed.inject(ToastService);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('WISH-SVC-01: initializes with clean empty signals', () => {
    expect(service.wishlistIds()).toEqual([]);
    expect(service.wishlistProducts()).toEqual([]);
    expect(service.wishlistData()).toEqual([]);
    expect(service.wishlistCount()).toBe(0);
    expect(service.isLoading()).toBe(false);
  });

  it('WISH-SVC-02: getLoggedUserWishlist populates wishlistProducts, wishlistIds, and wishlistCount signals', () => {
    service.getLoggedUserWishlist().subscribe({ error: () => {} });

    const req = httpTesting.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockRes);

    expect(service.isLoading()).toBe(false);
    expect(service.wishlistProducts().length).toBe(2);
    expect(service.wishlistIds()).toEqual(['p-101', 'p-102']);
    expect(service.wishlistCount()).toBe(2);
  });

  it('WISH-SVC-03: addToWishlist calls POST, updates wishlistIds, and displays toast', () => {
    const actionRes: WishlistActionResponse = {
      status: 'success',
      message: 'Product added successfully to your wishlist',
      data: ['p-101'],
    };
    const getRes: WishlistResponse = {
      status: 'success',
      count: 1,
      data: [mockProductA],
    };
    const toastSpy = vi.spyOn(toast, 'success');

    service.addToWishlist('p-101').subscribe({ error: () => {} });

    const postReq = httpTesting.expectOne(baseUrl);
    expect(postReq.request.method).toBe('POST');
    expect(postReq.request.body).toEqual({ productId: 'p-101' });
    postReq.flush(actionRes);

    // Hydration call triggered inside tap
    const getReq = httpTesting.expectOne(baseUrl);
    expect(getReq.request.method).toBe('GET');
    getReq.flush(getRes);

    expect(service.wishlistIds()).toEqual(['p-101']);
    expect(toastSpy).toHaveBeenCalledWith('Product added successfully to your wishlist');

    // Test addProductToWishlist alias
    service.addProductToWishlist('p-102').subscribe({ error: () => {} });
    const postReq2 = httpTesting.expectOne(baseUrl);
    expect(postReq2.request.method).toBe('POST');
    postReq2.flush({ status: 'success', message: 'Added', data: ['p-101', 'p-102'] });
    const getReq2 = httpTesting.expectOne(baseUrl);
    getReq2.flush(mockRes);
  });

  it('WISH-SVC-04: removeFromWishlist calls DELETE, removes item from signals, and displays toast', () => {
    service.wishlistIds.set(['p-101', 'p-102']);
    service.wishlistProducts.set([mockProductA, mockProductB]);

    const deleteRes: WishlistActionResponse = {
      status: 'success',
      message: 'Product removed successfully from your wishlist',
      data: ['p-102'],
    };
    const toastSpy = vi.spyOn(toast, 'info');

    service.removeFromWishlist('p-101').subscribe({ error: () => {} });

    const req = httpTesting.expectOne(`${baseUrl}/p-101`);
    expect(req.request.method).toBe('DELETE');
    req.flush(deleteRes);

    expect(service.wishlistIds()).toEqual(['p-102']);
    expect(service.wishlistProducts()).toEqual([mockProductB]);
    expect(toastSpy).toHaveBeenCalledWith('Product removed successfully from your wishlist');

    // Test removeProductFromWishlist alias
    service.removeProductFromWishlist('p-102').subscribe({ error: () => {} });
    const req2 = httpTesting.expectOne(`${baseUrl}/p-102`);
    expect(req2.request.method).toBe('DELETE');
    req2.flush({ status: 'success', message: 'Removed', data: [] });
    expect(service.wishlistProducts()).toEqual([]);
  });

  it('WISH-SVC-05: toggleWishlist delegates to removeFromWishlist if present, or addToWishlist if absent', () => {
    service.wishlistIds.set(['p-101']);

    const removeSpy = vi
      .spyOn(service, 'removeFromWishlist')
      .mockReturnValue(of({ status: 'success', message: '', data: [] }));
    const addSpy = vi
      .spyOn(service, 'addToWishlist')
      .mockReturnValue(of({ status: 'success', message: '', data: ['p-102'] }));

    // p-101 is present -> calls removeFromWishlist
    service.toggleWishlist('p-101');
    expect(removeSpy).toHaveBeenCalledWith('p-101');
    expect(addSpy).not.toHaveBeenCalled();

    // p-102 is absent -> calls addToWishlist
    service.toggleWishlist('p-102');
    expect(addSpy).toHaveBeenCalledWith('p-102');
  });

  it('WISH-SVC-06: isInWishlist accurately checks membership', () => {
    service.wishlistIds.set(['p-101']);
    expect(service.isInWishlist('p-101')).toBe(true);
    expect(service.isInWishlist('p-999')).toBe(false);
  });

  it('WISH-SVC-07: clearWishlistState resets signals to initial values', () => {
    service.wishlistIds.set(['p-101']);
    service.wishlistProducts.set([mockProductA]);
    service.isLoading.set(true);

    service.clearWishlistState();

    expect(service.wishlistIds()).toEqual([]);
    expect(service.wishlistProducts()).toEqual([]);
    expect(service.isLoading()).toBe(false);
    expect(service.wishlistCount()).toBe(0);
  });
});
