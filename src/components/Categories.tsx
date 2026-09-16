import { useEffect, useState } from "react";
import { productsApi } from "../api/client";

// ✅ عکس‌های دسته‌بندی از فضای خود پروژه - نه Pexels
const CAT_IMAGES_LOCAL: Record<string, string> = {
  سوسیس: "/images/categories/sausage.jpg",
  کالباس: "/images/categories/calbas.jpg",
  "فرآورده های منجمد": "/images/categories/frozen-products.jpg",
  "سس": "/images/categories/sauces.jpg",
  "ترشی، خیارشور و زیتون": "/images/categories/pickles-olives.jpg",
  "نوشیدنی ها": "/images/categories/drinks.jpg",
  "پنیر ها": "/images/categories/cheese.jpg",
  sausage: "/images/categories/sausage.jpg",
  kalbas: "/images/categories/calbas.jpg",
  frozen: "/images/categories/frozen-products.jpg",
  sauce: "/images/categories/sauces.jpg",
  "pickles-olives": "/images/categories/pickles-olives.jpg",
  drinks: "/images/categories/drinks.jpg",
  cheese: "/images/categories/cheese.jpg",
  // fallback اضافی
  default1: "/images/categories/p1.jpg",
  default2: "/images/categories/p3.jpg",
  default3: "/images/categories/p5.jpg",
};

const CAT_SUB: Record<string, string> = {
  سوسیس: "سوسیس آلمانی، دودی، مرغ و کوکتل",
  کالباس: "کالباس گوشت، مرغ، ژامبون و کم‌نمک",
  "فرآورده های منجمد": "ناگت، کتلت، برگر و سمبوسه",
  "سس": "انواع سس برای فست‌فود، رستوران و مصرف خانگی",
  "ترشی، خیارشور و زیتون": "ترشیجات، خیارشور و زیتون مناسب سفارش‌های غذایی",
  "نوشیدنی ها": "نوشیدنی‌های سرد و مکمل سفارش‌های غذایی",
  "پنیر ها": "انواع پنیر مناسب فست‌فود، رستوران و مصرف خانگی",
  sausage: "سوسیس آلمانی، دودی، مرغ",
  kalbas: "کالباس گوشت و مرغ",
  frozen: "ناگت، کتلت، برگر",
  sauce: "انواع سس برای فست‌فود و رستوران",
  "pickles-olives": "ترشیجات، خیارشور و زیتون",
  drinks: "نوشیدنی‌های سرد و مکمل سفارش",
  cheese: "انواع پنیر مناسب فست‌فود و رستوران",
};

type Props = {
  onSelect: (category: string) => void;
};

type CategoryWithImage = {
  id: number;
  name: string;
  slug: string;
  image?: string | null;
  description?: string;
};

export default function Categories({ onSelect }: Props) {
  const [apiCategories, setApiCategories] = useState<CategoryWithImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const cats: any = await productsApi.getCategories();
        const list = (cats.results ?? cats) as CategoryWithImage[];
        setApiCategories(Array.isArray(list) ? list : []);
      } catch {
        setApiCategories([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getImageUrl = (cat: CategoryWithImage) => {
    // اگر از API عکس دلخواه اومده (از پنل ادمین آپلود شده)، همون رو نشون بده
    if (cat.image) {
      if (cat.image.startsWith("http") || cat.image.startsWith("/media/")) {
        if (cat.image.startsWith("/media/")) {
          const base = (import.meta as any).env?.VITE_API_BASE_URL?.replace("/api", "") || "http://127.0.0.1:8000";
          return `${base}${cat.image}`;
        }
        return cat.image;
      }
      return cat.image;
    }
    // ✅ فقط عکس‌های لوکال پروژه
    return CAT_IMAGES_LOCAL[cat.name] || CAT_IMAGES_LOCAL[cat.slug] || CAT_IMAGES_LOCAL[`default${(cat.id % 3) + 1}`] || "/images/placeholder.jpg";
  };

  if (loading) {
    return (
      <section className="bg-cream-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[30rem] rounded-[2rem] bg-stone-100 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-cream-50 to-white py-20 sm:py-28">
      <div className="pointer-events-none absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-paprika-200/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-gold-200/30 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-paprika-50 px-4 py-1.5 text-xs font-bold text-paprika-700">
            ★ کاتالوگ محصولات نوین
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold text-stone-800 sm:text-5xl">دسته‌بندی محصولات</h2>
          <p className="mx-auto mt-3 max-w-2xl text-stone-500">روی هر دسته کلیک کنید تا محصولات آن را در فروشگاه مشاهده کنید</p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
          {apiCategories.map((cat, idx) => (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.name)}
              style={{ animationDelay: `${idx * 120}ms` }}
              className="group relative flex h-[30rem] flex-col justify-end overflow-hidden rounded-[2rem] border border-stone-200/70 bg-stone-900 text-right shadow-xl shadow-stone-900/10 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-paprika-900/20 cursor-pointer sm:h-[34rem]"
            >
              <img
                src={getImageUrl(cat)}
                alt={cat.name}
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.src = "/images/placeholder.jpg";
                }}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-stone-950/20 to-transparent transition group-hover:from-stone-950/60 group-hover:via-stone-950/10" />

              <div className="relative z-10 p-8 text-white">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-paprika-500" />
                  دسته‌بندی
                </div>
                <h3 className="font-display text-3xl font-bold drop-shadow-lg sm:text-4xl">{cat.name}</h3>
                <p className="mt-2 text-sm text-stone-200/90 leading-relaxed">
                  {CAT_SUB[cat.name] || CAT_SUB[cat.slug] || cat.description || "محصولات متنوع نوین"}
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-white/20 pt-4">
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-gold-300 transition group-hover:gap-3">
                    مشاهده محصولات <span className="transition group-hover:-translate-x-1">←</span>
                  </span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur transition group-hover:bg-paprika-600">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
