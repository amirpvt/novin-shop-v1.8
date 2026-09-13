/**
 * dashboardApi.ts - FIXED: body stream already read bug
 * قبلاً دوبار body را می‌خواند (json و بعد text) که باعث ارور می‌شد
 * الان فقط یکبار به صورت text می‌خواند و بعد JSON parse می‌کند
 */

import { apiFetchWithAuthRefresh, tokenStore } from "../authToken";

async function authFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStore.get()?.access || null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as any),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await apiFetchWithAuthRefresh(`/dashboard${endpoint}`, {
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
    todaySchedules: (params?: { visitor_id?: number; date?: string }) =>
      authFetch<any[]>(`/owner/today-schedules/${params ? `?${new URLSearchParams(Object.entries(params).reduce((acc, [key, value]) => value ? { ...acc, [key]: String(value) } : acc, {} as Record<string, string>)).toString()}` : ""}`),
    todayScheduleCreate: (data: { visitor_id: number; customer_id: number; date?: string; priority?: number; notes?: string; admin_notes?: string }) =>
      authFetch<any>("/owner/today-schedules/", { method: "POST", body: JSON.stringify(data) }),
    todayScheduleUpdate: (data: { schedule_id: number; status?: string; priority?: number; notes?: string; admin_notes?: string }) =>
      authFetch<any>("/owner/today-schedules/", { method: "PATCH", body: JSON.stringify(data) }),
    todayScheduleDelete: (schedule_id: number) =>
      authFetch<any>("/owner/today-schedules/", { method: "DELETE", body: JSON.stringify({ schedule_id }) }),
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
    commissions: (visitor_id?: number) => authFetch<any>(`/owner/commissions/${visitor_id ? `?visitor_id=${visitor_id}` : ""}`),
    commissionRuleUpdate: (data: { visitor_id: number; percentage: number; apply_to_unpaid?: boolean; notes?: string }) =>
      authFetch<any>("/owner/commissions/", { method: "PATCH", body: JSON.stringify(data) }),
    commissionPay: (data: { visitor_id: number; commission_ids?: number[]; reference_number?: string; description?: string }) =>
      authFetch<any>("/owner/commissions/", { method: "POST", body: JSON.stringify(data) }),
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
    customers: (q?: string, todayOnly = false) => authFetch<any[]>(`/visitor/customers/${q || todayOnly ? `?${new URLSearchParams({ ...(q ? { q } : {}), ...(todayOnly ? { today: "1" } : {}) }).toString()}` : ""}`),
    customerCreate: (data: { first_name: string; last_name?: string; phone: string; email?: string; address?: string; city?: string; postal_code?: string; national_id?: string; add_to_today?: boolean }) =>
      authFetch<any>("/visitor/customers/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    todayList: () => authFetch<any[]>("/visitor/today/"),
    todayUpdate: (data: { schedule_id: number; status?: string; notes?: string }) =>
      authFetch<any>("/visitor/today/", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    orderCreate: (data: { customer_id: number; sale_type?: "wholesale"; items: { product_id: number; quantity: number }[]; address?: string }) =>
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
