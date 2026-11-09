import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Category, Product } from '../../core/models/product-model';
import { ProductService } from '../../core/services/product.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card';

@Component({
  selector: 'app-products',
  imports: [FormsModule, ProductCardComponent],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly route = inject(ActivatedRoute);

  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly searchTerm = signal<string>('');
  readonly selectedCategory = signal<string | null>(null);

  // Pagination Signals
  readonly currentPage = signal<number>(1);
  readonly numberOfPages = signal<number>(1);
  readonly limit = signal<number>(20);

  // Real-time title search computed signal
  readonly filteredProducts = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const list = this.products();
    if (!term) return list;
    return list.filter((p) => p.title.toLowerCase().includes(term));
  });

  // Pages array computed signal for pagination buttons
  readonly pages = computed(() =>
    Array.from({ length: this.numberOfPages() }, (_, i) => i + 1)
  );

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['q']) {
        this.searchTerm.set(params['q']);
      }
      if (params['category']) {
        this.selectedCategory.set(params['category']);
      }
      if (params['page']) {
        const pageNum = parseInt(params['page'], 10);
        if (!isNaN(pageNum) && pageNum > 0) {
          this.currentPage.set(pageNum);
        }
      }
    });

    this.loadCategories();
    this.loadProducts(this.currentPage(), this.selectedCategory());
  }

  loadCategories(): void {
    this.productService.getCategories(20).subscribe({
      next: (res) => {
        this.categories.set(res.data || []);
      },
      error: () => {},
    });
  }

  loadProducts(page = this.currentPage(), categoryId = this.selectedCategory()): void {
    this.isLoading.set(true);
    this.productService.getProducts(this.limit(), page, categoryId || undefined).subscribe({
      next: (res) => {
        this.products.set(res.data || []);
        if (res.metadata) {
          this.currentPage.set(res.metadata.currentPage || page);
          this.numberOfPages.set(res.metadata.numberOfPages || 1);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  selectCategory(categoryId: string | null): void {
    this.selectedCategory.set(categoryId);
    this.currentPage.set(1);
    this.loadProducts(1, categoryId);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.numberOfPages() || page === this.currentPage()) {
      return;
    }
    this.currentPage.set(page);
    this.loadProducts(page, this.selectedCategory());
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        // Safe fallback for environments lacking smooth scrolling
      }
    }
  }

  resetSearch(): void {
    this.searchTerm.set('');
  }
}
