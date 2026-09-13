import { useState, useEffect, useCallback } from "react";
import { productsApi, type ApiProduct } from "../api/client";
import { type Product, mapApiProduct } from "../data";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: number; name: string; slug: string }[]>([]);

  const fetchProducts = useCallback(async (params?: {
    category?: string;
    search?: string;
    ordering?: string;
    page?: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await productsApi.getAll(params);
      const apiResults = (response as any).results ?? response;
      const mapped = Array.isArray(apiResults) ? apiResults.map((p: ApiProduct) => mapApiProduct(p)) : [];
      setProducts(mapped);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setProducts([]);
      setError(err instanceof Error ? err.message : "خطا در دریافت محصولات");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const cats = await productsApi.getCategories();
      if (cats && cats.length > 0) setCategories(cats as any);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  const updateProducts = useCallback((newProducts: Product[]) => {
    setProducts(newProducts);
  }, []);

  const addProduct = useCallback((product: Product) => {
    setProducts((prev) => [...prev, product]);
  }, []);

  const editProduct = useCallback((updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
  }, []);

  const deleteProduct = useCallback((productId: number | string) => {
    setProducts((prev) => prev.filter((p) => String(p.id) !== String(productId)));
  }, []);

  const duplicateProduct = useCallback((productId: number | string) => {
    setProducts((prev) => {
      const product = prev.find((p) => String(p.id) === String(productId));
      if (!product) return prev;
      const duplicated: Product = {
        ...product,
        id: Date.now(),
        name: `${product.name} (کپی)`,
      };
      return [...prev, duplicated];
    });
  }, []);

  return {
    products,
    loading,
    error,
    categories,
    fetchProducts,
    fetchCategories,
    updateProducts,
    addProduct,
    editProduct,
    deleteProduct,
    duplicateProduct,
  };
}
