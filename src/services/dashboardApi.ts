/**
 * dashboardApi.ts - FIXED: body stream already read bug
 * قبلاً دوبار body را می‌خواند (json و بعد text) که باعث ارور می‌شد
 * الان فقط یکبار به صورت text می‌خواند و بعد JSON parse می‌کند
 */

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
const DASHBOARD_BASE = `${API_BASE}/dashboard`;

function getToken(): string | null {
  try {
    const raw = localStorage.getItem("novin_auth_tokens");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.access || null;
  } catch {
    return null;
  }
}

async function authFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as any),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${DASHBOARD_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    // ✅ FIX: فقط یکبار body را می‌خوانیم
    const text = await res.text();
    let err: any = {};
    try {
      err = JSON.parse(text);
    } catch {
      err = { detail: text };
    }
    throw new Error(err.detail || err.error || err.message || text || `HTTP ${res.status}`);
  }

  if (res.status === 204) return {} as T;
  
  // ✅ FIX: برای موفقیت هم فقط یکبار می‌خوانیم
  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as any;
  }
}

async function authFetchFormData<T>(endpoint: string, formData: FormData, method: string = "POST"): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${DASHBOARD_BASE}${endpoint}`, {
    method,
    headers,
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    let err: any = {};
    try {
      err = JSON.parse(text);
    } catch {
      err = { detail: text };
    }
    throw new Error(err.detail || err.error || JSON.stringify(err) || text);
  }

  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as any;
  }
}

export const dashboardApi = {
  owner: {
    stats: () => authFetch<any>("/owner/stats/"),
    pricingList: () => authFetch<any[]>("/owner/pricing/"),
    pricingUpdate: (productId: number, data: { base_price: number; wholesale_price: number; is_active?: boolean }) =>
      authFetch<any>(`/owner/pricing/${productId}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    pricingCreate: (data: { product: number; base_price: number; wholesale_price: number }) =>
      authFetch<any>("/owner/pricing/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    users: (role?: string) => authFetch<any[]>(`/owner/users/${role ? `?role=${role}` : ""}`),
    userCreate: (data: { username: string; password: string; role: string; phone?: string; first_name?: string; last_name?: string; email?: string }) =>
      authFetch<any>("/owner/users/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    userToggleActive: (user_id: number, is_active: boolean) =>
      authFetch<any>("/owner/users/", {
        method: "PATCH",
        body: JSON.stringify({ user_id, is_active }),
      }),
    userDelete: (user_id: number) =>
      authFetch<any>("/owner/users/", {
        method: "DELETE",
        body: JSON.stringify({ user_id }),
      }),
    visitorReport: () => authFetch<any[]>("/owner/reports/?type=visitors"),
    debtorsReport: () => authFetch<any[]>("/owner/reports/?type=debtors"),
  },

  admin: {
    orderCreate: (data: { customer_id: number; items: { product_id: number; quantity: number; weight?: number }[]; sale_type: "retail" | "wholesale"; address?: string; message?: string }) =>
      authFetch<any>("/admin/orders/create/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    pendingOrders: () => authFetch<any[]>("/admin/orders/pending/"),
    pendingAction: (order_id: number, action: "confirm" | "reject") =>
      authFetch<any>("/admin/orders/pending/", {
        method: "PATCH",
        body: JSON.stringify({ order_id, action }),
      }),
    stock: (low_threshold?: number) => authFetch<any>(`/admin/stock/${low_threshold ? `?low_threshold=${low_threshold}` : ""}`),
  },

  visitor: {
    todayList: () => authFetch<any[]>("/visitor/today/"),
    orderCreate: (data: { customer_id: number; items: { product_id: number; quantity: number; weight?: number }[]; address?: string }) =>
      authFetch<any>("/visitor/orders/create/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    cashList: () => authFetch<any[]>("/visitor/cash/"),
    cashCreate: (data: { customer: number; amount: number; payment_type?: string; order?: number; receipt_number?: string; notes?: string }) =>
      authFetch<any>("/visitor/cash/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    commission: (visitor_id?: number) =>
      authFetch<any>(`/visitor/commission/${visitor_id ? `?visitor_id=${visitor_id}` : ""}`),
  },

  customer: {
    prices: () => authFetch<any[]>("/customer/prices/"),
  },
};
