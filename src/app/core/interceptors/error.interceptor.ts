import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 0) {
        errorMessage = 'Network connection failed. Please check your internet connection.';
      } else if (error.status === 401) {
        errorMessage = error.error?.message || 'Unauthorized access. Please sign in again.';
      } else if (error.status === 404) {
        errorMessage = error.error?.message || 'Requested resource not found.';
      }

      // We do not toast if it's an expected check (e.g. initial cart fetch when empty)
      const isCartNotFound = req.url.includes('/api/v1/cart') && error.status === 404;
      if (!isCartNotFound) {
        toastService.error(errorMessage);
      }

      return throwError(() => error);
    })
  );
};
