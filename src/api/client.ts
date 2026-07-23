const API_BASE_URL = "http://127.0.0.1:8000/api";
// ─── Helpers ───────────────────────────────────────────────────────────

async function get<T>(endpoint: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.text().catch(() => "Unknown error");
    throw new Error(`API Error ${res.status}: ${err}`);
  }
  return res.json();
}

async function post<T>(endpoint: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "Unknown error");
    throw new Error(`API Error ${res.status}: ${err}`);
  }
  return res.json();
}

async function patch<T>(endpoint: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "Unknown error");
    throw new Error(`API Error ${res.status}: ${err}`);
  }
  return res.json();
}

// ─── Types ─────────────────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  slug: string;
  order: number;
}

export interface ApiProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: string;        // Django Decimal → string
  unit: string;
  brand: string;
  tag: string;
  badge: string;
  image: string;
  available: boolean;
  order: number;
  category: number | null;
  category_name: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Order (B2C)
export interface OrderItemInput {
  product_id: number;
  quantity: number;
}

export interface OrderItem {
  id: number;
  product: number | null;
  product_name: string;
  price: string;
  quantity: number;
  subtotal: string;
}

export interface Order {
  id: number;
  order_number: string;
  name: string;
  phone: string;
  address: string;
  message: string;
  order_status: string;
  total_amount: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderCreateInput {
  name: string;
  phone: string;
  address?: string;
  message?: string;
  items: OrderItemInput[];
}

// Wholesale (B2B)
export interface WholesaleItemInput {
  product_id: number;
  quantity: number;
  notes?: string;
}

export interface WholesaleRequestItem {
  id: number;
  product: number | null;
  product_name: string;
  quantity: number;
  notes: string;
}

export interface WholesaleRequest {
  id: number;
  request_number: string;
  company_name: string;
  contact_person: string;
  phone: string;
  address: string;
  description: string;
  status: string;
  items: WholesaleRequestItem[];
  created_at: string;
}

export interface WholesaleCreateInput {
  company_name: string;
  contact_person: string;
  phone: string;
  address?: string;
  description?: string;
  items: WholesaleItemInput[];
}

// ─── Products API ──────────────────────────────────────────────────────

export const productsApi = {
  getAll: (params?: {
    category?: string;
    brand?: string;
    search?: string;
    ordering?: string;
    page?: number;
  }) => get<PaginatedResponse<ApiProduct>>("/products/", params),

  getById: (id: number | string) => get<ApiProduct>(`/products/${id}/`),

  getCategories: async () => {
  const response = await get<{results: Category[]}>("/products/categories/");
  return response.results;
  }
};
// ─── Orders API (B2C) ──────────────────────────────────────────────────

export const ordersApi = {
  create: (data: OrderCreateInput) => post<Order>("/orders/", data),

  track: (orderNumber: string) => get<Order>(`/orders/track/${orderNumber}/`),

  list: () => get<Order[]>("/orders/list/"),
};

// ─── Wholesale API (B2B) ───────────────────────────────────────────────

export const wholesaleApi = {
  create: (data: WholesaleCreateInput) =>
    post<WholesaleRequest>("/orders/wholesale/", data),

  track: (requestNumber: string) =>
    get<WholesaleRequest>(`/orders/wholesale/track/${requestNumber}/`),

  list: () => get<WholesaleRequest[]>("/orders/wholesale/list/"),

  updateStatus: (requestNumber: string, status: string) =>
    patch<WholesaleRequest>(`/orders/wholesale/${requestNumber}/status/`, { status }),
};