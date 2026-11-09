import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Product } from '../../core/models/product-model';
import { CartService } from '../../core/services/cart.service';
import { ProductService } from '../../core/services/product.service';
import { WishlistService } from '../../core/services/wishlist.service';

@Component({
  selector: 'app-product-details',
  imports: [RouterLink],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  readonly cartService = inject(CartService);
  readonly wishlistService = inject(WishlistService);

  readonly product = signal<Product | null>(null);
  readonly selectedImage = signal<string>('');
  readonly quantity = signal<number>(1);
  readonly isLoading = signal<boolean>(true);
  readonly isAddingToCart = signal<boolean>(false);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.loadProduct(id);
      }
    });
  }

  loadProduct(id: string): void {
    this.isLoading.set(true);
    this.productService.getProductById(id).subscribe({
      next: (res) => {
        this.product.set(res.data);
        this.selectedImage.set(res.data.imageCover || res.data.images?.[0] || '');
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  setImage(image: string): void {
    this.selectedImage.set(image);
  }

  incrementQuantity(): void {
    this.quantity.update((q) => q + 1);
  }

  decrementQuantity(): void {
    this.quantity.update((q) => Math.max(1, q - 1));
  }

  addToCart(): void {
    const p = this.product();
    if (!p || this.isAddingToCart()) return;

    this.isAddingToCart.set(true);
    const qty = this.quantity();

    this.cartService
      .addProductToCart(p._id)
      .pipe(
        finalize(() => {
          if (qty <= 1) {
            this.isAddingToCart.set(false);
          }
        })
      )
      .subscribe({
        next: () => {
          if (qty > 1) {
            this.cartService
              .updateProductQuantity(p._id, qty)
              .pipe(
                finalize(() => {
                  this.isAddingToCart.set(false);
                })
              )
              .subscribe({
                next: () => {},
                error: () => {},
              });
          }
        },
        error: () => {
          this.isAddingToCart.set(false);
        },
      });
  }

  toggleWishlist(): void {
    const p = this.product();
    if (!p) return;
    this.wishlistService.toggleWishlist(p._id);
  }
}
