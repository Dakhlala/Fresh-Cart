import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Category, SubCategory } from '../../core/models/product-model';
import { ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-categories',
  imports: [RouterLink],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class Categories implements OnInit {
  private readonly productService = inject(ProductService);

  readonly categories = signal<Category[]>([]);
  readonly selectedCategory = signal<Category | null>(null);
  readonly subCategories = signal<SubCategory[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly isLoadingSubs = signal<boolean>(false);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.selectedCategory()) {
      this.closeSubCategories();
    }
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading.set(true);
    this.productService.getCategories(30).subscribe({
      next: (res) => {
        this.categories.set(res.data || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  selectCategory(category: Category): void {
    this.selectedCategory.set(category);
    this.isLoadingSubs.set(true);
    this.productService.getSubCategoriesOnCategory(category._id).subscribe({
      next: (res) => {
        this.subCategories.set(res.data || []);
        this.isLoadingSubs.set(false);
      },
      error: () => {
        this.subCategories.set([]);
        this.isLoadingSubs.set(false);
      },
    });
  }

  closeSubCategories(): void {
    this.selectedCategory.set(null);
    this.subCategories.set([]);
  }
}
