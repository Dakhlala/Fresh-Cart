import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Home } from './home';
import { ProductService } from '../../core/services/product.service';
import { Product, Category } from '../../core/models/product-model';

describe('Home Component', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;
  let productServiceMock: any;

  const mockCategories: Category[] = [
    { _id: 'cat1', name: 'Electronics', slug: 'electronics', image: 'https://example.com/elec.jpg' },
    { _id: 'cat2', name: 'Bakery', slug: 'bakery', image: 'https://example.com/bakery.jpg' },
  ];

  const mockProducts: Product[] = [
    {
      _id: 'p1',
      title: 'Fresh Red Apple',
      description: 'Crisp and juicy sweet organic red apples',
      quantity: 50,
      price: 25,
      imageCover: 'https://example.com/apple.jpg',
      images: ['https://example.com/apple.jpg'],
      category: mockCategories[0],
      ratingsAverage: 4.8,
      ratingsQuantity: 120,
    },
    {
      _id: 'p2',
      title: 'Organic Milk 1L',
      description: 'Whole organic dairy farm milk',
      quantity: 30,
      price: 35,
      imageCover: 'https://example.com/milk.jpg',
      images: ['https://example.com/milk.jpg'],
      category: mockCategories[1],
      ratingsAverage: 4.5,
      ratingsQuantity: 80,
    },
  ];

  beforeEach(async () => {
    productServiceMock = {
      getCategories: vi.fn().mockReturnValue(of({ results: 2, data: mockCategories })),
      getProducts: vi.fn().mockReturnValue(of({ results: 2, data: mockProducts })),
    };

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: ProductService, useValue: productServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create the Home component', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch categories and products on init', () => {
    expect(productServiceMock.getCategories).toHaveBeenCalledWith(12);
    expect(productServiceMock.getProducts).toHaveBeenCalledWith(30);
    expect(component.categories().length).toBe(2);
    expect(component.products().length).toBe(2);
    expect(component.isLoading()).toBe(false);
  });

  it('should advance and rewind hero carousel slides', () => {
    expect(component.currentSlide()).toBe(0);

    component.nextSlide();
    expect(component.currentSlide()).toBe(1);

    component.nextSlide();
    expect(component.currentSlide()).toBe(2);

    // Wraparound to 0
    component.nextSlide();
    expect(component.currentSlide()).toBe(0);

    // Wraparound backward
    component.prevSlide();
    expect(component.currentSlide()).toBe(component.slides.length - 1);
  });

  it('should filter popular products reactively by title search term', () => {
    component.searchTerm.set('apple');
    expect(component.filteredProducts().length).toBe(1);
    expect(component.filteredProducts()[0].title).toBe('Fresh Red Apple');

    component.searchTerm.set('milk');
    expect(component.filteredProducts().length).toBe(1);
    expect(component.filteredProducts()[0].title).toBe('Organic Milk 1L');

    // Case-insensitive check
    component.searchTerm.set('MILK');
    expect(component.filteredProducts().length).toBe(1);

    // Non-matching term
    component.searchTerm.set('xyzNonExistent');
    expect(component.filteredProducts().length).toBe(0);

    // Reset search
    component.resetSearch();
    expect(component.searchTerm()).toBe('');
    expect(component.filteredProducts().length).toBe(2);
  });

  it('should render product card components for each product', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('app-product-card');
    expect(cards.length).toBe(2);
  });
});
