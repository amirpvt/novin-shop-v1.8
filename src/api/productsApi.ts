import { apiService } from "../api";
import type { ApiProduct } from "../api";

const BASE_URL = "http://127.0.0.1:8000/api/products/";

export const productsApi = {
  // دریافت همه محصولات
  getAll() {
    return apiService.fetchProducts({});
  },

  // جستجو
  search(search: string) {
    return apiService.fetchProducts({
      search,
    });
  },

  // فیلتر دسته‌بندی
  byCategory(category: number | string) {
    return apiService.fetchProducts({
      category,
    });
  },

  // ایجاد محصول
  async create(product: Partial<ApiProduct>) {
    const response = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(product),
    });

    if (!response.ok) {
      throw new Error("خطا در ایجاد محصول");
    }

    return response.json();
  },

  // ویرایش محصول
  async update(id: number, product: Partial<ApiProduct>) {
    const response = await fetch(`${BASE_URL}${id}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(product),
    });

    if (!response.ok) {
      throw new Error("خطا در بروزرسانی محصول");
    }

    return response.json();
  },

  // حذف محصول
  async remove(id: number) {
    const response = await fetch(`${BASE_URL}${id}/`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("خطا در حذف محصول");
    }

    return true;
  },
};