import { Routes } from '@angular/router';
import { MainLayout } from './layouts/main-layout/main-layout';
import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { authGuard } from './core/guards/auth.guard';
import { loggedGuard } from './core/guards/logged.guard';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'home',
        loadComponent: () =>
          import('./features/home/home').then((m) => m.Home),
        title: 'FreshCart - Fresh Products Delivered to Your Door',
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/products').then((m) => m.Products),
        title: 'All Products - FreshCart',
      },
      {
        path: 'products/:id',
        loadComponent: () =>
          import('./features/product-details/product-details').then(
            (m) => m.ProductDetails
          ),
        title: 'Product Details - FreshCart',
      },
      {
        path: 'details/:id',
        loadComponent: () =>
          import('./features/product-details/product-details').then(
            (m) => m.ProductDetails
          ),
        title: 'Product Details - FreshCart',
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/categories/categories').then((m) => m.Categories),
        title: 'Categories - FreshCart',
      },
      {
        path: 'brands',
        loadComponent: () =>
          import('./features/brands/brands').then((m) => m.Brands),
        title: 'Top Brands - FreshCart',
      },
      {
        path: 'cart',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/cart/cart').then((m) => m.Cart),
        title: 'Shopping Cart - FreshCart',
      },
      {
        path: 'wishlist',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/wishlist/wishlist').then((m) => m.Wishlist),
        title: 'My Wishlist - FreshCart',
      },
      {
        path: 'checkout',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/checkout/checkout').then((m) => m.Checkout),
        title: 'Checkout - FreshCart',
      },
      {
        path: 'checkout/:cartId',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/checkout/checkout').then((m) => m.Checkout),
        title: 'Checkout - FreshCart',
      },
      {
        path: 'allorders',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/allorders/allorders').then((m) => m.Allorders),
        title: 'My Orders - FreshCart',
      },
    ],
  },
  {
    path: '',
    component: AuthLayout,
    children: [
      {
        path: 'login',
        canActivate: [loggedGuard],
        loadComponent: () =>
          import('./features/auth/login/login').then((m) => m.Login),
        title: 'Sign In - FreshCart',
      },
      {
        path: 'register',
        canActivate: [loggedGuard],
        loadComponent: () =>
          import('./features/auth/register/register').then((m) => m.Register),
        title: 'Create an Account - FreshCart',
      },
      {
        path: 'signup',
        redirectTo: 'register',
        pathMatch: 'full',
      },
      {
        path: 'forgot-password',
        canActivate: [loggedGuard],
        loadComponent: () =>
          import('./features/auth/forgot-password/forgot-password').then(
            (m) => m.ForgotPassword
          ),
        title: 'Forgot Password - FreshCart',
      },
      {
        path: 'forget-password',
        redirectTo: 'forgot-password',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
