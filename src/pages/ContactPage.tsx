import { useNavigate } from "react-router-dom";
import { address, mobilePhone, phoneFixed, siteName } from "../data";
import { ArrowRightIcon, PhoneIcon } from "../components/icons";

export default function ContactPage() {
  const navigate = useNavigate();
  const cleanFixedPhone = phoneFixed.replace(/-/g, "");
  const cleanMobilePhone = mobilePhone.replace(/-/g, "");

  return (
    <main className="min-h-screen bg-cream-50 pb-20 pt-10 font-sans text-right" dir="rtl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center gap-2 text-xs font-bold text-stone-400 mb-6 pt-6">
          <button onClick={() => navigate("/")} className="hover:text-paprika-600">خانه</button>
          <span>/</span>
          <span className="text-paprika-600">تماس با ما</span>
        </div>

        <button onClick={() => navigate(-1)} className="mb-8 inline-flex items-center gap-1.5 text-sm font-bold text-stone-500 transition hover:text-paprika-700">
          <ArrowRightIcon className="h-4 w-4" />
          بازگشت
        </button>

        <section className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950 p-8 text-white shadow-2xl sm:p-12">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-paprika-600/25 blur-3xl" />
          <div className="absolute -bottom-24 right-10 h-72 w-72 rounded-full bg-gold-500/15 blur-3xl" />
          <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black text-gold-300 backdrop-blur">
                ارتباط با {siteName}
              </span>
              <h1 className="mt-6 font-display text-4xl font-black leading-tight sm:text-5xl">
                تماس با ما
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-8 text-stone-300 sm:text-base">
                برای ثبت سفارش، پیگیری خرید، همکاری عمده یا دریافت مشاوره خرید با ما در ارتباط باشید.
                تیم پخش نوین آماده پاسخگویی و راهنمایی شماست.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href={`tel:${cleanMobilePhone}`} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-paprika-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-paprika-600/25 transition hover:bg-paprika-700">
                  <PhoneIcon className="h-5 w-5" />
                  تماس با همراه
                </a>
                <a href={`tel:${cleanFixedPhone}`} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-6 py-4 text-sm font-black text-white backdrop-blur transition hover:bg-white/15">
                  ☎️ تماس با تلفن ثابت
                </a>
              </div>
            </div>

            <div className="rounded-[2.5rem] border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
              <div className="grid gap-4">
                <div className="rounded-3xl bg-white p-5 text-stone-800 shadow-xl">
                  <div className="mb-2 flex items-center gap-2 text-xs font-black text-paprika-600">
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-paprika-50 text-lg">📍</span>
                    آدرس فروشگاه
                  </div>
                  <p className="text-sm font-bold leading-8 text-stone-700">{address}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <a href={`tel:${cleanFixedPhone}`} className="rounded-3xl bg-white p-5 text-stone-800 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl">
                    <div className="mb-2 text-xs font-black text-stone-400">تلفن ثابت</div>
                    <div dir="ltr" className="font-mono text-lg font-black text-stone-900">{phoneFixed}</div>
                  </a>
                  <a href={`tel:${cleanMobilePhone}`} className="rounded-3xl bg-white p-5 text-stone-800 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl">
                    <div className="mb-2 text-xs font-black text-stone-400">شماره همراه</div>
                    <div dir="ltr" className="font-mono text-lg font-black text-paprika-600">{mobilePhone}</div>
                  </a>
                </div>

                <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-5 text-sm font-bold leading-7 text-emerald-100">
                  <span className="ml-2 inline-block h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  پاسخگویی و ثبت سفارش در ساعات کاری فروشگاه انجام می‌شود.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-paprika-50 text-2xl">🛒</div>
            <h3 className="font-black text-stone-900">ثبت سفارش</h3>
            <p className="mt-3 text-sm leading-7 text-stone-500">برای خرید خرده یا عمده با شماره‌های درج‌شده تماس بگیرید یا از بخش فروشگاه سفارش خود را ثبت کنید.</p>
          </div>
          <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-50 text-2xl">🚚</div>
            <h3 className="font-black text-stone-900">ارسال محصولات</h3>
            <p className="mt-3 text-sm leading-7 text-stone-500">ارسال محصولات با بسته‌بندی مناسب و هماهنگی قبلی با مشتری انجام می‌شود.</p>
          </div>
          <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">🤝</div>
            <h3 className="font-black text-stone-900">همکاری عمده</h3>
            <p className="mt-3 text-sm leading-7 text-stone-500">جهت همکاری با فروشگاه‌ها، رستوران‌ها و مراکز پخش، از طریق تماس مستقیم با ما در ارتباط باشید.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
