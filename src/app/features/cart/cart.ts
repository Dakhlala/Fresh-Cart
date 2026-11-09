import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CartService } from '../../core/services/cart.service';
import { CartProductItem } from '../../core/models/cart-model';

@Component({
  selector: 'app-cart',
  imports: [RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart implements OnInit {
  readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  // In-flight tracking signals for granular UI responsiveness
  readonly isInitialLoading = signal<boolean>(true);
  readonly updatingItemId = signal<string | null>(null);
  readonly isClearing = signal<boolean>(false);

  // Normalized cart data signal satisfying both cartData()?.products and cartData()?.data?.products
  readonly cartData = computed(() => {
    const rawData = this.cartService.cartData();
    if (!rawData) return null;
    return {
      ...rawData,
      data: rawData.data ?? rawData,
      products: rawData.data?.products ?? (rawData as any).products ?? [],
      totalCartPrice: rawData.data?.totalCartPrice ?? (rawData as any).totalCartPrice ?? 0,
    };
  });

  readonly products = computed<CartProductItem[]>(() => {
    return this.cartService.cartProducts();
  });

  readonly numOfCartItems = computed<number>(() => this.cartService.numOfCartItems());

  readonly totalCartPrice = computed<number>(() => this.cartService.totalCartPrice());

  readonly cartId = computed<string>(() => {
    return this.cartService.cartId() ?? this.cartService.cartData()?.data?._id ?? '';
  });

  readonly isCartEmpty = computed<boolean>(() => {
    return this.numOfCartItems() === 0 || this.cartService.isCartEmpty() || this.products().length === 0;
  });

  ngOnInit(): void {
    this.fetchCart();
  }

  fetchCart(): void {
    this.isInitialLoading.set(true);
    this.cartService
      .getLoggedUserCart()
      .pipe(finalize(() => this.isInitialLoading.set(false)))
      .subscribe({
        error: () => {},
      });
  }

  /**
   * Interactive Stepper: Decrement handler.
   * When current count is 1, dispatches removeItem(productId).
   * Otherwise, dispatches updateQuantity(productId, currentCount - 1).
   */
  decrementQuantity(productId: string, currentCount: number): void {
    if (this.updatingItemId() || this.isClearing()) return;

    if (currentCount <= 1) {
      this.removeItem(productId);
    } else {
      this.updateQuantity(productId, currentCount - 1);
    }
  }

  /**
   * Interactive Stepper: Increment handler.
   * Calls updateQuantity(productId, count + 1).
   */
  incrementQuantity(productId: string, currentCount: number): void {
    if (this.updatingItemId() || this.isClearing()) return;
    this.updateQuantity(productId, currentCount + 1);
  }

  updateQuantity(productId: string, newCount: number): void {
    if (newCount <= 0) {
      this.removeItem(productId);
      return;
    }

    this.updatingItemId.set(productId);

    this.cartService
      .updateCartProductQuantity(productId, newCount)
      .pipe(finalize(() => this.updatingItemId.set(null)))
      .subscribe({
        error: () => {},
      });
  }

  removeItem(productId: string): void {
    this.updatingItemId.set(productId);

    this.cartService
      .removeSpecificCartItem(productId)
      .pipe(finalize(() => this.updatingItemId.set(null)))
      .subscribe({
        error: () => {},
      });
  }

  clearCart(): void {
    if (this.isClearing() || this.isCartEmpty()) return;

    const confirmed = typeof window !== 'undefined'
      ? window.confirm('Are you sure you want to clear your cart? All items will be removed.')
      : true;
    if (!confirmed) return;

    this.isClearing.set(true);

    this.cartService
      .clearCart()
      .pipe(finalize(() => this.isClearing.set(false)))
      .subscribe({
        error: () => {},
      });
  }

  isItemUpdating(productId: string): boolean {
    return this.updatingItemId() === productId || this.isClearing();
  }

  proceedToCheckout(): void {
    const id = this.cartId();
    if (id) {
      this.router.navigate(['/checkout', id]);
    } else {
      this.router.navigate(['/checkout']);
    }
  }
}
