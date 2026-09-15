/**
 * Client FIXED for MyOrders - سفارش به کاربر لاگین شده وصل می‌شود
 */
import { apiFetchWithAuthRefresh, tokenStore } from "../authToken";

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

export { tokenStore };

async function request<T>(endpoint: string, options: RequestInit = {}, _auth = false): Promise<T> {
  const tokens = tokenStore.get();
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(options.headers as any) };
  // اگر auth=True یا توکن داریم، همیشه بفرست تا سفارش به کاربر وصل شود
  if (tokens?.access) headers["Authorization"] = `Bearer ${tokens.access}`;

  const res = await apiFetchWithAuthRefresh(endpoint, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    let err: any = {};
    try {
      err = text ? JSON.parse(text) : {};
    } catch {
      err = { detail: text };
    }
    const message = err.detail || err.error || err.message || (typeof err === "string" ? err : "") || text || `HTTP ${res.status}`;
    throw new Error(message);
  }
  if (res.status === 204) return {} as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : {}) as T;
}

function get<T>(endpoint: string, params?: Record<string, any>, auth = false): Promise<T> {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") url.searchParams.append(k, String(v)); });
  return request<T>(url.toString().replace(API_BASE_URL, ""), { method: "GET" }, auth);
}

// Types
export interface ApiProduct { id: number; name: string; slug: string; description: string; price: string; base_price?: string; wholesale_price?: string; unit: string; brand?: number; brand_name?: string; tag: string | null; badge: string | null; image: string; stock: number; available: boolean; order: number; category: number | null; category_name?: string; }
export interface PaginatedResponse<T> { count: number; next: string | null; previous: string | null; results: T[]; }
export interface OrderItem { id: number; product: number | null; product_name: string; price: string; quantity: number; subtotal: string; }
export interface Order { id: number; order_number: string; name: string; phone: string; address: string; message: string; order_status: string; total_amount: string; items: OrderItem[]; created_at: string; }
export interface WholesaleRequest { id: number; request_number: string; company_name: string; contact_person: string; phone: string; address: string; description: string; status: string; items: any[]; created_at: string; }
export interface ApiUser { id: number; username: string; email: string; first_name?: string; last_name?: string; name: string; phone: string; role: string; is_staff: boolean; customer: any; }
export interface ApiAuthResponse { access: string; refresh: string; user: ApiUser; }

export const productsApi = {
  getAll: (params?: any) => get<PaginatedResponse<ApiProduct>>("/products/", params, true),
  getById: (id: number | string) => get<ApiProduct>(`/products/${id}/`, undefined, true),
  getCategories: async () => { const res = await get<any>("/products/categories/", undefined, true); return (res.results ?? res); },
  getBrands: async () => { const res = await get<any>("/products/brands/", undefined, true); return (res.results ?? res); },
  create: (data: any) => request<ApiProduct>("/products/", { method: "POST", body: JSON.stringify(data) }, true),
  update: (id: number, data: any) => request<ApiProduct>(`/products/${id}/`, { method: "PATCH", body: JSON.stringify(data) }, true),
  delete: (id: number) => request(`/products/${id}/`, { method: "DELETE" }, true),
};

// 🆕 FIX: تمام درخواست‌های سفارش با auth=True تا user ذخیره شود
export const ordersApi = {
  create: (data: any) => request<Order>("/orders/", { method: "POST", body: JSON.stringify(data) }, true),
  createRetailPayment: (data: any) =>
    request<{ payment_url: string; payment_number: string; amount: string | number }>("/orders/payments/retail/create/", { method: "POST", body: JSON.stringify(data) }, true),
  verifyRetailPayment: (data: { payment_number?: string | null; authority?: string | null; status?: string | null }) =>
    request<{ status: string; payment_number?: string; transaction_id?: string; order_number?: string; message?: string }>("/orders/payments/retail/verify/", { method: "POST", body: JSON.stringify(data) }, false),
  createPayment: (data: { order_id?: number | string; order_number?: string; callback_url?: string }) =>
    request<{ payment_url: string; payment_number: string; order_number: string; amount: string | number }>("/orders/payments/create/", { method: "POST", body: JSON.stringify(data) }, true),
  verifyPayment: (data: { payment_number?: string | null; authority?: string | null; order_number?: string | null; status?: string | null }) =>
    request<{ status: string; payment_number?: string; transaction_id?: string; order_number?: string; message?: string }>("/orders/payments/verify/", { method: "POST", body: JSON.stringify(data) }, true),
  track: (orderNumber: string) => get<Order>(`/orders/track/${orderNumber}/`, undefined, false),
  list: (params?: any) => get<any>("/orders/list/", params, true),
  myOrders: () => get<any>("/orders/my-orders/", undefined, true),
  stats: () => get<any>("/orders/stats/", undefined, true),
  updateStatus: (id: number, order_status: string) => request<Order>(`/orders/${id}/status/`, { method: "PATCH", body: JSON.stringify({ order_status }) }, true),
};

export const wholesaleApi = {
  create: (data: any) => request<WholesaleRequest>("/orders/wholesale/", { method: "POST", body: JSON.stringify(data) }, true),
  createPayment: (data: any) => request<{ payment_url: string; payment_number: string; amount: string | number }>("/orders/wholesale/payments/create/", { method: "POST", body: JSON.stringify(data) }, true),
  verifyPayment: (data: { payment_number?: string | null; authority?: string | null; status?: string | null }) =>
    request<{ status: string; payment_number?: string; transaction_id?: string; wholesale_request_number?: string; message?: string }>("/orders/wholesale/payments/verify/", { method: "POST", body: JSON.stringify(data) }, false),
  track: (requestNumber: string) => get<WholesaleRequest>(`/orders/wholesale/track/${requestNumber}/`, undefined, false),
  list: (params?: any) => get<any>("/orders/wholesale/list/", params, true),
  myRequests: () => get<any>("/orders/wholesale/my-requests/", undefined, true),
  updateStatus: (requestNumber: string, status: string) => request<WholesaleRequest>(`/orders/wholesale/${requestNumber}/status/`, { method: "PATCH", body: JSON.stringify({ status }) }, true),
};

export const authApi = {
  register: (payload: any) => request<ApiAuthResponse>("/auth/register/", { method: "POST", body: JSON.stringify(payload) }).then((data: any) => { tokenStore.set({ access: data.access, refresh: data.refresh }); return data; }),
  login: (username: string, password: string) => request<ApiAuthResponse>("/auth/login/", { method: "POST", body: JSON.stringify({ username, password }) }).then((data: any) => { tokenStore.set({ access: data.access, refresh: data.refresh }); return data; }),
  logout: async () => {
    const tokens = tokenStore.get();
    try {
      if (tokens?.refresh) {
        await fetch(`${API_BASE_URL}/auth/logout/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}),
          },
          body: JSON.stringify({ refresh: tokens.refresh }),
        });
      }
    } catch {
      // حتی اگر ارتباط با سرور خطا داشت، خروج سمت کاربر انجام می‌شود.
    } finally {
      tokenStore.clear();
    }
  },
  getProfile: () => get<ApiUser>("/auth/profile/", undefined, true),
  updateProfile: (payload: any) => request<ApiUser>("/auth/profile/", { method: "PATCH", body: JSON.stringify(payload) }, true),
  isAuthenticated: () => !!tokenStore.get()?.access,
};
