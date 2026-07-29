/**
 * Novin Shop - API Client v3 (Phase 3)
 * محصولات CRUD + سفارش واقعی + موجودی
 */
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || "http://127.0.0.1:8000/api";

const TOKEN_KEY = "novin_auth_tokens";

export const tokenStore = {
  get(): { access: string; refresh: string } | null {
    try {
      const raw = localStorage.getItem(TOKEN_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },
  set(tokens: { access: string; refresh: string }) {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  },
  clear() { localStorage.removeItem(TOKEN_KEY); },
};

async function request<T>(endpoint: string, options: RequestInit = {}, auth = false): Promise<T> {
  const tokens = tokenStore.get();
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(options.headers as any) };
  if (auth && tokens?.access) headers["Authorization"] = `Bearer ${tokens.access}`;
  // برای GET هم اگر توکن داریم بفرست تا ادمین همه محصولات را ببیند
  if (!auth && tokens?.access && options.method === undefined) {
    headers["Authorization"] = `Bearer ${tokens.access}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  if (!res.ok) {
    let err: any = {};
    try { err = await res.json(); } catch { err.detail = await res.text(); }
    throw new Error(err.detail || err.message || JSON.stringify(err) || `HTTP ${res.status}`);
  }
  if (res.status === 204) return {} as T;
  return res.json();
}

function get<T>(endpoint: string, params?: Record<string, any>, auth = false): Promise<T> {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.append(k, String(v));
    });
  }
  return request<T>(url.toString().replace(API_BASE_URL, ""), { method: "GET" }, auth);
}

// Types
export interface Category { id: number; name: string; slug: string; order?: number; product_count?: number; }
export interface ApiProduct {
  id: number; name: string; slug: string; description: string; price: string;
  discount_price?: string; unit: string; brand?: number; brand_name?: string;
  tag: string | null; badge: string | null; image: string; stock: number;
  available: boolean; order: number; category: number | null; category_name?: string;
  is_featured?: boolean; status?: string; sku?: string;
}
export interface PaginatedResponse<T> { count: number; next: string | null; previous: string | null; results: T[]; }
export interface OrderItemInput { product_id: number; quantity: number; }
export interface OrderItem { id: number; product: number | null; product_name: string; price: string; quantity: number; subtotal: string; }
export interface Order {
  id: number; order_number: string; name: string; phone: string; address: string;
  message: string; order_status: string; total_amount: string; items: OrderItem[];
  created_at: string; updated_at: string;
}
export interface OrderCreateInput { name: string; phone: string; address?: string; message?: string; items: OrderItemInput[]; }
export interface WholesaleItemInput { product_id: number; quantity: number; notes?: string; }
export interface WholesaleRequestItem { id: number; product: number | null; product_name: string; quantity: number; notes: string; }
export interface WholesaleRequest {
  id: number; request_number: string; company_name: string; contact_person: string;
  phone: string; address: string; description: string; status: string;
  items: WholesaleRequestItem[]; created_at: string;
}
export interface WholesaleCreateInput {
  company_name: string; contact_person: string; phone: string;
  address?: string; description?: string; items: WholesaleItemInput[];
}
export interface ApiUser {
  id: number; username: string; email: string; name: string; phone: string;
  role: "superadmin" | "admin" | "customer"; is_staff: boolean;
  customer: { phone: string; address: string; city: string; postal_code: string; national_id: string; customer_type: string; is_wholesale_approved: boolean; } | null;
}
export interface ApiAuthResponse { access: string; refresh: string; user: ApiUser; }

// Products
export const productsApi = {
  getAll: (params?: any) => get<PaginatedResponse<ApiProduct>>("/products/", params),
  getById: (id: number | string) => get<ApiProduct>(`/products/${id}/`),
  getCategories: async () => {
    const res = await get<any>("/products/categories/");
    return (res.results ?? res) as Category[];
  },
  // Admin CRUD
  create: (data: Partial<ApiProduct>) => request<ApiProduct>("/products/", { method: "POST", body: JSON.stringify(data) }, true),
  update: (id: number, data: Partial<ApiProduct>) => request<ApiProduct>(`/products/${id}/`, { method: "PATCH", body: JSON.stringify(data) }, true),
  delete: (id: number) => request(`/products/${id}/`, { method: "DELETE" }, true),
};

// Orders
export const ordersApi = {
  create: (data: OrderCreateInput) => request<Order>("/orders/", { method: "POST", body: JSON.stringify(data) }),
  track: (orderNumber: string) => get<Order>(`/orders/track/${orderNumber}/`),
  list: (params?: any) => get<PaginatedResponse<Order> | Order[]>("/orders/list/", params, true),
  updateStatus: (id: number, status: string) => request<Order>(`/orders/${id}/`, { method: "PATCH", body: JSON.stringify({ order_status: status }) }, true),
};

// Wholesale
export const wholesaleApi = {
  create: (data: WholesaleCreateInput) => request<WholesaleRequest>("/orders/wholesale/", { method: "POST", body: JSON.stringify(data) }),
  track: (requestNumber: string) => get<WholesaleRequest>(`/orders/wholesale/track/${requestNumber}/`),
  list: (params?: any) => get<PaginatedResponse<WholesaleRequest> | WholesaleRequest[]>("/orders/wholesale/list/", params, true),
  updateStatus: (requestNumber: string, status: string) => request<WholesaleRequest>(`/orders/wholesale/${requestNumber}/status/`, { method: "PATCH", body: JSON.stringify({ status }) }, true),
};

// Auth
export const authApi = {
  register: (payload: any) => request<ApiAuthResponse>("/auth/register/", { method: "POST", body: JSON.stringify(payload) }),
  login: (username: string, password: string) => request<ApiAuthResponse>("/auth/login/", { method: "POST", body: JSON.stringify({ username, password }) }).then((data: any) => { tokenStore.set({ access: data.access, refresh: data.refresh }); return data; }),
  logout: async () => { try { await request("/auth/logout/", { method: "POST" }, true); } catch {} tokenStore.clear(); },
  getProfile: () => get<ApiUser>("/auth/profile/", undefined, true),
  isAuthenticated: () => !!tokenStore.get()?.access,
};
