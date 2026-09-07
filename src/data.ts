export const siteName = "پخش سوسیس و کالباس نوین";
export const siteSlogan = "توزیع عمده و خرده‌فروشی انواع سوسیس، کالباس و فرآورده‌های گوشتی با بهترین برندها";
export const phone = "09300117977";
export const phoneFixed = "02636640196";
export const mobilePhone = "09300117977";
export const address = "استان البرز، کرج، جاده ملارد، خیابان نیروگاه مپنا، شهرک ارم، بلوار ارم، روبروی آتشنشانی، خیابان پریسای شرقی، جنب حسینیه چهارده معصوم، پخش نوین";

export const brands: { name: string; image: string }[] = [
  { name: "فرآورده های گوشتی گلچین", image: "/images/brands/golchin.jpg" },
  { name: "202", image: "/images/brands/202.jpg" },
  { name: "لاله بناب", image: "/images/brands/laleh-bonab.jpg" },
  { name: "سس 88", image: "/images/brands/sauce88.jpg" },
  { name: "شام ایرانی", image: "/images/brands/shamirani.jpg" },
];

export const categories = ["سوسیس", "کالباس", "فرآورده های منجمد"] as const;

// ✅ واحدها به صورت درست فارسی - بسته بندی و کیلوگرم جدا
export const UNIT_LABELS: Record<string, string> = {
  kg: "کیلوگرم",
  pack: "بسته بندی",
  piece: "عدد",
  carton: "کارتن",
  box: "بسته بندی",
  kilogram: "کیلوگرم",
};

// ✅ اعداد انگلیسی
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
  brand: string;
  tag?: string;
  category: string;
  category_name?: string;
  image: string;
  badge?: string;
  available: boolean;
  stock?: number;
};

export const products: Product[] = [
  { id: 1, name: "سوسیس بلغاری گوشت", description: "۱۰۰٪ گوشت گوساله تازه", price: 89000, unit: "pack", retail_unit: "pack", wholesale_unit: "kg", wholesale_min_quantity: 10, brand: "گلچین", category: "سوسیس", image: "/images/p1.jpg", badge: "گوشت تازه", available: true, stock: 150 },
  { id: 2, name: "کالباس گوشت کلاسیک", description: "بافت نرم", price: 76000, unit: "pack", retail_unit: "pack", wholesale_unit: "kg", wholesale_min_quantity: 5, brand: "گلچین", category: "کالباس", image: "/images/p2.jpg", available: true, stock: 80 },
  { id: 3, name: "فرانکفورتر دودی", description: "اصیل", price: 95000, unit: "pack", retail_unit: "pack", wholesale_unit: "carton", wholesale_min_quantity: 2, brand: "202", category: "سوسیس", image: "/images/p3.jpg", available: true, stock: 45 },
  { id: 4, name: "سوسیس مرغ سفید", description: "سبک", price: 69000, unit: "pack", retail_unit: "pack", wholesale_unit: "kg", wholesale_min_quantity: 10, brand: "لاله بناب", category: "سوسیس", image: "/images/p4.jpg", available: true, stock: 120 },
  { id: 5, name: "سوسیس کوکتل", description: "مهمانی", price: 82000, unit: "pack", retail_unit: "pack", wholesale_unit: "carton", wholesale_min_quantity: 1, brand: "سس 88", category: "فرآورده های منجمد", image: "/images/p5.jpg", available: true, stock: 200 },
  { id: 6, name: "کالباس کم‌نمک", description: "کم نمک", price: 88000, unit: "pack", retail_unit: "pack", wholesale_unit: "kg", wholesale_min_quantity: 5, brand: "شام ایرانی", category: "کالباس", image: "/images/p6.jpg", available: false, stock: 0 },
  { id: 7, name: "ناگت مرغ", description: "ناگت", price: 79000, unit: "pack", retail_unit: "pack", wholesale_unit: "carton", wholesale_min_quantity: 2, brand: "شام ایرانی", category: "فرآورده های منجمد", image: "/images/p7.jpg", available: true, stock: 60 },
  { id: 8, name: "کتلت گوشت", description: "کتلت", price: 99000, unit: "pack", retail_unit: "pack", wholesale_unit: "kg", wholesale_min_quantity: 10, brand: "شام ایرانی", category: "فرآورده های منجمد", image: "/images/p8.jpg", available: true, stock: 35 },
];

// ✅ اعداد انگلیسی - به جای fa-IR از en-US استفاده می‌کنیم
export function formatPrice(n: number) {
  return n.toLocaleString("en-US") + " تومان";
}

export function formatNumber(n: number) {
  return n.toLocaleString("en-US");
}

export function getUnitLabel(unit: string) {
  return UNIT_LABELS[unit] || unit;
}

export function mapApiProduct(apiProduct: any): Product {
  const brandName = apiProduct.brand_name || (typeof apiProduct.brand === "string" ? apiProduct.brand : "") || "";
  const catName = apiProduct.category_name || (apiProduct.category ? String(apiProduct.category) : "") || "";
  let img = apiProduct.image || "/images/placeholder.jpg";
  if (img.startsWith("/media/")) {
    const base = (import.meta as any).env?.VITE_API_BASE_URL?.replace("/api", "") || "http://127.0.0.1:8000";
    img = `${base}${img}`;
  }
  if (!img || img.includes("placeholder")) {
    const id = apiProduct.id;
    img = id && id <= 8 ? `/images/p${id}.jpg` : "/images/placeholder.jpg";
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
    brand: brandName,
    tag: apiProduct.tag || undefined,
    category: catName,
    image: img,
    badge: apiProduct.badge || undefined,
    available: apiProduct.available,
    stock: apiProduct.stock ?? 0,
  };
}
