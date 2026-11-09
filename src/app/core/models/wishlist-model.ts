import { Product } from './product-model';

export interface WishlistResponse {
  status: string;
  count?: number;
  message?: string;
  data: Product[];
}

export interface WishlistActionResponse {
  status: string;
  message: string;
  data: string[]; // List of product IDs in wishlist
}
