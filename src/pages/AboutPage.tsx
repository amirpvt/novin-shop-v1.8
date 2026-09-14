import { useEffect, useState } from "react";
import { siteName, siteSlogan, phoneFixed, mobilePhone, address } from "../data";
import { PhoneIcon, ArrowRightIcon } from "../components/icons";
import { productsApi } from "../api/client";

type Props = {
  onBack: () => void;
  onShop: () => void;
  onOrder: () => void;
};

export default function AboutPage({ onBack, onShop, onOrder }: Props) {
  const [brands, setBrands] = useState<{ id: number; name: string; is_active?: boolean }[]>([]);

  useEffect(() => {
    let ignore = false;
    productsApi.getBrands()
      .then((data: any) => {
        const list = data?.results ?? data;
        if (!ignore) setBrands(Array.isArray(list) ? list.filter((b: any) => b.is_active !== false) : []);
      })
      .catch(() => {
        if (!ignore) setBrands([]);
      });
    return () => { ignore = true; };
  }, []);

  const values = [
    {
      icon: "🏆",
      title: "کیفیت بی‌رقیب",
      desc: "انتخاب دقیق محصولات از برترین کارخانجات کشور و کنترل کیفی در تمام مراحل توزیع.",
    },
    {
      icon: "❄️",
      title: "زنجیره سرمای استاندارد",
      desc: "ناوگان مجهز به یخچال‌های زیر صفر و بالای صفر برای حفظ تازگی در تمام مسیر توزیع.",
    },
    {
      icon: "🤝",
      title: "اعتماد دو دهه‌ای",
      desc: "همکاری مستمر با هزاران فروشگاه، فست‌فود، رستوران و هایپرمارکت در سراسر ایران.",
    },
    {
      icon: "🚚",
      title: "ارسال سریع و مطمئن",
      desc: "تحویل در البرز و تهران کمتر از ۲۴ ساعت و ارسال تخصصی به تمامی شهرستان‌ها.",
    },
    {
      icon: "💎",
      title: "تنوع بی‌نظیر محصولات",
      desc: "بیش از ۴۰ نوع محصول در سه دسته سوسیس، کالباس و فرآورده‌های منجمد از برندهای معتبر.",
    },
    {
      icon: "📞",
      title: "پشتیبانی ۲۴ ساعته",
      desc: "تیم فروش و پشتیبانی ما در تمام ساعات شبانه‌روز آماده پاسخ‌گویی و ثبت سفارش هستند.",
    },
  ];

  const stats = [
    { value: "+۲۰", label: "سال سابقه درخشان" },
    { value: "+۴۰", label: "نوع محصول متنوع" },
    { value: "+۱۰۰۰", label: "مشتری وفادار فعال" },
    { value: "۳۱", label: "استان تحت پوشش" },
  ];

  return (
    <div className="min-h-screen bg-cream-50 font-sans text-stone-800">
      {/* HERO */}
      <section className="relative isolate overflow-hidden">
        <img
          src="/images/banners/banner7.png"
          alt="درباره پخش سوسیس و کالباس نوین"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-l from-stone-950/92 via-stone-900/80 to-paprika-950/60" />

        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 text-center text-white">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold backdrop-blur">
            ★ درباره مجموعه ما
          </span>
          <h1 className="mt-6 font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            درباره {siteName}
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-stone-200 sm:text-lg">
            بیش از دو دهه تجربه، اعتماد و کیفیت در صنعت توزیع فرآورده‌های گوشتی ایران
          </p>

          <button
            onClick={onBack}
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold backdrop-blur transition hover:bg-white/20"
          >
            <ArrowRightIcon className="h-4 w-4" />
            بازگشت به صفحه نخست
          </button>
        </div>
      </section>

      {/* INTRO + STATS */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="text-right space-y-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-paprika-50 px-4 py-1.5 text-xs font-bold text-paprika-700">
                معرفی مجموعه
              </span>
              <p className="text-base leading-loose text-stone-600 sm:text-lg">
                <strong className="font-bold text-paprika-700">«{siteName}»</strong> با بیش از دو دهه سابقه درخشان در صنعت توزیع مواد غذایی، از یک دفتر کوچک در تهران آغاز به کار کرد و امروز به یکی از معتبرترین شبکه‌های پخش فرآورده‌های گوشتی در کشور تبدیل شده است. {siteSlogan}
              </p>
              <p className="text-base leading-loose text-stone-600">
                ما با تکیه بر تیمی متخصص، ناوگان مجهز و همکاری با برندهای بزرگ صنعت، توانسته‌ایم اعتماد بیش از هزار فروشگاه، رستوران، فست‌فود و هایپرمارکت را در سراسر ایران جلب کنیم.
              </p>

              {/* آدرس جدید */}
              <div className="mt-8 rounded-3xl bg-white p-6 border border-stone-200 shadow-sm">
                <h4 className="font-black text-stone-800 mb-3 flex items-center gap-2">📍 آدرس فروشگاه</h4>
                <p className="text-sm leading-loose text-stone-700 font-medium">
                  {address}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div className="rounded-2xl bg-stone-900 text-white p-5 flex items-center gap-3">
                  <PhoneIcon className="h-6 w-6 text-gold-400" />
                  <div>
                    <p className="text-[10px] text-stone-400 font-bold">تلفن ثابت</p>
                    <p className="font-mono font-black tracking-wider" dir="ltr">{phoneFixed}</p>
                  </div>
                </div>
                <div className="rounded-2xl bg-paprika-600 text-white p-5 flex items-center gap-3">
                  <PhoneIcon className="h-6 w-6 text-white" />
                  <div>
                    <p className="text-[10px] text-paprika-100 font-bold">تلفن همراه</p>
                    <p className="font-mono font-black tracking-wider" dir="ltr">{mobilePhone}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-3xl border border-stone-200/70 bg-white p-8 text-center shadow-sm transition hover:-translate-y-1 hover:border-paprika-300 hover:shadow-lg"
                >
                  <div className="font-display text-4xl font-bold text-paprika-700 sm:text-5xl">
                    {s.value}
                  </div>
                  <div className="mt-2 text-sm font-bold text-stone-600">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="bg-white py-20 sm:py-24 border-y border-stone-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-paprika-50 px-4 py-1.5 text-xs font-bold text-paprika-700">
              ★ ارزش‌های بنیادین
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold text-stone-800 sm:text-4xl">
              چرا مشتریان به ما اعتماد می‌کنند؟
            </h2>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((v) => (
              <div
                key={v.title}
                className="group rounded-3xl border border-stone-200/70 bg-gradient-to-b from-white to-cream-50/40 p-8 shadow-sm transition hover:-translate-y-1 hover:border-paprika-300 hover:shadow-lg"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-paprika-50 text-3xl transition group-hover:bg-paprika-100">
                  {v.icon}
                </div>
                <h3 className="mt-5 font-display text-xl font-bold text-stone-800">
                  {v.title}
                </h3>
                <p className="mt-2 leading-relaxed text-stone-600 text-sm">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT INFO HIGHLIGHT */}
      <section className="py-16 bg-cream-50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="rounded-[2.5rem] bg-white border border-stone-200 shadow-xl p-8 sm:p-10">
            <h3 className="text-2xl font-black text-center mb-8">اطلاعات تماس پخش نوین</h3>
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="text-center p-6 rounded-2xl bg-stone-50 border">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-900 text-white mb-3">📍</div>
                <p className="text-xs font-bold text-stone-500 mb-1">آدرس</p>
                <p className="text-sm font-bold leading-loose">{address}</p>
              </div>
              <div className="text-center p-6 rounded-2xl bg-stone-900 text-white">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/10 mb-3">📞</div>
                <p className="text-xs font-bold text-stone-400 mb-1">تلفن ثابت</p>
                <p className="font-mono text-lg font-black" dir="ltr">{phoneFixed}</p>
                <a href={`tel:${phoneFixed.replace(/-/g, "")}`} className="mt-3 inline-block text-xs bg-white text-stone-900 px-4 py-1.5 rounded-full font-bold">تماس</a>
              </div>
              <div className="text-center p-6 rounded-2xl bg-paprika-600 text-white">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/20 mb-3">📱</div>
                <p className="text-xs font-bold text-paprika-100 mb-1">تلفن همراه</p>
                <p className="font-mono text-lg font-black" dir="ltr">{mobilePhone}</p>
                <a href={`tel:${mobilePhone.replace(/-/g, "")}`} className="mt-3 inline-block text-xs bg-white text-paprika-700 px-4 py-1.5 rounded-full font-bold">تماس فوری</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BRANDS */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-50 px-4 py-1.5 text-xs font-bold text-gold-700">
              ★ شرکای تجاری
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold text-stone-800 sm:text-4xl">
              برندهایی که افتخار همکاری با آن‌ها را داریم
            </h2>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            {brands.map((b) => (
              <div
                key={b.name}
                className="rounded-2xl border border-stone-200 bg-white px-6 py-4 text-sm font-bold text-stone-700 shadow-sm"
              >
                {b.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-paprika-700 via-paprika-800 to-stone-900 py-20 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:28px_28px]" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            آماده همکاری با کسب‌وکار شما هستیم
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-paprika-100/90">
            برای دریافت لیست قیمت، مشاوره تخصصی یا ثبت سفارش عمده، همین حالا با ما در تماس باشید.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={onOrder}
              className="w-full rounded-full bg-white px-8 py-4 text-base font-bold text-paprika-700 shadow-lg transition hover:bg-paprika-50 sm:w-auto"
            >
              ثبت سفارش عمده
            </button>
            <button
              onClick={onShop}
              className="w-full rounded-full border-2 border-white/60 bg-white/5 px-8 py-4 text-base font-bold backdrop-blur transition hover:bg-white/15 sm:w-auto"
            >
              مشاهده فروشگاه
            </button>
            <a
              href={`tel:${mobilePhone.replace(/-/g, "")}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-white/40 bg-transparent px-8 py-4 text-base font-bold transition hover:bg-white/10 sm:w-auto"
            >
              <PhoneIcon className="h-5 w-5" />
              {mobilePhone}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
