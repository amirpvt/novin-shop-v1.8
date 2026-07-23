import {
  getStoredProducts,
  saveStoredProducts,
} from "../storage";

import type { Product } from "../data";

export const productService = {
  getAll(): Product[] {
    return getStoredProducts();
  },

  save(products: Product[]): void {
    saveStoredProducts(products);
  },

  add(product: Product): Product[] {
    const products = getStoredProducts();

    const updated = [...products, product];

    saveStoredProducts(updated);

    return updated;
  },

  update(product: Product): Product[] {
    const products = getStoredProducts();

    const updated = products.map((p) =>
      p.id === product.id ? product : p
    );

    saveStoredProducts(updated);

    return updated;
  },

  delete(id: string): Product[] {
    const products = getStoredProducts();

    const updated = products.filter((p) => p.id !== id);

    saveStoredProducts(updated);

    return updated;
  },
};