import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal, Component } from '@angular/core';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Cart } from './cart';
import { CartService } from '../../core/services/cart.service';
import { CartResponse } from '../../core/models/cart-model';

@Component({ selector: 'dummy-checkout', template: `<div>Mock Checkout View</div>` })
class DummyCheckoutComponent {}

@Component({ selector: 'dummy-products', template: `<div>Mock Products View</div>` })
class DummyProductsComponent {}

describe('Cart Component — Milestone M3 Hermetic Test Suite', () => {
  let fixture: ComponentFixture<Cart>;
  let component: Cart;
  let cartServiceMock: any;
  let router: Router;

  const sampleCartResponse: CartResponse = {
    status: 'success',
    numOfCartItems: 3,
    cartId: 'cart-123',
    data: {
      _id: 'cart-123',
      cartOwner: 'user-456',
      totalCartPrice: 600,
      products: [
        {
          _id: 'item-1',
          count: 2,
          price: 150,
          product: {
            _id: 'prod-100',
            id: 'prod-100',
            title: 'Fresh Milk',
            description: '100% Organic Milk',
            quantity: 20,
            price: 150,
            imageCover: 'https://example.com/milk.jpg',
            images: ['https://example.com/milk.jpg'],
            category: {
              _id: 'cat-1',
              name: 'Dairy',
              slug: 'dairy',
              image: 'https://example.com/cat1.jpg',
            },
            ratingsAverage: 4.8,
            ratingsQuantity: 120,
          } as any,
        },
        {
          _id: 'item-2',
          count: 1,
          price: 300,
          product: {
            _id: 'prod-200',
            id: 'prod-200',
            title: 'Organic Olive Oil',
            description: 'Extra Virgin 500ml',
            quantity: 15,
            price: 300,
            imageCover: 'https://example.com/oil.jpg',
            images: ['https://example.com/oil.jpg'],
            category: {
              _id: 'cat-2',
              name: 'Oils',
              slug: 'oils',
              image: 'https://example.com/cat2.jpg',
            },
            ratingsAverage: 4.9,
            ratingsQuantity: 45,
          } as any,
        },
      ],
    },
  };

  beforeEach(async () => {
    cartServiceMock = {
      numOfCartItems: signal<number>(3),
      cartId: signal<string | null>('cart-123'),
      cartData: signal<CartResponse | null>(sampleCartResponse),
      isLoading: signal<boolean>(false),
      totalCartPrice: signal<number>(600),
      cartProducts: signal(sampleCartResponse.data.products),
      isCartEmpty: signal<boolean>(false),

      getLoggedUserCart: vi.fn().mockReturnValue(of(sampleCartResponse)),
      updateProductQuantity: vi.fn().mockReturnValue(of(sampleCartResponse)),
      updateCartProductQuantity: vi.fn().mockReturnValue(of(sampleCartResponse)),
      removeProductFromCart: vi.fn().mockReturnValue(of(sampleCartResponse)),
      removeSpecificCartItem: vi.fn().mockReturnValue(of(sampleCartResponse)),
      clearUserCart: vi.fn().mockReturnValue(of({ message: 'success' })),
      clearCart: vi.fn().mockReturnValue(of({ message: 'success' })),
      resetCart: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Cart],
      providers: [
        provideRouter([
          { path: 'checkout/:cartId', component: DummyCheckoutComponent },
          { path: 'checkout', component: DummyCheckoutComponent },
          { path: 'products', component: DummyProductsComponent },
        ]),
        { provide: CartService, useValue: cartServiceMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(Cart);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  it('1. should create Cart component successfully', () => {
    expect(component).toBeTruthy();
  });

  it('2. should fetch cart data on ngOnInit via getLoggedUserCart', () => {
    expect(cartServiceMock.getLoggedUserCart).toHaveBeenCalledTimes(1);
    expect(component.numOfCartItems()).toBe(3);
    expect(component.totalCartPrice()).toBe(600);
    expect(component.cartId()).toBe('cart-123');
  });

  it('3. should render header banner with "Shop Cart", total items badge, and #0aad0a price', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const banner = compiled.querySelector('h1');
    expect(banner?.textContent).toContain('Shop Cart');

    const priceText = compiled.textContent;
    expect(priceText).toContain('600 EGP');
    expect(priceText).toContain('3 Items');
  });

  it('4. should render populated products list with titles and prices', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Fresh Milk');
    expect(compiled.textContent).toContain('Organic Olive Oil');
    expect(compiled.textContent).toContain('Dairy');
  });

  it('5. should call incrementQuantity on + button click', () => {
    const increaseBtns = fixture.nativeElement.querySelectorAll('button[aria-label="Increase quantity"]');
    expect(increaseBtns.length).toBeGreaterThan(0);
    increaseBtns[0].click();

    expect(cartServiceMock.updateCartProductQuantity).toHaveBeenCalledWith('prod-100', 3);
  });

  it('6. should call decrementQuantity on - button click when count > 1', () => {
    const decreaseBtns = fixture.nativeElement.querySelectorAll('button[aria-label="Decrease quantity"]');
    expect(decreaseBtns.length).toBeGreaterThan(0);
    decreaseBtns[0].click(); // Item 1 has count: 2, so should update to 1

    expect(cartServiceMock.updateCartProductQuantity).toHaveBeenCalledWith('prod-100', 1);
  });

  it('7. should call removeItem when clicking - button when count is 1', () => {
    const decreaseBtns = fixture.nativeElement.querySelectorAll('button[aria-label="Decrease quantity"]');
    expect(decreaseBtns.length).toBeGreaterThan(1);
    decreaseBtns[1].click(); // Item 2 has count: 1, so clicking '-' dispatches removeItem

    expect(cartServiceMock.removeSpecificCartItem).toHaveBeenCalledWith('prod-200');
  });

  it('8. should call removeItem on remove button click', () => {
    const removeBtns = fixture.nativeElement.querySelectorAll('button[aria-label="Remove item"]');
    expect(removeBtns.length).toBeGreaterThan(0);
    removeBtns[0].click();

    expect(cartServiceMock.removeSpecificCartItem).toHaveBeenCalledWith('prod-100');
  });

  it('9. should call clearCart on clear cart button click', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const clearBtn = fixture.nativeElement.querySelector('button[aria-label="Clear Cart"]');
    expect(clearBtn).toBeTruthy();
    clearBtn?.click();

    expect(cartServiceMock.clearCart).toHaveBeenCalled();
  });

  it('10. should render empty state when cart has no items', () => {
    cartServiceMock.cartData.set(null);
    cartServiceMock.numOfCartItems.set(0);
    cartServiceMock.isCartEmpty.set(true);
    cartServiceMock.cartProducts.set([]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Your cart is empty!');
    expect(compiled.textContent).toContain('Continue Shopping');
    const link = compiled.querySelector('a[href="/products"]');
    expect(link).toBeTruthy();
  });

  it('11. should navigate to checkout when proceedToCheckout is called', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.proceedToCheckout();
    expect(navigateSpy).toHaveBeenCalledWith(['/checkout', 'cart-123']);
  });
});
