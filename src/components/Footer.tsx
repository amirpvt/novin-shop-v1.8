import { phoneFixed, mobilePhone, address } from "../data";

type Props = {
  id: string;
  siteName: string;
  onOrder: () => void;
  onShop?: () => void;
  onAbout?: () => void;
  onContact?: () => void;
};

export default function Footer({ id, siteName, onOrder, onShop, onAbout, onContact }: Props) {
  const designerName = "امیرحسین تقی زاده";
  const designerPhone = "09050127673";

  return (
    <footer id={id} className="bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 text-stone-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <img src="/images/logo.png" alt={siteName} className="h-10 w-10 rounded-xl object-cover" />
              <span className="font-display text-xl text-white">{siteName}</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-stone-400">
              توزیع عمده و خرده‌فروشی انواع سوسیس، کالباس و فرآورده‌های گوشتی.
            </p>
            {/* نشان اعتماد مشتری */}
            <div className="mt-6 flex items-center gap-2 text-[11px] text-stone-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>آنلاین و آماده خدمت‌رسانی</span>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white">دسترسی سریع</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><button onClick={onOrder} className="transition hover:text-gold-400">سفارش عمده</button></li>
              <li><button onClick={onShop} className="transition hover:text-gold-400">فروشگاه</button></li>
              <li><button onClick={onAbout} className="transition hover:text-gold-400">درباره ما و برندهای همکار</button></li>
              <li><button onClick={onContact} className="transition hover:text-gold-400">تماس با ما</button></li>
              <li><a href="/track" className="transition hover:text-gold-400">پیگیری سفارش</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white">اطلاعات تماس</h4>
            <ul className="mt-4 space-y-3 text-sm text-stone-400">
              <li className="leading-loose text-stone-300">📍 {address}</li>
              <li className="flex flex-col gap-1">
                <span className="text-[11px]">📞 تلفن ثابت:</span>
                <a href={`tel:${phoneFixed.replace(/-/g, "")}`} dir="ltr" className="font-mono font-bold text-white hover:text-gold-400 text-right">{phoneFixed}</a>
              </li>
              <li className="flex flex-col gap-1">
                <span className="text-[11px]">📱 همراه:</span>
                <a href={`tel:${mobilePhone.replace(/-/g, "")}`} dir="ltr" className="font-mono font-bold text-gold-400 hover:text-gold-300 text-right">{mobilePhone}</a>
              </li>
            </ul>
          </div>
        </div>

        {/* کپی رایت + طراح سایت - حرفه‌ای */}
        <div className="mt-12 border-t border-white/10 pt-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-center md:text-right">
              <p className="text-sm text-stone-500">
                © {new Date().getFullYear()} {siteName} — تمامی حقوق محفوظ است.
              </p>
              <p className="mt-2 text-xs text-stone-600 hidden md:block">{address}</p>
            </div>

            {/* امضای طراح - حرفه‌ای و ظریف */}
            <div className="flex flex-col items-center gap-2 md:items-end">
              <div className="group relative overflow-hidden rounded-full border border-white/10 bg-white/5 px-5 py-2.5 backdrop-blur transition hover:border-gold-500/30 hover:bg-white/10">
                <div className="absolute inset-0 bg-gradient-to-r from-gold-500/0 via-gold-500/10 to-paprika-500/0 opacity-0 transition group-hover:opacity-100" />
                <div className="relative flex items-center gap-2.5 text-xs">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-paprika-600 text-[10px] font-black text-white">A</span>
                  <span className="text-stone-400">طراح سایت:</span>
                  <span className="font-bold text-white">{designerName}</span>
                  <span className="text-stone-600">|</span>
                  <a href={`tel:${designerPhone}`} dir="ltr" className="font-mono font-bold text-gold-400 hover:text-gold-300 transition tracking-wider">
                    {designerPhone}
                  </a>
                </div>
              </div>
              <p className="text-[10px] text-stone-600">طراحی و توسعه با ❤️ برای پخش نوین</p>
            </div>
          </div>
        </div>
      </div>

      {/* نوار باریک پایین - نسخه مینیمال برای موبایل */}
      <div className="border-t border-white/5 bg-black/20 py-3 text-center md:hidden">
        <p className="text-[11px] text-stone-500">
          طراح: <span className="font-bold text-stone-300">{designerName}</span> | <a href={`tel:${designerPhone}`} className="font-mono text-gold-400">{designerPhone}</a>
        </p>
      </div>
    </footer>
  );
}
