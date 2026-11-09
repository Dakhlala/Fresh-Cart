# FreshCart E-Commerce Platform

A production-grade, pixel-accurate e-commerce web application engineered with **Angular v21 (Zoneless Change Detection & Signals)**, **Tailwind CSS**, and **FontAwesome 6**, integrated with the **Route Misr E-Commerce REST API**.

[![Angular](https://img.shields.io/badge/Angular-21.2-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Zoneless](https://img.shields.io/badge/Architecture-Zoneless%20Signals-0aad0a?style=for-the-badge)](https://angular.dev/guide/experimental/zoneless)

---

## 👤 Author & Developer

**Karam Ahmed Dakhlalah**  
*Junior Frontend Engineer*

- **LinkedIn:** [linkedin.com/in/dakhlala](https://www.linkedin.com/in/dakhlala/)  
- **GitHub:** [github.com/Dakhlala](https://github.com/Dakhlala)  
- **Email:** [karamhagag5@gmail.com](mailto:karamhagag5@gmail.com)

---

## 🌟 Live Demo & Reference Parity

- **Reference Application:** [FreshCart Route E-Commerce](https://freshcart-route.vercel.app/products)
- **Backend API:** [Route Misr E-Commerce REST API](https://ecommerce.routemisr.com) (v1 & modern v2 endpoints)

---

## 🚀 Key Highlights & Architectural Strengths

### 1. Modern Angular v21 Zoneless Architecture
- **No Zone.js Overhead:** Configured with `provideZonelessChangeDetection()` in `app.config.ts`, unlocking microtask-based scheduling, peak runtime performance, and minimal bundle size.
- **100% Standalone Components:** Modern component design leveraging modern input/output signals (`input()`, `output()`, `model()`).
- **Native Control Flow:** Zero legacy directives (`*ngIf`, `*ngFor`). Fully driven by native `@if`, `@for`, `@empty`, and `@defer` syntax.
- **Pure Signal State Management:** State is centralized in reactive Signal stores (`signal()`, `computed()`) across Authentication, Cart, Wishlist, and Search Filters.

### 2. Robust Security & Functional HTTP Interceptors
- **`authInterceptor`:** Automatically attaches authentication token `{ token: userToken }` to all outgoing protected API requests.
- **`loadingInterceptor`:** Manages a reactive global progress bar and spinner state across in-flight HTTP calls.
- **`errorInterceptor`:** Centralizes HTTP error handling, transforming backend errors into user-friendly notifications via `ToastService`.
- **Functional Route Guards:**
  - `authGuard`: Enforces authentication on private routes (`/cart`, `/checkout`, `/allorders`, `/wishlist`) with automatic return URL preservation (`/login?returnUrl=...`).
  - `loggedGuard`: Prevents authenticated users from accessing login or registration pages, redirecting them to `/home`.

---

## 🛍️ Feature Breakdown

### 🔐 Authentication & Profile (`/login`, `/register`, `/forgot-password`)
- **Signup Form:** Multi-field validation including Egyptian mobile number verification (`^01[0125]\d{8}$`), password regex requiring uppercase initial + 5–20 alphanumeric chars, dynamic 3-tier password strength bar, and matching confirm password cross-validator.
- **Sign In:** Email format verification, eye toggle for password visibility, and remember-me checkbox.
- **Password Recovery:** 3-step reactive wizard (Submit Email $\to$ Verify 6-digit Code $\to$ Reset Password).
- **Social Login Options:** Google & Facebook branded action buttons matching the live FreshCart design.

### 📦 Catalog, Search & Filtering (`/home`, `/products`, `/categories`, `/brands`)
- **Interactive Home View:** Dynamic banner slider, animated category carousel, and popular products grid.
- **Product Card (`ProductCardComponent`):**
  - Hover zoom effect with primary green border transition (`#0aad0a`).
  - Slide-up full-width "Add to Cart" button with in-flight spinner.
  - Interactive Wishlist heart button with instant $O(1)$ toggling.
  - Star ratings (`#ffc908`) and discount pricing badges.
- **Real-Time Search:** Instant client-side search pipe bound to a reactive signal for zero-latency keystroke filtering.
- **Modal Previews:** Detailed subcategory inspection modal on Categories, and brand detail modal on Brands.
- **Product Details (`/details/:id`):** Multi-thumbnail image switcher gallery, quantity stepper controls, and stock indicators.

### 🛒 Cart & Wishlist State (`/cart`, `/wishlist`)
- **Live Navbar Badges:** Real-time synchronized cart count (`numOfCartItems`) and wishlist count.
- **Cart Management:** Quantity increment/decrement steppers, item removal with slide-out animation, complete cart clearing, and dynamic total price recalculation.
- **Wishlist to Cart:** Atomic "Move to Cart" operation transferring items from wishlist to cart with immediate badge synchronization.
- **Modern API v2 Support:** Seamless fallback and support for Route API `v2` cart operations (`/api/v2/cart`).

### 💳 Checkout & Order History (`/checkout/:cartId`, `/allorders`)
- **Shipping Address Form:** Validates street details, city, and phone number against Egyptian carrier patterns.
- **Payment Method Selection:**
  - **Cash on Delivery:** Direct order placement via `POST /api/v2/orders/:cartId` with instant cart reset.
  - **Online Payment:** Secure checkout session initiation (`POST /api/v1/orders/checkout-session/:cartId`) redirecting to Stripe payment gateway.
- **Orders History (`/allorders`):** Comprehensive purchase history cards with thumbnails, status pills (Paid / Cash / Delivered), date formatting, and order total breakdowns.

---

## 📐 Design System & UI Specifications

| Token | Value | Purpose |
| :--- | :--- | :--- |
| **Primary Green** | `#0aad0a` | Primary CTA buttons, brand badges, active links, hover borders |
| **Primary Dark Green** | `#088a08` | Button hover and focus states |
| **Surface Background** | `#f0f3f2` | Navbar, footer, and subtle card surfaces |
| **Star Rating Gold** | `#ffc908` | Rating stars on product cards and reviews |
| **Font Family** | `'Encode Sans Expanded', sans-serif` | Clean, modern e-commerce typography |

---

## 🛠️ Project Structure

```
FreshCart/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── guards/          # authGuard, loggedGuard
│   │   │   ├── interceptors/    # authInterceptor, loadingInterceptor, errorInterceptor
│   │   │   ├── models/          # api-contracts.ts, auth, product, cart, order models
│   │   │   ├── services/        # AuthService, CartService, WishlistService, OrdersService, ToastService
│   │   │   └── utils/           # JWT decoding & token validation utilities
│   │   ├── features/
│   │   │   ├── auth/            # Login, Register, Forgot Password
│   │   │   ├── home/            # Hero slider, category carousel, popular products
│   │   │   ├── products/        # Product catalog & search filtering
│   │   │   ├── product-details/ # Image gallery switcher & stepper
│   │   │   ├── categories/      # Categories grid with subcategories modal
│   │   │   ├── brands/          # Brands grid with details modal
│   │   │   ├── cart/            # Cart management & summary
│   │   │   ├── wishlist/        # Wishlist grid & Move to Cart action
│   │   │   ├── checkout/        # Shipping address form (Cash & Stripe)
│   │   │   └── allorders/       # User order history dashboard
│   │   ├── layouts/
│   │   │   ├── main-layout/     # Navbar, router-outlet, Footer
│   │   │   └── auth-layout/     # Clean auth shell
│   │   └── shared/
│   │       ├── components/      # ProductCard, Navbar, Footer, Toast, LoadingSpinner
│   │       └── pipes/           # SearchPipe
│   ├── environments/            # API base URL configuration
│   └── styles.css               # Global Tailwind CSS & custom design tokens
├── angular.json                 # Angular workspace configuration
├── package.json                 # Project dependencies & scripts
└── README.md                    # Project documentation
```

---

## 💻 Getting Started Locally

### Prerequisites
- **Node.js:** v18.x or v20.x+
- **npm:** v9.x+
- **Angular CLI:** v21.x (`npm install -g @angular/cli`)

### Installation & Run
```bash
# 1. Clone repository
git clone https://github.com/Dakhlala/FreshCart.git
cd FreshCart

# 2. Install dependencies
npm install

# 3. Start development server
ng serve

# 4. Open browser
Navigate to http://localhost:4200/
```

### Production Build
```bash
npm run build
```
Build output is optimized and emitted to `dist/E-commerce`.

---

## 📄 License
This project was developed by [Karam Ahmed Dakhlalah](https://www.linkedin.com/in/dakhlala/) as a showcase of modern Angular and enterprise frontend architecture. All rights reserved.
