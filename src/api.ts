/**
 * API Service - Phase 1 (with JWT Auth)
 *
 * نکته: BASE_URL از متغیر محیطی Vite خوانده می‌شود.
 * در فایل .env فرانت:
 *   VITE_API_BASE_URL=http://127.0.0.1:8000/api
 */
import { apiFetchWithAuthRefresh, tokenStore } from "./authToken";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || "http://127.0.0.1:8000/api";

// ─── Types ──────────────────────────────────────────────────────────────
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
  stock: number;
  order: number;
}

export interface ApiOrder {
  order_number: string;
  name: string;
  phone: string;
  address: string;
  message: string;
  order_status: string;
  total_amount: number;
  payment_status: string;
  items: ApiOrderItem[];
  created_at: string;
}

export interface ApiOrderItem {
  id: number;
  product: number;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface ApiUser {
  id: number;
  username: string;
  email: string;
  name: string;
  phone: string;
  role: "superadmin" | "admin" | "customer";
  is_staff: boolean;
  customer: {
    phone: string;
    address: string;
    city: string;
    postal_code: string;
    national_id: string;
    customer_type: "retail" | "wholesale" | "both";
    is_wholesale_approved: boolean;
  } | null;
}

export interface ApiAuthResponse {
  access: string;
  refresh: string;
  user: ApiUser;
}

// ─── Token Helpers ──────────────────────────────────────────────────────
export { tokenStore };

// ─── Fetch Helper (خودکار Authorization Header) ────────────────────────
async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const tokens = tokenStore.get();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (tokens?.access) {
    headers["Authorization"] = `Bearer ${tokens.access}`;
  }

  const res = await apiFetchWithAuthRefresh(path, { ...init, headers });
  if (!res.ok) {
    let err: any = { detail: `HTTP ${res.status}` };
    try {
      err = await res.json();
    } catch {
      /* ignore */
    }
    throw new Error(err.detail || err.message || "خطا در ارتباط با سرور");
  }
  return res.json() as Promise<T>;
}

// ─── API Service ────────────────────────────────────────────────────────
export const apiService = {
  // ── Categories & Products ────────────────────────────────────────────
  async fetchCategories(): Promise<Category[]> {
    const data = await apiFetch<any>("/products/categories/");
    return data.results ?? data;
  },

  async fetchProducts(params: {
    category?: string | number | null;
    search?: string;
  } = {}): Promise<ApiProduct[]> {
    const url = new URL(`${BASE_URL}/products/`);
    if (params.category) url.searchParams.append("category", params.category.toString());
    if (params.search) url.searchParams.append("search", params.search);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error("Failed to load products");
    const data = await res.json();
    return data.results ?? data;
  },

  // ── Orders ──────────────────────────────────────────────────────────
  async trackOrder(orderNumber: string): Promise<ApiOrder> {
    return apiFetch<ApiOrder>(`/orders/track/${orderNumber}/`);
  },

  async createPayment(orderId: string): Promise<{ payment_url: string }> {
    return apiFetch<{ payment_url: string }>("/orders/payments/create/", {
      method: "POST",
      body: JSON.stringify({ order_id: orderId }),
    });
  },

  // ── 🆕 Authentication ──────────────────────────────────────────────
  async register(payload: {
    username: string;
    email?: string;
    password: string;
    password2: string;
    first_name?: string;
    last_name?: string;
    phone: string;
  }): Promise<ApiAuthResponse> {
    const data = await apiFetch<ApiAuthResponse>("/auth/register/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    tokenStore.set({ access: data.access, refresh: data.refresh });
    return data;
  },

  async login(username: string, password: string): Promise<ApiAuthResponse> {
    const data = await apiFetch<ApiAuthResponse>("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    tokenStore.set({ access: data.access, refresh: data.refresh });
    return data;
  },

  async logout(): Promise<void> {
    const tokens = tokenStore.get();
    try {
      if (tokens?.refresh) {
        await fetch(`${BASE_URL}/auth/logout/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}),
          },
          body: JSON.stringify({ refresh: tokens.refresh }),
        });
      }
    } catch {
      /* حتی اگر ارتباط با سرور خطا داشت، توکن سمت کاربر پاک می‌شود */
    } finally {
      tokenStore.clear();
    }
  },

  async getProfile(): Promise<ApiUser> {
    return apiFetch<ApiUser>("/auth/profile/");
  },

  async updateProfile(patch: Partial<ApiUser["customer"]>): Promise<ApiUser> {
    return apiFetch<ApiUser>("/auth/profile/", {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },

  async changePassword(old_password: string, new_password: string): Promise<{ detail: string }> {
    return apiFetch<{ detail: string }>("/auth/change-password/", {
      method: "POST",
      body: JSON.stringify({ old_password, new_password }),
    });
  },

  isAuthenticated(): boolean {
    return !!tokenStore.get()?.access;
  },
};
