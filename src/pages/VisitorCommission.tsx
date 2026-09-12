import { useEffect, useMemo, useState } from "react";
import { dashboardApi } from "../services/dashboardApi";
import { formatJalaliDateTime } from "../utils/date";

type CommissionItem = {
  id: number;
  product_name?: string;
  quantity?: number;
  price?: number | string;
  subtotal?: number | string;
};

type Commission = {
  id: number;
  order_number?: string;
  order_total?: number | string;
  sale_type?: "wholesale" | "retail" | string;
  customer_name?: string;
  customer_phone?: string;
  percentage?: number | string;
  amount?: number | string;
  is_paid?: boolean;
  paid_at?: string | null;
  created_at?: string;
  items?: CommissionItem[];
};

type CommissionResponse = {
  total_commission?: number | string;
  unpaid_commission?: number | string;
  paid_commission?: number | string;
  commissions?: Commission[];
};

function money(value: number | string | null | undefined) {
  const num = Number(value ?? 0);
  return (Number.isFinite(num) ? num : 0).toLocaleString("en-US") + " تومان";
}

function nf(value: number | string | null | undefined) {
  const num = Number(value ?? 0);
  return (Number.isFinite(num) ? num : 0).toLocaleString("en-US");
}

function saleTypeLabel(type?: string) {
  return type === "wholesale" ? "عمده" : "خرده";
}

function itemSubtotal(item: CommissionItem) {
  const direct = Number(item.subtotal ?? 0);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const price = Number(item.price ?? 0);
  const quantity = Number(item.quantity ?? 0);
  return (Number.isFinite(price) ? price : 0) * (Number.isFinite(quantity) ? quantity : 0);
}

export default function VisitorCommission() {
  const [data, setData] = useState<CommissionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "wholesale" | "retail">("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await dashboardApi.visitor.commission();
      setData(response || {});
    } catch (err: any) {
      setError(err.message || "خطا در دریافت اطلاعات پورسانت");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const commissions = useMemo(() => Array.isArray(data?.commissions) ? data?.commissions || [] : [], [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return commissions.filter((commission) => {
      const statusOk = statusFilter === "all" || (statusFilter === "paid" ? commission.is_paid : !commission.is_paid);
      const typeOk = typeFilter === "all" || commission.sale_type === typeFilter;
      const text = `${commission.order_number || ""} ${commission.customer_name || ""} ${commission.customer_phone || ""}`.toLowerCase();
      const queryOk = !q || text.includes(q);
      return statusOk && typeOk && queryOk;
    });
  }, [commissions, query, statusFilter, typeFilter]);

  const localStats = useMemo(() => {
    const wholesaleCount = commissions.filter((item) => item.sale_type === "wholesale").length;
    const retailCount = commissions.filter((item) => item.sale_type !== "wholesale").length;
    const average = commissions.length
      ? commissions.reduce((sum, item) => sum + Number(item.amount || 0), 0) / commissions.length
      : 0;
    return { wholesaleCount, retailCount, average };
  }, [commissions]);

  return (
    <div className="min-h-screen bg-[#f8f7fb]" dir="rtl">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-950 px-4 py-8 text-white sm:px-6 lg:px-10">
        <div className="absolute -right-28 -top-28 h-96 w-96 rounded-full bg-blue-500/25 blur-3xl" />
        <div className="absolute -left-28 top-10 h-96 w-96 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.10)_1px,transparent_0)] bg-[size:30px_30px] opacity-30" />

        <div className="relative mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-black backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-lg shadow-emerald-300/50" />
            گزارش پورسانت ویزیتور
          </div>
          <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_410px] lg:items-end">
            <div>
              <h1 className="font-display text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                پورسانت من
                <span className="block text-blue-200">شفاف، دقیق و حرفه‌ای</span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm font-bold leading-8 text-blue-100/75">
                پورسانت سفارش‌های ثبت‌شده، وضعیت پرداخت و جزئیات هر سفارش را در یک صفحه اختصاصی ویزیتور مشاهده کنید.
              </p>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between text-xs font-black text-blue-100">
                <span>کل پورسانت</span>
                <span>{nf(commissions.length)} رکورد</span>
              </div>
              <div className="mt-3 text-3xl font-black text-emerald-300">{money(data?.total_commission)}</div>
              <div className="mt-2 text-[11px] font-bold text-blue-100/70">میانگین هر سفارش: {money(localStats.average)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative overflow-hidden rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="absolute -left-10 -top-10 h-28 w-28 rounded-full bg-emerald-100 blur-2xl" />
            <p className="relative text-[11px] font-black text-slate-400">پرداخت‌شده</p>
            <p className="relative mt-2 text-2xl font-black text-emerald-700">{money(data?.paid_commission)}</p>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] border border-amber-100 bg-white p-5 shadow-sm">
            <div className="absolute -left-10 -top-10 h-28 w-28 rounded-full bg-amber-100 blur-2xl" />
            <p className="relative text-[11px] font-black text-slate-400">در انتظار پرداخت</p>
            <p className="relative mt-2 text-2xl font-black text-amber-700">{money(data?.unpaid_commission)}</p>
          </div>
          <div className="rounded-[2rem] border border-blue-100 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-black text-slate-400">سفارش عمده</p>
            <p className="mt-2 text-3xl font-black text-blue-700">{nf(localStats.wholesaleCount)}</p>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-xl">
            <p className="text-[11px] font-black text-slate-400">سفارش خرده</p>
            <p className="mt-2 text-3xl font-black text-blue-200">{nf(localStats.retailCount)}</p>
          </div>
        </div>

        <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto] lg:items-center">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجوی مشتری، موبایل یا شماره سفارش..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black outline-none transition focus:border-blue-400 focus:bg-white"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="paid">پرداخت‌شده</option>
              <option value="unpaid">در انتظار پرداخت</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black outline-none transition focus:border-blue-400 focus:bg-white"
            >
              <option value="all">همه سفارش‌ها</option>
              <option value="wholesale">عمده</option>
              <option value="retail">خرده</option>
            </select>
            <button onClick={load} type="button" className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5">
              بروزرسانی
            </button>
          </div>
        </div>

        {error && <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-7 text-red-700">{error}</div>}

        {loading ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {[1, 2, 3, 4].map((item) => <div key={item} className="h-56 animate-pulse rounded-[2rem] bg-white" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-6 rounded-[2.5rem] border border-dashed border-slate-200 bg-white p-16 text-center shadow-sm">
            <div className="text-6xl">💎</div>
            <h3 className="mt-4 text-xl font-black text-slate-900">پورسانتی یافت نشد</h3>
            <p className="mt-2 text-sm font-bold text-slate-500">با تغییر فیلترها یا ثبت سفارش جدید، رکوردهای پورسانت اینجا نمایش داده می‌شوند.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {filtered.map((commission, index) => {
              const expanded = expandedId === commission.id;
              return (
                <article key={commission.id} className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl">
                  <div className="relative overflow-hidden bg-gradient-to-l from-slate-950 to-blue-950 p-5 text-white">
                    <div className="absolute -left-16 -top-16 h-40 w-40 rounded-full bg-blue-400/20 blur-3xl" />
                    <div className="relative flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-sm font-black text-blue-950 shadow-lg">{index + 1}</span>
                        <div>
                          <h3 className="font-black">{commission.customer_name || "مشتری"}</h3>
                          <p className="mt-1 font-mono text-xs font-bold text-blue-100">{commission.order_number || "بدون شماره"}</p>
                        </div>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-black ${commission.is_paid ? "bg-emerald-300 text-emerald-950" : "bg-amber-300 text-amber-950"}`}>
                        {commission.is_paid ? "پرداخت‌شده" : "در انتظار پرداخت"}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
                      <div className="rounded-2xl bg-blue-50 p-3">
                        <p className="text-[10px] font-black text-slate-400">نوع سفارش</p>
                        <p className="mt-1 text-sm font-black text-blue-700">{saleTypeLabel(commission.sale_type)}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-[10px] font-black text-slate-400">مبلغ سفارش</p>
                        <p className="mt-1 text-xs font-black text-slate-900">{money(commission.order_total)}</p>
                      </div>
                      <div className="rounded-2xl bg-fuchsia-50 p-3">
                        <p className="text-[10px] font-black text-slate-400">درصد</p>
                        <p className="mt-1 text-sm font-black text-fuchsia-700">{nf(commission.percentage)}٪</p>
                      </div>
                      <div className="rounded-2xl bg-emerald-50 p-3">
                        <p className="text-[10px] font-black text-slate-400">پورسانت</p>
                        <p className="mt-1 text-xs font-black text-emerald-700">{money(commission.amount)}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-2 rounded-2xl bg-slate-50 p-4 text-xs font-bold leading-6 text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                      <span>📅 ثبت: {formatJalaliDateTime(commission.created_at)}</span>
                      {commission.customer_phone && <span dir="ltr" className="text-right font-mono">📞 {commission.customer_phone}</span>}
                    </div>

                    {commission.is_paid && commission.paid_at && (
                      <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-700">
                        تاریخ پرداخت: {formatJalaliDateTime(commission.paid_at)}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : commission.id)}
                      className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                    >
                      {expanded ? "بستن جزئیات سفارش" : "مشاهده جزئیات سفارش"}
                    </button>

                    {expanded && (
                      <div className="mt-4 space-y-2">
                        {(commission.items || []).length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs font-bold text-slate-500">آیتمی برای این سفارش ثبت نشده است.</div>
                        ) : (
                          (commission.items || []).map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-black text-slate-900">{item.product_name || "محصول"}</p>
                                <p className="mt-1 text-[11px] font-bold text-slate-500">تعداد: {nf(item.quantity)} × {money(item.price)}</p>
                              </div>
                              <p className="shrink-0 text-xs font-black text-blue-700">{money(itemSubtotal(item))}</p>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
