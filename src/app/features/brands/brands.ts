import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Brand, BrandsResponse } from '../../core/models/product-model';
import { ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-brands',
  imports: [RouterLink],
  templateUrl: './brands.html',
  styleUrl: './brands.css',
})
export class Brands implements OnInit {
  private readonly productService = inject(ProductService);

  readonly brands = signal<Brand[]>([]);
  readonly selectedBrand = signal<Brand | null>(null);
  readonly isLoading = signal<boolean>(true);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.selectedBrand()) {
      this.closeBrandModal();
    }
  }

  ngOnInit(): void {
    this.loadBrands();
  }

  loadBrands(): void {
    this.isLoading.set(true);
    this.productService.getBrands(40).subscribe({
      next: (res: BrandsResponse) => {
        this.brands.set(res.data || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  selectBrand(brand: Brand): void {
    this.selectedBrand.set(brand);
  }

  closeBrandModal(): void {
    this.selectedBrand.set(null);
  }
}
