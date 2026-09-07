// ─── Cart Storage ─────────────────────────────────────────────────────

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

// این تایپ فقط برای چند کامپوننت قدیمیِ فرم عمده نگه داشته شده و دیگر به localStorage وصل نیست.
export type StoredOrder = {
  id: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  message: string;
  status: "جدید" | "در حال پیگیری" | "انجام شده" | "لغو شده";
  createdAt: string;
};
