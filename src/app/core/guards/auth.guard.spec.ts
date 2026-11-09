import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let router: Router;
  let authService: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideRouter([])],
    });
    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthService);
    vi.spyOn(router, 'navigate');
  });

  it('should allow access when user is authenticated', () => {
    authService.userToken.set('valid-token');
    const route = {} as ActivatedRouteSnapshot;
    const state = { url: '/cart' } as RouterStateSnapshot;

    const result = TestBed.runInInjectionContext(() => authGuard(route, state));
    expect(result).toBe(true);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to /login with returnUrl when user is not authenticated', () => {
    authService.userToken.set(null);
    const route = {} as ActivatedRouteSnapshot;
    const state = { url: '/cart' } as RouterStateSnapshot;

    const result = TestBed.runInInjectionContext(() => authGuard(route, state));
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/cart' } });
  });
});
