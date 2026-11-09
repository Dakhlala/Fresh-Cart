import { Product } from './product-model';

/**
 * Delivery shipping address submitted during checkout.
 */
export interface ShippingAddress {
  details: string;
  phone: string;
  city: string;
  postalCode?: string;
}

/**
 * Individual cart item embedded inside a placed Order entity.
 */
export interface CartItemInOrder {
  _id: string;
  count: number;
  price: number;
  product: Product;
}

/** Backward-compatible alias for existing imports */
export type OrderItem = CartItemInOrder;

/**
 * User summary embedded in an Order entity.
 */
export interface OrderUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

/**
 * Full Order representation returned by Route Misr API.
 */
export interface Order {
  _id: string;
  id?: number;
  user: OrderUser;
  cartItems: CartItemInOrder[];
  shippingAddress?: ShippingAddress;
  taxPrice: number;
  shippingPrice: number;
  totalOrderPrice: number;
  paymentMethodType: 'cash' | 'card';
  isPaid: boolean;
  paidAt?: string;
  isDelivered: boolean;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * API response for POST /api/v1/orders/:cartId (Cash on Delivery).
 */
export interface CashOrderResponse {
  status: string;
  data: Order;
}

/**
 * Stripe checkout session metadata.
 */
export interface StripeSession {
  url: string;
  success_url?: string;
  cancel_url?: string;
}

/**
 * API response for POST /api/v1/orders/checkout-session/:cartId.
 */
export interface StripeSessionResponse {
  status: string;
  session: StripeSession;
}

/** Backward-compatible alias for existing imports */
export type CheckoutSessionResponse = StripeSessionResponse;
