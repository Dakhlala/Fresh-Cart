import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Wishlist } from './wishlist';
import { WishlistService } from '../../core/services/wishlist.service';
import { CartService } from '../../core/services/cart.service';
import { Product } from '../../core/models/product-model';

describe('Wishlist Component (Hermetic Unit Tests)', () => {
  let fixture: ComponentFixture<Wishlist>;
  let component: Wishlist;
  let wishlistServiceMock: any;
  let cartServiceMock: any;

  const mockProduct: Product = {
    _id: 'p-101',
    id: 'p-101',
    title: 'Organic Honey 500g',
    description: 'Pure wildflower honey',
    quantity: 20,
    price: 120,
    imageCover: 'honey.jpg',
    images: ['honey.jpg'],
    category: { _id: 'cat-2', name: 'Pantry', slug: 'pantry', image: 'pantry.jpg' },
    ratingsAverage: 4.9,
    ratingsQuantity: 45,
  };

  beforeEach(async () => {
    localStorage.clear();

    wishlistServiceMock = {
      wishlistIds: signal<string[]>(['p-101']),
      wishlistProducts: signal<Product[]>([mockProduct]),
      wishlistData: signal<Product[]>([mockProduct]),
      isLoading: signal<boolean>(false),
      getLoggedUserWishlist: vi.fn().mockReturnValue(of({ status: 'success', count: 1, data: [mockProduct] })),
      removeFromWishlist: vi.fn().mockReturnValue(of({ status: 'success', message: 'Item removed', data: [] })),
      removeProductFromWishlist: vi.fn().mockReturnValue(of({ status: 'success', message: 'Item removed', data: [] })),
      addToWishlist: vi.fn().mockReturnValue(of({ status: 'success', message: 'Item added', data: ['p-101'] })),
    };

    cartServiceMock = {
      addToCart: vi.fn().mockReturnValue(of({ status: 'success', numOfCartItems: 1 })),
      addProductToCart: vi.fn().mockReturnValue(of({ status: 'success', numOfCartItems: 1 })),
    };

    await TestBed.configureTestingModule({
      imports: [Wishlist],
      providers: [
        provideRouter([{ path: 'products', component: class {} }]),
        { provide: WishlistService, useValue: wishlistServiceMock },
        { provide: CartService, useValue: cartServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Wishlist);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('WISH-VIEW-01: should create component and invoke getLoggedUserWishlist on init', () => {
    expect(component).toBeTruthy();
    expect(wishlistServiceMock.getLoggedUserWishlist).toHaveBeenCalledTimes(1);
  });

  it('WISH-VIEW-02: renders Empty Wishlist State when wishlistProducts is empty', () => {
    wishlistServiceMock.wishlistProducts.set([]);
    wishlistServiceMock.isLoading.set(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Your wishlist is empty!');
    expect(compiled.textContent).toContain('Browse Products');

    const exploreLink = compiled.querySelector('a[href="/products"]') as HTMLAnchorElement;
    expect(exploreLink).toBeTruthy();
  });

  it('WISH-VIEW-03: renders loading spinner when isLoading signal is true', () => {
    wishlistServiceMock.isLoading.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.fa-spinner')).toBeTruthy();
    expect(compiled.textContent).toContain('Loading your wishlist...');
  });

  it('WISH-VIEW-04: renders populated grid with total items count badge in header', () => {
    wishlistServiceMock.wishlistProducts.set([mockProduct]);
    wishlistServiceMock.isLoading.set(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('My Wishlist');
    expect(compiled.textContent).toContain('Total Items:');
    expect(compiled.textContent).toContain('1');
    expect(compiled.textContent).toContain('Organic Honey 500g');
    expect(compiled.textContent).toContain('120');
    expect(compiled.textContent).toContain('EGP');
    expect(compiled.textContent).toContain('4.9');
  });

  it('WISH-VIEW-05: clicking removeItem calls wishlistService.removeProductFromWishlist', () => {
    wishlistServiceMock.wishlistProducts.set([mockProduct]);
    fixture.detectChanges();

    component.removeItem('p-101');
    expect(wishlistServiceMock.removeProductFromWishlist).toHaveBeenCalledWith('p-101');
  });

  it('WISH-VIEW-06: moveToCart orchestrates cart addition followed by wishlist removal', () => {
    wishlistServiceMock.wishlistProducts.set([mockProduct]);
    fixture.detectChanges();

    component.moveToCart('p-101');

    expect(cartServiceMock.addToCart).toHaveBeenCalledWith('p-101');
    expect(wishlistServiceMock.removeProductFromWishlist).toHaveBeenCalledWith('p-101');
  });

  it('WISH-VIEW-07: moveToCart gracefully handles errors without breaking loading state', () => {
    cartServiceMock.addToCart.mockReturnValue(throwError(() => new Error('Cart addition failed')));

    component.moveToCart('p-101');
    expect(component.isMoving('p-101')).toBe(false);
  });
});
