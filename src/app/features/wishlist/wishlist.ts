import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { CartService } from '../../core/services/cart.service';
import { WishlistService } from '../../core/services/wishlist.service';

@Component({
  selector: 'app-wishlist',
  imports: [RouterLink],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.css',
})
export class Wishlist implements OnInit {
  readonly wishlistService = inject(WishlistService);
  readonly cartService = inject(CartService);

  // In-flight tracking sets for per-item loading states
  readonly movingProductIds = signal<Set<string>>(new Set<string>());
  readonly removingProductIds = signal<Set<string>>(new Set<string>());

  ngOnInit(): void {
    this.wishlistService.getLoggedUserWishlist().subscribe({
      error: () => {},
    });
  }

  isMoving(productId: string): boolean {
    return this.movingProductIds().has(productId);
  }

  isRemoving(productId: string): boolean {
    return this.removingProductIds().has(productId);
  }

  /**
   * Orchestrates the "Move to Cart" workflow:
   * 1. Adds product to Cart via CartService.addToCart(productId)
   * 2. Removes product from Wishlist via WishlistService.removeProductFromWishlist(productId)
   * 3. Reactively updates both Navbar badges (cartCount increments, wishlistCount decrements)
   */
  moveToCart(productId: string): void {
    if (this.isMoving(productId)) return;

    this.movingProductIds.update((set) => {
      const next = new Set(set);
      next.add(productId);
      return next;
    });

    const addCall$ = typeof (this.cartService as any).addToCart === 'function'
      ? (this.cartService as any).addToCart(productId)
      : this.cartService.addProductToCart(productId);

    addCall$
      .pipe(
        switchMap(() => this.wishlistService.removeProductFromWishlist(productId)),
        finalize(() => {
          this.movingProductIds.update((set) => {
            const next = new Set(set);
            next.delete(productId);
            return next;
          });
        })
      )
      .subscribe({
        next: () => {},
        error: () => {},
      });
  }

  // Alias for backward compatibility
  addToCart(productId: string): void {
    this.moveToCart(productId);
  }

  removeItem(productId: string): void {
    if (this.isRemoving(productId)) return;

    this.removingProductIds.update((set) => {
      const next = new Set(set);
      next.add(productId);
      return next;
    });

    this.wishlistService
      .removeProductFromWishlist(productId)
      .pipe(
        finalize(() => {
          this.removingProductIds.update((set) => {
            const next = new Set(set);
            next.delete(productId);
            return next;
          });
        })
      )
      .subscribe({
        error: () => {},
      });
  }
}
