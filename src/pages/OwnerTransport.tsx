import { useEffect, useMemo, useState } from "react";
import { ordersApi, wholesaleApi } from "../api/client";
import { formatJalaliDateTime } from "../utils/date";
import { retailOrderStatusMeta } from "../utils/orderStatus";

type TransportOrder = {
  id: number | string;
  type: "retail" | "wholesale";
  number: string;
  customer: string;
  phone: string;
  address: string;
  status: string;
  total: number;
  created_at: string;
  items: any[];
  raw: any;
};

const WHOLESALE_STATUS: Record<string, { label: string; color: string }> = {
  NEW: { label: "درخواست جدید", color: "bg-amber-50 text-amber-700 border-amber-200" },
  QUOTED: { label: "پیش‌فاکتور صادر شده", color: "bg-blue-50 text-blue-700 border-blue-200" },
  CONVERTED: { label: "تبدیل به سفارش شده", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  REJECTED: { label: "رد شده", color: "bg-red-50 text-red-700 border-red-200" },
};

const DELIVERY_KEYWORDS = [
  "شهرک", "کرج", "تهران", "ملارد", "فردیس", "اندیشه", "مارلیک", "ماهدشت", "محمدشهر", "کمالشهر", "نظرآباد", "هشتگرد", "صفادشت", "گرمدره", "شهریار",
];

function normalizeList(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function money(value: any) {
  return `${Math.round(Number(value || 0)).toLocaleString("en-US")} تومان`;
}

function statusMeta(order: TransportOrder) {
  if (order.type === "retail") return retailOrderStatusMeta(order.status);
  const meta = WHOLESALE_STATUS[order.status];
  return meta ? { ...meta, dot: "bg-amber-500", desc: "" } : { label: order.status || "نامشخص", color: "bg-stone-50 text-stone-700 border-stone-200", dot: "bg-stone-400", desc: "" };
}

function extractRegion(address = "") {
  const clean = address.replace(/[،,]/g, " ").replace(/\s+/g, " ").trim();
  if (!clean) return "بدون منطقه";

  const townMatch = clean.match(/شهرک\s+([^\s،,]+)/);
  if (townMatch) return `شهرک ${townMatch[1]}`;

  const found = DELIVERY_KEYWORDS.find((key) => clean.includes(key));
  if (found) return found;

  return clean.split(" ").slice(0, 2).join(" ") || "بدون منطقه";
}

function toRetail(o: any): TransportOrder {
  return {
    id: o.id || o.order_number,
    type: "retail",
    number: o.order_number,
    customer: o.name || "مشتری",
    phone: o.phone || "—",
    address: o.address || "—",
    status: o.order_status || "PENDING",
    total: Number(o.total_amount || 0),
    created_at: o.created_at,
    items: o.items || [],
    raw: o,
  };
}

function toWholesale(w: any): TransportOrder {
  return {
    id: w.id || w.request_number,
    type: "wholesale",
    number: w.request_number,
    customer: w.company_name || w.contact_person || "متقاضی عمده",
    phone: w.phone || "—",
    address: w.address || "—",
    status: w.status || "NEW",
    total: Number(w.total_amount || 0),
    created_at: w.created_at,
    items: w.items || [],
    raw: w,
  };
}

export default function OwnerTransport() {
  const [orders, setOrders] = useState<TransportOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "retail" | "wholesale">("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<TransportOrder | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [retailRes, wholesaleRes] = await Promise.all([
        ordersApi.list().catch(() => []),
        wholesaleApi.list().catch(() => []),
      ]);
      setOrders([
        ...normalizeList(retailRes).map(toRetail),
        ...normalizeList(wholesaleRes).map(toWholesale),
      ].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const regions = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach((order) => {
      const region = extractRegion(order.address);
      map.set(region, (map.get(region) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (typeFilter !== "all" && order.type !== typeFilter) return false;
      if (regionFilter !== "all" && extractRegion(order.address) !== regionFilter) return false;
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (!q) return true;
      return `${order.number} ${order.customer} ${order.phone} ${order.address} ${extractRegion(order.address)}`.toLowerCase().includes(q);
    });
  }, [orders, query, typeFilter, regionFilter, statusFilter]);

  const groupedByRegion = useMemo(() => {
    const map = new Map<string, TransportOrder[]>();
    filtered.forEach((order) => {
      const region = extractRegion(order.address);
      map.set(region, [...(map.get(region) || []), order]);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  const stats = useMemo(() => ({
    total: filtered.length,
    retail: filtered.filter((o) => o.type === "retail").length,
    wholesale: filtered.filter((o) => o.type === "wholesale").length,
    preparing: filtered.filter((o) => ["CONFIRMED", "PREPARING", "CONVERTED"].includes(o.status)).length,
    shipped: filtered.filter((o) => o.status === "SHIPPED").length,
    delivered: filtered.filter((o) => o.status === "DELIVERED").length,
  }), [filtered]);



  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[2.7rem] bg-gradient-to-br from-slate-950 via-stone-900 to-amber-950 p-7 text-white shadow-2xl">
        <div className="absolute -right-28 -top-28 h-96 w-96 rounded-full bg-amber-500/20 blur-[90px]" />
        <div className="absolute -bottom-28 -left-28 h-96 w-96 rounded-full bg-cyan-500/10 blur-[90px]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-xs font-black text-amber-200 backdrop-blur">
              🚚 ناوگان اختصاصی نوین
            </span>
            <h1 className="mt-4 text-3xl font-black md:text-4xl">مدیریت حمل و نقل سفارش‌ها</h1>
            <p className="mt-3 max-w-2xl text-sm font-bold leading-7 text-stone-300">
              سفارش‌های هر منطقه را با فیلتر شهر، شهرک، وضعیت و نوع سفارش مدیریت کنید و مسیرهای ارسال ناوگان نوین را سریع‌تر کنترل کنید.
            </p>
          </div>
          <button onClick={load} className="rounded-2xl bg-white px-6 py-3 text-sm font-black text-stone-950 shadow-xl transition hover:bg-amber-100">
            🔄 بروزرسانی سفارش‌ها
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Kpi title="کل سفارش‌ها" value={stats.total} tone="stone" />
        <Kpi title="جزئی" value={stats.retail} tone="blue" />
        <Kpi title="عمده" value={stats.wholesale} tone="amber" />
        <Kpi title="آماده ارسال" value={stats.preparing} tone="violet" />
        <Kpi title="ارسال شده" value={stats.shipped} tone="cyan" />
        <Kpi title="تحویل شده" value={stats.delivered} tone="emerald" />
      </div>

      <div className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className="text-[11px] font-black text-stone-500">جستجو</label>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="شماره سفارش، نام مشتری، موبایل، آدرس یا منطقه..." className="mt-2 w-full rounded-2xl border-2 border-stone-100 bg-stone-50 px-4 py-3 text-sm font-bold outline-none focus:border-stone-900" />
          </div>
          <div>
            <label className="text-[11px] font-black text-stone-500">نوع سفارش</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="mt-2 w-full rounded-2xl border-2 border-stone-100 bg-stone-50 px-4 py-3 text-sm font-bold outline-none focus:border-stone-900">
              <option value="all">همه سفارش‌ها</option>
              <option value="retail">فروش جزئی</option>
              <option value="wholesale">فروش عمده</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-black text-stone-500">منطقه / شهرک</label>
            <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} className="mt-2 w-full rounded-2xl border-2 border-stone-100 bg-stone-50 px-4 py-3 text-sm font-bold outline-none focus:border-stone-900">
              <option value="all">همه مناطق</option>
              {regions.map(([region, count]) => <option key={region} value={region}>{region} ({count})</option>)}
            </select>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            ["all", "همه وضعیت‌ها"],
            ["PAID_PENDING_REVIEW", "در انتظار بررسی"],
            ["CONFIRMED", "تأیید شده"],
            ["PREPARING", "در حال آماده‌سازی"],
            ["SHIPPED", "ارسال شده"],
            ["DELIVERED", "تحویل شده"],
          ].map(([value, label]) => (
            <button key={value} onClick={() => setStatusFilter(value)} className={`rounded-xl px-4 py-2 text-xs font-black transition ${statusFilter === value ? "bg-stone-900 text-white shadow" : "bg-stone-50 text-stone-500 hover:bg-stone-100"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4">{[1, 2, 3].map((i) => <div key={i} className="h-36 animate-pulse rounded-[2rem] bg-white" />)}</div>
      ) : groupedByRegion.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed bg-white p-14 text-center shadow-sm">
          <div className="text-6xl">🚚</div>
          <p className="mt-4 text-lg font-black text-stone-700">سفارشی برای این فیلتر پیدا نشد</p>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedByRegion.map(([region, list]) => (
            <section key={region} className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b bg-gradient-to-l from-stone-900 to-stone-800 p-5 text-white md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[11px] font-black text-amber-200">مسیر ارسال ناوگان</p>
                  <h2 className="mt-1 text-xl font-black">{region}</h2>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-black">
                  <span className="rounded-full bg-white/10 px-3 py-1.5">{list.length.toLocaleString("en-US")} سفارش</span>
                  <span className="rounded-full bg-amber-400 px-3 py-1.5 text-stone-950">{money(list.reduce((sum, item) => sum + item.total, 0))}</span>
                </div>
              </div>

              <div className="divide-y divide-stone-100">
                {list.map((order) => {
                  const meta = statusMeta(order);
                  const key = `${order.type}-${order.number}`;
                  const rowNumber = filtered.findIndex((item) => item.type === order.type && item.number === order.number) + 1;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="block w-full p-4 text-right transition hover:bg-stone-50/80 focus:bg-amber-50/60 focus:outline-none"
                    >
                      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[72px_1fr_150px] xl:items-center">
                        <div className="flex items-center gap-3 xl:flex-col xl:items-start">
                          <span className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2 text-xs font-black text-stone-500">ردیف</span>
                          <span className="font-mono text-3xl font-black text-stone-900">{rowNumber.toLocaleString("en-US")}</span>
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-3 py-1 text-[10px] font-black ${order.type === "retail" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>{order.type === "retail" ? "جزئی" : "عمده"}</span>
                            <span className="font-mono text-sm font-black text-stone-900">{order.number}</span>
                            <span className={`rounded-full border px-3 py-1 text-[10px] font-black ${meta.color}`}>{meta.label}</span>
                          </div>
                          <div className="mt-3 grid gap-2 text-xs font-bold text-stone-600 md:grid-cols-4">
                            <Info label="مشتری" value={order.customer} />
                            <Info label="موبایل" value={order.phone} ltr />
                            <Info label="تاریخ" value={formatJalaliDateTime(order.created_at)} />
                            <Info label="مبلغ" value={money(order.total)} strong />
                          </div>
                          <div className="mt-3 rounded-2xl bg-stone-50 p-3 text-xs font-bold leading-6 text-stone-600">📍 {order.address || "آدرس ثبت نشده"}</div>
                        </div>

                        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-center text-xs font-black text-amber-800 shadow-sm">
                          مشاهده جزئیات کامل
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {selectedOrder && <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
}

function Kpi({ title, value, tone }: { title: string; value: number; tone: string }) {
  const tones: Record<string, string> = {
    stone: "border-stone-200 text-stone-900",
    blue: "border-blue-200 text-blue-700",
    amber: "border-amber-200 text-amber-700",
    violet: "border-violet-200 text-violet-700",
    cyan: "border-cyan-200 text-cyan-700",
    emerald: "border-emerald-200 text-emerald-700",
  };
  return <div className={`rounded-3xl border bg-white p-4 shadow-sm ${tones[tone]}`}><p className="text-[10px] font-black text-stone-400">{title}</p><p className="mt-2 text-2xl font-black">{value.toLocaleString("en-US")}</p></div>;
}

function Info({ label, value, strong, ltr }: { label: string; value: string; strong?: boolean; ltr?: boolean }) {
  return <div className="rounded-2xl bg-white p-3"><p className="text-[10px] font-black text-stone-400">{label}</p><p dir={ltr ? "ltr" : "rtl"} className={`mt-1 truncate ${strong ? "font-black text-stone-900" : "text-stone-700"}`}>{value || "—"}</p></div>;
}

function orderTypeLabel(type: TransportOrder["type"]) {
  return type === "retail" ? "سفارش جزئی" : "درخواست عمده";
}

function itemName(item: any) {
  return item.product_name || item.name || item.product?.name || item.title || "محصول";
}

function itemQuantity(item: any) {
  const quantity = item.quantity ?? item.qty ?? item.count ?? 1;
  const unit = item.wholesale_option_label || item.unit_label || item.unit || item.product?.unit || "";
  return `${Number(quantity || 0).toLocaleString("en-US")}${unit ? ` ${unit}` : ""}`;
}

function itemUnitPrice(item: any) {
  return item.wholesale_unit_price ?? item.unit_price ?? item.price ?? item.product?.price ?? 0;
}

function itemSubtotal(item: any) {
  return item.total_price ?? item.subtotal ?? item.total ?? Number(itemUnitPrice(item) || 0) * Number(item.quantity || 1);
}

function detailValue(value: any) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function OrderDetailsModal({ order, onClose }: { order: TransportOrder; onClose: () => void }) {
  const meta = statusMeta(order);
  const region = extractRegion(order.address);
  const details = [
    ["نوع", orderTypeLabel(order.type)],
    ["شماره", order.number],
    ["وضعیت", meta.label],
    ["مشتری", order.customer],
    ["موبایل", order.phone],
    ["منطقه / مسیر", region],
    ["تاریخ ثبت", formatJalaliDateTime(order.created_at)],
    ["مبلغ کل", money(order.total)],
    ["آدرس", order.address || "آدرس ثبت نشده"],
  ];

  const extraDetails = [
    ["شناسه سیستمی", order.raw?.id],
    ["نام شرکت", order.raw?.company_name],
    ["شخص تماس", order.raw?.contact_person],
    ["ایمیل", order.raw?.email],
    ["کد پیگیری", order.raw?.tracking_code || order.raw?.payment_tracking_code],
    ["شناسه تراکنش", order.raw?.transaction_id || order.raw?.ref_id],
    ["روش پرداخت", order.raw?.payment_method],
    ["توضیحات", order.raw?.notes || order.raw?.description],
  ].filter(([, value]) => value !== null && value !== undefined && value !== "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-100 bg-white/95 p-5 backdrop-blur">
          <div>
            <p className="text-[11px] font-black text-amber-600">جزئیات کامل سفارش</p>
            <h3 className="mt-1 font-mono text-xl font-black text-stone-900">{order.number}</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-2xl bg-stone-100 px-4 py-2 text-sm font-black text-stone-700 transition hover:bg-stone-200">بستن ✕</button>
        </div>

        <div className="space-y-5 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-[11px] font-black ${order.type === "retail" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>{orderTypeLabel(order.type)}</span>
            <span className={`rounded-full border px-3 py-1 text-[11px] font-black ${meta.color}`}>{meta.label}</span>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-black text-stone-600">مسیر: {region}</span>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {details.map(([label, value]) => (
              <div key={label} className={`rounded-2xl border border-stone-100 bg-stone-50 p-4 ${label === "آدرس" ? "md:col-span-3" : ""}`}>
                <p className="text-[10px] font-black text-stone-400">{label}</p>
                <p className="mt-1 break-words text-sm font-black leading-7 text-stone-800">{value}</p>
              </div>
            ))}
          </div>

          {extraDetails.length > 0 && (
            <div className="rounded-[1.5rem] border border-stone-100 p-4">
              <h4 className="text-sm font-black text-stone-800">اطلاعات تکمیلی</h4>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {extraDetails.map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-white p-3 text-xs font-bold text-stone-600 shadow-sm ring-1 ring-stone-100">
                    <span className="font-black text-stone-400">{label}: </span>{detailValue(value)}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-[1.5rem] border border-stone-100">
            <div className="flex items-center justify-between bg-stone-900 px-4 py-3 text-white">
              <h4 className="text-sm font-black">اقلام سفارش</h4>
              <span className="text-xs font-black text-amber-200">{(order.items || []).length.toLocaleString("en-US")} قلم</span>
            </div>
            {(order.items || []).length === 0 ? (
              <div className="p-6 text-center text-sm font-bold text-stone-500">اقلامی برای این سفارش ثبت نشده است.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-right text-sm">
                  <thead className="bg-stone-50 text-[11px] font-black text-stone-500">
                    <tr>
                      <th className="px-4 py-3">ردیف</th>
                      <th className="px-4 py-3">محصول</th>
                      <th className="px-4 py-3">تعداد / واحد</th>
                      <th className="px-4 py-3">قیمت واحد</th>
                      <th className="px-4 py-3">جمع</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {order.items.map((item, index) => (
                      <tr key={item.id || `${itemName(item)}-${index}`} className="font-bold text-stone-700">
                        <td className="px-4 py-3 font-mono text-stone-500">{(index + 1).toLocaleString("en-US")}</td>
                        <td className="px-4 py-3 font-black text-stone-900">{itemName(item)}</td>
                        <td className="px-4 py-3">{itemQuantity(item)}</td>
                        <td className="px-4 py-3">{money(itemUnitPrice(item))}</td>
                        <td className="px-4 py-3 font-black">{money(itemSubtotal(item))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
