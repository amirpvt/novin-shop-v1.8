import { useState } from "react";
import { phone, type Product } from "../data";
import { CheckIcon, PhoneIcon, TruckIcon } from "./icons";
import type { StoredOrder } from "../storage";

type Props = {
  product: string;
  products: Product[];
  onAddOrder: (order: Omit<StoredOrder, "id" | "createdAt" | "status">) => void;
  onBack: () => void;
};

export default function BulkOrder({ product, products, onAddOrder, onBack }: Props) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    product: product || "",
    msg: "",
  });
  const [sent, setSent] = useState(false);

  const update = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;

    onAddOrder({
      customerName: form.name,
      customerPhone: form.phone,
      productName: form.product,
      message: form.msg,
    });

    setSent(true);
    setTimeout(() => setSent(false), 4000);
    setForm({ name: "", phone: "", product: "", msg: "" });
  };

  return (
    <section className="min-h-screen bg-cream-50 px-4 py-24 sm:px-6 sm:py-28 font-sans">
      <div className="mx-auto max-w-3xl text-right">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm font-bold text-stone-500 transition hover:text-red-700"
        >
          ← بازگشت
        </button>

        <h2 className="mt-4 font-display text-3xl text-stone-800 sm:text-4xl font-bold">
          سفارش عمده
        </h2>
        <p className="mt-2 text-stone-500 text-sm">
          برای دریافت لیست قیمت و هماهنگی ارسال عمده، فرم زیر را پر کنید یا با ما تماس بگیرید.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <form
            onSubmit={submit}
            className="space-y-4 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"
          >
            <div>
              <label className="mb-1.5 block text-sm font-bold text-stone-700">
                نام شرکت / فروشگاه / خریدار
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="مثلاً فروشگاه زیتون"
                className="w-full rounded-2xl border border-stone-200 bg-cream-50 px-4 py-3.5 text-stone-800 outline-none transition focus:border-red-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-stone-700">
                شماره تماس
              </label>
              <input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                className="w-full rounded-2xl border border-stone-200 bg-cream-50 px-4 py-3.5 text-stone-800 outline-none transition focus:border-red-500 focus:bg-white text-left dir-ltr font-mono"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-stone-700">
                محصول مورد نظر
              </label>
              <select
                value={form.product}
                onChange={(e) => update("product", e.target.value)}
                className="w-full rounded-2xl border border-stone-200 bg-cream-50 px-4 py-3.5 text-stone-800 outline-none transition focus:border-red-500 focus:bg-white cursor-pointer"
              >
                <option value="">انتخاب کنید...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
                <option value="سفارش عمده متفرقه">سفارش عمده متفرقه</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-stone-700">
                توضیحات (تعداد، آدرس ارسال یا شرایط فاکتور)
              </label>
              <textarea
                rows={3}
                value={form.msg}
                onChange={(e) => update("msg", e.target.value)}
                placeholder="مثلاً ۵۰ کارتن سوسیس بالایی — ارسال به کرج"
                className="w-full resize-none rounded-2xl border border-stone-200 bg-cream-50 px-4 py-3.5 text-stone-800 outline-none transition focus:border-red-500 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-red-600 py-4 font-bold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-700 active:scale-98"
            >
              ثبت درخواست سفارش
            </button>

            {sent && (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 leading-relaxed">
                <CheckIcon className="h-5 w-5 text-emerald-600 shrink-0" />
                درخواست سفارش شما با موفقیت در پنل مدیریت ثبت شد! بزودی با شما تماس می‌گیریم.
              </div>
            )}
          </form>

          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-3xl border border-stone-200 bg-white p-6">
              <PhoneIcon className="h-6 w-6 text-red-600" />
              <div>
                <div className="text-xs text-stone-500">سفارش تلفنی فوری</div>
                <div className="font-bold text-stone-800 mt-0.5">{phone}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-3xl border border-stone-200 bg-white p-6">
              <TruckIcon className="h-6 w-6 text-red-600" />
              <div>
                <div className="text-xs text-stone-500">ارسال عمده سراسری</div>
                <div className="font-bold text-stone-800 mt-0.5">
                  تهران و شهرستان با ماشین یخچال‌دار
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
