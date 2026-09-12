import { useEffect, useMemo, useState } from "react";
import { dashboardApi } from "../services/dashboardApi";
import { formatJalaliDateTime } from "../utils/date";

type VisitorReportRow = {
  visitor_id: number;
  visitor_username?: string;
  visitor_name?: string;
  total_visits?: number;
  completed_visits?: number;
  pending_visits?: number;
  total_orders?: number;
  retail_orders?: number;
  wholesale_orders?: number;
  total_sales?: number | string;
  retail_sales?: number | string;
  wholesale_sales?: number | string;
  total_commission?: number | string;
};

type CommissionRow = {
  id: number;
  order_number?: string;
  order_total?: number | string;
  amount?: number | string;
  percentage?: number | string;
  sale_type?: string;
  is_paid?: boolean;
  paid_at?: string | null;
  created_at?: string;
};

type VisitorCommissionDetail = {
  visitor_id?: number;
  visitor_name?: string;
  visitor_username?: string;
  visitor_phone?: string;
  percentage?: number | string;
  total_commission?: number | string;
  unpaid_commission?: number | string;
  paid_commission?: number | string;
  commission_count?: number;
  unpaid_count?: number;
  paid_count?: number;
  commissions?: CommissionRow[];
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

function saleTypeLabel(type?: string) {
  return type === "wholesale" ? "عمده" : "خرده";
}

export default function OwnerVisitorReport() {
  const [report, setReport] = useState<VisitorReportRow[]>([]);
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorReportRow | null>(null);
  const [details, setDetails] = useState<VisitorCommissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"sales" | "commission" | "orders" | "visits">("sales");

  const loadReport = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await dashboardApi.owner.visitorReport();
      const rows = Array.isArray(data) ? data : [];
      setReport(rows);
      if (!selectedVisitor && rows.length > 0) {
        setSelectedVisitor(rows[0]);
      }
    } catch (err: any) {
      setError(err.message || "خطا در دریافت گزارش ویزیتورها");
    } finally {
      setLoading(false);
    }
  };

  const loadDetails = async (visitor: VisitorReportRow) => {
    setSelectedVisitor(visitor);
    setDetailsLoading(true);
    try {
      const data = await dashboardApi.owner.commissions(visitor.visitor_id);
      setDetails(data || null);
    } catch {
      setDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => { loadReport(); }, []);

  useEffect(() => {
    if (selectedVisitor?.visitor_id) loadDetails(selectedVisitor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVisitor?.visitor_id]);

  const filteredReport = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = report.filter((visitor) => {
      const text = `${visitor.visitor_name || ""} ${visitor.visitor_username || ""}`.toLowerCase();
      return !q || text.includes(q);
    });

    return rows.sort((a, b) => {
      if (sortBy === "commission") return Number(b.total_commission || 0) - Number(a.total_commission || 0);
      if (sortBy === "orders") return Number(b.total_orders || 0) - Number(a.total_orders || 0);
      if (sortBy === "visits") return Number(b.total_visits || 0) - Number(a.total_visits || 0);
      return Number(b.total_sales || 0) - Number(a.total_sales || 0);
    });
  }, [report, query, sortBy]);

  const stats = useMemo(() => {
    const totalSales = report.reduce((sum, visitor) => sum + Number(visitor.total_sales || 0), 0);
    const totalCommission = report.reduce((sum, visitor) => sum + Number(visitor.total_commission || 0), 0);
    const totalOrders = report.reduce((sum, visitor) => sum + Number(visitor.total_orders || 0), 0);
    const totalVisits = report.reduce((sum, visitor) => sum + Number(visitor.total_visits || 0), 0);
    const completedVisits = report.reduce((sum, visitor) => sum + Number(visitor.completed_visits || 0), 0);
    const bestVisitor = [...report].sort((a, b) => Number(b.total_sales || 0) - Number(a.total_sales || 0))[0];
    return { totalSales, totalCommission, totalOrders, totalVisits, completedVisits, bestVisitor };
  }, [report]);

  const maxSales = useMemo(() => Math.max(1, ...report.map((visitor) => Number(visitor.total_sales || 0))), [report]);
  const commissions = Array.isArray(details?.commissions) ? details?.commissions || [] : [];

  return (
    <div className="min-h-screen bg-[#f7f6fb]" dir="rtl">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 px-4 py-8 text-white sm:px-6 lg:px-10">
        <div className="absolute -right-28 -top-28 h-96 w-96 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute -left-28 top-12 h-96 w-96 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.11)_1px,transparent_0)] bg-[size:30px_30px] opacity-30" />

        <div className="relative mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-black backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-lg shadow-emerald-300/50" />
            گزارش مدیریتی ویزیتورها
          </div>
          <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_420px] lg:items-end">
            <div>
              <h1 className="font-display text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                گزارش ویزیتورها
                <span className="block text-amber-200">تحلیل فروش، بازدید و پورسانت</span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm font-bold leading-8 text-indigo-100/75">
                عملکرد هر ویزیتور را با جزئیات فروش، تعداد سفارش‌ها، بازدیدهای انجام‌شده و پورسانت‌ها در یک صفحه لوکس و قابل مدیریت بررسی کنید.
              </p>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between text-xs font-black text-indigo-100">
                <span>فروش کل ویزیتورها</span>
                <span>{nf(report.length)} ویزیتور</span>
              </div>
              <div className="mt-3 text-3xl font-black text-amber-200">{money(stats.totalSales)}</div>
              <div className="mt-2 text-[11px] font-bold text-indigo-100/70">
                بهترین عملکرد: {stats.bestVisitor?.visitor_name || "—"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative overflow-hidden rounded-[2rem] border border-indigo-100 bg-white p-5 shadow-sm">
            <div className="absolute -left-10 -top-10 h-28 w-28 rounded-full bg-indigo-100 blur-2xl" />
            <p className="relative text-[11px] font-black text-slate-400">کل سفارش‌ها</p>
            <p className="relative mt-2 text-3xl font-black text-indigo-700">{nf(stats.totalOrders)}</p>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="absolute -left-10 -top-10 h-28 w-28 rounded-full bg-emerald-100 blur-2xl" />
            <p className="relative text-[11px] font-black text-slate-400">پورسانت کل</p>
            <p className="relative mt-2 text-2xl font-black text-emerald-700">{money(stats.totalCommission)}</p>
          </div>
          <div className="rounded-[2rem] border border-blue-100 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-black text-slate-400">کل بازدیدها</p>
            <p className="mt-2 text-3xl font-black text-blue-700">{nf(stats.totalVisits)}</p>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-xl">
            <p className="text-[11px] font-black text-slate-400">بازدیدهای موفق</p>
            <p className="mt-2 text-3xl font-black text-amber-200">{nf(stats.completedVisits)}</p>
          </div>
        </div>

        <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجوی نام یا نام کاربری ویزیتور..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black outline-none transition focus:border-indigo-400 focus:bg-white"
            >
              <option value="sales">مرتب‌سازی بر اساس فروش</option>
              <option value="commission">مرتب‌سازی بر اساس پورسانت</option>
              <option value="orders">مرتب‌سازی بر اساس سفارش</option>
              <option value="visits">مرتب‌سازی بر اساس بازدید</option>
            </select>
            <button onClick={loadReport} type="button" className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5">
              بروزرسانی
            </button>
          </div>
        </div>

        {error && <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-7 text-red-700">{error}</div>}

        <div className="mt-6 grid gap-5 lg:grid-cols-[390px_1fr]">
          <aside className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-900">لیست ویزیتورها</h2>
                <p className="mt-1 text-[10px] font-bold text-slate-400">انتخاب کنید تا جزئیات نمایش داده شود</p>
              </div>
              <span className="rounded-2xl bg-indigo-50 px-3 py-2 text-[10px] font-black text-indigo-700">{nf(filteredReport.length)}</span>
            </div>

            {loading ? (
              <div className="space-y-3">{[1, 2, 3, 4].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-slate-100" />)}</div>
            ) : filteredReport.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm font-bold text-slate-500">ویزیتوری یافت نشد.</div>
            ) : (
              <div className="max-h-[760px] space-y-3 overflow-y-auto pr-1">
                {filteredReport.map((visitor, index) => {
                  const active = selectedVisitor?.visitor_id === visitor.visitor_id;
                  const visitRate = Number(visitor.total_visits || 0) ? (Number(visitor.completed_visits || 0) / Number(visitor.total_visits || 0)) * 100 : 0;
                  const salesRate = (Number(visitor.total_sales || 0) / maxSales) * 100;
                  return (
                    <button
                      type="button"
                      key={visitor.visitor_id}
                      onClick={() => loadDetails(visitor)}
                      className={`w-full rounded-2xl border p-4 text-right transition ${active ? "border-indigo-300 bg-indigo-50 shadow-lg shadow-indigo-900/10" : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/40"}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-sm font-black ${active ? "bg-indigo-700 text-white" : "bg-slate-950 text-white"}`}>{index + 1}</span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-slate-900">{visitor.visitor_name || "ویزیتور"}</p>
                            <p className="mt-1 truncate font-mono text-xs font-bold text-slate-400">@{visitor.visitor_username || "—"}</p>
                          </div>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-indigo-700">{nf(visitor.total_orders)} سفارش</span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold">
                        <div className="rounded-xl bg-white/80 p-3">
                          <span className="block text-slate-400">فروش</span>
                          <span className="mt-1 block font-black text-slate-900">{money(visitor.total_sales)}</span>
                        </div>
                        <div className="rounded-xl bg-white/80 p-3">
                          <span className="block text-slate-400">پورسانت</span>
                          <span className="mt-1 block font-black text-emerald-700">{money(visitor.total_commission)}</span>
                        </div>
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500" style={{ width: percent(salesRate) }} /></div>
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                          <span>نرخ انجام بازدید</span>
                          <span>{percent(visitRate)}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          <main className="min-h-[620px] rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            {!selectedVisitor ? (
              <div className="flex min-h-[560px] flex-col items-center justify-center text-center">
                <div className="text-6xl">📈</div>
                <h3 className="mt-4 text-xl font-black text-slate-900">ویزیتور را انتخاب کنید</h3>
                <p className="mt-2 text-sm font-bold text-slate-500">جزئیات فروش و پورسانت همینجا نمایش داده می‌شود.</p>
              </div>
            ) : (
              <div>
                <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-l from-slate-950 to-indigo-950 p-6 text-white">
                  <div className="absolute -left-20 -top-20 h-52 w-52 rounded-full bg-amber-300/20 blur-3xl" />
                  <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-[11px] font-black text-indigo-100/75">جزئیات عملکرد</p>
                      <h2 className="mt-2 text-2xl font-black">{selectedVisitor.visitor_name || "ویزیتور"}</h2>
                      <p className="mt-1 font-mono text-xs font-bold text-indigo-100/70">@{selectedVisitor.visitor_username || "—"}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black backdrop-blur">
                      پورسانت کل: <span className="text-amber-200">{money(selectedVisitor.total_commission)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl bg-indigo-50 p-4"><p className="text-[10px] font-black text-slate-400">فروش کل</p><p className="mt-2 text-lg font-black text-indigo-700">{money(selectedVisitor.total_sales)}</p></div>
                  <div className="rounded-2xl bg-emerald-50 p-4"><p className="text-[10px] font-black text-slate-400">بازدید موفق</p><p className="mt-2 text-lg font-black text-emerald-700">{nf(selectedVisitor.completed_visits)} از {nf(selectedVisitor.total_visits)}</p></div>
                  <div className="rounded-2xl bg-amber-50 p-4"><p className="text-[10px] font-black text-slate-400">سفارش عمده</p><p className="mt-2 text-lg font-black text-amber-700">{nf(selectedVisitor.wholesale_orders)}</p></div>
                  <div className="rounded-2xl bg-slate-50 p-4"><p className="text-[10px] font-black text-slate-400">سفارش خرده</p><p className="mt-2 text-lg font-black text-slate-900">{nf(selectedVisitor.retail_orders)}</p></div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center justify-between text-xs font-black text-slate-500"><span>فروش عمده</span><span>{money(selectedVisitor.wholesale_sales)}</span></div>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-amber-400" style={{ width: percent((Number(selectedVisitor.wholesale_sales || 0) / Math.max(1, Number(selectedVisitor.total_sales || 0))) * 100) }} /></div>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center justify-between text-xs font-black text-slate-500"><span>فروش خرده</span><span>{money(selectedVisitor.retail_sales)}</span></div>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-indigo-500" style={{ width: percent((Number(selectedVisitor.retail_sales || 0) / Math.max(1, Number(selectedVisitor.total_sales || 0))) * 100) }} /></div>
                  </div>
                </div>

                <section className="mt-5 rounded-2xl border border-slate-100 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-100 p-4">
                    <div>
                      <h3 className="font-black text-slate-900">آخرین پورسانت‌ها</h3>
                      <p className="mt-1 text-[10px] font-bold text-slate-400">بر اساس سفارش‌های ثبت‌شده برای این ویزیتور</p>
                    </div>
                    <span className="rounded-2xl bg-slate-50 px-3 py-2 text-[10px] font-black text-slate-500">{nf(commissions.length)} رکورد</span>
                  </div>

                  {detailsLoading ? (
                    <div className="space-y-3 p-4">{[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)}</div>
                  ) : commissions.length === 0 ? (
                    <div className="p-10 text-center text-sm font-bold text-slate-500">پورسانتی برای این ویزیتور ثبت نشده است.</div>
                  ) : (
                    <div className="max-h-[520px] space-y-3 overflow-y-auto p-4 pr-2">
                      {commissions.slice(0, 20).map((commission) => (
                        <div key={commission.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-indigo-100 hover:bg-white">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <div className="font-mono text-sm font-black text-slate-900">{commission.order_number || "بدون شماره"}</div>
                              <div className="mt-1 text-[11px] font-bold text-slate-400">{formatJalaliDateTime(commission.created_at)}</div>
                            </div>
                            <div className="flex flex-wrap gap-2 text-[10px] font-black">
                              <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{saleTypeLabel(commission.sale_type)}</span>
                              <span className={`rounded-full px-3 py-1 ${commission.is_paid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{commission.is_paid ? "پرداخت‌شده" : "در انتظار پرداخت"}</span>
                            </div>
                          </div>
                          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-bold">
                            <div className="rounded-xl bg-white p-3"><span className="block text-slate-400">مبلغ سفارش</span><span className="mt-1 block font-black text-slate-900">{money(commission.order_total)}</span></div>
                            <div className="rounded-xl bg-white p-3"><span className="block text-slate-400">درصد</span><span className="mt-1 block font-black text-indigo-700">{nf(commission.percentage)}٪</span></div>
                            <div className="rounded-xl bg-white p-3"><span className="block text-slate-400">پورسانت</span><span className="mt-1 block font-black text-emerald-700">{money(commission.amount)}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
