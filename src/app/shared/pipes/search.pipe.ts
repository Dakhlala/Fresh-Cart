import { Pipe, PipeTransform } from '@angular/core';
import { Product } from '../../core/models/product-model';

@Pipe({
  name: 'search',
})
export class SearchPipe implements PipeTransform {
  transform(products: Product[] | null, searchTerm: string): Product[] {
    if (!products) return [];
    if (!searchTerm || !searchTerm.trim()) return products;

    const term = searchTerm.toLowerCase().trim();
    return products.filter((product) =>
      product.title.toLowerCase().includes(term)
    );
  }
}
