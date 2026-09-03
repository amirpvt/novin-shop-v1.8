import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ordersApi, wholesaleApi, type Order, type WholesaleRequest } from "../api/client";
import { formatPrice } from "../data";

type OrderType = "retail" | "wholesale";
type Tab = "all" | OrderType;

type UnifiedOrder = {
  id: number | string;
  type: OrderType;
  number: string;
  title: string;
  contact: string;
  phone: string;
  address: string;
  note: string;
  status: string;
  total: number;
  created_at: string;
  items: any[];
  raw: any;
};

const retailStatuses = [
  { value: "PENDING", label: "در انتظار بررسی", desc: "سفارش ثبت شده و منتظر بررسی مدیریت است", color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  { value: "CONFIRMED", label: "تایید شده", desc: "سفارش تایید شده و وارد صف آماده‌سازی شده است", color: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  { value: "PREPARING", label: "در حال آماده‌سازی", desc: "اقلام سفارش در حال آماده‌سازی هستند", color: "bg-violet-50 text-violet-700 border-violet-200", dot: "bg-violet-500" },
  { value: "SHIPPED", label: "ارسال شده", desc: "سفارش از انبار خارج شده و در مسیر ارسال است", color: "bg-cyan-50 text-cyan-700 border-cyan-200", dot: "bg-cyan-500" },
  { value: "DELIVERED", label: "تحویل شده", desc: "سفارش با موفقیت تحویل شده است", color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  { value: "CANCELLED", label: "لغو شده", desc: "این سفارش لغو شده است", color: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
];

const wholesaleStatuses = [
  { value: "NEW", label: "درخواست جدید", desc: "درخواست عمده ثبت شده و منتظر بررسی است", color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  { value: "QUOTED", label: "پیش‌فاکتور صادر شده", desc: "درخواست بررسی شده و پیش‌فاکتور آماده است", color: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  { value: "CONVERTED", label: "تبدیل به سفارش شده", desc: "درخواست عمده تایید و تبدیل به سفارش شده است", color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  { value: "REJECTED", label: "رد شده", desc: "این درخواست عمده رد شده است", color: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
];

function statusMeta(type: OrderType, status: string) {
  const list = type === "retail" ? retailStatuses : wholesaleStatuses;
  return list.find((s) => s.value === status) || { value: status, label: status || "نامشخص", desc: "وضعیت نامشخص", color: "bg-stone-50 text-stone-700 border-stone-200", dot: "bg-stone-400" };
}

function normalizeList(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function toNumber(v: any) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
}

function dateFa(iso?: string) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short" }); } catch { return "—"; }
}

function imgSrc(src?: string) {
  if (!src) return "/images/placeholder.jpg";
  if (src.startsWith("http") || src.startsWith("/")) return src;
  return `/${src}`;
}

function retailToUnified(o: any): UnifiedOrder {
  return {
    id: o.id || o.order_number,
    type: "retail",
    number: o.order_number,
    title: o.name || "سفارش خرده",
    contact: o.name || "—",
    phone: o.phone || "—",
    address: o.address || "—",
    note: o.message || "",
    status: o.order_status || "PENDING",
    total: toNumber(o.total_amount),
    created_at: o.created_at,
    items: o.items || [],
    raw: o,
  };
}

function wholesaleToUnified(w: any): UnifiedOrder {
  return {
    id: w.id || w.request_number,
    type: "wholesale",
    number: w.request_number,
    title: w.company_name || w.contact_person || "درخواست عمده",
    contact: w.contact_person || "—",
    phone: w.phone || "—",
    address: w.address || "—",
    note: w.description || "",
    status: w.status || "NEW",
    total: toNumber(w.total_amount),
    created_at: w.created_at,
    items: w.items || [],
    raw: w,
  };
}

export default function MyOrders() {
  const [tab, setTab] = useState<Tab>("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [wholesale, setWholesale] = useState<WholesaleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [silentLoading, setSilentLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");
  const [trackedOrder, setTrackedOrder] = useState<UnifiedOrder | null>(null);
  const [selected, setSelected] = useState<UnifiedOrder | null>(null);
  const navigate = useNavigate();

  const loadAll = async (silent = false) => {
    if (silent) setSilentLoading(true); else setLoading(true);
    setError("");
    try {
      const [ordersData, wholesaleData] = await Promise.all([
        ordersApi.myOrders().catch(() => []),
        wholesaleApi.myRequests().catch(() => []),
      ]);
      setOrders(normalizeList(ordersData) as Order[]);
      setWholesale(normalizeList(wholesaleData) as WholesaleRequest[]);
    } catch (e: any) {
      setError(e.message || "خطا در دریافت سفارش‌ها");
    } finally {
      if (silent) setSilentLoading(false); else setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    const timer = window.setInterval(() => loadAll(true), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const unified = useMemo(() => [
    ...orders.map(retailToUnified),
    ...wholesale.map(wholesaleToUnified),
  ].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()), [orders, wholesale]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return unified.filter((o) => {
      if (tab !== "all" && o.type !== tab) return false;
      if (!q) return true;
      return `${o.number} ${o.title} ${o.contact} ${o.phone} ${o.address}`.toLowerCase().includes(q);
    });
  }, [unified, tab, search]);

  const stats = useMemo(() => ({
    total: unified.length,
    retail: orders.length,
    wholesale: wholesale.length,
    active: unified.filter((o) => !["DELIVERED", "CANCELLED", "CONVERTED", "REJECTED"].includes(o.status)).length,
    completed: unified.filter((o) => ["DELIVERED", "CONVERTED"].includes(o.status)).length,
  }), [unified, orders, wholesale]);

  const doTracking = async () => {
    const code = trackingNumber.trim().toUpperCase();
    setTrackingError("");
    setTrackedOrder(null);
    if (!code) return setTrackingError("شماره سفارش یا درخواست را وارد کنید");
    setTrackingLoading(true);
    try {
      if (code.startsWith("WHS")) {
        const data = await wholesaleApi.track(code);
        setTrackedOrder(wholesaleToUnified(data));
      } else {
        const data = await ordersApi.track(code);
        setTrackedOrder(retailToUnified(data));
      }
    } catch (e: any) {
      setTrackingError("سفارشی با این شماره پیدا نشد یا هنوز قابل پیگیری نیست.");
    } finally {
      setTrackingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] px-4 py-8 lg:px-6" dir="rtl">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950 p-7 text-white shadow-2xl">
          <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-gold-500/10 blur-[90px]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-[11px] font-black text-gold-200">پیگیری زنده سفارش</span>
              <h1 className="mt-4 text-3xl font-black">سفارش‌های من</h1>
              <p className="mt-2 max-w-2xl text-sm font-bold leading-7 text-stone-400">وضعیت هر سفارش دقیقاً از همان بخش مدیریت کل خوانده می‌شود؛ با تغییر مدیرکل، این صفحه هم بروزرسانی می‌شود.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => navigate("/")} className="rounded-2xl bg-white/10 px-5 py-3 text-xs font-black transition hover:bg-white/20">بازگشت به فروشگاه</button>
              <button onClick={() => loadAll()} className="rounded-2xl bg-gold-500 px-5 py-3 text-xs font-black text-stone-950 transition hover:bg-gold-400">{silentLoading ? "در حال بروزرسانی..." : "بروزرسانی"}</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Kpi title="کل سفارش‌ها" value={stats.total} />
          <Kpi title="سفارش خرده" value={stats.retail} tone="blue" />
          <Kpi title="درخواست عمده" value={stats.wholesale} tone="violet" />
          <Kpi title="در جریان" value={stats.active} tone="amber" />
          <Kpi title="تکمیل شده" value={stats.completed} tone="emerald" />
        </div>

        <div className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1">
              <p className="text-sm font-black text-stone-900">پیگیری سریع با شماره سفارش</p>
              <p className="mt-1 text-xs font-bold text-stone-400">مثلاً ORD-12345678 برای خرده یا WHS-12345678 برای عمده</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doTracking()} placeholder="شماره سفارش یا درخواست..." className="min-w-0 flex-1 rounded-2xl border-2 border-stone-100 bg-stone-50 px-4 py-3 font-mono text-sm font-black uppercase outline-none focus:border-stone-900" />
                <button onClick={doTracking} disabled={trackingLoading} className="rounded-2xl bg-stone-900 px-7 py-3 text-sm font-black text-white disabled:opacity-50">{trackingLoading ? "در حال پیگیری..." : "پیگیری"}</button>
              </div>
              {trackingError && <p className="mt-2 text-xs font-bold text-red-600">{trackingError}</p>}
            </div>
            <div className="lg:w-80">
              <p className="text-xs font-black text-stone-500">جستجو در سفارش‌های من</p>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="شماره، نام، موبایل..." className="mt-3 w-full rounded-2xl border-2 border-stone-100 bg-stone-50 px-4 py-3 text-sm font-bold outline-none focus:border-stone-900" />
            </div>
          </div>
          {trackedOrder && (
            <div className="mt-5 rounded-3xl border border-gold-200 bg-gold-50/60 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[10px] font-black text-gold-700">نتیجه پیگیری</p>
                  <p className="mt-1 font-mono text-lg font-black text-stone-900">{trackedOrder.number}</p>
                  <p className="mt-1 text-xs font-bold text-stone-500">{trackedOrder.title} · {statusMeta(trackedOrder.type, trackedOrder.status).label}</p>
                </div>
                <button onClick={() => setSelected(trackedOrder)} className="rounded-2xl bg-stone-900 px-5 py-3 text-xs font-black text-white">مشاهده جزئیات کامل</button>
              </div>
              <StatusTimeline type={trackedOrder.type} status={trackedOrder.status} compact />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-[2rem] border bg-white p-3 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex rounded-2xl bg-stone-100 p-1 text-xs font-black">
            {([{ id: "all", label: "همه" }, { id: "retail", label: "خرده" }, { id: "wholesale", label: "عمده" }] as any[]).map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`rounded-xl px-5 py-2.5 transition ${tab === t.id ? "bg-stone-900 text-white shadow" : "text-stone-500 hover:text-stone-900"}`}>{t.label}</button>
            ))}
          </div>
          <p className="px-2 text-[11px] font-bold text-stone-400">بروزرسانی خودکار هر ۳۰ ثانیه</p>
        </div>

        {loading ? (
          <div className="grid gap-4 lg:grid-cols-2">{[1,2,3,4].map(i => <div key={i} className="h-56 animate-pulse rounded-[2rem] bg-white" />)}</div>
        ) : error ? (
          <div className="rounded-[2rem] border bg-white p-12 text-center"><p className="font-bold text-red-600">{error}</p><button onClick={() => navigate("/")} className="mt-6 rounded-2xl bg-paprika-600 px-8 py-3 font-bold text-white">بازگشت</button></div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[2rem] border bg-white p-14 text-center text-stone-400"><div className="text-5xl">📦</div><p className="mt-4 font-black">سفارشی پیدا نشد</p></div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {filtered.map((o) => <OrderCard key={`${o.type}-${o.number}`} order={o} onOpen={() => setSelected(o)} />)}
          </div>
        )}
      </div>
      {selected && <OrderDetailsModal order={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function Kpi({ title, value, tone = "stone" }: { title: string; value: number; tone?: string }) {
  const map: any = { stone: "text-stone-900", blue: "text-blue-700", violet: "text-violet-700", amber: "text-amber-700", emerald: "text-emerald-700" };
  return <div className="rounded-3xl border bg-white p-5 shadow-sm"><p className="text-[10px] font-black text-stone-400">{title}</p><p className={`mt-2 text-2xl font-black ${map[tone]}`}>{value.toLocaleString("en-US")}</p></div>;
}

function StatusTimeline({ type, status, compact = false }: { type: OrderType; status: string; compact?: boolean }) {
  const list = type === "retail" ? retailStatuses : wholesaleStatuses;
  const currentIndex = Math.max(0, list.findIndex((s) => s.value === status));
  const isBad = ["CANCELLED", "REJECTED"].includes(status);
  const current = statusMeta(type, status);
  return (
    <div className={`${compact ? "mt-4" : "mt-5"} rounded-2xl border bg-stone-50 p-4`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black text-stone-400">وضعیت فعلی</p>
          <p className="mt-1 text-sm font-black text-stone-900">{current.label}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[10px] font-black ${current.color}`}>{type === "retail" ? "خرده" : "عمده"}</span>
      </div>
      <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
        {list.map((s, idx) => {
          const active = s.value === status;
          const done = !isBad && idx <= currentIndex;
          return (
            <div key={s.value} className={`min-w-[125px] flex-1 rounded-2xl border p-3 ${active ? s.color : done ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-stone-100 bg-white text-stone-400"}`}>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-black text-white ${active ? s.dot : done ? "bg-emerald-500" : "bg-stone-300"}`}>{done ? "✓" : idx + 1}</div>
              <p className="mt-3 text-[11px] font-black leading-5">{s.label}</p>
              {!compact && <p className="mt-1 text-[10px] font-bold leading-5 opacity-70">{s.desc}</p>}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] font-bold text-stone-500">این مسیر پیگیری مستقیماً از وضعیت ثبت‌شده در پنل مدیریت کل نمایش داده می‌شود.</p>
    </div>
  );
}

function OrderCard({ order, onOpen }: { order: UnifiedOrder; onOpen: () => void }) {
  const meta = statusMeta(order.type, order.status);
  return (
    <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <button onClick={onOpen} className="block w-full p-5 text-right">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-[10px] font-black ${order.type === "wholesale" ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"}`}>{order.type === "wholesale" ? "درخواست عمده" : "سفارش خرده"}</span>
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black ${meta.color}`}><span className={`h-2 w-2 rounded-full ${meta.dot}`} />{meta.label}</span>
            </div>
            <h3 className="mt-3 font-mono text-lg font-black text-stone-900">{order.number}</h3>
            <p className="mt-1 text-xs font-bold text-stone-500">{order.title} · {order.phone}</p>
          </div>
          <div className="text-left"><p className="text-[10px] font-black text-stone-400">تاریخ ثبت</p><p className="mt-1 text-xs font-bold text-stone-700">{dateFa(order.created_at)}</p></div>
        </div>
        <StatusTimeline type={order.type} status={order.status} compact />
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-stone-50 p-3">
          <span className="text-xs font-bold text-stone-500">{order.items.length.toLocaleString("en-US")} قلم کالا</span>
          <span className="text-sm font-black text-stone-900">{order.total > 0 ? formatPrice(order.total) : "مبلغ در حال بررسی"}</span>
        </div>
      </button>
    </div>
  );
}

function OrderDetailsModal({ order, onClose }: { order: UnifiedOrder; onClose: () => void }) {
  const meta = statusMeta(order.type, order.status);
  return (
    <div className="fixed inset-0 z-[140] flex items-start justify-center overflow-y-auto bg-stone-950/75 p-4 backdrop-blur-sm lg:items-center" onClick={onClose}>
      <div className="my-auto w-full max-w-6xl overflow-hidden rounded-[2.2rem] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950 p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap gap-2"><span className={`rounded-full border px-3 py-1 text-[10px] font-black ${order.type === "wholesale" ? "border-violet-300/30 bg-violet-400/20 text-violet-100" : "border-blue-300/30 bg-blue-400/20 text-blue-100"}`}>{order.type === "wholesale" ? "درخواست عمده" : "سفارش خرده"}</span><span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black">{meta.label}</span></div>
              <h2 className="mt-4 font-mono text-2xl font-black">{order.number}</h2>
              <p className="mt-2 text-sm font-bold text-stone-400">{order.title} · {dateFa(order.created_at)}</p>
            </div>
            <button onClick={onClose} className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-black hover:bg-white/20">✕</button>
          </div>
        </div>
        <div className="grid max-h-[76vh] overflow-y-auto lg:grid-cols-3">
          <aside className="space-y-4 border-l bg-cream-50 p-5">
            <Info title={order.type === "wholesale" ? "نام شرکت / فروشگاه" : "نام مشتری"} value={order.title} />
            <Info title="شخص رابط" value={order.contact} />
            <Info title="شماره تماس" value={order.phone} />
            <Info title="آدرس" value={order.address} />
            {order.note && <Info title="توضیحات" value={order.note} />}
            <Info title="مبلغ کل" value={order.total > 0 ? formatPrice(order.total) : "در حال بررسی"} strong />
          </aside>
          <main className="p-5 lg:col-span-2">
            <h3 className="text-lg font-black text-stone-900">پیگیری سفارش</h3>
            <StatusTimeline type={order.type} status={order.status} />
            <h3 className="mt-8 text-lg font-black text-stone-900">جزئیات اقلام</h3>
            <div className="mt-4 space-y-3">
              {order.items.length ? order.items.map((item: any, idx: number) => {
                const price = toNumber(item.price || item.unit_price);
                const qty = toNumber(item.quantity);
                const subtotal = toNumber(item.subtotal || price * qty);
                return (
                  <div key={item.id || idx} className="flex gap-4 rounded-3xl border bg-white p-4 shadow-sm">
                    <img src={imgSrc(item.product_image)} alt="" className="h-20 w-20 rounded-2xl bg-stone-100 object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-stone-900">{item.product_name || item.name || "محصول"}</p>
                      {item.notes && <p className="mt-1 text-xs font-bold text-stone-400">{item.notes}</p>}
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black">
                        <span className="rounded-xl bg-stone-50 px-3 py-1.5 text-stone-600">تعداد: {qty.toLocaleString("en-US")}</span>
                        {price > 0 && <span className="rounded-xl bg-blue-50 px-3 py-1.5 text-blue-700">قیمت واحد: {formatPrice(price)}</span>}
                        {subtotal > 0 && <span className="rounded-xl bg-gold-50 px-3 py-1.5 text-gold-700">جمع: {formatPrice(subtotal)}</span>}
                      </div>
                    </div>
                  </div>
                );
              }) : <div className="rounded-3xl border bg-stone-50 p-10 text-center text-sm font-bold text-stone-400">جزئیات اقلام برای این سفارش ثبت نشده است.</div>}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function Info({ title, value, strong }: { title: string; value: string; strong?: boolean }) {
  return <div className="rounded-3xl border bg-white p-4 shadow-sm"><p className="text-[10px] font-black text-stone-400">{title}</p><p className={`mt-2 leading-7 ${strong ? "text-lg font-black text-stone-900" : "text-sm font-bold text-stone-700"}`}>{value || "—"}</p></div>;
}
