import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { Brands } from './brands';
import { ProductService } from '../../core/services/product.service';
import { Brand } from '../../core/models/product-model';

describe('Brands Component', () => {
  let component: Brands;
  let fixture: ComponentFixture<Brands>;
  let productService: ProductService;

  const mockBrands: Brand[] = [
    {
      _id: 'b-1',
      name: 'Organic Valley',
      slug: 'organic-valley',
      image: 'https://example.com/brand-valley.png',
    },
    {
      _id: 'b-2',
      name: 'Nestle Goodness',
      slug: 'nestle-goodness',
      image: 'https://example.com/brand-nestle.png',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Brands],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(Brands);
    component = fixture.componentInstance;
    productService = TestBed.inject(ProductService);
  });

  it('should create the component instance', () => {
    expect(component).toBeTruthy();
  });

  it('should load brands on init and render brand grid', async () => {
    vi.spyOn(productService, 'getBrands').mockReturnValue(
      of({ results: 2, data: mockBrands })
    );

    component.ngOnInit();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(productService.getBrands).toHaveBeenCalledWith(40);
    expect(component.brands().length).toBe(2);
    expect(component.isLoading()).toBe(false);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Organic Valley');
    expect(compiled.textContent).toContain('Nestle Goodness');
  });

  it('should open modal preview when clicking a brand card', async () => {
    vi.spyOn(productService, 'getBrands').mockReturnValue(
      of({ results: 2, data: mockBrands })
    );
    component.ngOnInit();
    fixture.detectChanges();
    await fixture.whenStable();

    component.selectBrand(mockBrands[0]);
    fixture.detectChanges();

    expect(component.selectedBrand()).toEqual(mockBrands[0]);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('View Products from Organic Valley');
  });

  it('should close brand modal when closeBrandModal() is invoked', () => {
    component.selectedBrand.set(mockBrands[0]);
    component.closeBrandModal();
    expect(component.selectedBrand()).toBeNull();
  });

  it('should close modal when Escape key is pressed', () => {
    component.selectedBrand.set(mockBrands[0]);
    component.onEscape();
    expect(component.selectedBrand()).toBeNull();
  });

  it('should handle brand fetch error gracefully', async () => {
    vi.spyOn(productService, 'getBrands').mockReturnValue(
      throwError(() => new Error('Failed to fetch brands'))
    );

    component.ngOnInit();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.brands()).toEqual([]);
    expect(component.isLoading()).toBe(false);
  });
});
