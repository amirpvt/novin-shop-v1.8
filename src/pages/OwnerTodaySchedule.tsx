import { useEffect, useMemo, useState } from "react";
import { dashboardApi } from "../services/dashboardApi";
import { formatJalaliDate } from "../utils/date";

type Schedule = {
  id: number;
  visitor: number;
  visitor_name: string;
  customer: number;
  customer_name: string;
  customer_phone: string;
  date: string;
  status: string;
  priority: number;
  notes?: string;
  admin_notes?: string;
};

const statuses = [
  { value: "pending", label: "در انتظار", icon: "⏳", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "visited", label: "بازدید شد", icon: "✅", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "ordered", label: "سفارش ثبت شد", icon: "📝", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "no_order", label: "سفارش نداشت", icon: "—", color: "bg-stone-50 text-stone-700 border-stone-200" },
  { value: "postponed", label: "تعویق", icon: "↺", color: "bg-violet-50 text-violet-700 border-violet-200" },
];

function statusMeta(status: string) {
  return statuses.find((s) => s.value === status) || statuses[0];
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function OwnerTodaySchedule() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [date, setDate] = useState(todayIso());
  const [visitorFilter, setVisitorFilter] = useState<number | "">("");
  const [form, setForm] = useState({ visitor_id: "", customer_id: "", priority: "1", admin_notes: "" });

  const loadSchedules = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await dashboardApi.owner.todaySchedules({ date, ...(visitorFilter ? { visitor_id: Number(visitorFilter) } : {}) });
      setSchedules(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "خطا در دریافت برنامه امروز");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const [visitorList, customerList] = await Promise.all([
        dashboardApi.owner.users("visitor"),
        dashboardApi.owner.users("customer"),
      ]);
      setVisitors(Array.isArray(visitorList) ? visitorList : []);
      setCustomers(Array.isArray(customerList) ? customerList : []);
    } catch (err: any) {
      setError(err.message || "خطا در دریافت کاربران");
    }
  };

  useEffect(() => { loadUsers(); }, []);
  useEffect(() => { loadSchedules(); }, [date, visitorFilter]);

  const stats = useMemo(() => ({
    total: schedules.length,
    visitors: new Set(schedules.map((s) => s.visitor)).size,
    pending: schedules.filter((s) => s.status === "pending").length,
    ordered: schedules.filter((s) => s.status === "ordered").length,
  }), [schedules]);

  const createSchedule = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!form.visitor_id || !form.customer_id) {
      setError("ویزیتور و مشتری را انتخاب کنید.");
      return;
    }
    setSaving(true);
    try {
      await dashboardApi.owner.todayScheduleCreate({
        visitor_id: Number(form.visitor_id),
        customer_id: Number(form.customer_id),
        date,
        priority: Number(form.priority || 1),
        admin_notes: form.admin_notes,
      });
      setForm({ visitor_id: form.visitor_id, customer_id: "", priority: "1", admin_notes: "" });
      await loadSchedules();
    } catch (err: any) {
      setError(err.message || "خطا در ثبت برنامه");
    } finally {
      setSaving(false);
    }
  };

  const updateSchedule = async (scheduleId: number, patch: Partial<Schedule>) => {
    setError("");
    try {
      const updated = await dashboardApi.owner.todayScheduleUpdate({ schedule_id: scheduleId, ...patch });
      setSchedules((prev) => prev.map((s) => s.id === scheduleId ? { ...s, ...updated } : s));
    } catch (err: any) {
      setError(err.message || "خطا در بروزرسانی برنامه");
    }
  };

  const deleteSchedule = async (scheduleId: number) => {
    if (!confirm("این برنامه حذف شود؟")) return;
    setError("");
    try {
      await dashboardApi.owner.todayScheduleDelete(scheduleId);
      setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
    } catch (err: any) {
      setError(err.message || "خطا در حذف برنامه");
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]" dir="rtl">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-stone-950 via-amber-950 to-stone-900 p-8 text-white shadow-2xl shadow-stone-900/20">
        <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-gold-400/20 blur-3xl" />
        <div className="absolute -left-20 top-16 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative">
          <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-black backdrop-blur">مدیریت برنامه امروز</span>
          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-3xl font-black sm:text-4xl lg:text-5xl">برنامه امروز ویزیتورها</h1>
              <p className="mt-3 max-w-2xl text-sm font-bold leading-8 text-stone-300">مدیرکل می‌تواند برنامه روزانه هر ویزیتور را بسازد، اولویت بدهد، وضعیت را پیگیری کند و یادداشت مدیریتی ثبت کند.</p>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
              <div className="mb-2 text-[11px] font-black text-gold-200">تاریخ شمسی: {formatJalaliDate(date)}</div>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-black text-stone-900 outline-none" />
            </div>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[1.7rem] border border-white/10 bg-white/10 p-4"><p className="text-[11px] font-black text-stone-400">کل برنامه‌ها</p><p className="mt-2 text-3xl font-black">{stats.total}</p></div>
            <div className="rounded-[1.7rem] border border-white/10 bg-white/10 p-4"><p className="text-[11px] font-black text-stone-400">ویزیتور فعال</p><p className="mt-2 text-3xl font-black text-gold-300">{stats.visitors}</p></div>
            <div className="rounded-[1.7rem] border border-white/10 bg-white/10 p-4"><p className="text-[11px] font-black text-stone-400">در انتظار</p><p className="mt-2 text-3xl font-black text-amber-200">{stats.pending}</p></div>
            <div className="rounded-[1.7rem] border border-white/10 bg-white/10 p-4"><p className="text-[11px] font-black text-stone-400">سفارش ثبت‌شده</p><p className="mt-2 text-3xl font-black text-emerald-300">{stats.ordered}</p></div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
        <form onSubmit={createSchedule} className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-xl shadow-stone-900/5 xl:sticky xl:top-24 xl:self-start">
          <h2 className="text-lg font-black text-stone-900">افزودن برنامه جدید</h2>
          <p className="mt-1 text-xs font-bold text-stone-400">برای تاریخ انتخاب‌شده، مشتری را به برنامه ویزیتور اضافه کنید.</p>

          {error && <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-7 text-red-700">{error}</div>}

          <div className="mt-5 space-y-4">
            <label className="block text-xs font-black text-stone-600">ویزیتور
              <select value={form.visitor_id} onChange={(e) => setForm((p) => ({ ...p, visitor_id: e.target.value }))} className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold outline-none focus:border-gold-400">
                <option value="">انتخاب ویزیتور</option>
                {visitors.map((v) => <option key={v.id} value={v.id}>{v.full_name || v.username} - {v.phone}</option>)}
              </select>
            </label>
            <label className="block text-xs font-black text-stone-600">مشتری
              <select value={form.customer_id} onChange={(e) => setForm((p) => ({ ...p, customer_id: e.target.value }))} className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold outline-none focus:border-gold-400">
                <option value="">انتخاب مشتری</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.full_name || c.username} - {c.phone}</option>)}
              </select>
            </label>
            <label className="block text-xs font-black text-stone-600">اولویت
              <input type="number" min={1} max={5} value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))} className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-center font-mono text-sm font-black outline-none focus:border-gold-400" />
            </label>
            <label className="block text-xs font-black text-stone-600">یادداشت مدیر
              <textarea value={form.admin_notes} onChange={(e) => setForm((p) => ({ ...p, admin_notes: e.target.value }))} rows={4} className="mt-2 w-full resize-none rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold leading-7 outline-none focus:border-gold-400" placeholder="توضیحات مسیر، نکته مذاکره یا اولویت فروش..." />
            </label>
          </div>

          <button disabled={saving} className="mt-5 w-full rounded-2xl bg-gradient-to-l from-amber-500 to-gold-500 py-4 text-sm font-black text-stone-950 shadow-xl shadow-amber-500/20 transition hover:-translate-y-0.5 disabled:opacity-60">
            {saving ? "در حال ثبت..." : "افزودن به برنامه امروز"}
          </button>
        </form>

        <section className="space-y-4">
          <div className="rounded-[2rem] border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-black text-stone-900">لیست برنامه‌ها</h2>
              <select value={visitorFilter} onChange={(e) => setVisitorFilter(e.target.value ? Number(e.target.value) : "")} className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold outline-none focus:border-gold-400">
                <option value="">همه ویزیتورها</option>
                {visitors.map((v) => <option key={v.id} value={v.id}>{v.full_name || v.username}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 lg:grid-cols-2">{[1,2,3,4].map((i) => <div key={i} className="h-56 animate-pulse rounded-[2rem] bg-white" />)}</div>
          ) : schedules.length === 0 ? (
            <div className="rounded-[2.5rem] border border-dashed border-stone-200 bg-white p-16 text-center shadow-sm">
              <div className="text-6xl">📅</div>
              <h3 className="mt-4 text-xl font-black">برای این تاریخ برنامه‌ای ثبت نشده است</h3>
              <p className="mt-2 text-sm font-bold text-stone-500">از فرم سمت راست برنامه جدید اضافه کنید.</p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {schedules.map((schedule) => {
                const m = statusMeta(schedule.status);
                return (
                  <div key={schedule.id} className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                    <div className="border-b border-stone-100 bg-gradient-to-l from-stone-50 via-white to-amber-50 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-stone-900 text-sm font-black text-white">{schedule.priority}</span>
                          <div>
                            <h3 className="font-black text-stone-900">{schedule.customer_name}</h3>
                            <p dir="ltr" className="mt-1 text-right font-mono text-xs font-bold text-stone-500">{schedule.customer_phone || "بدون شماره"}</p>
                          </div>
                        </div>
                        <span className={`rounded-full border px-3 py-1.5 text-[11px] font-black ${m.color}`}>{m.icon} {m.label}</span>
                      </div>
                      <div className="mt-4 rounded-2xl bg-white/80 p-3 text-xs font-bold text-stone-600">
                        ویزیتور: <span className="font-black text-stone-900">{schedule.visitor_name}</span>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="grid gap-2 sm:grid-cols-5">
                        {statuses.map((option) => (
                          <button key={option.value} onClick={() => updateSchedule(schedule.id, { status: option.value })} className={`rounded-2xl border px-2 py-3 text-[10px] font-black transition ${schedule.status === option.value ? "border-stone-900 bg-stone-900 text-white" : "border-stone-100 bg-stone-50 text-stone-600 hover:border-gold-200 hover:bg-amber-50"}`}>
                            <span className="block text-base">{option.icon}</span>
                            <span className="mt-1 block leading-4">{option.label}</span>
                          </button>
                        ))}
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-[110px_1fr]">
                        <label className="text-xs font-black text-stone-500">اولویت
                          <input type="number" min={1} max={5} defaultValue={schedule.priority} onBlur={(e) => updateSchedule(schedule.id, { priority: Number(e.target.value || 1) })} className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3 text-center font-mono text-sm font-black outline-none focus:border-gold-400" />
                        </label>
                        <label className="text-xs font-black text-stone-500">یادداشت مدیر
                          <textarea defaultValue={schedule.admin_notes || ""} onBlur={(e) => updateSchedule(schedule.id, { admin_notes: e.target.value })} rows={3} className="mt-2 w-full resize-none rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold leading-7 outline-none focus:border-gold-400" />
                        </label>
                      </div>
                      {schedule.notes && <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50 p-3 text-xs font-bold leading-6 text-blue-800">یادداشت ویزیتور: {schedule.notes}</div>}
                      <button onClick={() => deleteSchedule(schedule.id)} className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-2.5 text-xs font-black text-red-600 hover:bg-red-100">حذف برنامه</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
