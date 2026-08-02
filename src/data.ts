export const siteName = "پخش سوسیس و کالباس نوین";
export const siteSlogan =
  "توزیع عمده و خرده‌فروشی انواع سوسیس، کالباس و فرآورده‌های گوشتی با بهترین برندها";

export const phone = "09300117977";
export const phoneFixed = "02636640196";
export const mobilePhone = "09300117977";
export const address = "استان البرز، کرج، جاده ملارد، خیابان نیروگاه، شهرک ارم، روبروی آتشنشانی، خیابان پریسای شرقی، جنب حسینیه چهارده معصوم، پخش نوین";

export const brands: { name: string; image: string }[] = [
  { name: "فرآورده های گوشتی گلچین", image: "/images/brands/golchin.jpg" },
  { name: "202", image: "/images/brands/202.jpg" },
  { name: "لاله بناب", image: "/images/brands/laleh-bonab.jpg" },
  { name: "سس 88", image: "/images/brands/sauce88.jpg" },
  { name: "شام ایرانی", image: "/images/brands/shamirani.jpg" },
];

export const categories = ["سوسیس", "کالباس", "فرآورده های منجمد"] as const;

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
  stock?: number;
  is_featured?: boolean;
  brand_name?: string;
  category_name?: string;
};

export const products: Product[] = [
  {
    id: 1,
    name: "سوسیس بلغاری گوشت",
    description: "۱۰۰٪ گوشت گوساله تازه با ادویه‌جات طبیعی و دودی ملایم.",
    price: 89000,
    unit: "هر بسته ۵۰۰ گرم",
    brand: "فرآورده های گوشتی گلچین",
    tag: "پرفروش‌ترین",
    category: "سوسیس",
    image: "/images/p1.jpg",
    badge: "گوشت تازه",
    available: true,
    stock: 150,
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
    stock: 80,
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
    stock: 45,
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
    stock: 120,
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
    stock: 200,
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
    available: false,
    stock: 0,
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
    stock: 60,
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
    stock: 35,
  },
];

export function formatPrice(n: number) {
  return n.toLocaleString("fa-IR") + " تومان";
}

export function mapApiProduct(apiProduct: any): Product {
  const brandName = apiProduct.brand_name || (typeof apiProduct.brand === "string" ? apiProduct.brand : "") || "";
  const catName = apiProduct.category_name || (apiProduct.category ? String(apiProduct.category) : "") || "";
  let img = apiProduct.image || "/images/placeholder.jpg";
  if (!img || img.includes("placeholder")) {
    const id = apiProduct.id;
    img = id && id <= 8 ? `/images/p${id}.jpg` : "/images/placeholder.jpg";
  }
  return {
    id: apiProduct.id,
    name: apiProduct.name,
    description: apiProduct.description || apiProduct.name,
    price: parseFloat(apiProduct.price) || 0,
    unit: apiProduct.unit || "بسته",
    brand: brandName,
    brand_name: brandName,
    tag: apiProduct.tag || undefined,
    category: catName,
    category_name: catName,
    image: img,
    badge: apiProduct.badge || undefined,
    available: apiProduct.available,
    stock: apiProduct.stock ?? 0,
    is_featured: apiProduct.is_featured ?? false,
  };
}
