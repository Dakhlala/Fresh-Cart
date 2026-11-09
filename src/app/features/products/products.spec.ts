import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { Products } from './products';
import { ProductService } from '../../core/services/product.service';
import { Product, Category } from '../../core/models/product-model';

describe('Products Component', () => {
  let component: Products;
  let fixture: ComponentFixture<Products>;
  let productServiceMock: any;

  const mockCategories: Category[] = [
    { _id: 'cat1', name: "Men's Fashion", slug: 'mens-fashion', image: 'https://example.com/men.jpg' },
    { _id: 'cat2', name: "Electronics", slug: 'electronics', image: 'https://example.com/elec.jpg' },
  ];

  const mockProducts: Product[] = [
    {
      _id: 'p1',
      title: 'Casual Cotton Shirt',
      description: 'Comfortable daily wear cotton shirt',
      quantity: 50,
      price: 350,
      imageCover: 'https://example.com/shirt.jpg',
      images: ['https://example.com/shirt.jpg'],
      category: mockCategories[0],
      ratingsAverage: 4.6,
      ratingsQuantity: 45,
    },
    {
      _id: 'p2',
      title: 'Wireless Bluetooth Headphones',
      description: 'Noise cancelling over-ear headphones',
      quantity: 20,
      price: 1200,
      imageCover: 'https://example.com/headphones.jpg',
      images: ['https://example.com/headphones.jpg'],
      category: mockCategories[1],
      ratingsAverage: 4.9,
      ratingsQuantity: 210,
    },
  ];

  beforeEach(async () => {
    productServiceMock = {
      getCategories: vi.fn().mockReturnValue(of({ results: 2, data: mockCategories })),
      getProducts: vi.fn().mockImplementation((limit: number = 20, page: number = 1, categoryId?: string) =>
        of({
          results: 2,
          metadata: { currentPage: page, numberOfPages: 3, limit },
          data: mockProducts,
        })
      ),
    };

    await TestBed.configureTestingModule({
      imports: [Products],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({}),
          },
        },
        { provide: ProductService, useValue: productServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Products);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create the Products catalog component', () => {
    expect(component).toBeTruthy();
  });

  it('should load categories and products with pagination metadata on init', () => {
    expect(productServiceMock.getCategories).toHaveBeenCalledWith(20);
    expect(productServiceMock.getProducts).toHaveBeenCalledWith(20, 1, undefined);
    expect(component.products().length).toBe(2);
    expect(component.categories().length).toBe(2);
    expect(component.currentPage()).toBe(1);
    expect(component.numberOfPages()).toBe(3);
    expect(component.isLoading()).toBe(false);
  });

  it('should filter displayed products in real time using search signal', () => {
    component.searchTerm.set('Shirt');
    expect(component.filteredProducts().length).toBe(1);
    expect(component.filteredProducts()[0].title).toBe('Casual Cotton Shirt');

    component.searchTerm.set('headphones');
    expect(component.filteredProducts().length).toBe(1);
    expect(component.filteredProducts()[0].title).toBe('Wireless Bluetooth Headphones');

    component.searchTerm.set('unknown item');
    expect(component.filteredProducts().length).toBe(0);

    component.resetSearch();
    expect(component.searchTerm()).toBe('');
    expect(component.filteredProducts().length).toBe(2);
  });

  it('should filter products when category pill is selected', () => {
    component.selectCategory('cat2');
    expect(component.selectedCategory()).toBe('cat2');
    expect(component.currentPage()).toBe(1);
    expect(productServiceMock.getProducts).toHaveBeenCalledWith(20, 1, 'cat2');

    // Deselect back to All Categories
    component.selectCategory(null);
    expect(component.selectedCategory()).toBeNull();
    expect(productServiceMock.getProducts).toHaveBeenCalledWith(20, 1, undefined);
  });

  it('should navigate pages when goToPage is called', () => {
    component.goToPage(2);
    expect(component.currentPage()).toBe(2);
    expect(productServiceMock.getProducts).toHaveBeenCalledWith(20, 2, undefined);

    // Out of bounds page calls should be ignored
    component.goToPage(0);
    expect(component.currentPage()).toBe(2);

    component.goToPage(4); // greater than numberOfPages (3)
    expect(component.currentPage()).toBe(2);
  });

  it('should render product card components in the grid', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('app-product-card');
    expect(cards.length).toBe(2);
  });
});
