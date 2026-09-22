import { useEffect, useRef, useState, type ReactNode } from "react";
import { productsApi } from "../api/client";

type Brand = { id: number; name: string; slug?: string; logo?: string | null; description?: string; is_active?: boolean; is_featured?: boolean; };

// Custom high-quality SVG vector logos/icons for each brand
const BRAND_ICONS: Record<string, ReactNode> = {
  "فرآورده های گوشتی گلچین": (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <defs>
        <linearGradient id="golchin-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#991b1b" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#golchin-grad)" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="#fef08a" strokeWidth="2" strokeDasharray="4,4" />
      {/* Chef Hat & Premium Ribbon */}
      <path d="M35 55 Q30 40 40 35 Q50 25 60 35 Q70 40 65 55 Z" fill="#ffffff" />
      <rect x="37" y="55" width="26" height="8" rx="2" fill="#facc15" />
      {/* Stars */}
      <polygon points="50,68 52,72 56,72 53,75 54,79 50,77 46,79 47,75 44,72 48,72" fill="#ffffff" />
    </svg>
  ),

  "۲۰۲": (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <defs>
        <linearGradient id="g202" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1e40af" />
        </linearGradient>
        <linearGradient id="flame" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#facc15" />
        </linearGradient>
      </defs>
      <rect x="5" y="5" width="90" height="90" rx="25" fill="url(#g202)" />
      {/* Flame behind typography */}
      <path d="M50 80 C30 80 30 50 45 40 C40 55 55 50 50 25 C65 40 70 60 50 80 Z" fill="url(#flame)" opacity="0.9" />
      {/* Bold 202 in Persian digits */}
      <text x="50" y="66" font-family="sans-serif" font-weight="900" font-size="34" fill="#ffffff" textAnchor="middle" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.5))">
        ۲۰۲
      </text>
    </svg>
  ),

  "لاله بناب": (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <defs>
        <linearGradient id="alaleh-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#18181b" />
          <stop offset="100%" stopColor="#27272a" />
        </linearGradient>
        <linearGradient id="tulip" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#991b1b" />
        </linearGradient>
      </defs>
      <polygon points="50,4 94,26 94,74 50,96 6,74 6,26" fill="url(#alaleh-bg)" stroke="#ea580c" strokeWidth="3" />
      {/* Skewers */}
      <line x1="20" y1="80" x2="80" y2="20" stroke="#a1a1aa" strokeWidth="4" strokeLinecap="round" />
      <line x1="80" y1="80" x2="20" y2="20" stroke="#a1a1aa" strokeWidth="4" strokeLinecap="round" />
      {/* Red Tulip Anemone */}
      <path d="M50 70 C30 50 35 25 50 40 C65 25 70 50 50 70 Z" fill="url(#tulip)" />
      <circle cx="50" cy="45" r="5" fill="#facc15" />
    </svg>
  ),

  "سس ۸۸": (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <defs>
        <linearGradient id="sauce-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#b91c1c" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#sauce-bg)" stroke="#fef08a" strokeWidth="3" />
      {/* Bottle Silhouette */}
      <path d="M42 20 L58 20 L58 32 C58 35 64 38 64 45 L64 75 C64 80 60 84 50 84 C40 84 36 80 36 75 L36 45 C36 38 42 35 42 32 Z" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
      {/* Bottle Cap */}
      <rect x="43" y="14" width="14" height="6" rx="2" fill="#facc15" />
      {/* Gold Label displaying 88 */}
      <ellipse cx="50" cy="60" rx="11" ry="8" fill="#facc15" />
      <text x="50" y="64" font-family="sans-serif" font-weight="900" font-size="14" fill="#7f1d1d" textAnchor="middle">
        ۸۸
      </text>
    </svg>
  ),

  "شامیرانی": (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <defs>
        <linearGradient id="shamirani-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#831843" />
          <stop offset="100%" stopColor="#500724" />
        </linearGradient>
        <linearGradient id="gold-border" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
      </defs>
      {/* Elegant Premium Shield/Crest */}
      <path d="M50 5 L85 20 L85 60 C85 80 50 95 50 95 C50 95 15 80 15 60 L15 20 Z" fill="url(#shamirani-bg)" stroke="url(#gold-border)" strokeWidth="4" />
      {/* Salami Slice illustration inside */}
      <circle cx="50" cy="50" r="22" fill="#be123c" stroke="#fecdd3" strokeWidth="2" />
      {/* Salami fat specks */}
      <circle cx="45" cy="45" r="2.5" fill="#ffffff" />
      <circle cx="56" cy="48" r="2" fill="#ffffff" />
      <circle cx="48" cy="56" r="2.5" fill="#ffffff" />
      <circle cx="40" cy="52" r="1.5" fill="#ffffff" />
      <circle cx="54" cy="57" r="1.5" fill="#ffffff" />
      {/* Crown */}
      <path d="M38 32 L44 38 L50 30 L56 38 L62 32 L60 25 L40 25 Z" fill="#facc15" />
    </svg>
  ),
};

type Props = {
  onSelect: (brand: string) => void;
};

export default function Brands({ onSelect }: Props) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const brandRailRef = useRef<HTMLDivElement | null>(null);

  const updateScrollProgress = () => {
    const el = brandRailRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) {
      setScrollProgress(1);
      return;
    }
    setScrollProgress(Math.min(1, Math.max(0, Math.abs(el.scrollLeft) / maxScroll)));
  };

  useEffect(() => {
    let ignore = false;
    productsApi.getBrands()
      .then((data: any) => {
        const list = data?.results ?? data;
        if (!ignore) setBrands(Array.isArray(list) ? list.filter((b: Brand) => b.is_active !== false && b.is_featured === true) : []);
      })
      .catch(() => {
        if (!ignore) setBrands([]);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    window.requestAnimationFrame(updateScrollProgress);
  }, [brands]);

  if (loading) {
    return (
      <section className="border-b border-stone-100 bg-white py-10 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((item) => <div key={item} className="h-56 w-[72vw] max-w-[280px] shrink-0 animate-pulse rounded-3xl bg-stone-100 sm:h-64 sm:w-auto sm:max-w-none" />)}
          </div>
        </div>
      </section>
    );
  }

  if (brands.length === 0) return null;

  return (
    <section className="border-b border-stone-100 bg-white py-10 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-100 px-4 py-1.5 text-xs font-bold text-gold-700">
            ★ بهترین‌های صنعت فرآورده‌های گوشتی
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold text-stone-800 sm:text-4xl">
            برندهای همکار ما در توزیع
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-500 sm:text-base">
            افتخار همکاری با معتبرترین و باکیفیت‌ترین نام‌های ایران در پخش عمده و خرده
          </p>
          <div className="mx-auto mt-3 flex w-fit items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-4 py-2 text-[11px] font-black text-gold-800 shadow-sm sm:hidden">
            برندها را افقی بکشید
          </div>
        </div>

        {/* Mobile: horizontal brand rail / Desktop: original grid */}
        <div className="relative mt-8 sm:mt-12">
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white to-transparent sm:hidden" />
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white to-transparent sm:hidden" />
          <div
            ref={brandRailRef}
            onScroll={updateScrollProgress}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-5 scrollbar-hide sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-5"
          >
          {brands.map((b) => (
            <button
              key={b.name}
              onClick={() => onSelect(b.name)}
              className="group relative flex w-[74vw] max-w-[290px] shrink-0 snap-center flex-col items-center justify-between overflow-hidden rounded-[1.75rem] border border-stone-200/80 bg-gradient-to-b from-white to-cream-50/40 p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-paprika-400 hover:shadow-xl hover:shadow-paprika-950/10 cursor-pointer sm:w-auto sm:max-w-none sm:rounded-3xl sm:p-8"
            >
              {/* Subtle top glow on hover */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-paprika-500 to-gold-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              {/* Extremely large icon / image container */}
              <div className="relative my-3 flex h-24 w-24 items-center justify-center rounded-2xl bg-white p-2 transition-transform duration-500 group-hover:scale-110 sm:my-4 sm:h-36 sm:w-36">
                <img 
                  src={b.logo || "/images/placeholder.jpg"} 
                  alt={b.name}
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    // Fallback to SVG if image file doesn't exist
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.classList.add('fallback-svg');
                  }}
                />
                {/* Definitive SVG Brand Vector Icon (Fallback) */}
                <div className="absolute inset-0 p-2 opacity-0 [.fallback-svg_&]:opacity-100">
                  {BRAND_ICONS[b.name]}
                </div>
              </div>

              {/* Brand Name Text */}
              <div className="mt-2 flex flex-col items-center">
                <h3 className="font-display text-base font-bold text-stone-800 transition-colors group-hover:text-paprika-700 sm:text-xl">
                  {b.name}
                </h3>
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">
                  نماینده پخش رسمی
                </span>
              </div>
            </button>
          ))}
          </div>
          <div className="mx-auto mt-1 flex h-2 w-32 justify-end overflow-hidden rounded-full bg-stone-100 shadow-inner sm:hidden" dir="ltr">
            <div
              className="h-full rounded-full bg-gradient-to-r from-paprika-500 to-gold-500 transition-all duration-200 ease-out"
              style={{ width: `${Math.max(10, scrollProgress * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
