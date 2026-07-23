export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface ApiProduct {
  id: number;
  category: number;
  category_name: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  unit: string;
  tag: string | null;
  badge: string | null;
  image: string;
  available: boolean;
  order: number;
}

export interface ApiOrder {
  order_number: string;
  name: string;
  phone: string;
  product: string;
  message: string;
  order_status: string;
  total_amount: number;
  payment_status: string;
  created_at: string;
}

const BASE_URL = "http://127.0.0.1:8000/api";

export const apiService = {
  async fetchCategories(): Promise<Category[]> {
    const res = await fetch(`${BASE_URL}/products/categories/`);
    
    if (!res.ok) {
      throw new Error("Failed to load categories");
    }

    const data = await res.json();

    return data.results ?? data;
  },
  async fetchProducts(params: {
    category?: string | number | null;
    search?: string;
  }): Promise<ApiProduct[]> {

    const url = new URL(`${BASE_URL}/products/`);

    if (params.category) {
      url.searchParams.append(
        "category",
        params.category.toString()
      );
    }

    if (params.search) {
      url.searchParams.append(
        "search",
        params.search
      );
    }

    const res = await fetch(url.toString());

    if (!res.ok) {
      throw new Error("Failed to load products");
    }

    const data = await res.json();

    return data.results ?? data;
  },

  async trackOrder(orderNumber: string): Promise<ApiOrder> {
    const res = await fetch(`${BASE_URL}/orders/track/${orderNumber}/`);
    if (!res.ok) throw new Error("سفارش یافت نشد");
    return res.json();
  },

  async createPayment(orderId: string): Promise<{ payment_url: string }> {
    const res = await fetch(`${BASE_URL}/orders/payments/create/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId }),
    });
    if (!res.ok) throw new Error("خطا در ایجاد درخواست پرداخت");
    return res.json();
  }
};
