import { useEffect, useMemo, useState } from "react";
import { dashboardApi } from "../services/dashboardApi";
import { formatJalaliDateTime } from "../utils/date";

type Debtor = {
  id: number;
  customer: number;
  customer_name?: string;
  customer_phone?: string;
  total_debt?: number | string;
  total_paid?: number | string;
  remaining_debt?: number | string;
  last_order_date?: string | null;
  last_payment_date?: string | null;
  is_overdue?: boolean;
  notes?: string;
  updated_at?: string;
};

function money(value: number | string | null | undefined) {
  const num = Number(value ?? 0);
  return (Number.isFinite(num) ? num : 0).toLocaleString("en-US") + " تومان";
}

function nf(value: number | string | null | undefined) {
  const num = Number(value ?? 0);
  return (Number.isFinite(num) ? num : 0).toLocaleString("en-US");
}

function percent(value: number) {
  const safe = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  return `${safe.toFixed(0)}%`;
}

function num(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function OwnerDebtors() {
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "overdue" | "active">("all");
  const [sortBy, setSortBy] = useState<"remaining" | "total" | "paid" | "recent">("remaining");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await dashboardApi.owner.debtorsReport();
      setDebtors(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "خطا در دریافت گزارش بدهکاران");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredDebtors = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = debtors.filter((debtor) => {
      const text = `${debtor.customer_name || ""} ${debtor.customer_phone || ""} ${debtor.notes || ""}`.toLowerCase();
      const queryOk = !q || text.includes(q);
      const statusOk = statusFilter === "all" || (statusFilter === "overdue" ? debtor.is_overdue : !debtor.is_overdue);
      return queryOk && statusOk;
    });

    return rows.sort((a, b) => {
      if (sortBy === "total") return num(b.total_debt) - num(a.total_debt);
      if (sortBy === "paid") return num(b.total_paid) - num(a.total_paid);
      if (sortBy === "recent") return new Date(b.last_order_date || b.updated_at || 0).getTime() - new Date(a.last_order_date || a.updated_at || 0).getTime();
      return num(b.remaining_debt) - num(a.remaining_debt);
    });
  }, [debtors, query, statusFilter, sortBy]);

  const selectedDebtor = useMemo(() => {
    if (!selectedId) return filteredDebtors[0] || null;
    return filteredDebtors.find((debtor) => debtor.id === selectedId) || filteredDebtors[0] || null;
  }, [filteredDebtors, selectedId]);

  const stats = useMemo(() => {
    const totalDebt = debtors.reduce((sum, debtor) => sum + num(debtor.total_debt), 0);
    const totalPaid = debtors.reduce((sum, debtor) => sum + num(debtor.total_paid), 0);
    const remaining = debtors.reduce((sum, debtor) => sum + num(debtor.remaining_debt), 0);
    const overdue = debtors.filter((debtor) => debtor.is_overdue).length;
    return { totalDebt, totalPaid, remaining, overdue, count: debtors.length };
  }, [debtors]);

  const maxRemaining = useMemo(() => Math.max(1, ...debtors.map((debtor) => num(debtor.remaining_debt))), [debtors]);
  const selectedPayRate = selectedDebtor && num(selectedDebtor.total_debt) > 0 ? (num(selectedDebtor.total_paid) / num(selectedDebtor.total_debt)) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#f8f6f2]" dir="rtl">
      <div className="relative overflow-hidden bg-gradient-to-br from-stone-950 via-amber-950 to-red-950 px-4 py-8 text-white sm:px-6 lg:px-10">
        <div className="absolute -right-28 -top-28 h-96 w-96 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="absolute -left-28 top-12 h-96 w-96 rounded-full bg-red-400/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.10)_1px,transparent_0)] bg-[size:30px_30px] opacity-30" />

        <div className="relative mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-black backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-amber-300 shadow-lg shadow-amber-300/50" />
            گزارش مالی مشتریان بدهکار
          </div>
          <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_430px] lg:items-end">
            <div>
              <h1 className="font-display text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                بدهکاران
                <span className="block text-amber-200">کنترل مانده‌ها و پرداخت‌ها</span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm font-bold leading-8 text-amber-50/75">
                وضعیت بدهی، پرداختی و مانده هر مشتری را با نمای مدیریتی، قابل جستجو و مرتب‌سازی‌شده بررسی کنید.
              </p>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between text-xs font-black text-amber-100">
                <span>مانده کل بدهی</span>
                <span>{nf(stats.count)} مشتری</span>
              </div>
              <div className="mt-3 text-3xl font-black text-amber-200">{money(stats.remaining)}</div>
              <div className="mt-2 text-[11px] font-bold text-amber-100/70">پرداخت‌شده: {money(stats.totalPaid)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative overflow-hidden rounded-[2rem] border border-red-100 bg-white p-5 shadow-sm">
            <div className="absolute -left-10 -top-10 h-28 w-28 rounded-full bg-red-100 blur-2xl" />
            <p className="relative text-[11px] font-black text-stone-400">مانده بدهی</p>
            <p className="relative mt-2 text-2xl font-black text-red-700">{money(stats.remaining)}</p>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] border border-amber-100 bg-white p-5 shadow-sm">
            <div className="absolute -left-10 -top-10 h-28 w-28 rounded-full bg-amber-100 blur-2xl" />
            <p className="relative text-[11px] font-black text-stone-400">کل بدهی ثبت‌شده</p>
            <p className="relative mt-2 text-2xl font-black text-amber-700">{money(stats.totalDebt)}</p>
          </div>
          <div className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-black text-stone-400">کل پرداختی</p>
            <p className="mt-2 text-2xl font-black text-emerald-700">{money(stats.totalPaid)}</p>
          </div>
          <div className="rounded-[2rem] border border-stone-200 bg-stone-950 p-5 text-white shadow-xl">
            <p className="text-[11px] font-black text-stone-400">سررسید گذشته</p>
            <p className="mt-2 text-3xl font-black text-amber-200">{nf(stats.overdue)}</p>
          </div>
        </div>

        <div className="mt-6 rounded-[2rem] border border-stone-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto] lg:items-center">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجوی نام مشتری، شماره موبایل یا یادداشت..."
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-black outline-none transition focus:border-amber-400 focus:bg-white"
            >
              <option value="all">همه بدهکاران</option>
              <option value="overdue">سررسید گذشته</option>
              <option value="active">عادی</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-black outline-none transition focus:border-amber-400 focus:bg-white"
            >
              <option value="remaining">مرتب‌سازی بر اساس مانده</option>
              <option value="total">مرتب‌سازی بر اساس کل بدهی</option>
              <option value="paid">مرتب‌سازی بر اساس پرداختی</option>
              <option value="recent">مرتب‌سازی بر اساس آخرین سفارش</option>
            </select>
            <button onClick={load} type="button" className="rounded-2xl bg-stone-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5">
              بروزرسانی
            </button>
          </div>
        </div>

        {error && <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-7 text-red-700">{error}</div>}

        <div className="mt-6 grid gap-5 lg:grid-cols-[410px_1fr]">
          <aside className="rounded-[2rem] border border-stone-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-stone-900">لیست بدهکاران</h2>
                <p className="mt-1 text-[10px] font-bold text-stone-400">برای مشاهده جزئیات انتخاب کنید</p>
              </div>
              <span className="rounded-2xl bg-amber-50 px-3 py-2 text-[10px] font-black text-amber-700">{nf(filteredDebtors.length)}</span>
            </div>

            {loading ? (
              <div className="space-y-3">{[1, 2, 3, 4].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-stone-100" />)}</div>
            ) : filteredDebtors.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-8 text-center text-sm font-bold text-stone-500">بدهکاری یافت نشد.</div>
            ) : (
              <div className="max-h-[760px] space-y-3 overflow-y-auto pr-1">
                {filteredDebtors.map((debtor, index) => {
                  const active = selectedDebtor?.id === debtor.id;
                  const remainingRate = (num(debtor.remaining_debt) / maxRemaining) * 100;
                  return (
                    <button
                      type="button"
                      key={debtor.id}
                      onClick={() => setSelectedId(debtor.id)}
                      className={`w-full rounded-2xl border p-4 text-right transition ${active ? "border-amber-300 bg-amber-50 shadow-lg shadow-amber-900/10" : "border-stone-200 bg-white hover:border-amber-200 hover:bg-amber-50/40"}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-sm font-black ${active ? "bg-amber-600 text-white" : "bg-stone-950 text-white"}`}>{index + 1}</span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-stone-900">{debtor.customer_name || "مشتری"}</p>
                            <p dir="ltr" className="mt-1 truncate text-right font-mono text-xs font-bold text-stone-400">{debtor.customer_phone || "بدون شماره"}</p>
                          </div>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black ${debtor.is_overdue ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                          {debtor.is_overdue ? "معوق" : "عادی"}
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold">
                        <div className="rounded-xl bg-white/80 p-3">
                          <span className="block text-stone-400">مانده</span>
                          <span className="mt-1 block font-black text-red-700">{money(debtor.remaining_debt)}</span>
                        </div>
                        <div className="rounded-xl bg-white/80 p-3">
                          <span className="block text-stone-400">پرداختی</span>
                          <span className="mt-1 block font-black text-emerald-700">{money(debtor.total_paid)}</span>
                        </div>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
                        <div className="h-full rounded-full bg-gradient-to-l from-red-500 to-amber-400" style={{ width: percent(remainingRate) }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          <main className="min-h-[620px] rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
            {!selectedDebtor ? (
              <div className="flex min-h-[560px] flex-col items-center justify-center text-center">
                <div className="text-6xl">💳</div>
                <h3 className="mt-4 text-xl font-black text-stone-900">مشتری بدهکار را انتخاب کنید</h3>
                <p className="mt-2 text-sm font-bold text-stone-500">جزئیات بدهی و پرداخت همینجا نمایش داده می‌شود.</p>
              </div>
            ) : (
              <div>
                <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-l from-stone-950 to-amber-950 p-6 text-white">
                  <div className="absolute -left-20 -top-20 h-52 w-52 rounded-full bg-amber-300/20 blur-3xl" />
                  <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-[11px] font-black text-amber-100/75">پرونده بدهی مشتری</p>
                      <h2 className="mt-2 text-2xl font-black">{selectedDebtor.customer_name || "مشتری"}</h2>
                      <p dir="ltr" className="mt-1 text-right font-mono text-xs font-bold text-amber-100/70">{selectedDebtor.customer_phone || "بدون شماره"}</p>
                    </div>
                    <div className={`rounded-2xl border px-4 py-3 text-sm font-black backdrop-blur ${selectedDebtor.is_overdue ? "border-red-300/30 bg-red-500/20 text-red-100" : "border-white/10 bg-white/10 text-amber-100"}`}>
                      {selectedDebtor.is_overdue ? "سررسید گذشته" : "وضعیت عادی"}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-red-50 p-5">
                    <p className="text-[10px] font-black text-stone-400">مانده بدهی</p>
                    <p className="mt-2 text-xl font-black text-red-700">{money(selectedDebtor.remaining_debt)}</p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 p-5">
                    <p className="text-[10px] font-black text-stone-400">کل بدهی</p>
                    <p className="mt-2 text-xl font-black text-amber-700">{money(selectedDebtor.total_debt)}</p>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 p-5">
                    <p className="text-[10px] font-black text-stone-400">پرداخت‌شده</p>
                    <p className="mt-2 text-xl font-black text-emerald-700">{money(selectedDebtor.total_paid)}</p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-stone-100 bg-stone-50 p-5">
                  <div className="flex items-center justify-between text-xs font-black text-stone-500">
                    <span>نسبت پرداخت به کل بدهی</span>
                    <span>{percent(selectedPayRate)}</span>
                  </div>
                  <div className="mt-3 h-4 overflow-hidden rounded-full bg-white shadow-inner">
                    <div className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-emerald-300" style={{ width: percent(selectedPayRate) }} />
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-stone-100 bg-white p-5 shadow-sm">
                    <p className="text-[10px] font-black text-stone-400">آخرین سفارش</p>
                    <p className="mt-2 text-sm font-black text-stone-900">{selectedDebtor.last_order_date ? formatJalaliDateTime(selectedDebtor.last_order_date) : "ثبت نشده"}</p>
                  </div>
                  <div className="rounded-2xl border border-stone-100 bg-white p-5 shadow-sm">
                    <p className="text-[10px] font-black text-stone-400">آخرین پرداخت</p>
                    <p className="mt-2 text-sm font-black text-stone-900">{selectedDebtor.last_payment_date ? formatJalaliDateTime(selectedDebtor.last_payment_date) : "ثبت نشده"}</p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-stone-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-black text-stone-900">یادداشت مالی</h3>
                      <p className="mt-1 text-[10px] font-bold text-stone-400">توضیحات ثبت‌شده برای این بدهی</p>
                    </div>
                    <span className="rounded-full bg-stone-50 px-3 py-1 text-[10px] font-black text-stone-500">شناسه مشتری: {selectedDebtor.customer}</span>
                  </div>
                  <div className="mt-4 rounded-2xl bg-stone-50 p-4 text-sm font-bold leading-8 text-stone-600">
                    {selectedDebtor.notes || "یادداشتی برای این مشتری ثبت نشده است."}
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-stone-950 p-5 text-white shadow-xl">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[11px] font-black text-stone-400">آخرین بروزرسانی</p>
                      <p className="mt-1 text-sm font-bold text-stone-200">{selectedDebtor.updated_at ? formatJalaliDateTime(selectedDebtor.updated_at) : "—"}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] font-black text-stone-400">مبلغ مورد پیگیری</p>
                      <p className="mt-1 text-xl font-black text-amber-200">{money(selectedDebtor.remaining_debt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
