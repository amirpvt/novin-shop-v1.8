import { useEffect, useMemo, useState } from "react";
import { ordersApi, wholesaleApi } from "../api/client";

type Tab = "all" | "retail" | "wholesale";
type UnifiedOrder = {
  id: number | string;
  type: "retail" | "wholesale";
  number: string;
  customerName: string;
  phone: string;
  address: string;
  description: string;
  status: string;
  total: number;
  created_at: string;
  updated_at?: string;
  items: any[];
  raw: any;
};

const retailStatuses = [
  { value: "PENDING", label: "در انتظار بررسی", color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  { value: "CONFIRMED", label: "تایید شده", color: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  { value: "PREPARING", label: "در حال آماده‌سازی", color: "bg-violet-50 text-violet-700 border-violet-200", dot: "bg-violet-500" },
  { value: "SHIPPED", label: "ارسال شده", color: "bg-cyan-50 text-cyan-700 border-cyan-200", dot: "bg-cyan-500" },
  { value: "DELIVERED", label: "تحویل شده", color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  { value: "CANCELLED", label: "لغو شده", color: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
];

const wholesaleStatuses = [
  { value: "NEW", label: "درخواست جدید", color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  { value: "QUOTED", label: "پیش‌فاکتور صادر شده", color: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  { value: "CONVERTED", label: "تبدیل به سفارش شده", color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  { value: "REJECTED", label: "رد شده", color: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
];

const nf = (n: any) => new Intl.NumberFormat("en-US").format(Math.round(Number(n || 0)));
const money = (n: any) => `${nf(n)} تومان`;

function dateFa(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
}

function normalizeList(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getStatusMeta(type: "retail" | "wholesale", value: string) {
  const list = type === "retail" ? retailStatuses : wholesaleStatuses;
  return list.find((s) => s.value === value) || { value, label: value || "نامشخص", color: "bg-stone-50 text-stone-700 border-stone-200", dot: "bg-stone-400" };
}

function imgSrc(src?: string) {
  if (!src) return "/images/placeholder.jpg";
  if (src.startsWith("http") || src.startsWith("/")) return src;
  return `/${src}`;
}

export default function OwnerOrdersManagement() {
  const [retail, setRetail] = useState<UnifiedOrder[]>([]);
  const [wholesale, setWholesale] = useState<UnifiedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [selected, setSelected] = useState<UnifiedOrder | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [retailRes, wholesaleRes] = await Promise.all([
        ordersApi.list().catch(() => []),
        wholesaleApi.list().catch(() => []),
      ]);

      const retailRows = normalizeList(retailRes).map((o: any): UnifiedOrder => ({
        id: o.id,
        type: "retail",
        number: o.order_number,
        customerName: o.name || o.customer_name || "مشتری",
        phone: o.phone || "",
        address: o.address || "",
        description: o.message || "",
        status: o.order_status,
        total: Number(o.total_amount || 0),
        created_at: o.created_at,
        updated_at: o.updated_at,
        items: o.items || [],
        raw: o,
      }));

      const wholesaleRows = normalizeList(wholesaleRes).map((w: any): UnifiedOrder => ({
        id: w.id || w.request_number,
        type: "wholesale",
        number: w.request_number,
        customerName: w.company_name || w.contact_person || "مشتری عمده",
        phone: w.phone || "",
        address: w.address || "",
        description: w.description || "",
        status: w.status,
        total: Number(w.total_amount || 0),
        created_at: w.created_at,
        items: w.items || [],
        raw: w,
      }));

      setRetail(retailRows);
      setWholesale(wholesaleRows);
    } catch (e: any) {
      alert("خطا در دریافت سفارش‌ها: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const allOrders = useMemo(() => [...retail, ...wholesale].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), [retail, wholesale]);

  const filtered = useMemo(() => {
    const now = new Date();
    const q = query.trim().toLowerCase();
    return allOrders.filter((o) => {
      if (tab !== "all" && o.type !== tab) return false;
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (q) {
        const hay = `${o.number} ${o.customerName} ${o.phone} ${o.address} ${o.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (dateFilter !== "all") {
        const d = new Date(o.created_at);
        const diff = now.getTime() - d.getTime();
        if (dateFilter === "today" && d.toDateString() !== now.toDateString()) return false;
        if (dateFilter === "week" && diff > 7 * 24 * 60 * 60 * 1000) return false;
        if (dateFilter === "month" && diff > 30 * 24 * 60 * 60 * 1000) return false;
      }
      return true;
    });
  }, [allOrders, tab, statusFilter, query, dateFilter]);

  const totals = useMemo(() => ({
    count: allOrders.length,
    retailCount: retail.length,
    wholesaleCount: wholesale.length,
    totalSales: allOrders.reduce((s, o) => s + o.total, 0),
    pending: allOrders.filter((o) => ["PENDING", "NEW"].includes(o.status)).length,
    completed: allOrders.filter((o) => ["DELIVERED", "CONVERTED"].includes(o.status)).length,
  }), [allOrders, retail, wholesale]);

  const availableStatuses = tab === "wholesale" ? wholesaleStatuses : tab === "retail" ? retailStatuses : [...retailStatuses, ...wholesaleStatuses];

  const updateStatus = async (order: UnifiedOrder, newStatus: string) => {
    setSaving(true);
    try {
      if (order.type === "retail") {
        await ordersApi.updateStatus(Number(order.id), newStatus);
      } else {
        await wholesaleApi.updateStatus(order.number, newStatus);
      }
      await load();
      setSelected((prev) => prev ? { ...prev, status: newStatus } : prev);
    } catch (e: any) {
      alert("خطا در تغییر وضعیت: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    const rows = filtered.map((o) => ({
      نوع: o.type === "retail" ? "خرده" : "عمده",
      شماره: o.number,
      مشتری: o.customerName,
      تلفن: o.phone,
      وضعیت: getStatusMeta(o.type, o.status).label,
      مبلغ: o.total,
      تاریخ: dateFa(o.created_at),
    }));
    const csv = [Object.keys(rows[0] || { نوع: "", شماره: "", مشتری: "", تلفن: "", وضعیت: "", مبلغ: "", تاریخ: "" }).join(","), ...rows.map((r: any) => Object.values(r).map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950 p-7 text-white shadow-2xl">
        <div className="absolute -left-16 -top-16 h-72 w-72 rounded-full bg-gold-500/10 blur-[90px]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-[11px] font-black text-gold-200">مرکز عملیات سفارش‌ها</span>
            <h1 className="mt-4 text-3xl font-black">مدیریت و پیگیری سفارش‌های عمده و خرده</h1>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-7 text-stone-400">تمام سفارش‌ها، وضعیت‌ها، اقلام، اطلاعات مشتری، مبلغ‌ها و عملیات تغییر وضعیت در یک پنل حرفه‌ای و یکپارچه.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={exportCsv} className="rounded-2xl bg-white/10 px-5 py-3 text-xs font-black transition hover:bg-white/20">خروجی CSV</button>
            <button onClick={load} className="rounded-2xl bg-gold-500 px-5 py-3 text-xs font-black text-stone-950 transition hover:bg-gold-400">بروزرسانی</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Kpi title="کل سفارش‌ها" value={nf(totals.count)} tone="stone" />
        <Kpi title="فروش کل" value={money(totals.totalSales)} tone="gold" wide />
        <Kpi title="خرده" value={nf(totals.retailCount)} tone="blue" />
        <Kpi title="عمده" value={nf(totals.wholesaleCount)} tone="violet" />
        <Kpi title="در انتظار" value={nf(totals.pending)} tone="amber" />
        <Kpi title="تکمیل‌شده" value={nf(totals.completed)} tone="emerald" />
      </div>

      <div className="rounded-[2rem] border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex rounded-2xl bg-stone-100 p-1 text-xs font-black">
            {([{ id: "all", label: "همه" }, { id: "retail", label: "سفارش خرده" }, { id: "wholesale", label: "سفارش عمده" }] as any[]).map((t) => (
              <button key={t.id} onClick={() => { setTab(t.id); setStatusFilter("all"); }} className={`rounded-xl px-5 py-2.5 transition ${tab === t.id ? "bg-stone-900 text-white shadow" : "text-stone-500 hover:text-stone-900"}`}>{t.label}</button>
            ))}
          </div>
          <div className="flex flex-1 flex-col gap-2 md:flex-row xl:max-w-3xl">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جستجو با شماره سفارش، نام، موبایل یا آدرس..." className="min-w-0 flex-1 rounded-2xl border-2 border-stone-100 bg-stone-50 px-4 py-3 text-sm font-bold outline-none focus:border-stone-900" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-2xl border-2 border-stone-100 bg-stone-50 px-4 py-3 text-sm font-bold outline-none focus:border-stone-900">
              <option value="all">همه وضعیت‌ها</option>
              {availableStatuses.map((s, idx) => <option key={`${s.value}-${idx}`} value={s.value}>{s.label}</option>)}
            </select>
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as any)} className="rounded-2xl border-2 border-stone-100 bg-stone-50 px-4 py-3 text-sm font-bold outline-none focus:border-stone-900">
              <option value="all">همه تاریخ‌ها</option>
              <option value="today">امروز</option>
              <option value="week">۷ روز اخیر</option>
              <option value="month">۳۰ روز اخیر</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">{[1,2,3,4].map(i => <div key={i} className="h-52 animate-pulse rounded-[2rem] bg-stone-100" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[2rem] border bg-white p-16 text-center"><p className="text-lg font-black text-stone-800">سفارشی پیدا نشد</p><p className="mt-2 text-sm font-bold text-stone-400">فیلترها یا عبارت جستجو را تغییر بدهید.</p></div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((o) => <OrderCard key={`${o.type}-${o.number}`} order={o} onOpen={() => setSelected(o)} onStatus={updateStatus} saving={saving} />)}
        </div>
      )}

      {selected && <OrderModal order={selected} onClose={() => setSelected(null)} onStatus={updateStatus} saving={saving} />}
    </div>
  );
}

function Kpi({ title, value, tone, wide }: { title: string; value: string; tone: string; wide?: boolean }) {
  const tones: any = {
    stone: "border-stone-200 text-stone-900",
    gold: "border-gold-200 text-gold-700",
    blue: "border-blue-200 text-blue-700",
    violet: "border-violet-200 text-violet-700",
    amber: "border-amber-200 text-amber-700",
    emerald: "border-emerald-200 text-emerald-700",
  };
  return <div className={`rounded-3xl border bg-white p-4 shadow-sm ${tones[tone]} ${wide ? "col-span-2" : ""}`}><p className="text-[10px] font-black text-stone-400">{title}</p><p className="mt-2 text-lg font-black">{value}</p></div>;
}

function OrderCard({ order, onOpen, onStatus, saving }: { order: UnifiedOrder; onOpen: () => void; onStatus: (o: UnifiedOrder, s: string) => void; saving: boolean }) {
  const meta = getStatusMeta(order.type, order.status);
  const statuses = order.type === "retail" ? retailStatuses : wholesaleStatuses;
  return (
    <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <button onClick={onOpen} className="block w-full p-5 text-right">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-[10px] font-black ${order.type === "wholesale" ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"}`}>{order.type === "wholesale" ? "عمده" : "خرده"}</span>
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black ${meta.color}`}><span className={`h-2 w-2 rounded-full ${meta.dot}`} />{meta.label}</span>
            </div>
            <h3 className="mt-3 font-mono text-lg font-black text-stone-900">{order.number}</h3>
            <p className="mt-1 text-xs font-bold text-stone-500">{order.customerName} · {order.phone || "بدون شماره"}</p>
          </div>
          <div className="text-left"><p className="text-[10px] font-black text-stone-400">مبلغ</p><p className="mt-1 text-lg font-black text-stone-900">{money(order.total)}</p></div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-stone-500">
          <div className="rounded-2xl bg-stone-50 p-3">تاریخ: {dateFa(order.created_at)}</div>
          <div className="rounded-2xl bg-stone-50 p-3">اقلام: {nf(order.items?.length || 0)}</div>
        </div>
      </button>
      <div className="border-t bg-stone-50/60 p-3">
        <select disabled={saving} value={order.status} onChange={(e) => onStatus(order, e.target.value)} className="w-full rounded-2xl border bg-white px-4 py-3 text-xs font-black outline-none focus:border-stone-900 disabled:opacity-60">
          {statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
    </div>
  );
}

function OrderModal({ order, onClose, onStatus, saving }: { order: UnifiedOrder; onClose: () => void; onStatus: (o: UnifiedOrder, s: string) => void; saving: boolean }) {
  const statuses = order.type === "retail" ? retailStatuses : wholesaleStatuses;
  const meta = getStatusMeta(order.type, order.status);
  return (
    <div className="fixed inset-0 z-[130] flex items-start justify-center overflow-y-auto bg-stone-950/75 p-4 backdrop-blur-sm lg:items-center" onClick={onClose}>
      <div className="my-auto w-full max-w-6xl overflow-hidden rounded-[2.2rem] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950 p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap gap-2"><span className={`rounded-full px-3 py-1 text-[10px] font-black ${order.type === "wholesale" ? "bg-violet-400/20 text-violet-100" : "bg-blue-400/20 text-blue-100"}`}>{order.type === "wholesale" ? "سفارش عمده" : "سفارش خرده"}</span><span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black">{meta.label}</span></div>
              <h2 className="mt-4 font-mono text-2xl font-black">{order.number}</h2>
              <p className="mt-2 text-sm font-bold text-stone-400">{order.customerName} · {dateFa(order.created_at)}</p>
            </div>
            <button onClick={onClose} className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-black hover:bg-white/20">✕</button>
          </div>
        </div>

        <div className="grid max-h-[75vh] overflow-y-auto lg:grid-cols-3">
          <aside className="space-y-4 border-l bg-cream-50 p-5">
            <Info title="نام / شرکت" value={order.customerName} />
            <Info title="شماره تماس" value={order.phone || "—"} />
            <Info title="آدرس" value={order.address || "—"} />
            <Info title="توضیحات" value={order.description || "—"} />
            <Info title="مبلغ کل" value={money(order.total)} strong />
            <div className="rounded-3xl border bg-white p-4 shadow-sm">
              <p className="text-[10px] font-black text-stone-400">تغییر وضعیت</p>
              <select disabled={saving} value={order.status} onChange={(e) => onStatus(order, e.target.value)} className="mt-3 w-full rounded-2xl border bg-stone-50 px-4 py-3 text-sm font-black outline-none focus:border-stone-900">
                {statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </aside>

          <main className="p-5 lg:col-span-2">
            <h3 className="text-lg font-black text-stone-900">اقلام سفارش</h3>
            <div className="mt-4 space-y-3">
              {order.items?.length ? order.items.map((item: any, idx: number) => {
                const price = Number(item.price || item.unit_price || 0);
                const qty = Number(item.quantity || 0);
                const subtotal = Number(item.subtotal || price * qty || 0);
                return (
                  <div key={item.id || idx} className="flex gap-4 rounded-3xl border bg-white p-4 shadow-sm">
                    <img src={imgSrc(item.product_image)} alt="" className="h-20 w-20 rounded-2xl bg-stone-100 object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-stone-900">{item.product_name || item.name || "محصول"}</p>
                      {item.notes && <p className="mt-1 text-xs font-bold text-stone-400">{item.notes}</p>}
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black">
                        <span className="rounded-xl bg-stone-50 px-3 py-1.5 text-stone-600">تعداد: {nf(qty)}</span>
                        {price > 0 && <span className="rounded-xl bg-blue-50 px-3 py-1.5 text-blue-700">قیمت واحد: {money(price)}</span>}
                        {subtotal > 0 && <span className="rounded-xl bg-gold-50 px-3 py-1.5 text-gold-700">جمع: {money(subtotal)}</span>}
                      </div>
                    </div>
                  </div>
                );
              }) : <div className="rounded-3xl border bg-stone-50 p-10 text-center text-sm font-bold text-stone-400">جزئیات اقلام برای این سفارش ثبت نشده است.</div>}
            </div>

            <h3 className="mt-8 text-lg font-black text-stone-900">مسیر پیگیری</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {statuses.map((s) => {
                const active = s.value === order.status;
                return <div key={s.value} className={`rounded-2xl border p-4 ${active ? s.color : "border-stone-100 bg-stone-50 text-stone-400"}`}><span className={`block h-2 w-2 rounded-full ${active ? s.dot : "bg-stone-300"}`} /><p className="mt-3 text-xs font-black">{s.label}</p></div>;
              })}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function Info({ title, value, strong }: { title: string; value: string; strong?: boolean }) {
  return <div className="rounded-3xl border bg-white p-4 shadow-sm"><p className="text-[10px] font-black text-stone-400">{title}</p><p className={`mt-2 leading-7 ${strong ? "text-lg font-black text-stone-900" : "text-sm font-bold text-stone-700"}`}>{value}</p></div>;
}
