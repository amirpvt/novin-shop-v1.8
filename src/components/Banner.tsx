import { siteName, siteSlogan, phone } from "../data";
import { PhoneIcon } from "./icons";

type Props = {
  onProducts: () => void;
  onOrder: () => void;
};

export default function Banner({ onProducts, onOrder }: Props) {
  return (
    <section className="relative isolate overflow-hidden">
      <img
        src="/images/banner7.png"
        alt="پخش سوسیس و کالباس نوین"
        className="absolute inset-0 -z-20 h-full w-full object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-l from-stone-950/90 via-stone-900/75 to-stone-950/55" />

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

        <h1 className="mt-6 font-display text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">
          {siteName}
        </h1>

        <p className="mt-5 max-w-2xl text-base leading-relaxed text-stone-200 sm:text-lg">
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
      </div>
    </section>
  );
}
