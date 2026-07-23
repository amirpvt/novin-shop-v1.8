import { phone } from "../data";

type Props = {
  id: string;
  siteName: string;
  onOrder: () => void;
  onShop?: () => void;
  onAbout?: () => void;
  onContact?: () => void;
};

export default function Footer({ id, siteName, onOrder, onShop, onAbout, onContact }: Props) {
  return (
    <footer id={id} className="bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <img
                src="/images/logo.png"
                alt={siteName}
                className="h-10 w-10 rounded-xl object-cover"
              />
              <span className="font-display text-xl text-white">{siteName}</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-stone-400">
              توزیع عمده و خرده‌فروشی انواع سوسیس، کالباس و فرآورده‌های گوشتی.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white">دسترسی سریع</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <button onClick={onOrder} className="transition hover:text-gold-400">
                  سفارش عمده
                </button>
              </li>
              <li>
                <button onClick={onShop} className="transition hover:text-gold-400">
                  فروشگاه
                </button>
              </li>
              <li>
                <button onClick={onAbout} className="transition hover:text-gold-400">
                  درباره ما و برندهای همکار
                </button>
              </li>
              <li>
                <button onClick={onContact} className="transition hover:text-gold-400">
                  تماس با ما
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white">اطلاعات تماس</h4>
            <ul className="mt-4 space-y-2 text-sm text-stone-400">
              <li>تهران، شهرک صنعتی غذایی</li>
              <li dir="ltr" className="text-right">{phone}</li>
              <li dir="ltr" className="text-right">info@novin-sausage.ir</li>
              <li>پشتیبانی ۲۴ ساعته</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-5 text-center text-sm text-stone-500">
          © {new Date().getFullYear()} {siteName} — تمامی حقوق محفوظ است.
        </div>
      </div>
    </footer>
  );
}
