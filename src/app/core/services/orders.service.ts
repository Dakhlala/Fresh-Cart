import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CashOrderResponse,
  Order,
  ShippingAddress,
  StripeSessionResponse,
} from '../models/order-model';

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.baseUrl}/api/v1/orders`;

  // --- Angular v21 Zoneless Reactive Signals ---
  readonly orders = signal<Order[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  /**
   * Create a Cash on Delivery order from active cart.
   * Route Misr clears the user's cart upon creation.
   */
  createCashOrder(cartId: string, shippingAddress: ShippingAddress): Observable<CashOrderResponse> {
    return this.http.post<CashOrderResponse>(`${this.baseUrl}/${cartId}`, { shippingAddress });
  }

  /**
   * Initialize a Stripe checkout session for online credit card payment.
   */
  createCheckoutSession(
    cartId: string,
    shippingAddress: ShippingAddress,
    returnUrl: string = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4200'
  ): Observable<StripeSessionResponse> {
    const encodedUrl = encodeURIComponent(returnUrl);
    return this.http.post<StripeSessionResponse>(
      `${this.baseUrl}/checkout-session/${cartId}?url=${encodedUrl}`,
      { shippingAddress }
    );
  }

  /**
   * Alias for createCheckoutSession to support existing component callers.
   */
  checkoutSession(
    cartId: string,
    shippingAddress: ShippingAddress,
    returnUrl?: string
  ): Observable<StripeSessionResponse> {
    return this.createCheckoutSession(cartId, shippingAddress, returnUrl);
  }

  /**
   * Fetch order history for a given user ID.
   * Route Misr returns a direct JSON array of Order objects.
   */
  getUserOrders(userId: string): Observable<Order[]> {
    this.isLoading.set(true);
    this.error.set(null);
    return this.http.get<Order[]>(`${this.baseUrl}/user/${userId}`).pipe(
      tap({
        next: (orders) => {
          this.orders.set(orders || []);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Failed to load user orders');
          this.isLoading.set(false);
        },
      })
    );
  }
}

/** Export backward-compatible alias */
export { OrdersService as OrderService };
