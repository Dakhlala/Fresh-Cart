import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Order } from '../../core/models/order-model';
import { AuthService } from '../../core/services/auth.service';
import { OrdersService } from '../../core/services/orders.service';
import { CartService } from '../../core/services/cart.service';
import { decodeJwt } from '../../core/utils/jwt';

@Component({
  selector: 'app-allorders',
  imports: [RouterLink, DatePipe],
  templateUrl: './allorders.html',
  styleUrl: './allorders.css',
})
export class Allorders implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly orderService = inject(OrdersService);
  private readonly cartService = inject(CartService);

  readonly orders = signal<Order[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  readonly totalOrders = computed(() => this.orders().length);

  ngOnInit(): void {
    // Sync cart state if needed (safe empty handler)
    this.cartService.getLoggedUserCart().subscribe({ error: () => {} });

    // Derive userId reliably from signal, user data, or token fallback
    const userId = this.resolveUserId();
    if (userId) {
      this.loadOrders(userId);
    } else {
      this.isLoading.set(false);
    }
  }

  resolveUserId(): string | null {
    // 1. Try auth.userId computed signal
    const idFromSignal = this.auth.userId?.();
    if (idFromSignal) {
      return idFromSignal;
    }

    // 2. Try auth.userData / currentUser signal
    const user = this.auth.userData?.() || (this.auth as any).currentUser?.();
    if (user?.id) {
      return user.id;
    }

    // 3. Try decoding active token
    const token =
      this.auth.userToken?.() ||
      (typeof localStorage !== 'undefined' ? localStorage.getItem('userToken') : null);
    if (token) {
      const decoded = decodeJwt(token);
      if (decoded?.id) {
        return decoded.id;
      }
    }

    return null;
  }

  loadOrders(userId: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.orderService.getUserOrders(userId).subscribe({
      next: (data: Order[]) => {
        const sorted = (data || []).slice().sort(
          (a: Order, b: Order) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.orders.set(sorted);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(
          err?.error?.message || 'Failed to load order history. Please try again.'
        );
        this.isLoading.set(false);
      },
    });
  }
}
