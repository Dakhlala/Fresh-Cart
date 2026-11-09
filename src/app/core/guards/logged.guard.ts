import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const loggedGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = inject(AuthService);

  const hasToken =
    auth.isAuthenticated() ||
    (typeof localStorage !== 'undefined' && !!localStorage.getItem('userToken'));

  if (hasToken) {
    router.navigate(['/home']);
    return false;
  }

  return true;
};
