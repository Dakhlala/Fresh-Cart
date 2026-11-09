import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { Categories } from './categories';
import { ProductService } from '../../core/services/product.service';
import { Category, SubCategory } from '../../core/models/product-model';

describe('Categories Component', () => {
  let component: Categories;
  let fixture: ComponentFixture<Categories>;
  let productService: ProductService;

  const mockCategories: Category[] = [
    {
      _id: 'cat-1',
      name: 'Dairy & Eggs',
      slug: 'dairy-and-eggs',
      image: 'https://example.com/dairy.jpg',
    },
    {
      _id: 'cat-2',
      name: 'Fresh Bakery',
      slug: 'fresh-bakery',
      image: 'https://example.com/bakery.jpg',
    },
  ];

  const mockSubCategories: SubCategory[] = [
    {
      _id: 'sub-1',
      name: 'Milk & Butter',
      slug: 'milk-and-butter',
      category: 'cat-1',
    },
    {
      _id: 'sub-2',
      name: 'Artisan Cheeses',
      slug: 'artisan-cheeses',
      category: 'cat-1',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Categories],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(Categories);
    component = fixture.componentInstance;
    productService = TestBed.inject(ProductService);
  });

  it('should create the component instance', () => {
    expect(component).toBeTruthy();
  });

  it('should load all categories on init and render cards', async () => {
    vi.spyOn(productService, 'getCategories').mockReturnValue(
      of({ results: 2, data: mockCategories })
    );

    component.ngOnInit();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(productService.getCategories).toHaveBeenCalledWith(30);
    expect(component.categories().length).toBe(2);
    expect(component.isLoading()).toBe(false);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Dairy & Eggs');
    expect(compiled.textContent).toContain('Fresh Bakery');
  });

  it('should open subcategories modal when category is selected', async () => {
    vi.spyOn(productService, 'getCategories').mockReturnValue(
      of({ results: 2, data: mockCategories })
    );
    vi.spyOn(productService, 'getSubCategoriesOnCategory').mockReturnValue(
      of({ results: 2, data: mockSubCategories })
    );

    component.ngOnInit();
    fixture.detectChanges();
    await fixture.whenStable();

    component.selectCategory(mockCategories[0]);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.selectedCategory()).toEqual(mockCategories[0]);
    expect(component.subCategories().length).toBe(2);
    expect(productService.getSubCategoriesOnCategory).toHaveBeenCalledWith('cat-1');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Milk & Butter');
    expect(compiled.textContent).toContain('Artisan Cheeses');
  });

  it('should close subcategories modal on closeSubCategories()', async () => {
    component.selectedCategory.set(mockCategories[0]);
    component.subCategories.set(mockSubCategories);
    fixture.detectChanges();

    component.closeSubCategories();
    fixture.detectChanges();

    expect(component.selectedCategory()).toBeNull();
    expect(component.subCategories().length).toBe(0);
  });

  it('should close modal when Escape key is pressed', () => {
    component.selectedCategory.set(mockCategories[0]);
    component.onEscape();
    expect(component.selectedCategory()).toBeNull();
  });

  it('should handle category fetch error gracefully', async () => {
    vi.spyOn(productService, 'getCategories').mockReturnValue(
      throwError(() => new Error('Network error'))
    );

    component.ngOnInit();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.categories()).toEqual([]);
    expect(component.isLoading()).toBe(false);
  });
});
