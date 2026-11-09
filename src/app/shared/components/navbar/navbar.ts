import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { CartService } from '../../../core/services/cart.service';
import { WishlistService } from '../../../core/services/wishlist.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  readonly auth = inject(Auth);
  readonly cartService = inject(CartService);
  readonly wishlistService = inject(WishlistService);
  private readonly router = inject(Router);

  // Reactive computed signals
  readonly cartCount = computed(() => this.cartService.numOfCartItems());
  readonly wishlistCount = computed(() => this.wishlistService.wishlistIds().length);
  readonly isLoggedIn = computed(() => this.auth.isLoggedIn());

  onSearch(event: Event, inputVal: string): void {
    event.preventDefault();
    if (inputVal && inputVal.trim()) {
      this.router.navigate(['/products'], { queryParams: { q: inputVal.trim() } });
    } else {
      this.router.navigate(['/products']);
    }
  }

  logout(): void {
    this.auth.logout();
  }
}
