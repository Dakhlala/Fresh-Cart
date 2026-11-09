// src/app/core/models/api-contracts.ts

// ============================================================================
// 1. BASE URL & ENDPOINT CONSTANTS
// ============================================================================
export const API_BASE_URL = 'https://ecommerce.routemisr.com';

export const API_ENDPOINTS = {
  AUTH: {
    SIGNUP: `${API_BASE_URL}/api/v1/auth/signup`,
    SIGNIN: `${API_BASE_URL}/api/v1/auth/signin`,
    FORGOT_PASSWORD: `${API_BASE_URL}/api/v1/auth/forgotPasswords`,
    VERIFY_RESET_CODE: `${API_BASE_URL}/api/v1/auth/verifyResetCode`,
    RESET_PASSWORD: `${API_BASE_URL}/api/v1/auth/resetPassword`,
    VERIFY_TOKEN: `${API_BASE_URL}/api/v1/auth/verifyToken`,
  },
  PRODUCTS: {
    ALL: `${API_BASE_URL}/api/v1/products`,
    BY_ID: (id: string) => `${API_BASE_URL}/api/v1/products/${id}`,
  },
  CATEGORIES: {
    ALL: `${API_BASE_URL}/api/v1/categories`,
    BY_ID: (id: string) => `${API_BASE_URL}/api/v1/categories/${id}`,
    SUBCATEGORIES_ON_CATEGORY: (id: string) =>
      `${API_BASE_URL}/api/v1/categories/${id}/subcategories`,
  },
  SUBCATEGORIES: {
    ALL: `${API_BASE_URL}/api/v1/subcategories`,
    BY_ID: (id: string) => `${API_BASE_URL}/api/v1/subcategories/${id}`,
  },
  BRANDS: {
    ALL: `${API_BASE_URL}/api/v1/brands`,
    BY_ID: (id: string) => `${API_BASE_URL}/api/v1/brands/${id}`,
  },
  CART: {
    // Note: Postman documentation features v2 for cart operations
    BASE: `${API_BASE_URL}/api/v2/cart`,
    ITEM: (productId: string) => `${API_BASE_URL}/api/v2/cart/${productId}`,
    APPLY_COUPON: `${API_BASE_URL}/api/v2/cart/applyCoupon`,
  },
  WISHLIST: {
    BASE: `${API_BASE_URL}/api/v1/wishlist`,
    ITEM: (productId: string) => `${API_BASE_URL}/api/v1/wishlist/${productId}`,
  },
  ORDERS: {
    // Note: Postman documentation features v2 for Create Cash Order
    CASH_ORDER: (cartId: string) => `${API_BASE_URL}/api/v2/orders/${cartId}`,
    CHECKOUT_SESSION: (cartId: string, returnUrl = 'http://localhost:4200') =>
      `${API_BASE_URL}/api/v1/orders/checkout-session/${cartId}?url=${returnUrl}`,
    USER_ORDERS: (userId: string) => `${API_BASE_URL}/api/v1/orders/user/${userId}`,
  },
  ADDRESSES: {
    BASE: `${API_BASE_URL}/api/v1/addresses`,
    BY_ID: (addressId: string) => `${API_BASE_URL}/api/v1/addresses/${addressId}`,
  },
} as const;

// ============================================================================
// 2. GENERIC PAGINATED RESPONSE WRAPPER
// ============================================================================
export interface PaginationMetadata {
  currentPage: number;
  numberOfPages: number;
  limit: number;
  nextPage?: number;
  prevPage?: number;
}

export interface PaginatedResponse<T> {
  results: number;
  metadata: PaginationMetadata;
  data: T[];
}

export interface SingleItemResponse<T> {
  data: T;
}

// ============================================================================
// 3. AUTHENTICATION & USER INTERFACES
// ============================================================================
export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  rePassword: string;
  phone: string; // Egyptian phone regex: ^01[0125][0-9]{8}$
}

export interface SigninPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface VerifyResetCodePayload {
  resetCode: string;
}

export interface ResetPasswordPayload {
  email: string;
  newPassword: string;
}

export interface AuthUser {
  name: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  message: string; // Typically "success"
  user: AuthUser;
  token: string;
}

export interface DecodedToken {
  id: string; // CRITICAL: Used for GET /api/v1/orders/user/${id}
  name: string;
  role: string;
  iat: number;
  exp: number;
}

export interface StatusMessageResponse {
  statusMsg?: string;
  status?: string;
  message?: string;
  token?: string; // Returned by PUT /api/v1/auth/resetPassword
}

// ============================================================================
// 4. CATALOG INTERFACES (CATEGORY, SUBCATEGORY, BRAND, PRODUCT)
// ============================================================================
export interface Category {
  _id: string;
  name: string;
  slug: string;
  image: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Subcategory {
  _id: string;
  name: string;
  slug: string;
  category: string; // Category _id
  createdAt?: string;
  updatedAt?: string;
}

export interface Brand {
  _id: string;
  name: string;
  slug: string;
  image: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  sold: number;
  images: string[];
  subcategory: Subcategory[];
  ratingsQuantity: number;
  _id: string;
  title: string;
  slug: string;
  description: string;
  quantity: number;
  price: number;
  priceAfterDiscount?: number;
  imageCover: string;
  category: Category;
  brand: Brand;
  ratingsAverage: number;
  createdAt: string;
  updatedAt: string;
  id: string;
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  sort?: string; // e.g., "-price", "price", "-ratingsAverage"
  keyword?: string;
  'price[gte]'?: number;
  'price[lte]'?: number;
  'category[in]'?: string;
  brand?: string;
}

// ============================================================================
// 5. CART INTERFACES
// ============================================================================
export interface AddToCartPayload {
  productId: string;
}

export interface UpdateCartItemQuantityPayload {
  count: number;
}

/**
 * Note on Route API Cart Items:
 * - GET /api/v1/cart and PUT /api/v1/cart/:id return `product` as a populated `Product` object.
 * - POST /api/v1/cart (Add to Cart) returns `product` as a string ID (`string`).
 */
export interface CartProductItem<TProduct = Product> {
  count: number;
  _id: string;
  product: TProduct;
  price: number;
}

export interface CartData<TProduct = Product> {
  _id: string;
  cartOwner: string;
  products: CartProductItem<TProduct>[];
  createdAt: string;
  updatedAt: string;
  __v: number;
  totalCartPrice: number;
}

export interface CartResponse<TProduct = Product> {
  status: string; // "success"
  message?: string; // Present on POST add to cart: "Product added successfully to your cart"
  numOfCartItems: number;
  cartId: string;
  data: CartData<TProduct>;
}

export interface ClearCartResponse {
  message: string; // "success"
}

// ============================================================================
// 6. WISHLIST INTERFACES
// ============================================================================
export interface AddToWishlistPayload {
  productId: string;
}

/**
 * Returned by POST /api/v1/wishlist and DELETE /api/v1/wishlist/:productId
 * Note: `data` here is an array of Product IDs (strings) currently in the user's wishlist!
 */
export interface WishlistMutationResponse {
  status: string; // "success"
  message: string;
  data: string[]; // Array of product _id strings—bind directly to your Wishlist Signal!
}

/**
 * Returned by GET /api/v1/wishlist
 * Note: `data` here is an array of full populated `Product` objects!
 */
export interface WishlistGetResponse {
  status: string; // "success"
  count: number;
  data: Product[];
}

// ============================================================================
// 7. CHECKOUT & ORDERS INTERFACES
// ============================================================================
export interface ShippingAddress {
  details: string;
  phone: string;
  city: string;
}

export interface OrderRequestPayload {
  shippingAddress: ShippingAddress;
}

export interface StripeCheckoutSessionResponse {
  status: string; // "success"
  session: {
    url: string; // Redirect browser here: window.location.href = res.session.url
    success_url: string;
    cancel_url: string;
  };
}

export interface OrderUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

export interface Order {
  shippingAddress?: ShippingAddress;
  taxPrice: number;
  shippingPrice: number;
  totalOrderPrice: number;
  paymentMethodType: 'card' | 'cash';
  isPaid: boolean;
  isDelivered: boolean;
  _id: string;
  user: OrderUser;
  cartItems: CartProductItem<Product>[];
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  id: number;
}
