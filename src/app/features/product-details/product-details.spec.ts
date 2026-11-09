import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ProductDetails } from './product-details';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { Product } from '../../core/models/product-model';

describe('ProductDetails Component', () => {
  let component: ProductDetails;
  let fixture: ComponentFixture<ProductDetails>;
  let productService: ProductService;
  let cartService: CartService;
  let wishlistService: WishlistService;

  const mockProduct: Product = {
    _id: 'prod-123',
    id: 'prod-123',
    title: 'Fresh Organic Strawberries 500g',
    description: 'Sweet, freshly harvested organic strawberries packed with vitamins.',
    quantity: 25,
    price: 65,
    priceAfterDiscount: 50,
    imageCover: 'https://example.com/strawberry-cover.jpg',
    images: [
      'https://example.com/strawberry-1.jpg',
      'https://example.com/strawberry-2.jpg',
      'https://example.com/strawberry-3.jpg',
    ],
    category: {
      _id: 'cat-1',
      name: 'Fruits & Vegetables',
      slug: 'fruits-and-vegetables',
      image: 'https://example.com/cat.jpg',
    },
    brand: {
      _id: 'brand-1',
      name: 'FreshFarm',
      slug: 'fresh-farm',
      image: 'https://example.com/brand.jpg',
    },
    ratingsAverage: 4.8,
    ratingsQuantity: 120,
  };

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [ProductDetails],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: 'prod-123' })),
            snapshot: { paramMap: convertToParamMap({ id: 'prod-123' }) },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetails);
    component = fixture.componentInstance;
    productService = TestBed.inject(ProductService);
    cartService = TestBed.inject(CartService);
    wishlistService = TestBed.inject(WishlistService);
  });

  it('should create the component instance', () => {
    expect(component).toBeTruthy();
  });

  it('should load product by route param ID on init', async () => {
    vi.spyOn(productService, 'getProductById').mockReturnValue(
      of({ data: mockProduct })
    );

    component.ngOnInit();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(productService.getProductById).toHaveBeenCalledWith('prod-123');
    expect(component.product()).toEqual(mockProduct);
    expect(component.selectedImage()).toBe('https://example.com/strawberry-cover.jpg');
    expect(component.isLoading()).toBe(false);
  });

  it('should switch active preview image when clicking thumbnail', async () => {
    vi.spyOn(productService, 'getProductById').mockReturnValue(
      of({ data: mockProduct })
    );
    component.ngOnInit();
    fixture.detectChanges();
    await fixture.whenStable();

    component.setImage('https://example.com/strawberry-2.jpg');
    fixture.detectChanges();

    expect(component.selectedImage()).toBe('https://example.com/strawberry-2.jpg');
    const previewImg = fixture.nativeElement.querySelector('img[src="https://example.com/strawberry-2.jpg"]');
    expect(previewImg).toBeTruthy();
  });

  it('should render title, category, price, star rating, and description in template', async () => {
    vi.spyOn(productService, 'getProductById').mockReturnValue(
      of({ data: mockProduct })
    );
    component.ngOnInit();
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Fresh Organic Strawberries 500g');
    expect(compiled.textContent).toContain('Fruits & Vegetables');
    expect(compiled.textContent).toContain('65');
    expect(compiled.textContent).toContain('EGP');
    expect(compiled.textContent).toContain('4.8');
    expect(compiled.textContent).toContain('Sweet, freshly harvested organic strawberries');
    expect(compiled.querySelector('.fa-star')).toBeTruthy();
  });

  it('should increment and decrement quantity with lower bound of 1', () => {
    expect(component.quantity()).toBe(1);
    component.decrementQuantity();
    expect(component.quantity()).toBe(1); // Cannot go below 1

    component.incrementQuantity();
    expect(component.quantity()).toBe(2);
    component.incrementQuantity();
    expect(component.quantity()).toBe(3);

    component.decrementQuantity();
    expect(component.quantity()).toBe(2);
  });

  it('should handle in-flight spinner state during addToCart()', async () => {
    vi.spyOn(productService, 'getProductById').mockReturnValue(
      of({ data: mockProduct })
    );
    component.ngOnInit();
    fixture.detectChanges();
    await fixture.whenStable();

    vi.spyOn(cartService, 'addProductToCart').mockReturnValue(
      of({ status: 'success', numOfCartItems: 1, cartId: 'c1', data: {} as any })
    );

    expect(component.isAddingToCart()).toBe(false);
    component.addToCart();
    expect(cartService.addProductToCart).toHaveBeenCalledWith('prod-123');
    expect(component.isAddingToCart()).toBe(false);
  });

  it('should toggle wishlist state when clicking heart button', async () => {
    vi.spyOn(productService, 'getProductById').mockReturnValue(
      of({ data: mockProduct })
    );
    component.ngOnInit();
    fixture.detectChanges();
    await fixture.whenStable();

    vi.spyOn(wishlistService, 'toggleWishlist').mockImplementation(() => {});
    component.toggleWishlist();
    expect(wishlistService.toggleWishlist).toHaveBeenCalledWith('prod-123');
  });

  it('should render product not found state when product is null', async () => {
    vi.spyOn(productService, 'getProductById').mockReturnValue(
      throwError(() => new Error('Not found'))
    );
    component.ngOnInit();
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Product not found');
  });
});
