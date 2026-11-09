import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Category, Product } from '../../core/models/product-model';
import { ProductService } from '../../core/services/product.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card';

@Component({
  selector: 'app-home',
  imports: [RouterLink, FormsModule, ProductCardComponent],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private readonly productService = inject(ProductService);

  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly searchTerm = signal<string>('');

  readonly filteredProducts = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const list = this.products();
    if (!term) return list;
    return list.filter((p) => p.title.toLowerCase().includes(term));
  });

  readonly currentSlide = signal<number>(0);
  readonly slides = [
    {
      badge: '20% Off Your First Order',
      title: 'Fresh Products Delivered to Your Door',
      description:
        'Farm-fresh organic produce, premium pantry groceries, and dairy delivered in 30 minutes.',
      image:
        'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
    },
    {
      badge: 'Daily Flash Deal',
      title: 'Healthy Organic Fruits & Vegetables',
      description:
        'Handpicked seasonal fruits, fresh green herbs, and vegetables from local farms.',
      image:
        'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1200&q=80',
    },
    {
      badge: 'Super Market Deals',
      title: 'Snacks, Dairy & Bakery Essentials',
      description:
        'Stock up your kitchen with everyday essentials at the lowest guaranteed market prices.',
      image:
        'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80',
    },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);

    this.productService.getCategories(12).subscribe({
      next: (res) => {
        this.categories.set(res.data || []);
      },
      error: () => {},
    });

    this.productService.getProducts(30).subscribe({
      next: (res) => {
        this.products.set(res.data || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  prevSlide(): void {
    this.currentSlide.update((prev) =>
      prev === 0 ? this.slides.length - 1 : prev - 1
    );
  }

  nextSlide(): void {
    this.currentSlide.update((prev) =>
      prev === this.slides.length - 1 ? 0 : prev + 1
    );
  }

  scrollCategories(direction: 'left' | 'right'): void {
    const container = document.getElementById('categories-slider');
    if (container) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }

  resetSearch(): void {
    this.searchTerm.set('');
  }
}
