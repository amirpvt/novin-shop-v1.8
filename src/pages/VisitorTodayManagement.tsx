import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dashboardApi } from "../services/dashboardApi";
import { formatTodayJalali } from "../utils/date";

type VisitItem = {
  id: number;
  customer: number;
  customer_name: string;
  customer_phone: string;
  date: string;
  status: string;
  priority: number;
  notes?: string;
  admin_notes?: string;
};

const statusOptions = [
  { value: "pending", label: "در انتظار بازدید", icon: "⏳", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "visited", label: "بازدید شد", icon: "✅", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "ordered", label: "سفارش ثبت شد", icon: "📝", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "no_order", label: "سفارش نداشت", icon: "—", color: "bg-stone-50 text-stone-700 border-stone-200" },
  { value: "postponed", label: "به تعویق افتاد", icon: "↺", color: "bg-violet-50 text-violet-700 border-violet-200" },
];

function meta(status: string) {
  return statusOptions.find((s) => s.value === status) || statusOptions[0];
}

export default function VisitorTodayManagement() {
  const navigate = useNavigate();
  const [items, setItems] = useState<VisitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await dashboardApi.visitor.todayList();
      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "خطا در دریافت برنامه امروز");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    total: items.length,
    pending: items.filter((i) => i.status === "pending").length,
    visited: items.filter((i) => ["visited", "ordered", "no_order"].includes(i.status)).length,
    ordered: items.filter((i) => i.status === "ordered").length,
  }), [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((item) => filter === "all" || item.status === filter)
      .filter((item) => !q || `${item.customer_name} ${item.customer_phone} ${item.notes || ""} ${item.admin_notes || ""}`.toLowerCase().includes(q))
      .sort((a, b) => a.priority - b.priority);
  }, [items, filter, query]);

  const updateVisit = async (scheduleId: number, patch: { status?: string; notes?: string }) => {
    setSavingId(scheduleId);
    setError("");
    try {
      const updated = await dashboardApi.visitor.todayUpdate({ schedule_id: scheduleId, ...patch });
      setItems((prev) => prev.map((item) => item.id === scheduleId ? { ...item, ...updated } : item));
    } catch (err: any) {
      setError(err.message || "خطا در بروزرسانی برنامه");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7fbff]" dir="rtl">
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-800 to-cyan-700 px-4 py-8 text-white sm:px-6 lg:px-10">
        <div className="absolute -right-28 -top-28 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute -left-28 top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.12)_1px,transparent_0)] bg-[size:30px_30px] opacity-30" />
        <div className="relative mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-black backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-lg shadow-emerald-300/50" />
            برنامه امروز ویزیتور
          </div>
          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">مدیریت برنامه امروز</h1>
              <p className="mt-3 max-w-2xl text-sm font-bold leading-8 text-blue-100/85">
                مشتری‌های امروز را ببینید، وضعیت بازدید را ثبت کنید، یادداشت بگذارید و برای مشتری انتخاب‌شده سفارش عمده بسازید.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
              <div className="rounded-[2rem] border border-white/10 bg-white/10 p-4 text-right backdrop-blur">
                <div className="text-[11px] font-black text-cyan-100">تاریخ شمسی امروز</div>
                <div className="mt-2 text-sm font-black text-white">{formatTodayJalali()}</div>
              </div>
              <button onClick={() => navigate("/dashboard/visitor/order")} className="rounded-2xl bg-white px-6 py-4 text-sm font-black text-blue-800 shadow-2xl transition hover:-translate-y-0.5">
                ثبت سفارش عمده
              </button>
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[1.7rem] border border-white/15 bg-white/10 p-4 backdrop-blur"><p className="text-[11px] font-black text-blue-100">کل برنامه</p><p className="mt-2 text-3xl font-black">{stats.total}</p></div>
            <div className="rounded-[1.7rem] border border-white/15 bg-white/10 p-4 backdrop-blur"><p className="text-[11px] font-black text-blue-100">در انتظار</p><p className="mt-2 text-3xl font-black text-amber-200">{stats.pending}</p></div>
            <div className="rounded-[1.7rem] border border-white/15 bg-white/10 p-4 backdrop-blur"><p className="text-[11px] font-black text-blue-100">بازدید شده</p><p className="mt-2 text-3xl font-black text-cyan-100">{stats.visited}</p></div>
            <div className="rounded-[1.7rem] border border-white/15 bg-white/10 p-4 backdrop-blur"><p className="text-[11px] font-black text-blue-100">سفارش ثبت‌شده</p><p className="mt-2 text-3xl font-black text-emerald-200">{stats.ordered}</p></div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
        <div className="rounded-[2rem] border border-blue-100 bg-white p-4 shadow-xl shadow-blue-900/5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[{ value: "all", label: "همه" }, ...statusOptions].map((option) => (
                <button key={option.value} onClick={() => setFilter(option.value)} className={`whitespace-nowrap rounded-2xl px-4 py-2.5 text-xs font-black transition ${filter === option.value ? "bg-blue-700 text-white shadow-lg shadow-blue-700/20" : "bg-blue-50 text-blue-700 hover:bg-blue-100"}`}>
                  {"icon" in option ? `${option.icon} ` : ""}{option.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جستجوی مشتری، موبایل یا یادداشت..." className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold outline-none focus:border-blue-400 focus:bg-white lg:w-80" />
              <button onClick={load} className="rounded-2xl border border-stone-200 bg-white px-5 py-3 text-xs font-black text-stone-700 hover:bg-stone-50">رفرش</button>
            </div>
          </div>
        </div>

        {error && <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}

        {loading ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-56 animate-pulse rounded-[2rem] bg-white" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-6 rounded-[2.5rem] border border-dashed border-blue-100 bg-white p-16 text-center shadow-sm">
            <div className="text-6xl">📅</div>
            <h3 className="mt-4 text-xl font-black text-stone-900">برنامه‌ای برای نمایش وجود ندارد</h3>
            <p className="mt-2 text-sm font-bold text-stone-500">اگر برنامه امروز توسط مدیر ثبت شود، اینجا نمایش داده می‌شود.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {filtered.map((item) => {
              const itemMeta = meta(item.status);
              return (
                <div key={item.id} className="group overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/10">
                  <div className="relative border-b border-blue-50 bg-gradient-to-l from-blue-50 via-white to-cyan-50 p-5">
                    <div className="absolute -left-10 -top-10 h-28 w-28 rounded-full bg-blue-100 blur-2xl" />
                    <div className="relative flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-800 text-sm font-black text-white shadow-lg shadow-blue-800/20">{item.priority}</span>
                        <div>
                          <h3 className="text-lg font-black text-stone-900">{item.customer_name}</h3>
                          <p dir="ltr" className="mt-1 text-right font-mono text-xs font-bold text-stone-500">{item.customer_phone || "بدون شماره"}</p>
                        </div>
                      </div>
                      <span className={`rounded-full border px-3 py-1.5 text-[11px] font-black ${itemMeta.color}`}>{itemMeta.icon} {itemMeta.label}</span>
                    </div>
                  </div>

                  <div className="p-5">
                    {item.admin_notes && (
                      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-xs font-bold leading-6 text-amber-800">
                        <span className="font-black">یادداشت مدیر: </span>{item.admin_notes}
                      </div>
                    )}

                    <div className="mt-4 grid gap-2 sm:grid-cols-5">
                      {statusOptions.map((option) => (
                        <button
                          key={option.value}
                          disabled={savingId === item.id}
                          onClick={() => updateVisit(item.id, { status: option.value })}
                          className={`rounded-2xl border px-2 py-3 text-[10px] font-black transition disabled:opacity-50 ${item.status === option.value ? "border-blue-500 bg-blue-700 text-white shadow-lg shadow-blue-700/20" : "border-stone-100 bg-stone-50 text-stone-600 hover:border-blue-200 hover:bg-blue-50"}`}
                        >
                          <span className="block text-base">{option.icon}</span>
                          <span className="mt-1 block leading-4">{option.label}</span>
                        </button>
                      ))}
                    </div>

                    <label className="mt-4 block text-xs font-black text-stone-500">
                      یادداشت ویزیتور
                      <textarea
                        defaultValue={item.notes || ""}
                        onBlur={(e) => updateVisit(item.id, { notes: e.target.value })}
                        rows={3}
                        placeholder="نتیجه مذاکره، توضیح مشتری یا زمان مراجعه بعدی..."
                        className="mt-2 w-full resize-none rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold leading-7 outline-none transition focus:border-blue-400 focus:bg-white"
                      />
                    </label>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <button onClick={() => navigate("/dashboard/visitor/order")} className="flex-1 rounded-2xl bg-blue-700 px-4 py-3 text-xs font-black text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800">
                        ثبت سفارش عمده برای مشتری
                      </button>
                      <a href={`tel:${item.customer_phone || ""}`} className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-center text-xs font-black text-blue-700 transition hover:bg-blue-100">
                        تماس با مشتری
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
