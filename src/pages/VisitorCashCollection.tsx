import { useEffect, useMemo, useState } from "react";
import { dashboardApi } from "../services/dashboardApi";
import { formatJalaliDateTime } from "../utils/date";

type VisitorCustomer = {
  id: number;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  phone?: string;
  city?: string;
  address?: string;
  remaining_debt?: number | string;
};

type CashRecord = {
  id: number;
  customer: number;
  customer_name?: string;
  amount: number | string;
  payment_type?: string;
  receipt_number?: string;
  notes?: string;
  collected_at?: string;
  created_at?: string;
};

const paymentTypes = [
  { value: "cash", label: "نقدی", icon: "💵", hint: "دریافت پول نقد از مشتری" },
  { value: "card", label: "کارتخوان سیار", icon: "💳", hint: "پرداخت با دستگاه کارتخوان" },
  { value: "cheque", label: "چک", icon: "🧾", hint: "ثبت شماره و توضیحات چک" },
  { value: "online", label: "آنلاین", icon: "🌐", hint: "کارت‌به‌کارت یا پرداخت آنلاین" },
];

function money(value: number | string | null | undefined) {
  const num = Number(value ?? 0);
  return (Number.isFinite(num) ? num : 0).toLocaleString("en-US") + " تومان";
}

function customerDisplayName(customer: VisitorCustomer) {
  return customer.full_name || `${customer.first_name || ""} ${customer.last_name || ""}`.trim() || customer.username || "مشتری بدون نام";
}

function paymentLabel(type?: string) {
  return paymentTypes.find((item) => item.value === type)?.label || "نامشخص";
}

function paymentIcon(type?: string) {
  return paymentTypes.find((item) => item.value === type)?.icon || "💰";
}

function remainingDebt(customer?: VisitorCustomer) {
  const value = Number(customer?.remaining_debt ?? 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export default function VisitorCashCollection() {
  const [customers, setCustomers] = useState<VisitorCustomer[]>([]);
  const [records, setRecords] = useState<CashRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [customerQuery, setCustomerQuery] = useState("");
  const [form, setForm] = useState({
    customer: "",
    amount: "",
    payment_type: "cash",
    receipt_number: "",
    notes: "",
  });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [customerData, cashData] = await Promise.all([
        dashboardApi.visitor.customers(),
        dashboardApi.visitor.cashList(),
      ]);
      setCustomers(Array.isArray(customerData) ? customerData : []);
      setRecords(Array.isArray(cashData) ? cashData : []);
    } catch (err: any) {
      setError(err.message || "خطا در دریافت اطلاعات دریافت وجه");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredCustomers = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    return customers
      .filter((customer) => {
        const name = customerDisplayName(customer).toLowerCase();
        const phone = String(customer.phone || "").toLowerCase();
        const city = String(customer.city || "").toLowerCase();
        return !q || `${name} ${phone} ${city}`.includes(q);
      })
      .slice(0, 30);
  }, [customers, customerQuery]);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => String(customer.id) === String(form.customer)),
    [customers, form.customer]
  );

  const stats = useMemo(() => {
    const total = records.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const today = new Date().toISOString().slice(0, 10);
    const todayTotal = records
      .filter((item) => String(item.collected_at || item.created_at || "").slice(0, 10) === today)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return { total, todayTotal, count: records.length };
  }, [records]);

  const update = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
    setSuccess("");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const amount = Number(form.amount);
    if (!form.customer) {
      setError("ابتدا مشتری را انتخاب کنید.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("مبلغ دریافتی باید بیشتر از صفر باشد.");
      return;
    }

    setSaving(true);
    try {
      const created = await dashboardApi.visitor.cashCreate({
        customer: Number(form.customer),
        amount,
        payment_type: form.payment_type,
        receipt_number: form.receipt_number,
        notes: form.notes,
      });
      setRecords((prev) => [created, ...prev]);
      setCustomers((prev) => prev.map((customer) => {
        if (String(customer.id) !== String(form.customer)) return customer;
        const nextRemaining = Math.max(remainingDebt(customer) - amount, 0);
        return { ...customer, remaining_debt: nextRemaining };
      }));
      setSuccess("دریافت وجه با موفقیت ثبت شد.");
      setForm({ customer: "", amount: "", payment_type: "cash", receipt_number: "", notes: "" });
      setCustomerQuery("");
    } catch (err: any) {
      setError(err.message || "خطا در ثبت دریافت وجه");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fb]" dir="rtl">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-900 px-4 py-8 text-white sm:px-6 lg:px-10">
        <div className="absolute -right-28 -top-28 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -left-28 top-12 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.11)_1px,transparent_0)] bg-[size:28px_28px] opacity-30" />

        <div className="relative mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-black backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-lg shadow-emerald-300/50" />
            ثبت دریافت وجه ویزیتور
          </div>
          <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_380px] lg:items-end">
            <div>
              <h1 className="font-display text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                دریافت وجه مشتری
                <span className="block text-cyan-200">سریع، دقیق و حرفه‌ای</span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm font-bold leading-8 text-cyan-50/75">
                مشتری را انتخاب کنید، مبلغ و روش پرداخت را وارد کنید و رسید دریافت وجه را برای پیگیری‌های بعدی ثبت نمایید.
              </p>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between text-xs font-black text-cyan-100">
                <span>مجموع دریافت‌های اخیر</span>
                <span>{stats.count.toLocaleString("en-US")} رسید</span>
              </div>
              <div className="mt-3 text-3xl font-black text-emerald-300">{money(stats.total)}</div>
              <div className="mt-2 text-[11px] font-bold text-cyan-100/70">امروز: {money(stats.todayTotal)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[370px_1fr] lg:px-10">
        <aside className="space-y-5">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-900">انتخاب مشتری</h2>
                <p className="mt-1 text-[10px] font-bold text-slate-400">از بین مشتری‌های ذخیره‌شده ویزیتور</p>
              </div>
              <span className="rounded-2xl bg-cyan-50 px-3 py-2 text-[10px] font-black text-cyan-700">{customers.length.toLocaleString("en-US")} مشتری</span>
            </div>

            <input
              value={customerQuery}
              onChange={(e) => setCustomerQuery(e.target.value)}
              placeholder="جستجوی نام، موبایل یا شهر..."
              className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
            />

            {loading ? (
              <div className="mt-4 space-y-3">
                {[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)}
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm font-bold leading-7 text-slate-500">
                مشتری‌ای برای انتخاب یافت نشد.
              </div>
            ) : (
              <div className="mt-4 max-h-[520px] space-y-2 overflow-y-auto pr-1">
                {filteredCustomers.map((customer) => {
                  const active = String(form.customer) === String(customer.id);
                  return (
                    <button
                      type="button"
                      key={customer.id}
                      onClick={() => update("customer", String(customer.id))}
                      className={`w-full rounded-2xl border p-4 text-right transition ${active ? "border-cyan-300 bg-cyan-50 shadow-lg shadow-cyan-900/10" : "border-slate-200 bg-white hover:border-cyan-200 hover:bg-cyan-50/40"}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-black text-slate-900">{customerDisplayName(customer)}</div>
                          <div dir="ltr" className="mt-1 text-right font-mono text-xs font-bold text-slate-500">{customer.phone || "بدون شماره"}</div>
                        </div>
                        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-2xl text-xs font-black ${active ? "bg-cyan-700 text-white" : "bg-slate-900 text-white"}`}>✓</span>
                      </div>
                      <div className="mt-3 grid gap-2 text-[11px] font-bold sm:grid-cols-2">
                        <div className="rounded-xl bg-white/80 px-3 py-2 text-slate-500">
                          مانده سفارش: <span className="font-black text-red-600">{money(remainingDebt(customer))}</span>
                        </div>
                        {(customer.city || customer.address) && (
                          <div className="truncate rounded-xl bg-white/80 px-3 py-2 text-slate-500">
                            📍 {customer.city || customer.address}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <main className="space-y-5">
          <form onSubmit={submit} className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
            <div className="relative overflow-hidden bg-gradient-to-l from-slate-950 to-blue-950 p-6 text-white">
              <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-black">فرم ثبت دریافت وجه</h2>
                  <p className="mt-2 text-xs font-bold leading-6 text-cyan-100/75">اطلاعات پرداخت مشتری را با دقت وارد کنید.</p>
                </div>
                {selectedCustomer && (
                  <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black backdrop-blur">
                    <div>{customerDisplayName(selectedCustomer)}</div>
                    <div className="mt-1 text-xs text-cyan-100/80">مانده سفارش: <span className="text-emerald-300">{money(remainingDebt(selectedCustomer))}</span></div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-2">
              <label className="text-xs font-black text-slate-600">
                مبلغ دریافتی *
                <input
                  required
                  dir="ltr"
                  inputMode="numeric"
                  value={form.amount}
                  onChange={(e) => update("amount", e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="مثلا 1500000"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left text-lg font-black outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                />
                <span className="mt-2 block text-[11px] font-bold text-cyan-700">{form.amount ? money(form.amount) : "مبلغ را به تومان وارد کنید"}</span>
              </label>

              <label className="text-xs font-black text-slate-600">
                شماره رسید / پیگیری
                <input
                  dir="ltr"
                  value={form.receipt_number}
                  onChange={(e) => update("receipt_number", e.target.value)}
                  placeholder="اختیاری"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left text-sm font-bold outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                />
              </label>

              <div className="lg:col-span-2">
                <p className="mb-3 text-xs font-black text-slate-600">روش پرداخت</p>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {paymentTypes.map((type) => {
                    const active = form.payment_type === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => update("payment_type", type.value)}
                        className={`rounded-2xl border p-4 text-right transition ${active ? "border-cyan-300 bg-cyan-50 shadow-lg shadow-cyan-900/10" : "border-slate-200 bg-slate-50 hover:border-cyan-200 hover:bg-white"}`}
                      >
                        <div className="text-2xl">{type.icon}</div>
                        <div className="mt-2 text-sm font-black text-slate-900">{type.label}</div>
                        <div className="mt-1 text-[10px] font-bold leading-5 text-slate-400">{type.hint}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="lg:col-span-2 text-xs font-black text-slate-600">
                توضیحات
                <textarea
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  rows={4}
                  placeholder="توضیح تکمیلی، بابت کدام بدهی، شرایط چک و ..."
                  className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold leading-7 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                />
              </label>
            </div>

            {(error || success) && (
              <div className="px-5 pb-5">
                {error && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-7 text-red-700">{error}</div>}
                {success && <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold leading-7 text-emerald-700">{success}</div>}
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs font-bold leading-6 text-slate-500">
                مبلغ قابل ثبت: <span className="font-black text-slate-900">{money(form.amount)}</span>
                <br />
                مانده سفارش مشتری: <span className="font-black text-red-600">{money(remainingDebt(selectedCustomer))}</span>
                <br />
                روش پرداخت: <span className="font-black text-cyan-700">{paymentLabel(form.payment_type)}</span>
              </div>
              <button
                disabled={saving || !form.customer || !form.amount}
                className="rounded-2xl bg-gradient-to-l from-cyan-600 via-blue-600 to-indigo-600 px-8 py-4 text-sm font-black text-white shadow-xl shadow-cyan-700/20 transition hover:-translate-y-0.5 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "در حال ثبت دریافت وجه..." : "ثبت نهایی دریافت وجه"}
              </button>
            </div>
          </form>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-900">آخرین دریافت‌ها</h2>
                <p className="mt-1 text-[10px] font-bold text-slate-400">۲۰ رسید آخر ثبت‌شده توسط شما</p>
              </div>
              <button onClick={load} type="button" className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-50">بروزرسانی</button>
            </div>

            {loading ? (
              <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)}</div>
            ) : records.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-bold leading-7 text-slate-500">
                هنوز دریافت وجهی ثبت نشده است.
              </div>
            ) : (
              <div className="space-y-3">
                {records.map((record) => (
                  <div key={record.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-cyan-100 hover:bg-white">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-xl shadow-sm">{paymentIcon(record.payment_type)}</span>
                        <div>
                          <div className="font-black text-slate-900">{record.customer_name || "مشتری"}</div>
                          <div className="mt-1 text-[11px] font-bold text-slate-400">{formatJalaliDateTime(record.collected_at || record.created_at)}</div>
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="font-black text-emerald-700">{money(record.amount)}</div>
                        <div className="mt-1 text-[11px] font-bold text-slate-400">{paymentLabel(record.payment_type)}</div>
                      </div>
                    </div>
                    {(record.receipt_number || record.notes) && (
                      <div className="mt-3 grid gap-2 text-xs font-bold text-slate-500 sm:grid-cols-2">
                        {record.receipt_number && <div className="rounded-xl bg-white px-3 py-2">شماره رسید: <span dir="ltr" className="font-mono text-slate-900">{record.receipt_number}</span></div>}
                        {record.notes && <div className="rounded-xl bg-white px-3 py-2 leading-6">{record.notes}</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
