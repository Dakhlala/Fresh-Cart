import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product } from '../models/product-model';
import { WishlistActionResponse, WishlistResponse } from '../models/wishlist-model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class WishlistService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly baseUrl = `${environment.baseUrl}/api/v1/wishlist`;

  // Signals (Angular v21 Zoneless State)
  readonly wishlistIds = signal<string[]>([]);
  readonly wishlistProducts = signal<Product[]>([]);
  readonly isLoading = signal<boolean>(false);

  // Computed signal for total count
  readonly wishlistCount = computed<number>(() => this.wishlistIds().length);

  // Backward compatibility alias
  readonly wishlistData = this.wishlistProducts;

  constructor() {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('userToken')) {
      this.getLoggedUserWishlist().subscribe({
        error: () => {},
      });
    }
  }

  getLoggedUserWishlist(): Observable<WishlistResponse> {
    this.isLoading.set(true);
    return this.http.get<WishlistResponse>(this.baseUrl).pipe(
      tap({
        next: (res) => {
          this.isLoading.set(false);
          const products = res.data || [];
          this.wishlistProducts.set(products);
          const ids = products.map((p) => p._id || p.id || '');
          this.wishlistIds.set(ids);
        },
        error: () => {
          this.isLoading.set(false);
        },
      })
    );
  }

  addToWishlist(productId: string): Observable<WishlistActionResponse> {
    return this.http.post<WishlistActionResponse>(this.baseUrl, { productId }).pipe(
      tap((res) => {
        this.wishlistIds.set(res.data || []);
        this.toast.success(res.message || 'Product added successfully to your wishlist');
        this.getLoggedUserWishlist().subscribe({ error: () => {} });
      })
    );
  }

  // Alias for specification compliance
  addProductToWishlist(productId: string): Observable<WishlistActionResponse> {
    return this.addToWishlist(productId);
  }

  removeFromWishlist(productId: string): Observable<WishlistActionResponse> {
    return this.http.delete<WishlistActionResponse>(`${this.baseUrl}/${productId}`).pipe(
      tap((res) => {
        this.wishlistIds.set(res.data || []);
        this.wishlistProducts.update((items) =>
          items.filter((item) => item._id !== productId && item.id !== productId)
        );
        this.toast.info(res.message || 'Product removed successfully from your wishlist');
      })
    );
  }

  // Alias for specification compliance
  removeProductFromWishlist(productId: string): Observable<WishlistActionResponse> {
    return this.removeFromWishlist(productId);
  }

  toggleWishlist(productId: string): void {
    if (this.isInWishlist(productId)) {
      this.removeFromWishlist(productId).subscribe({ error: () => {} });
    } else {
      this.addToWishlist(productId).subscribe({ error: () => {} });
    }
  }

  isInWishlist(productId: string): boolean {
    return this.wishlistIds().includes(productId);
  }

  clearWishlistState(): void {
    this.wishlistIds.set([]);
    this.wishlistProducts.set([]);
    this.isLoading.set(false);
  }
}
