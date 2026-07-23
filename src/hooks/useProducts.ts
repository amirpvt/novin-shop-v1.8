import { useState, useEffect, useCallback } from "react";
import { productsApi, type ApiProduct } from "../api/client";
import { type Product, mapApiProduct, products as fallbackProducts } from "../data";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: number; name: string; slug: string }[]>([]);

  // ─── Fetch products from API ─────────────────────────────────────────

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
      const mapped = response.results.map(mapApiProduct);
      
      console.log("API PRODUCTS:", response);
      console.log("MAPPED PRODUCTS:", mapped);
      
      setProducts(mapped);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError(err instanceof Error ? err.message : "خطا در دریافت محصولات");
      // Keep fallback data on error
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Fetch categories ────────────────────────────────────────────────

  const fetchCategories = useCallback(async () => {
    try {
      const cats = await productsApi.getCategories();
      setCategories(cats);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  }, []);

  // ─── Initial load ────────────────────────────────────────────────────

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  // ─── CRUD Operations (Admin) ─────────────────────────────────────────
  // Note: These now work with local state. For full admin CRUD via API,
  // you would add POST/PUT/DELETE endpoints in the backend.

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

  const deleteProduct = useCallback((productId: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  }, []);

  const duplicateProduct = useCallback((productId: number) => {
    setProducts((prev) => {
      const product = prev.find((p) => p.id === productId);
      if (!product) return prev;

      const duplicated: Product = {
        ...product,
        id: Date.now(), // temporary ID
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