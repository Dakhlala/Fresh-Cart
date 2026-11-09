import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError, Subject } from 'rxjs';
import { ProductCardComponent } from './product-card';
import { CartService } from '../../../core/services/cart.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { Product } from '../../../core/models/product-model';

describe('ProductCardComponent', () => {
  let fixture: ComponentFixture<ProductCardComponent>;
  let component: ProductCardComponent;
  let cartService: CartService;
  let wishlistService: WishlistService;

  const mockProduct: Product = {
    _id: 'prod-001',
    id: 'prod-001',
    title: 'Fresh Juicy Organic Apples 1kg',
    description: 'Farm-fresh premium crisp apples picked daily.',
    quantity: 100,
    price: 65,
    priceAfterDiscount: 50,
    imageCover: 'https://ecommerce.routemisr.com/Route-Academy-products/apples.jpg',
    images: ['https://ecommerce.routemisr.com/Route-Academy-products/apples.jpg'],
    category: {
      _id: 'cat-001',
      name: 'Fruits & Vegetables',
      slug: 'fruits-and-vegetables',
      image: 'https://ecommerce.routemisr.com/Route-Academy-categories/fruits.jpg',
    },
    ratingsAverage: 4.8,
    ratingsQuantity: 142,
  };

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ProductCardComponent],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;
    cartService = TestBed.inject(CartService);
    wishlistService = TestBed.inject(WishlistService);

    fixture.componentRef.setInput('product', mockProduct);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create successfully with required product input', () => {
    expect(component).toBeTruthy();
    expect(component.product()).toEqual(mockProduct);
  });

  describe('1. Visual & UI Parity Assertions', () => {
    it('renders imageCover with aspect-square object-contain w-full classes', () => {
      const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;
      expect(img).toBeTruthy();
      expect(img.src).toContain('apples.jpg');
      expect(img.alt).toBe(mockProduct.title);
      expect(img.classList.contains('aspect-square')).toBe(true);
      expect(img.classList.contains('object-contain')).toBe(true);
      expect(img.classList.contains('w-full')).toBe(true);
    });

    it('renders category name with text-[#0aad0a] text-xs font-semibold classes', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const categorySpan = compiled.querySelector('span.text-\\[\\#0aad0a\\]');
      expect(categorySpan).toBeTruthy();
      expect(categorySpan?.textContent?.trim()).toBe('Fruits & Vegetables');
      expect(categorySpan?.classList.contains('text-xs')).toBe(true);
      expect(categorySpan?.classList.contains('font-semibold')).toBe(true);
    });

    it('renders truncated title with line-clamp-1 font-medium text-gray-800', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const titleEl = compiled.querySelector('h3');
      expect(titleEl).toBeTruthy();
      expect(titleEl?.textContent?.trim()).toBe(mockProduct.title);
      expect(titleEl?.classList.contains('line-clamp-1')).toBe(true);
      expect(titleEl?.classList.contains('font-medium')).toBe(true);
      expect(titleEl?.classList.contains('text-gray-800')).toBe(true);
    });

    it('renders price in EGP and star rating with fa-star text-[#ffc908]', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('65');
      expect(compiled.textContent).toContain('EGP');

      const starIcon = compiled.querySelector('.fa-star');
      expect(starIcon).toBeTruthy();
      expect(starIcon?.classList.contains('text-[#ffc908]')).toBe(true);
      expect(compiled.textContent).toContain('4.8');
    });

    it('card container contains hover:border-[#0aad0a] and transition-all duration-300', () => {
      const card = fixture.nativeElement.firstElementChild as HTMLElement;
      expect(card.classList.contains('hover:border-[#0aad0a]')).toBe(true);
      expect(card.classList.contains('transition-all')).toBe(true);
      expect(card.classList.contains('duration-300')).toBe(true);
      expect(card.classList.contains('rounded-2xl')).toBe(true);
    });

    it('slide-up Add to Cart button includes required transition classes', () => {
      const btn = fixture.nativeElement.querySelector('button.w-full') as HTMLButtonElement;
      expect(btn).toBeTruthy();
      expect(btn.classList.contains('translate-y-full')).toBe(true);
      expect(btn.classList.contains('opacity-0')).toBe(true);
      expect(btn.classList.contains('group-hover:translate-y-0')).toBe(true);
      expect(btn.classList.contains('group-hover:opacity-100')).toBe(true);
      expect(btn.classList.contains('transition-all')).toBe(true);
      expect(btn.classList.contains('duration-300')).toBe(true);
    });
  });

  describe('2. Wishlist State & Reactivity', () => {
    it('isInWishlist is false when product ID is not in wishlistIds', () => {
      wishlistService.wishlistIds.set([]);
      fixture.detectChanges();

      expect(component.isInWishlist()).toBe(false);
      const heartIcon = fixture.nativeElement.querySelector('.fa-heart');
      expect(heartIcon.classList.contains('far')).toBe(true);
      expect(heartIcon.classList.contains('text-gray-400')).toBe(true);
    });

    it('isInWishlist is true and renders solid red heart when product ID is in wishlistIds', () => {
      wishlistService.wishlistIds.set(['prod-001', 'prod-002']);
      fixture.detectChanges();

      expect(component.isInWishlist()).toBe(true);
      const heartIcon = fixture.nativeElement.querySelector('.fa-heart');
      expect(heartIcon.classList.contains('fas')).toBe(true);
      expect(heartIcon.classList.contains('text-red-500')).toBe(true);
    });

    it('toggleWishlist stops event propagation and calls wishlistService.toggleWishlist', () => {
      const toggleSpy = vi.spyOn(wishlistService, 'toggleWishlist').mockImplementation(() => {});
      const fakeEvent = new MouseEvent('click');
      const stopSpy = vi.spyOn(fakeEvent, 'stopPropagation');
      const preventSpy = vi.spyOn(fakeEvent, 'preventDefault');

      component.toggleWishlist(fakeEvent);

      expect(stopSpy).toHaveBeenCalled();
      expect(preventSpy).toHaveBeenCalled();
      expect(toggleSpy).toHaveBeenCalledWith('prod-001');
    });
  });

  describe('3. Add to Cart & Loading Spinner', () => {
    it('addToCart stops event propagation and sets isAddingToCart true while in flight', () => {
      const responseSubject = new Subject<any>();
      const cartSpy = vi
        .spyOn(cartService, 'addProductToCart')
        .mockReturnValue(responseSubject.asObservable());

      const fakeEvent = new MouseEvent('click');
      const stopSpy = vi.spyOn(fakeEvent, 'stopPropagation');
      const preventSpy = vi.spyOn(fakeEvent, 'preventDefault');

      component.addToCart(fakeEvent);

      expect(stopSpy).toHaveBeenCalled();
      expect(preventSpy).toHaveBeenCalled();
      expect(cartSpy).toHaveBeenCalledWith('prod-001');
      expect(component.isAddingToCart()).toBe(true);

      fixture.detectChanges();

      // Button is disabled and shows spinner
      const btn = fixture.nativeElement.querySelector('button.w-full') as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
      expect(fixture.nativeElement.querySelector('.fa-spinner')).toBeTruthy();
      expect(btn.textContent).toContain('Adding...');

      // Complete request
      responseSubject.next({ status: 'success', numOfCartItems: 1 });
      responseSubject.complete();
      fixture.detectChanges();

      expect(component.isAddingToCart()).toBe(false);
      expect(btn.disabled).toBe(false);
      expect(btn.textContent).toContain('Add to Cart');
    });

    it('resets isAddingToCart when cart request errors (via finalize)', () => {
      vi.spyOn(cartService, 'addProductToCart').mockReturnValue(
        throwError(() => new Error('Network error'))
      );

      const fakeEvent = new MouseEvent('click');
      component.addToCart(fakeEvent);

      expect(component.isAddingToCart()).toBe(false);
    });

    it('does not re-trigger addToCart if already in progress', () => {
      component.isAddingToCart.set(true);
      const cartSpy = vi.spyOn(cartService, 'addProductToCart');

      const fakeEvent = new MouseEvent('click');
      component.addToCart(fakeEvent);

      expect(cartSpy).not.toHaveBeenCalled();
    });
  });
});
