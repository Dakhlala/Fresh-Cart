import { Product } from './product-model';

export interface CartProductItem {
  _id: string;
  count: number;
  price: number;
  product: Product;
}

export interface CartData {
  _id: string;
  cartOwner: string;
  products: CartProductItem[];
  createdAt?: string;
  updatedAt?: string;
  totalCartPrice: number;
}

export interface CartResponse {
  status: string;
  message?: string;
  numOfCartItems: number;
  cartId?: string;
  data: CartData;
}
