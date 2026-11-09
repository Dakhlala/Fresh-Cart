import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { Navbar } from './navbar';
import { CartService } from '../../../core/services/cart.service';
import { WishlistService } from '../../../core/services/wishlist.service';

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;
  let cartService: CartService;
  let wishlistService: WishlistService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
    cartService = TestBed.inject(CartService);
    wishlistService = TestBed.inject(WishlistService);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render brand logo and main navigation links', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('FreshCart');
    expect(compiled.textContent).toContain('Home');
    expect(compiled.textContent).toContain('Cart');
    expect(compiled.textContent).toContain('Wishlist');
    expect(compiled.textContent).toContain('Products');
    expect(compiled.textContent).toContain('Categories');
    expect(compiled.textContent).toContain('Brands');
  });

  it('should render 6 social media icons', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.fa-instagram')).toBeTruthy();
    expect(compiled.querySelector('.fa-facebook')).toBeTruthy();
    expect(compiled.querySelector('.fa-tiktok')).toBeTruthy();
    expect(compiled.querySelector('.fa-x-twitter')).toBeTruthy();
    expect(compiled.querySelector('.fa-linkedin')).toBeTruthy();
    expect(compiled.querySelector('.fa-youtube')).toBeTruthy();
  });

  it('should display cart badge reactively when items exist', () => {
    cartService.numOfCartItems.set(3);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('3');
  });

  it('should display wishlist badge reactively when items exist', () => {
    wishlistService.wishlistIds.set(['p1', 'p2']);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('2');
  });
});
