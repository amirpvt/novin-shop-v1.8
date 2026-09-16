import { useEffect, useState } from "react";
import { siteName, siteSlogan, phone } from "../data";
import { PhoneIcon } from "./icons";

type Props = {
  onProducts: () => void;
  onOrder: () => void;
};

const bannerImages = [
  "/images/banners/banner1.png",
  "/images/banners/banner2.png",
  "/images/banners/banner3.png",
  "/images/banners/banner4.png",
  "/images/banners/banner5.png",
  "/images/banners/banner6.png",
];

export default function Banner({ onProducts, onOrder }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % bannerImages.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const goPrev = () => {
    setActiveIndex((prev) => (prev - 1 + bannerImages.length) % bannerImages.length);
  };

  const goNext = () => {
    setActiveIndex((prev) => (prev + 1) % bannerImages.length);
  };

  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-20 overflow-hidden" dir="ltr">
        <div
          className="flex h-full w-full transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {bannerImages.map((src) => (
            <div key={src} className="h-full w-full flex-shrink-0">
              <img
                src={src}
                alt="پخش سوسیس و کالباس نوین"
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-l from-stone-950/55 via-stone-900/30 to-stone-950/15" />

      <button
        type="button"
        onClick={goNext}
        className="absolute right-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-stone-950/35 text-2xl font-black text-white shadow-xl backdrop-blur transition hover:bg-white/20 sm:flex"
        aria-label="تصویر قبلی"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={goPrev}
        className="absolute left-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-stone-950/35 text-2xl font-black text-white shadow-xl backdrop-blur transition hover:bg-white/20 sm:flex"
        aria-label="تصویر بعدی"
      >
        ›
      </button>

      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-20 text-center sm:px-6 sm:py-28 lg:py-32">
        {/* 🆕 لوگوی بزرگ روی بنر */}
        <div className="relative mb-8">
          <div className="absolute -inset-4 rounded-[2rem] bg-white/20 blur-xl" />
          <div className="relative flex h-28 w-28 sm:h-36 sm:w-36 lg:h-44 lg:w-44 items-center justify-center rounded-[2rem] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.4)] ring-4 ring-white/20 overflow-hidden">
            <img
              src="/images/logo.png"
              alt="لوگوی پخش نوین"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-3 -right-3 flex h-10 w-10 items-center justify-center rounded-full bg-paprika-600 text-white shadow-lg ring-4 ring-stone-900/20">
            <span className="text-xs font-black">نوین</span>
          </div>
        </div>

        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-amber-100 backdrop-blur">
          توزیع عمده سراسری
        </span>

        <h1 className="mt-6 font-display text-4xl leading-tight text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.75)] sm:text-5xl lg:text-6xl">
          {siteName}
        </h1>

        <p className="mt-5 max-w-2xl text-base leading-relaxed text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.7)] sm:text-lg">
          {siteSlogan}
        </p>

        <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
          <button
            onClick={onProducts}
            className="w-full rounded-full bg-paprika-600 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-paprika-600/30 transition hover:bg-paprika-700 sm:w-auto"
          >
            مشاهده محصولات
          </button>
          <button
            onClick={onOrder}
            className="w-full rounded-full border-2 border-white/70 bg-white/5 px-8 py-3.5 text-base font-bold text-white backdrop-blur transition hover:bg-white/15 sm:w-auto"
          >
            سفارش عمده
          </button>
        </div>

        <a
          href={`tel:${phone.replace(/-/g, "")}`}
          className="mt-8 inline-flex items-center gap-2 text-sm text-stone-300"
        >
          <PhoneIcon className="h-4 w-4 text-amber-300" />
          سفارش تلفنی: {phone}
        </a>

        <div className="mt-8 flex items-center gap-2" dir="ltr">
          {bannerImages.map((src, idx) => (
            <button
              key={src}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`h-2.5 rounded-full transition-all ${idx === activeIndex ? "w-8 bg-white" : "w-2.5 bg-white/40 hover:bg-white/70"}`}
              aria-label={`نمایش تصویر ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
