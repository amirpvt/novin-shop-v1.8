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
        src="/images/banner3.jpg"
        alt="پخش سوسیس و کالباس نوین"
        className="absolute inset-0 -z-20 h-full w-full object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-l from-stone-950/90 via-stone-900/75 to-ember-950/55" />

      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-28 text-center sm:px-6 sm:py-36 lg:py-44">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-ember-100 backdrop-blur">
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
            className="w-full rounded-full bg-ember-500 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-ember-500/30 transition hover:bg-ember-600 sm:w-auto"
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
          <PhoneIcon className="h-4 w-4 text-ember-300" />
          سفارش تلفنی: {phone}
        </a>
      </div>
    </section>
  );
}
