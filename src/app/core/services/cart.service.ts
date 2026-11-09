import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, Observable, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CartResponse } from '../models/cart-model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly baseUrl = `${environment.baseUrl}/api/v1/cart`;

  // Signals (Angular v21 Zoneless State)
  readonly cartId = signal<string | null>(null);
  readonly numOfCartItems = signal<number>(0);
  readonly cartData = signal<CartResponse | null>(null);
  readonly isLoading = signal<boolean>(false);

  // Computed signals
  readonly totalCartPrice = computed(() => this.cartData()?.data?.totalCartPrice ?? 0);
  readonly cartProducts = computed(() => this.cartData()?.data?.products ?? []);
  readonly isCartEmpty = computed(() => (this.cartData()?.data?.products?.length ?? 0) === 0);

  constructor() {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('userToken')) {
      this.getLoggedUserCart().subscribe({
        error: () => {},
      });
    }
  }

  /**
   * Reset all cart signals to initial empty state.
   */
  resetCart(): void {
    this.numOfCartItems.set(0);
    this.cartId.set(null);
    this.cartData.set(null);
  }

  /**
   * Fetch current authenticated user cart.
   * Intercepts 404 gracefully without throwing, resetting signals to empty state.
   */
  getLoggedUserCart(): Observable<CartResponse | null> {
    this.isLoading.set(true);
    return this.http.get<CartResponse>(this.baseUrl).pipe(
      tap((res) => {
        this.isLoading.set(false);
        this.numOfCartItems.set(res?.numOfCartItems ?? 0);
        this.cartId.set(res?.cartId || res?.data?._id || null);
        this.cartData.set(res);
      }),
      catchError((err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.resetCart();
        if (err.status === 404) {
          // Route API responds with 404 "No cart exist" for fresh or emptied users
          return of(null);
        }
        return throwError(() => err);
      })
    );
  }

  /**
   * Add a product to the user shopping cart.
   */
  addProductToCart(productId: string): Observable<CartResponse> {
    return this.http.post<CartResponse>(this.baseUrl, { productId }).pipe(
      tap((res) => {
        this.numOfCartItems.set(res.numOfCartItems ?? 0);
        this.cartId.set(res.cartId || res.data?._id || null);
        this.cartData.set(res);
        this.toast.success(res.message || 'Product added to cart successfully!');
      })
    );
  }

  /**
   * Alias for addProductToCart for ProductCardComponent compatibility.
   */
  addToCart(productId: string): Observable<CartResponse> {
    return this.addProductToCart(productId);
  }

  /**
   * Update item quantity in cart.
   * Auto-delegates count <= 0 to removeProductFromCart.
   */
  updateProductQuantity(productId: string, count: number): Observable<CartResponse> {
    if (count <= 0) {
      return this.removeProductFromCart(productId);
    }
    this.isLoading.set(true);
    return this.http.put<CartResponse>(`${this.baseUrl}/${productId}`, { count }).pipe(
      tap({
        next: (res) => {
          this.isLoading.set(false);
          this.numOfCartItems.set(res.numOfCartItems ?? 0);
          this.cartId.set(res.cartId || res.data?._id || null);
          this.cartData.set(res);
          this.toast.success('Cart updated successfully!');
        },
        error: () => {
          this.isLoading.set(false);
        },
      })
    );
  }

  /**
   * Alias for updateProductQuantity.
   */
  updateCartProductQuantity(productId: string, count: number): Observable<CartResponse> {
    return this.updateProductQuantity(productId, count);
  }

  /**
   * Remove a specific item from cart.
   */
  removeProductFromCart(productId: string): Observable<CartResponse> {
    this.isLoading.set(true);
    return this.http.delete<CartResponse>(`${this.baseUrl}/${productId}`).pipe(
      tap({
        next: (res) => {
          this.isLoading.set(false);
          this.numOfCartItems.set(res.numOfCartItems ?? 0);
          this.cartId.set(res.cartId || res.data?._id || null);
          this.cartData.set(res);
          this.toast.info('Item removed from cart.');
        },
        error: () => {
          this.isLoading.set(false);
        },
      })
    );
  }

  /**
   * Alias for removeProductFromCart.
   */
  removeSpecificCartItem(productId: string): Observable<CartResponse> {
    return this.removeProductFromCart(productId);
  }

  /**
   * Clear the entire user cart.
   */
  clearUserCart(): Observable<any> {
    this.isLoading.set(true);
    return this.http.delete<any>(this.baseUrl).pipe(
      tap({
        next: () => {
          this.isLoading.set(false);
          this.resetCart();
          this.toast.info('Cart cleared.');
        },
        error: () => {
          this.isLoading.set(false);
        },
      })
    );
  }

  /**
   * Alias for clearUserCart.
   */
  clearCart(): Observable<any> {
    return this.clearUserCart();
  }
}
