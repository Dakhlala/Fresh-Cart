import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BrandsResponse,
  CategoriesResponse,
  ProductsResponse,
  SingleBrandResponse,
  SingleCategoryResponse,
  SingleProductResponse,
  SubCategoriesResponse,
} from '../models/product-model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.baseUrl;

  getProducts(limit: number = 40, page: number = 1, categoryId?: string): Observable<ProductsResponse> {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('page', page.toString());
    if (categoryId) {
      params = params.set('category[in]', categoryId);
    }
    return this.http.get<ProductsResponse>(`${this.baseUrl}/api/v1/products`, { params });
  }

  getProductById(id: string): Observable<SingleProductResponse> {
    return this.http.get<SingleProductResponse>(`${this.baseUrl}/api/v1/products/${id}`);
  }

  getCategories(limit: number = 20): Observable<CategoriesResponse> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<CategoriesResponse>(`${this.baseUrl}/api/v1/categories`, { params });
  }

  getCategoryById(id: string): Observable<SingleCategoryResponse> {
    return this.http.get<SingleCategoryResponse>(`${this.baseUrl}/api/v1/categories/${id}`);
  }

  getSubCategoriesOnCategory(categoryId: string): Observable<SubCategoriesResponse> {
    return this.http.get<SubCategoriesResponse>(
      `${this.baseUrl}/api/v1/categories/${categoryId}/subcategories`
    );
  }

  getBrands(limit: number = 30): Observable<BrandsResponse> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<BrandsResponse>(`${this.baseUrl}/api/v1/brands`, { params });
  }

  getBrandById(id: string): Observable<SingleBrandResponse> {
    return this.http.get<SingleBrandResponse>(`${this.baseUrl}/api/v1/brands/${id}`);
  }
}
