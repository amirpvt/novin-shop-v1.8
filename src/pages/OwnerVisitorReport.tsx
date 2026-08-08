// @ts-nocheck
/**
 * OwnerVisitorReportPro.tsx - گزارش ویزیتورها حرفه‌ای و لوکس
 * فقط همین بخش تغییر کرده - بقیه پنل دست نخورده
 */
import { useEffect, useState } from "react";
import { dashboardApi } from "../services/dashboardApi";

function formatPrice(n: number | string) {
  const num = typeof n === "string" ? parseFloat(n) : n;
  return num.toLocaleString("en-US") + " تومان";
}

export default function OwnerVisitorReportPro() {
  const [report, setReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"sales" | "orders" | "visits">("sales");

  const load = async () => {
    setLoading(true);
    try {
      const data = await dashboardApi.owner.visitorReport();
      setReport(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const sorted = [...report].sort((a, b) => {
    if (sortBy === "sales") return (b.total_sales || 0) - (a.total_sales || 0);
    if (sortBy === "orders") return (b.total_orders || 0) - (a.total_orders || 0);
    return (b.total_visits || 0) - (a.total_visits || 0);
  });

  const totalSales = report.reduce((s, r) => s + (r.total_sales || 0), 0);
  const totalOrders = report.reduce((s, r) => s + (r.total_orders || 0), 0);
  const totalVisits = report.reduce((s, r) => s + (r.total_visits || 0), 0);
  const topVisitor = sorted[0];

  return (
    <div className="space-y-6">
      {/* هدر لوکس */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-900 via-slate-900 to-stone-900 p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] bg-[size:32px_32px] opacity-20" />
        
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/10 px-4 py-1.5 text-xs font-black tracking-widest">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            گزارش عملکرد ویزیتورها - لحظه‌ای
          </div>
          <h1 className="mt-5 font-display text-3xl md:text-4xl font-black tracking-tight">📈 گزارش ویزیتورها</h1>
          <p className="mt-3 text-stone-400 text-sm max-w-2xl leading-relaxed">
            عملکرد هر ویزیتور: تعداد بازدیدها، سفارشات ثبت شده، مجموع فروش و پورسانت. ویزیتور برتر مشخص است.
          </p>

          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-4">
              <p className="text-[10px] tracking-widest font-black text-stone-400">کل ویزیتورها</p>
              <p className="mt-2 text-2xl font-black">{report.length}</p>
              <p className="text-[11px] text-stone-400 mt-1">نماینده فعال</p>
            </div>
            <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-4">
              <p className="text-[10px] tracking-widest font-black text-stone-400">کل فروش تیم</p>
              <p className="mt-2 text-xl font-black text-emerald-300">{formatPrice(totalSales)}</p>
              <p className="text-[11px] text-stone-400 mt-1">{totalOrders} سفارش</p>
            </div>
            <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-4">
              <p className="text-[10px] tracking-widest font-black text-stone-400">کل بازدیدها</p>
              <p className="mt-2 text-2xl font-black">{totalVisits}</p>
              <p className="text-[11px] text-stone-400 mt-1">بازدید ثبت شده</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-gold-600 p-4 text-stone-900 shadow-lg shadow-amber-600/20">
              <p className="text-[10px] tracking-widest font-black opacity-70">ویزیتور برتر</p>
              <p className="mt-2 text-lg font-black truncate">{topVisitor?.visitor_name || topVisitor?.visitor_username || "-"}</p>
              <p className="text-[11px] opacity-80 mt-1">{topVisitor ? formatPrice(topVisitor.total_sales) : ""}</p>
            </div>
          </div>
        </div>
      </div>

      {/* سورت */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs font-bold text-stone-500 self-center ml-2">مرتب‌سازی بر اساس:</span>
        {[
          { id: "sales", label: "بیشترین فروش", icon: "💰" },
          { id: "orders", label: "بیشترین سفارش", icon: "📦" },
          { id: "visits", label: "بیشترین بازدید", icon: "📍" },
        ].map((s) => (
          <button key={s.id} onClick={() => setSortBy(s.id as any)} className={`px-4 py-2 rounded-xl text-xs font-black border transition ${sortBy === s.id ? "bg-stone-900 text-white border-stone-900 shadow" : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"}`}>
            <span className="mr-1">{s.icon}</span>{s.label}
          </button>
        ))}
        <button onClick={load} className="mr-auto px-4 py-2 bg-white border rounded-xl text-xs font-bold hover:bg-stone-50">🔄 رفرش</button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-48 bg-stone-100 rounded-[2rem] animate-pulse" />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="rounded-[2.5rem] bg-white border p-16 text-center shadow-sm">
          <div className="text-6xl mb-4">🧑‍💼</div>
          <h3 className="text-xl font-black">ویزیتوری یافت نشد</h3>
          <p className="text-sm text-stone-500 mt-2">هنوز ویزیتوری ثبت نشده یا فعالیتی نداشته</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sorted.map((visitor, idx) => {
            const isTop = idx === 0;
            const performance = visitor.total_visits > 0 ? Math.round((visitor.completed_visits / visitor.total_visits) * 100) : 0;
            return (
              <div key={visitor.visitor_id} className={`group relative overflow-hidden rounded-[2rem] border bg-white shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ${isTop ? "border-amber-200 shadow-amber-100/50 ring-2 ring-amber-500/20" : "border-stone-200"}`}>
                {isTop && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-gold-600 text-stone-900 px-4 py-1 rounded-bl-2xl rounded-tr-[2rem] text-[10px] font-black flex items-center gap-1">
                    <span>👑</span> برتر
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg ${isTop ? "bg-gradient-to-br from-amber-500 to-gold-600 text-stone-900" : "bg-stone-900 text-white"}`}>
                        {idx + 1}
                      </div>
                      <div>
                        <h3 className="font-black text-lg">{visitor.visitor_name}</h3>
                        <p className="text-xs text-stone-500 font-mono">@{visitor.visitor_username} • ID:{visitor.visitor_id}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1.5 w-20 bg-stone-100 rounded-full overflow-hidden">
                            <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-1000" style={{ width: `${performance}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-stone-500">{performance}% تکمیل</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black tracking-widest text-stone-400">فروش کل</p>
                      <p className="font-black text-emerald-600 mt-1">{formatPrice(visitor.total_sales)}</p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-4 gap-3">
                    <div className="rounded-2xl bg-stone-50 border p-3 text-center">
                      <p className="text-[10px] font-bold text-stone-400">بازدید</p>
                      <p className="mt-1 text-xl font-black">{visitor.total_visits}</p>
                    </div>
                    <div className="rounded-2xl bg-blue-50 border border-blue-100 p-3 text-center">
                      <p className="text-[10px] font-bold text-blue-600">انجام شده</p>
                      <p className="mt-1 text-xl font-black text-blue-700">{visitor.completed_visits}</p>
                    </div>
                    <div className="rounded-2xl bg-amber-50 border border-amber-100 p-3 text-center">
                      <p className="text-[10px] font-bold text-amber-700">در انتظار</p>
                      <p className="mt-1 text-xl font-black text-amber-700">{visitor.pending_visits}</p>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3 text-center">
                      <p className="text-[10px] font-bold text-emerald-700">پورسانت</p>
                      <p className="mt-1 text-sm font-black text-emerald-700">{formatPrice(visitor.total_commission)}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex gap-2">
                    <div className="flex-1 rounded-xl bg-stone-900 text-white p-3 flex justify-between items-center">
                      <span className="text-xs">سفارشات</span>
                      <span className="font-black">{visitor.total_orders}</span>
                    </div>
                    <div className="flex-1 rounded-xl bg-stone-50 border p-3 flex justify-between items-center">
                      <span className="text-xs font-bold text-stone-600">میانگین هر سفارش</span>
                      <span className="font-black text-sm">{visitor.total_orders > 0 ? formatPrice(visitor.total_sales / visitor.total_orders) : "0"}</span>
                    </div>
                  </div>
                </div>

                {/* نوار پایین */}
                <div className="h-1.5 w-full bg-stone-100">
                  <div className="h-1.5 bg-gradient-to-r from-stone-900 to-stone-700 transition-all duration-1000" style={{ width: `${Math.min(100, (visitor.total_sales / (sorted[0]?.total_sales || 1)) * 100)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
