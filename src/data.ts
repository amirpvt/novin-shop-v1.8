export const siteName = "پخش سوسیس و کالباس نوین";
export const siteSlogan =
  "توزیع عمده و خرده‌فروشی انواع سوسیس، کالباس و فرآورده‌های گوشتی با بهترین برندها";

export const phone = "۰۲۱-۱۲۳۴۵۶۷۸";

export const brands: { name: string; image: string }[] = [
  { name: "فرآورده های گوشتی گلچین", image: "/images/brands/golchin.jpg" },
  { name: "202", image: "/images/brands/202.jpg" },
  { name: "لاله بناب", image: "/images/brands/laleh-bonab.jpg" },
  { name: "سس 88", image: "/images/brands/sauce88.jpg" },
  { name: "شام ایرانی", image: "/images/brands/shamirani.jpg" },
];

export const categories = ["سوسیس", "کالباس", "فرآورده های منجمد"] as const;

// ─── Product type (سازگار با API Django) ──────────────────────────────
// id = number (Django auto-increment PK)
// desc → description (نام فیلد در Django)

export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  unit: string;
  brand: string;
  tag?: string;
  category: string;
  image: string;
  badge?: string;
  available: boolean;
};

// ─── Fallback mock data (اگر API در دسترس نباشد) ─────────────────────

export const products: Product[] = [
  {
    id: 1,
    name: "سوسیس بالایی گوشت",
    description: "۱۰۰٪ گوشت گوساله تازه با ادویه‌جات طبیعی و دودی ملایم.",
    price: 89000,
    unit: "هر بسته ۵۰۰ گرم",
    brand: "فرآورده های گوشتی گلچین",
    tag: "پرفروش‌ترین",
    category: "سوسیس",
    image: "/images/p1.jpg",
    badge: "گوشت تازه",
    available: true,
  },
  {
    id: 2,
    name: "کالباس گوشت کلاسیک",
    description: "بافت نرم و طعم دلچسب برای صبحانه و ساندویچ.",
    price: 76000,
    unit: "هر بسته ۴۰۰ گرم",
    brand: "فرآورده های گوشتی گلچین",
    category: "کالباس",
    image: "/images/p2.jpg",
    badge: "کم‌چرب",
    available: true,
  },
  {
    id: 3,
    name: "فرانکفورتر دودی",
    description: "سوسیس فرانکفورتر اصیل با پوشش طبیعی و طعم دودی.",
    price: 95000,
    unit: "هر بسته ۶ عددی",
    brand: "202",
    tag: "جدید",
    category: "سوسیس",
    image: "/images/p3.jpg",
    badge: "دودی",
    available: true,
  },
  {
    id: 4,
    name: "سوسیس مرغ سفید",
    description: "سبک و کم‌چرب با سینه مرغ تازه، مناسب رژیمی.",
    price: 69000,
    unit: "هر بسته ۵۰۰ گرم",
    brand: "لاله بناب", 
    category: "سوسیس",
    image: "/images/p4.jpg",
    badge: "رژیمی",
    available: true,
  },
  {
    id: 5,
    name: "سوسیس کوکتل",
    description: "اندازه کوچک و طعم بی‌نظیر برای مهمانی و پیش‌غذا — منجمد.",
    price: 82000,
    unit: "هر بسته ۳۰۰ گرم",
    brand: "سس 88",
    category: "فرآورده های منجمد",
    image: "/images/p5.jpg",
    badge: "مهمانی",
    available: true,
  },
  {
    id: 6,
    name: "کالباس کم‌نمک",
    description: "ویژه سالمندان و کودکان با سدیم پایین.",
    price: 88000,
    unit: "هر بسته ۴۰۰ گرم",
    brand: "شام ایرانی",
    category: "کالباس",
    image: "/images/p6.jpg",
    badge: "کم‌نمک",
    available: true,
  },
  {
    id: 7,
    name: "ناگت مرغ",
    description: "ناگت مرغ ترد و آماده طبخ، منجمد و بسته‌بندی بهداشتی.",
    price: 79000,
    unit: "هر بسته ۴۰۰ گرم",
    brand: "شام ایرانی",
    category: "فرآورده های منجمد",
    image: "/images/p7.jpg",
    badge: "منجمد",
    available: true,
  },
  {
    id: 8,
    name: "کتلت گوشت",
    description: "کتلت گوشت خانگی با طعم اصیل، منجمد و آماده سرخ‌کردن.",
    price: 99000,
    unit: "بسته ۶ عددی",
    brand: "شام ایرانی",
    category: "فرآورده های منجمد",
    image: "/images/p8.jpg",
    badge: "منجمد",
    available: true,
  },
];

export function formatPrice(n: number) {
  return n.toLocaleString("fa-IR") + " تومان";
}

// ─── Mapper: API Product → Frontend Product ────────────────────────────
// تبدیل محصول API به فرمت فرانت‌اند

export function mapApiProduct(apiProduct: import("./api/client").ApiProduct): Product {
  return {
      id: apiProduct.id,
      name: apiProduct.name,
      description: apiProduct.description || apiProduct.name,
      price: parseFloat(apiProduct.price),
      unit: apiProduct.unit || "",

      brand: apiProduct.brand || "",

      tag: apiProduct.tag || undefined,
      category: apiProduct.category_name || "",
      image: apiProduct.image || "/images/placeholder.jpg",
      badge: apiProduct.badge || undefined,
      available: apiProduct.available,
  };
}