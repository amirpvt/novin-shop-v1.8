import { products as initialProducts, type Product } from "./data";

export type UserRole = "admin" | "customer";

export type User = {
  name: string;
  phone: string;
  role: UserRole;
};

// ─── Cart Item (updated for API compatibility) ─────────────────────────
// id = number (Django PK)

export type CartItem = {
  id: number;
  name: string;
  price: number; // قیمت نهایی قابل پرداخت؛ اگر تخفیف داشته باشد همین قیمت تخفیفی است
  original_price?: number;
  discount_price?: number | null;
  discount_percent?: number;
  image: string;
  unit: string;
  qty: number;
};

export function getStoredCart(): CartItem[] {
  try {
    const s = localStorage.getItem("novin_shopping_cart");
    if (s) return JSON.parse(s);
  } catch (e) {
    console.error("Error reading shopping cart", e);
  }
  return [];
}

export function saveStoredCart(cart: CartItem[]): void {
  try {
    localStorage.setItem("novin_shopping_cart", JSON.stringify(cart));
  } catch (e) {
    console.error("Error saving shopping cart", e);
  }
}

// ─── User Auth Storage ────────────────────────────────────────────────

export function getLoggedUser(): User | null {
  try {
    const s = localStorage.getItem("novin_auth_user");
    if (s) return JSON.parse(s);
  } catch (e) {
    console.error("Error reading logged user", e);
  }
  return null;
}

export function saveLoggedUser(user: User | null): void {
  try {
    if (!user) {
      localStorage.removeItem("novin_auth_user");
    } else {
      localStorage.setItem("novin_auth_user", JSON.stringify(user));
    }
  } catch (e) {
    console.error("Error saving logged user", e);
  }
}

// ─── Registered Customers ────────────────────────────────────────────

export type RegisteredCustomer = {
  name: string;
  phone: string;
  password: string;
};

export function getRegisteredCustomers(): RegisteredCustomer[] {
  try {
    const s = localStorage.getItem("novin_registered_customers");
    if (s) return JSON.parse(s);
  } catch (e) {
    console.error("Error reading registered customers", e);
  }
  return [];
}

export function saveRegisteredCustomers(customers: RegisteredCustomer[]): void {
  try {
    localStorage.setItem("novin_registered_customers", JSON.stringify(customers));
  } catch (e) {
    console.error("Error saving registered customers", e);
  }
}

export function findCustomerByPhone(phone: string): RegisteredCustomer | undefined {
  return getRegisteredCustomers().find((c) => c.phone === phone);
}

export function registerCustomer(customer: RegisteredCustomer): void {
  const customers = getRegisteredCustomers();
  saveRegisteredCustomers([...customers, customer]);
}

// ─── Legacy: Products Storage (kept for backward compatibility) ─────

export function getStoredProducts(): Product[] {
  try {
    const s = localStorage.getItem("novin_products");
    if (s) return JSON.parse(s);
  } catch (e) {
    console.error("Error reading products from localStorage", e);
  }
  return initialProducts;
}

export function saveStoredProducts(products: Product[]): void {
  try {
    localStorage.setItem("novin_products", JSON.stringify(products));
  } catch (e) {
    console.error("Error saving products to localStorage", e);
  }
}

// ─── Legacy: Orders Storage (kept for backward compatibility) ───────────

export type StoredOrder = {
  id: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  message: string;
  status: "جدید" | "در حال پیگیری" | "انجام شده" | "لغو شده";
  createdAt: string;
};

export function getStoredOrders(): StoredOrder[] {
  try {
    const s = localStorage.getItem("novin_orders");
    if (s) return JSON.parse(s);
  } catch (e) {
    console.error("Error reading orders from localStorage", e);
  }
  return [];
}

export function saveStoredOrders(orders: StoredOrder[]): void {
  try {
    localStorage.setItem("novin_orders", JSON.stringify(orders));
  } catch (e) {
    console.error("Error saving orders to localStorage", e);
  }
}