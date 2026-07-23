import type { ReactNode } from "react";
import { brands } from "../data";

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
  return (
    <section className="border-b border-stone-100 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-100 px-4 py-1.5 text-xs font-bold text-gold-700">
            ★ بهترین‌های صنعت فرآورده‌های گوشتی
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold text-stone-800 sm:text-4xl">
            برندهای همکار ما در توزیع
          </h2>
          <p className="mt-2 text-base text-stone-500">
            افتخار همکاری با معتبرترین و باکیفیت‌ترین نام‌های ایران در پخش عمده و خرده
          </p>
        </div>

        {/* Larger brand cards with magnificent icon displays */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {brands.map((b) => (
            <button
              key={b.name}
              onClick={() => onSelect(b.name)}
              className="group relative flex flex-col items-center justify-between overflow-hidden rounded-3xl border border-stone-200/80 bg-gradient-to-b from-white to-cream-50/40 p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-paprika-400 hover:shadow-xl hover:shadow-paprika-950/10 cursor-pointer"
            >
              {/* Subtle top glow on hover */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-paprika-500 to-gold-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              {/* Extremely large icon / image container */}
              <div className="relative my-4 flex h-32 w-32 items-center justify-center rounded-2xl bg-white p-2 transition-transform duration-500 group-hover:scale-110 sm:h-36 sm:w-36">
                <img 
                  src={b.image} 
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
                <h3 className="font-display text-lg font-bold text-stone-800 transition-colors group-hover:text-paprika-700 sm:text-xl">
                  {b.name}
                </h3>
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">
                  نماینده پخش رسمی
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
