export const siteName = "پخش سوسیس و کالباس نوین";
export const siteSlogan = "توزیع عمده و خرده‌فروشی انواع سوسیس، کالباس و فرآورده‌های گوشتی با بهترین برندها";
export const phone = "09300117977";
export const phoneFixed = "02636640196";
export const mobilePhone = "09300117977";
export const address = "استان البرز، کرج، جاده ملارد، خیابان نیروگاه مپنا، شهرک ارم، بلوار ارم، روبروی آتشنشانی، خیابان پریسای شرقی، جنب حسینیه چهارده معصوم، پخش نوین";

// ✅ واحدها به صورت درست فارسی - بسته بندی و کیلوگرم جدا
export const UNIT_LABELS: Record<string, string> = {
  kg: "کیلوگرم",
  kgs: "کیلوگرم",
  kilo: "کیلوگرم",
  kilogram: "کیلوگرم",
  kilograms: "کیلوگرم",
  g: "گرم",
  gram: "گرم",
  grams: "گرم",
  pack: "بسته بندی",
  package: "بسته بندی",
  packet: "بسته بندی",
  piece: "عدد",
  pieces: "عدد",
  pcs: "عدد",
  pc: "عدد",
  peace: "عدد",
  عدد: "عدد",
  carton: "کارتن",
  cartons: "کارتن",
  کارتن: "کارتن",
  box: "باکس",
  boxes: "باکس",
  باکس: "باکس",
};

// ✅ اعداد انگلیسی
export type WholesaleOption = {
  id: number;
  code: string;
  label: string;
  unit_price: number;
  is_active: boolean;
  order: number;
};

export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  discount_price?: number | null;
  discount_percent?: number;
  base_price?: number;
  wholesale_price?: number;
  unit: string;
  retail_unit?: string;
  retail_unit_display?: string;
  wholesale_unit?: string;
  wholesale_unit_display?: string;
  wholesale_min_quantity?: number;
  wholesale_options?: WholesaleOption[];
  brand: string;
  tag?: string;
  category: string;
  category_name?: string;
  image: string;
  badge?: string;
  available: boolean;
  stock?: number;
};

// ✅ اعداد انگلیسی - به جای fa-IR از en-US استفاده می‌کنیم
export function formatPrice(n: number) {
  return n.toLocaleString("en-US") + " تومان";
}

export function formatNumber(n: number) {
  return n.toLocaleString("en-US");
}

export function getUnitLabel(unit?: string | null) {
  const raw = String(unit || "").trim();
  if (!raw) return "";
  const normalized = raw.toLowerCase();
  return UNIT_LABELS[raw] || UNIT_LABELS[normalized] || raw;
}

export function mapApiProduct(apiProduct: any): Product {
  const brandName = apiProduct.brand_name || (typeof apiProduct.brand === "string" ? apiProduct.brand : "") || "";
  const catName = apiProduct.category_name || (apiProduct.category ? String(apiProduct.category) : "") || "";
  let img = apiProduct.image || "";
  if (img.startsWith("/media/")) {
    const base = (import.meta as any).env?.VITE_API_BASE_URL?.replace("/api", "") || "http://127.0.0.1:8000";
    img = `${base}${img}`;
  }
  if (!img || img.includes("placeholder")) {
    const id = apiProduct.id;
    img = id ? `/image/products/p${id}.jpg` : "/image/products/placeholder.jpg";
  }

  const price = parseFloat(apiProduct.price) || 0;
  const basePrice = apiProduct.base_price != null ? parseFloat(apiProduct.base_price) : price;
  const wholesalePrice = apiProduct.wholesale_price != null ? parseFloat(apiProduct.wholesale_price) : price;
  const discountPrice = apiProduct.discount_price ? parseFloat(apiProduct.discount_price) : null;
  const discountPercent = discountPrice && price > 0 ? Math.round(((price - discountPrice) / price) * 100) : 0;

  return {
    id: apiProduct.id,
    name: apiProduct.name,
    description: apiProduct.description || apiProduct.name,
    price,
    discount_price: discountPrice,
    discount_percent: discountPercent,
    base_price: basePrice,
    wholesale_price: wholesalePrice,
    unit: apiProduct.unit || "pack",
    retail_unit: apiProduct.retail_unit || apiProduct.unit || "pack",
    retail_unit_display: apiProduct.retail_unit_display || UNIT_LABELS[apiProduct.retail_unit || apiProduct.unit] || "بسته بندی",
    wholesale_unit: apiProduct.wholesale_unit || "kg",
    wholesale_unit_display: apiProduct.wholesale_unit_display || UNIT_LABELS[apiProduct.wholesale_unit] || "کیلوگرم",
    wholesale_min_quantity: apiProduct.wholesale_min_quantity ?? 10,
    wholesale_options: Array.isArray(apiProduct.wholesale_options)
      ? apiProduct.wholesale_options.map((o: any) => ({ ...o, unit_price: Number(o.unit_price || 0), is_active: o.is_active !== false }))
      : [],
    brand: brandName,
    tag: apiProduct.tag || undefined,
    category: catName,
    image: img,
    badge: apiProduct.badge || undefined,
    available: apiProduct.available,
    stock: apiProduct.stock ?? 0,
  };
}
