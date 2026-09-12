import { useEffect, useMemo, useState } from "react";
import { dashboardApi } from "../services/dashboardApi";

function money(value: number | string | null | undefined) {
  const num = Number(value ?? 0);
  return (Number.isFinite(num) ? num : 0).toLocaleString("en-US") + " تومان";
}

export function CustomerCreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (customer: any) => void }) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    city: "",
    postal_code: "",
    national_id: "",
    address: "",
    add_to_today: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (key: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const created = await dashboardApi.visitor.customerCreate(form);
      onCreated(created);
    } catch (err: any) {
      setError(err.message || "خطا در افزودن مشتری");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-xl" onClick={onClose} dir="rtl">
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-3xl overflow-hidden rounded-[2.5rem] bg-white shadow-2xl">
        <div className="relative overflow-hidden bg-gradient-to-br from-stone-950 via-blue-950 to-indigo-900 p-7 text-white">
          <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-gold-300/20 blur-3xl" />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="absolute left-5 top-5 z-30 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="بستن پنجره افزودن مشتری"
          >
            ×
          </button>
          <div className="relative">
            <span className="rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-[11px] font-black">مشتری جدید</span>
            <h2 className="mt-4 text-2xl font-black">افزودن مشتری به پنل ویزیتور</h2>
            <p className="mt-2 text-sm font-bold leading-7 text-blue-100/80">مشتری با نقش عادی ساخته می‌شود و در صورت انتخاب، به برنامه امروز شما اضافه خواهد شد.</p>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6">
          {error && <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-black text-stone-600">نام مشتری *
              <input required value={form.first_name} onChange={(e) => update("first_name", e.target.value)} className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold outline-none focus:border-blue-400 focus:bg-white" />
            </label>
            <label className="text-xs font-black text-stone-600">نام خانوادگی
              <input value={form.last_name} onChange={(e) => update("last_name", e.target.value)} className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold outline-none focus:border-blue-400 focus:bg-white" />
            </label>
            <label className="text-xs font-black text-stone-600">شماره موبایل *
              <input required dir="ltr" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="09123456789" className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-left text-sm font-bold outline-none focus:border-blue-400 focus:bg-white" />
            </label>
            <label className="text-xs font-black text-stone-600">ایمیل
              <input type="email" dir="ltr" value={form.email} onChange={(e) => update("email", e.target.value)} className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-left text-sm font-bold outline-none focus:border-blue-400 focus:bg-white" />
            </label>
            <label className="text-xs font-black text-stone-600">شهر
              <input value={form.city} onChange={(e) => update("city", e.target.value)} className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold outline-none focus:border-blue-400 focus:bg-white" />
            </label>
            <label className="text-xs font-black text-stone-600">کد پستی
              <input dir="ltr" value={form.postal_code} onChange={(e) => update("postal_code", e.target.value)} className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-left text-sm font-bold outline-none focus:border-blue-400 focus:bg-white" />
            </label>
            <label className="text-xs font-black text-stone-600">کد ملی
              <input dir="ltr" value={form.national_id} onChange={(e) => update("national_id", e.target.value)} className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-left text-sm font-bold outline-none focus:border-blue-400 focus:bg-white" />
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-xs font-black text-emerald-700">
              <input type="checkbox" checked={form.add_to_today} onChange={(e) => update("add_to_today", e.target.checked)} className="h-4 w-4" />
              اضافه شدن به انتخاب مشتری در سفارش امروز
            </label>
            <label className="sm:col-span-2 text-xs font-black text-stone-600">آدرس
              <textarea value={form.address} onChange={(e) => update("address", e.target.value)} rows={4} className="mt-2 w-full resize-none rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold leading-7 outline-none focus:border-blue-400 focus:bg-white" />
            </label>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t bg-stone-50 p-5 sm:flex-row sm:justify-between">
          <button type="button" onClick={onClose} className="rounded-2xl border border-stone-200 bg-white px-6 py-3 text-sm font-black text-stone-700">انصراف</button>
          <button disabled={saving} className="rounded-2xl bg-gradient-to-l from-blue-700 to-indigo-600 px-8 py-3 text-sm font-black text-white shadow-xl disabled:opacity-60">{saving ? "در حال ذخیره..." : "افزودن مشتری"}</button>
        </div>
      </form>
    </div>
  );
}

export default function VisitorCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const load = async (q = query) => {
    setLoading(true);
    setError("");
    try {
      const data = await dashboardApi.visitor.customers(q);
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "خطا در دریافت مشتری‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(""); }, []);

  const stats = useMemo(() => ({
    total: customers.length,
    withAddress: customers.filter((c) => c.address).length,
    totalOrders: customers.reduce((s, c) => s + Number(c.total_orders || 0), 0),
    totalPurchases: customers.reduce((s, c) => s + Number(c.total_purchases || 0), 0),
  }), [customers]);

  return (
    <div className="min-h-screen bg-[#faf8f5]" dir="rtl">
      <div className="relative overflow-hidden bg-gradient-to-br from-stone-950 via-blue-950 to-indigo-900 px-4 py-8 text-white sm:px-6 lg:px-10">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-500/25 blur-3xl" />
        <div className="absolute -left-24 top-12 h-80 w-80 rounded-full bg-gold-400/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-black backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-300" /> مشتری‌های ویزیتور
          </div>
          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-3xl font-black sm:text-4xl lg:text-5xl">مدیریت مشتری‌ها</h1>
              <p className="mt-3 max-w-2xl text-sm font-bold leading-8 text-blue-100/80">لیست مشتری‌های برنامه‌ریزی‌شده و مشتری‌هایی که برایشان سفارش ثبت کرده‌اید، با امکان افزودن سریع مشتری جدید.</p>
            </div>
            <button onClick={() => setModalOpen(true)} className="rounded-2xl bg-gradient-to-l from-gold-400 to-amber-500 px-6 py-4 text-sm font-black text-stone-950 shadow-2xl shadow-gold-500/20 transition hover:-translate-y-0.5">+ افزودن مشتری جدید</button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[2rem] bg-white p-5 shadow-sm border"><p className="text-[11px] font-black text-stone-400">کل مشتری‌ها</p><p className="mt-2 text-3xl font-black">{stats.total}</p></div>
          <div className="rounded-[2rem] bg-white p-5 shadow-sm border"><p className="text-[11px] font-black text-stone-400">دارای آدرس</p><p className="mt-2 text-3xl font-black text-blue-700">{stats.withAddress}</p></div>
          <div className="rounded-[2rem] bg-white p-5 shadow-sm border"><p className="text-[11px] font-black text-stone-400">سفارش‌ها</p><p className="mt-2 text-3xl font-black text-emerald-700">{stats.totalOrders}</p></div>
          <div className="rounded-[2rem] bg-stone-900 p-5 shadow-xl text-white"><p className="text-[11px] font-black text-stone-400">خرید کل</p><p className="mt-2 text-xl font-black text-gold-300">{money(stats.totalPurchases)}</p></div>
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-[2rem] border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') load(query); }} placeholder="جستجوی نام، موبایل یا شهر..." className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold outline-none focus:border-blue-400 sm:max-w-md" />
          <div className="flex gap-2">
            <button onClick={() => load(query)} className="rounded-2xl bg-stone-900 px-5 py-3 text-sm font-black text-white">جستجو</button>
            <button onClick={() => { setQuery(''); load(''); }} className="rounded-2xl border bg-white px-5 py-3 text-sm font-black text-stone-600">همه</button>
          </div>
        </div>

        {error && <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}

        {loading ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[1,2,3,4,5,6].map(i => <div key={i} className="h-44 animate-pulse rounded-[2rem] bg-white" />)}</div>
        ) : customers.length === 0 ? (
          <div className="mt-6 rounded-[2.5rem] border border-dashed border-stone-200 bg-white p-16 text-center shadow-sm">
            <div className="text-6xl">👥</div>
            <h3 className="mt-4 text-xl font-black">مشتری‌ای یافت نشد</h3>
            <p className="mt-2 text-sm font-bold text-stone-500">می‌توانید اولین مشتری خود را اضافه کنید.</p>
            <button onClick={() => setModalOpen(true)} className="mt-6 rounded-2xl bg-blue-700 px-8 py-3 text-sm font-black text-white">افزودن مشتری</button>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {customers.map((customer, index) => (
              <div key={customer.id} className="group relative overflow-hidden rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl">
                <div className="absolute -left-12 -top-12 h-32 w-32 rounded-full bg-blue-50 blur-2xl transition group-hover:bg-blue-100" />
                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-stone-900 to-blue-800 text-sm font-black text-white shadow-lg">{index + 1}</span>
                    <div>
                      <h3 className="font-black text-stone-900">{customer.full_name}</h3>
                      <p dir="ltr" className="mt-1 text-right font-mono text-xs font-bold text-stone-500">{customer.phone || 'بدون شماره'}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-700">مشتری</span>
                </div>
                <div className="relative mt-4 grid grid-cols-2 gap-2 text-xs font-bold">
                  <div className="rounded-2xl bg-stone-50 p-3"><span className="block text-stone-400">شهر</span><span className="mt-1 block text-stone-800">{customer.city || '—'}</span></div>
                  <div className="rounded-2xl bg-stone-50 p-3"><span className="block text-stone-400">سفارش</span><span className="mt-1 block text-stone-800">{customer.total_orders || 0}</span></div>
                </div>
                <div className="relative mt-3 rounded-2xl bg-blue-50 p-3 text-xs font-bold leading-6 text-blue-900">
                  📍 {customer.address || 'آدرس ثبت نشده است'}
                </div>
                <div className="relative mt-4 flex items-center justify-between border-t border-stone-100 pt-4">
                  <span className="text-[11px] font-black text-stone-400">خرید کل</span>
                  <span className="font-black text-blue-700">{money(customer.total_purchases)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && <CustomerCreateModal onClose={() => setModalOpen(false)} onCreated={(customer) => { setModalOpen(false); setCustomers((prev) => [customer, ...prev]); }} />}
    </div>
  );
}
