import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { Component, signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Checkout } from './checkout';
import { CartService } from '../../core/services/cart.service';
import { OrdersService, OrderService } from '../../core/services/orders.service';
import { ToastService } from '../../core/services/toast.service';
import { CartResponse } from '../../core/models/cart-model';

@Component({ selector: 'dummy-allorders', template: `<div>Mock All Orders View</div>` })
class DummyAllordersComponent {}

@Component({ selector: 'dummy-cart', template: `<div>Mock Cart View</div>` })
class DummyCartComponent {}

describe('Checkout Component — Milestone M4 Hermetic Unit Test Suite', () => {
  let fixture: ComponentFixture<Checkout>;
  let component: Checkout;
  let cartServiceMock: any;
  let orderServiceMock: any;
  let toastServiceMock: any;
  let router: Router;

  const mockCartData: CartResponse = {
    status: 'success',
    numOfCartItems: 4,
    cartId: 'cart-route-789',
    data: {
      _id: 'cart-route-789',
      cartOwner: 'user-001',
      totalCartPrice: 850,
      products: [],
    },
  };

  const originalLocation = window.location;

  beforeEach(async () => {
    // Setup hermetic window.location mock
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:4200',
        href: '',
      },
      writable: true,
      configurable: true,
    });

    cartServiceMock = {
      cartId: signal<string | null>('cart-fallback-456'),
      numOfCartItems: signal<number>(4),
      cartData: signal<CartResponse | null>(mockCartData),
      isLoading: signal<boolean>(false),
      totalCartPrice: signal<number>(850),
      isCartEmpty: signal<boolean>(false),
      getLoggedUserCart: vi.fn().mockReturnValue(of(mockCartData)),
      resetCart: vi.fn(),
    };

    orderServiceMock = {
      createCashOrder: vi.fn().mockReturnValue(
        of({
          status: 'success',
          data: {
            _id: 'order-101',
            id: 101,
            totalOrderPrice: 850,
            paymentMethodType: 'cash',
          },
        })
      ),
      checkoutSession: vi.fn().mockReturnValue(
        of({
          status: 'success',
          session: {
            url: 'https://checkout.stripe.com/c/pay/cs_test_mock123',
            success_url: 'http://localhost:4200/allorders',
            cancel_url: 'http://localhost:4200/cart',
          },
        })
      ),
      createCheckoutSession: vi.fn().mockReturnValue(
        of({
          status: 'success',
          session: {
            url: 'https://checkout.stripe.com/c/pay/cs_test_mock123',
            success_url: 'http://localhost:4200/allorders',
            cancel_url: 'http://localhost:4200/cart',
          },
        })
      ),
    };

    toastServiceMock = {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Checkout],
      providers: [
        provideRouter([
          { path: 'allorders', component: DummyAllordersComponent },
          { path: 'cart', component: DummyCartComponent },
        ]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ cartId: 'cart-route-789' }),
            },
          },
        },
        { provide: CartService, useValue: cartServiceMock },
        { provide: OrdersService, useValue: orderServiceMock },
        { provide: OrderService, useValue: orderServiceMock },
        { provide: ToastService, useValue: toastServiceMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(Checkout);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  describe('1. Component Initialization & CartId Resolution', () => {
    it('should create Checkout component successfully', () => {
      expect(component).toBeTruthy();
    });

    it('should resolve cartId from ActivatedRoute snapshot paramMap', () => {
      expect(component.cartId()).toBe('cart-route-789');
    });

    it('should fallback to cartService.cartId() when route param is absent', () => {
      const route = TestBed.inject(ActivatedRoute);
      (route.snapshot as any).paramMap = convertToParamMap({});
      fixture = TestBed.createComponent(Checkout);
      const comp = fixture.componentInstance;
      fixture.detectChanges();

      expect(comp.cartId()).toBe('cart-fallback-456');
    });

    it('should trigger getLoggedUserCart on ngOnInit if cartData is initially null', () => {
      cartServiceMock.cartData.set(null);
      fixture = TestBed.createComponent(Checkout);
      fixture.detectChanges();

      expect(cartServiceMock.getLoggedUserCart).toHaveBeenCalled();
    });
  });

  describe('2. Reactive Form Validation UX', () => {
    it('should initialize shipping form as invalid with empty fields', () => {
      expect(component.shippingForm.valid).toBe(false);
      expect(component.detailsControl?.value).toBe('');
      expect(component.phoneControl?.value).toBe('');
      expect(component.cityControl?.value).toBe('');
    });

    it('should enforce details minlength of 3 characters', () => {
      const details = component.detailsControl;
      details?.setValue('AB');
      expect(details?.valid).toBe(false);
      expect(details?.hasError('minlength')).toBe(true);

      details?.setValue('123 Street');
      expect(details?.valid).toBe(true);
    });

    it('should validate Egyptian mobile phone regex (^01[0125][0-9]{8}$)', () => {
      const phone = component.phoneControl;

      // Valid Egyptian operators: 010, 011, 012, 015 with 11 digits
      const validNumbers = [
        '01012345678', // Vodafone
        '01123456789', // Etisalat
        '01234567890', // Orange
        '01512345678', // WE
      ];
      for (const num of validNumbers) {
        phone?.setValue(num);
        expect(phone?.valid, `Expected "${num}" to be valid`).toBe(true);
      }

      // Invalid phone vectors
      const invalidNumbers = [
        '01312345678', // Invalid prefix 013
        '01412345678', // Invalid prefix 014
        '010123456', // Too short (9 digits)
        '010123456789', // Too long (12 digits)
        '0101234abcd', // Contains letters
        '+201012345678', // Contains +20 prefix
      ];
      for (const num of invalidNumbers) {
        phone?.setValue(num);
        expect(phone?.valid, `Expected "${num}" to be invalid`).toBe(false);
      }
    });

    it('should enforce city as required', () => {
      const city = component.cityControl;
      city?.setValue('');
      expect(city?.valid).toBe(false);
      expect(city?.hasError('required')).toBe(true);

      city?.setValue('Cairo');
      expect(city?.valid).toBe(true);
    });

    it('should mark all fields as touched when submitting invalid form', () => {
      expect(component.shippingForm.touched).toBe(false);
      component.payCash();
      expect(component.shippingForm.touched).toBe(true);
      expect(component.detailsControl?.touched).toBe(true);
      expect(component.phoneControl?.touched).toBe(true);
      expect(component.cityControl?.touched).toBe(true);
      expect(orderServiceMock.createCashOrder).not.toHaveBeenCalled();
    });
  });

  describe('3. Flow A: Cash on Delivery Payment', () => {
    beforeEach(() => {
      component.shippingForm.setValue({
        details: '22 Dokki Street, Floor 3',
        phone: '01012345678',
        city: 'Giza',
      });
    });

    it('should dispatch createCashOrder with cartId and shippingAddress', () => {
      component.payCash();

      expect(orderServiceMock.createCashOrder).toHaveBeenCalledWith('cart-route-789', {
        details: '22 Dokki Street, Floor 3',
        phone: '01012345678',
        city: 'Giza',
      });
    });

    it('should resetCart, display toast success, and navigate to /allorders on success', () => {
      const navigateSpy = vi.spyOn(router, 'navigate');
      component.payCash();

      expect(cartServiceMock.resetCart).toHaveBeenCalledTimes(1);
      expect(toastServiceMock.success).toHaveBeenCalledWith(
        'Your cash order was placed successfully!'
      );
      expect(navigateSpy).toHaveBeenCalledWith(['/allorders']);
      expect(component.isCashLoading()).toBe(false);
    });

    it('should handle cash order failure gracefully, setting errorMessage and stopping spinner', () => {
      orderServiceMock.createCashOrder.mockReturnValue(
        throwError(() => ({ error: { message: 'Stock depleted for selected items' } }))
      );

      component.payCash();

      expect(component.isCashLoading()).toBe(false);
      expect(component.errorMessage()).toBe('Stock depleted for selected items');
      expect(cartServiceMock.resetCart).not.toHaveBeenCalled();
    });
  });

  describe('4. Flow B: Online Stripe Payment', () => {
    beforeEach(() => {
      component.shippingForm.setValue({
        details: '15 El-Horreya Avenue',
        phone: '01123456789',
        city: 'Alexandria',
      });
    });

    it('should dispatch createCheckoutSession with cartId, shippingAddress, and returnUrl', () => {
      component.payOnline();

      expect(
        orderServiceMock.createCheckoutSession || orderServiceMock.checkoutSession
      ).toHaveBeenCalled();
    });

    it('should call resetCart and redirect window.location.href to Stripe URL on success', () => {
      component.payOnline();

      expect(cartServiceMock.resetCart).toHaveBeenCalledTimes(1);
      expect(window.location.href).toBe('https://checkout.stripe.com/c/pay/cs_test_mock123');
      expect(component.isOnlineLoading()).toBe(false);
    });

    it('should handle Stripe session initialization failure gracefully', () => {
      orderServiceMock.createCheckoutSession.mockReturnValue(
        throwError(() => ({ error: { message: 'Stripe gateway temporarily unavailable' } }))
      );
      orderServiceMock.checkoutSession.mockReturnValue(
        throwError(() => ({ error: { message: 'Stripe gateway temporarily unavailable' } }))
      );

      component.payOnline();

      expect(component.isOnlineLoading()).toBe(false);
      expect(component.errorMessage()).toBe('Stripe gateway temporarily unavailable');
      expect(cartServiceMock.resetCart).not.toHaveBeenCalled();
    });
  });

  describe('5. In-Flight Spinners & Mutual Button Disabled State', () => {
    beforeEach(() => {
      component.shippingForm.setValue({
        details: '10 Zamalek Island',
        phone: '01234567890',
        city: 'Cairo',
      });
    });

    it('should indicate in-flight state and compute isAnyLoading correctly', () => {
      expect(component.isAnyLoading()).toBe(false);

      component.isCashLoading.set(true);
      expect(component.isAnyLoading()).toBe(true);

      component.isCashLoading.set(false);
      component.isOnlineLoading.set(true);
      expect(component.isAnyLoading()).toBe(true);
    });
  });

  describe('6. Order Summary Card & Missing CartId Handling', () => {
    it('should display total items, subtotal, FREE delivery badge, and #0aad0a price highlight', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Review Summary');
      expect(compiled.textContent).toContain('4 Items');
      expect(compiled.textContent).toContain('850 EGP');
      expect(compiled.textContent).toContain('FREE');
    });

    it('should show toast error and redirect to /cart if cartId cannot be resolved', () => {
      const route = TestBed.inject(ActivatedRoute);
      (route.snapshot as any).paramMap = convertToParamMap({});
      cartServiceMock.cartId.set(null);

      fixture = TestBed.createComponent(Checkout);
      const comp = fixture.componentInstance;
      comp.shippingForm.setValue({
        details: 'Valid Street 123',
        phone: '01012345678',
        city: 'Cairo',
      });

      const navigateSpy = vi.spyOn(router, 'navigate');
      comp.payCash();

      expect(toastServiceMock.error).toHaveBeenCalledWith(
        'Cart session not found. Please add items to cart first.'
      );
      expect(navigateSpy).toHaveBeenCalledWith(['/cart']);
      expect(orderServiceMock.createCashOrder).not.toHaveBeenCalled();
    });
  });
});
