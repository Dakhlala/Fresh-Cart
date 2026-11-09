export interface Category {
  _id: string;
  name: string;
  slug: string;
  image: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubCategory {
  _id: string;
  name: string;
  slug: string;
  category: string;
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
  _id: string;
  id?: string;
  title: string;
  slug?: string;
  description: string;
  quantity: number;
  price: number;
  priceAfterDiscount?: number;
  imageCover: string;
  images: string[];
  category: Category;
  subcategories?: SubCategory[];
  brand?: Brand;
  ratingsAverage: number;
  ratingsQuantity: number;
  sold?: number;
}

export interface PaginationMetadata {
  currentPage: number;
  numberOfPages: number;
  limit: number;
  nextPage?: number;
}

export interface ProductsResponse {
  results: number;
  metadata?: PaginationMetadata;
  data: Product[];
}

export interface SingleProductResponse {
  data: Product;
}

export interface CategoriesResponse {
  results: number;
  metadata?: PaginationMetadata;
  data: Category[];
}

export interface SingleCategoryResponse {
  data: Category;
}

export interface SubCategoriesResponse {
  results: number;
  metadata?: PaginationMetadata;
  data: SubCategory[];
}

export interface BrandsResponse {
  results: number;
  metadata?: PaginationMetadata;
  data: Brand[];
}

export interface SingleBrandResponse {
  data: Brand;
}
