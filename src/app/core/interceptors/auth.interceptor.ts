import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (typeof localStorage !== 'undefined') {
    const token = localStorage.getItem('userToken');
    if (token) {
      req = req.clone({
        setHeaders: {
          token: token,
        },
      });
    }
  }
  return next(req);
};
