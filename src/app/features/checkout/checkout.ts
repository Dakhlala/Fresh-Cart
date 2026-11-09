import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { OrdersService } from '../../core/services/orders.service';
import { ToastService } from '../../core/services/toast.service';
import { ShippingAddress, StripeSessionResponse } from '../../core/models/order-model';

@Component({
  selector: 'app-checkout',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrdersService);
  private readonly toast = inject(ToastService);
  readonly cartService = inject(CartService);

  // Optional route param bound as signal input
  readonly cartIdInput = input<string>('', { alias: 'cartId' });

  // Payment method selection ('cash' | 'online')
  readonly paymentMethod = signal<'cash' | 'online'>('cash');

  // Independent in-flight loading spinners
  readonly isCashLoading = signal<boolean>(false);
  readonly isOnlineLoading = signal<boolean>(false);
  readonly isAnyLoading = computed(() => this.isCashLoading() || this.isOnlineLoading());

  // Error alert message signal
  readonly errorMessage = signal<string | null>(null);

  // Triple-redundant cartId resolution: input signal -> route param -> cartService fallback
  readonly cartId = computed<string>(() => {
    const fromInput = this.cartIdInput()?.trim();
    if (fromInput) return fromInput;
    const fromRoute = this.route.snapshot.paramMap.get('cartId')?.trim();
    if (fromRoute) return fromRoute;
    return this.cartService.cartId() ?? '';
  });

  // Reactive shipping address form with Egyptian phone validation
  readonly shippingForm = this.fb.group({
    details: ['', [Validators.required, Validators.minLength(3)]],
    phone: ['', [Validators.required, Validators.pattern(/^01[0125][0-9]{8}$/)]],
    city: ['', [Validators.required]],
  });

  // Form control getters for clean template & test bindings
  get detailsControl() {
    return this.shippingForm.get('details');
  }

  get phoneControl() {
    return this.shippingForm.get('phone');
  }

  get cityControl() {
    return this.shippingForm.get('city');
  }

  ngOnInit(): void {
    // If cart data is not loaded yet (e.g. direct URL entry), refresh user cart
    if (!this.cartService.cartData()) {
      this.cartService.getLoggedUserCart().subscribe({
        error: () => {},
      });
    }
  }

  setPaymentMethod(method: 'cash' | 'online'): void {
    this.paymentMethod.set(method);
  }

  /**
   * Flow A: Cash on Delivery payment
   */
  payCash(): void {
    if (this.shippingForm.invalid) {
      this.shippingForm.markAllAsTouched();
      return;
    }

    const id = this.cartId();
    if (!id) {
      this.toast.error('Cart session not found. Please add items to cart first.');
      this.router.navigate(['/cart']);
      return;
    }

    this.isCashLoading.set(true);
    this.errorMessage.set(null);

    const shippingAddress: ShippingAddress = {
      details: this.detailsControl?.value?.trim() ?? '',
      phone: this.phoneControl?.value?.trim() ?? '',
      city: this.cityControl?.value?.trim() ?? '',
    };

    this.orderService.createCashOrder(id, shippingAddress).subscribe({
      next: () => {
        this.isCashLoading.set(false);
        this.cartService.resetCart();
        this.toast.success('Your cash order was placed successfully!');
        this.router.navigate(['/allorders']);
      },
      error: (err) => {
        this.isCashLoading.set(false);
        this.errorMessage.set(
          err.error?.message || 'Failed to place cash order. Please try again.'
        );
      },
    });
  }

  /**
   * Flow B: Online payment via Stripe encrypted checkout session
   */
  payOnline(): void {
    if (this.shippingForm.invalid) {
      this.shippingForm.markAllAsTouched();
      return;
    }

    const id = this.cartId();
    if (!id) {
      this.toast.error('Cart session not found. Please add items to cart first.');
      this.router.navigate(['/cart']);
      return;
    }

    this.isOnlineLoading.set(true);
    this.errorMessage.set(null);

    const shippingAddress: ShippingAddress = {
      details: this.detailsControl?.value?.trim() ?? '',
      phone: this.phoneControl?.value?.trim() ?? '',
      city: this.cityControl?.value?.trim() ?? '',
    };

    const returnUrl =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4200';

    this.orderService.createCheckoutSession(id, shippingAddress, returnUrl).subscribe({
      next: (res: StripeSessionResponse) => {
        this.isOnlineLoading.set(false);
        this.cartService.resetCart();
        if (res?.session?.url) {
          window.location.href = res.session.url;
        } else {
          this.errorMessage.set('Could not initialize Stripe checkout session.');
        }
      },
      error: (err: any) => {
        this.isOnlineLoading.set(false);
        this.errorMessage.set(
          err.error?.message || 'Online payment initialization failed. Please try again.'
        );
      },
    });
  }

  /**
   * Master submit delegating to the currently active payment choice
   */
  onSubmit(): void {
    if (this.paymentMethod() === 'online') {
      this.payOnline();
    } else {
      this.payCash();
    }
  }
}
