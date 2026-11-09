import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Product } from '../../../core/models/product-model';
import { CartService } from '../../../core/services/cart.service';
import { WishlistService } from '../../../core/services/wishlist.service';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
})
export class ProductCardComponent {
  private readonly cartService = inject(CartService);
  private readonly wishlistService = inject(WishlistService);

  readonly product = input.required<Product>();
  readonly isAddingToCart = signal<boolean>(false);

  readonly isInWishlist = computed(() => {
    const prod = this.product();
    const id = prod?._id || prod?.id || '';
    return this.wishlistService.wishlistIds().includes(id);
  });

  toggleWishlist(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    const prod = this.product();
    const id = prod?._id || prod?.id || '';
    if (id) {
      this.wishlistService.toggleWishlist(id);
    }
  }

  addToCart(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    const prod = this.product();
    const id = prod?._id || prod?.id || '';
    if (!id || this.isAddingToCart()) {
      return;
    }

    this.isAddingToCart.set(true);

    const cartCall =
      typeof (this.cartService as any).addToCart === 'function'
        ? (this.cartService as any).addToCart(id)
        : this.cartService.addProductToCart(id);

    cartCall
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
}
