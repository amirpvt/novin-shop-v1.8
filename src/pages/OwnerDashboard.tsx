/**
 * OwnerDashboard.tsx — داشبورد مدیر کل
 * صفحه اصلی پنل مدیرکل: شاخص‌های کلیدی، عملکرد ویزیتورها، وضعیت بازدیدها و آخرین سفارش‌ها
 * فقط همین فایل — بقیه سایت دست نخورده
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { dashboardApi } from "../services/dashboardApi";
import { CloseIcon, CrownIcon, PackageIcon, ShoppingBagIcon, TruckIcon } from "../components/icons";

// ─── Types ────────────────────────────────────────────────────────────────
type Stats = {
  today_sales: number;
  today_orders: number;
  active_visitors: number;
  low_stock: number;
  out_of_stock: number;
  debtors_count: number;
  total_debt: number;
  visits_status: { pending: number; visited: number; ordered: number };
};

type VisitorRow = {
  visitor_id: number;
  visitor_username: string;
  visitor_name: string;
  total_visits: number;
  completed_visits: number;
  total_orders: number;
  total_sales: number;
  total_commission: number;
  pending_visits: number;
  // تفکیک خرده / عمده (از بک‌اند)
  retail_orders?: number;
  retail_sales?: number;
  wholesale_orders?: number;
  wholesale_sales?: number;
};

type RetailOrder = {
  id: number;
  order_number: string;
  name: string;
  total_amount: number | string;
  order_status: string;
  created_at: string;
};

type WholesaleReqItem = {
  id: number;
  product_name: string;
  quantity: number;
  notes?: string;
  product_image?: string;
};

type WholesaleReq = {
  id: number;
  request_number: string;
  total_amount?: number | string | null;
  company_name: string;
  contact_person: string;
  phone?: string;
  address?: string;
  description?: string;
  status: string;
  created_at: string;
  user?: number | null;
  items?: WholesaleReqItem[];
};

type VisitorOrderItem = {
  id: number;
  product: number | null;
  product_name: string;
  price: number | string;
  quantity: number;
  subtotal: number | string;
  product_image?: string;
  product_slug?: string;
};

type VisitorOrder = {
  order_number: string;
  name: string;
  phone?: string;
  address?: string;
  total_amount: number | string;
  order_status: string;
  created_at: string;
  items?: VisitorOrderItem[];
  commission?: { amount: number | string; percentage: number | string; is_paid: boolean };
  partial?: boolean;
};

type CommissionSummary = {
  total: number;
  paid: number;
  unpaid: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────
const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const nf = (n: number | string | null | undefined) =>
  new Intl.NumberFormat("en-US").format(Number(n || 0));

function compact(n: number | string | null | undefined): string {
  const v = Number(n || 0);
  if (v >= 1_000_000_000) return `${nf((v / 1_000_000_000).toFixed(1))} میلیارد`;
  if (v >= 1_000_000) return `${nf((v / 1_000_000).toFixed(1))} میلیون`;
  if (v >= 1_000) return `${nf(Math.round(v / 1000))} هزار`;
  return nf(v);
}

function relTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const mins = Math.floor((Date.now() - t) / 60000);
  if (mins < 1) return "همین لحظه";
  if (mins < 60) return `${nf(mins)} دقیقه پیش`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${nf(hrs)} ساعت پیش`;
  return `${nf(Math.floor(hrs / 24))} روز پیش`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" });
}

async function apiGet<T>(path: string): Promise<T[]> {
  try {
    const token = JSON.parse(localStorage.getItem("novin_auth_tokens") || "{}")?.access;
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${path}`, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return ((data?.results ?? data) as T[]) || [];
  } catch {
    return [];
  }
}

const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "در انتظار", cls: "bg-amber-100 text-amber-800 border-amber-200" },
  CONFIRMED: { label: "تأیید شده", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  PREPARING: { label: "آماده‌سازی", cls: "bg-blue-100 text-blue-800 border-blue-200" },
  SHIPPED: { label: "ارسال شده", cls: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  DELIVERED: { label: "تحویل شده", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  CANCELLED: { label: "لغو شده", cls: "bg-rose-100 text-rose-800 border-rose-200" },
};

const WHOLESALE_STATUS: Record<string, { label: string; cls: string }> = {
  NEW: { label: "جدید", cls: "bg-amber-100 text-amber-800 border-amber-200" },
  QUOTED: { label: "پیش‌فاکتور", cls: "bg-blue-100 text-blue-800 border-blue-200" },
  CONVERTED: { label: "تبدیل شده", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  REJECTED: { label: "رد شده", cls: "bg-rose-100 text-rose-800 border-rose-200" },
};

const EMPTY_STATS: Stats = {
  today_sales: 0,
  today_orders: 0,
  active_visitors: 0,
  low_stock: 0,
  out_of_stock: 0,
  debtors_count: 0,
  total_debt: 0,
  visits_status: { pending: 0, visited: 0, ordered: 0 },
};

// ─── Small inline icons ────────────────────────────────────────────────────
type IconProps = { className?: string };
const ico = "h-5 w-5";

function WalletIcon({ className = ico }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 12V8H6a2 2 0 0 1 0-4h12v4" />
      <path d="M4 6v12a2 2 0 0 0 2 2h14v-4" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
    </svg>
  );
}
function ReceiptIcon({ className = ico }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 2v20l2.5-1.5L9 22l2.5-1.5L14 22l2.5-1.5L19 22V2l-2.5 1.5L14 2l-2.5 1.5L9 2 6.5 3.5 4 2z" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}
function UsersIcon({ className = ico }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function DebtIcon({ className = ico }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 9h8M8 13h8M12 17v.01M9.5 17h5" />
    </svg>
  );
}
function AlertIcon({ className = ico }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}
function RefreshIcon({ className = ico }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
    </svg>
  );
}

// ─── Sub components ────────────────────────────────────────────────────────
function KpiCard({
  title, value, unit, hint, tone, glow, children,
}: {
  title: string;
  value: string;
  unit?: string;
  hint?: string;
  tone: string;
  glow: string;
  children: ReactNode;
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-stone-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-900/5">
      <div className={`absolute -left-8 -top-8 h-24 w-24 rounded-full ${glow} opacity-40 blur-2xl transition-opacity group-hover:opacity-70`} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-stone-500">{title}</p>
          <p className="mt-2 truncate text-2xl font-black tracking-tight text-stone-900" title={value}>
            {value}
          </p>
          {unit && <p className="mt-0.5 text-[10px] font-bold text-stone-400">{unit}</p>}
          {hint && <p className="mt-2 truncate text-[10px] font-bold text-stone-400">{hint}</p>}
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tone} ring-1 ring-inset ring-black/5`}>
          {children}
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title, subtitle, icon, children, className = "",
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-sm ${className}`}>
      <div className="flex items-start justify-between gap-4 border-b border-stone-100 px-6 py-5">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-900 text-white">
              {icon}
            </div>
          )}
          <div>
            <h3 className="text-sm font-black text-stone-900">{title}</h3>
            {subtitle && <p className="mt-1 text-[11px] font-bold text-stone-400">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Donut({
  segments, size = 148, thickness = 16, centerLabel, centerValue,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerLabel: string;
  centerValue: string;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f5f5f4" strokeWidth={thickness} />
        {total > 0 &&
          segments.map((s) => {
            const len = (s.value / total) * c;
            const el = (
              <circle
                key={s.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={thickness}
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
              />
            );
            offset += len;
            return el;
          })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-stone-900">{centerValue}</span>
        <span className="mt-0.5 text-[10px] font-bold text-stone-400">{centerLabel}</span>
      </div>
    </div>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-stone-100 ${className}`} />;
}

/** تصویر محصول — در صورت نبود یا خطای بارگذاری، جایگزین حرفه‌ای نمایش می‌دهد */
function ProductThumb({ src, alt, size = 56 }: { src?: string; alt: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const dim = { width: size, height: size };

  if (!src || failed) {
    return (
      <div
        style={dim}
        className="flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-stone-100 to-stone-200 text-stone-400 ring-1 ring-inset ring-stone-200"
      >
        <PackageIcon className="h-6 w-6" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      style={dim}
      className="shrink-0 rounded-2xl object-cover ring-1 ring-stone-200"
    />
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────
export default function OwnerDashboard() {
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [report, setReport] = useState<VisitorRow[]>([]);
  const [retail, setRetail] = useState<RetailOrder[]>([]);
  const [wholesale, setWholesale] = useState<WholesaleReq[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selected, setSelected] = useState<VisitorRow | null>(null);
  const [visitorOrders, setVisitorOrders] = useState<VisitorOrder[]>([]);
  const [commission, setCommission] = useState<CommissionSummary>({ total: 0, paid: 0, unpaid: 0 });
  const [ordersLoading, setOrdersLoading] = useState(false);
  // تبِ پنجره جزئیات: سفارش‌های خرده یا عمده‌ی ویزیتور
  const [detailTab, setDetailTab] = useState<"retail" | "wholesale">("retail");

  const load = useCallback(async () => {
    const [s, r, rt, ws] = await Promise.all([
      dashboardApi.owner.stats().catch(() => EMPTY_STATS),
      dashboardApi.owner.visitorReport().catch(() => [] as VisitorRow[]),
      apiGet<RetailOrder>("/orders/list/"),
      apiGet<WholesaleReq>("/orders/wholesale/list/"),
    ]);
    setStats({ ...EMPTY_STATS, ...(s || {}) });
    setReport(Array.isArray(r) ? r : []);
    setRetail(rt);
    setWholesale(ws);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const loadVisitorOrders = async (visitor: VisitorRow) => {
    setSelected(visitor);
    setVisitorOrders([]);
    setCommission({ total: 0, paid: 0, unpaid: 0 });
    setDetailTab("retail");
    setOrdersLoading(true);
    try {
      const data: any = await dashboardApi.visitor.commission(visitor.visitor_id);
      const commissions: any[] = Array.isArray(data?.commissions)
        ? data.commissions
        : Array.isArray(data)
        ? data
        : [];

      setCommission({
        total: Number(data?.total_commission ?? 0),
        paid: Number(data?.paid_commission ?? 0),
        unpaid: Number(data?.unpaid_commission ?? 0),
      });

      const detailed = await Promise.all(
        commissions.map(async (c: any) => {
          const meta = {
            amount: c.amount ?? 0,
            percentage: c.percentage ?? 0,
            is_paid: !!c.is_paid,
          };
          // تلاش برای دریافت جزئیات کامل سفارش (شامل تصویر محصولات)
          try {
            const res = await fetch(`${API_BASE}/orders/track/${c.order_number ?? c.order}/`);
            if (res.ok) {
              const detail = (await res.json()) as VisitorOrder;
              return {
                ...detail,
                commission: meta,
                created_at: detail.created_at || c.created_at || "",
              } as VisitorOrder;
            }
          } catch {
            /* ignore */
          }
          // Fallback: فقط اطلاعات پورسانت
          return {
            order_number: c.order_number ?? "—",
            name: "سفارش ویزیتوری",
            total_amount: c.order_total ?? 0,
            order_status: "CONFIRMED",
            created_at: c.created_at ?? "",
            items: [],
            commission: meta,
            partial: true,
          } as VisitorOrder;
        })
      );

      detailed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setVisitorOrders(detailed);
    } catch {
      setVisitorOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  // ─── Derived ────────────────────────────────────────────────────────────
  const sortedReport = useMemo(
    () => [...report].sort((a, b) => Number(b.total_sales || 0) - Number(a.total_sales || 0)),
    [report]
  );
  const maxSales = useMemo(
    () => Math.max(1, ...sortedReport.map((v) => Number(v.total_sales || 0))),
    [sortedReport]
  );

  const totalTeamSales = useMemo(
    () => report.reduce((s, v) => s + Number(v.total_sales || 0), 0),
    [report]
  );
  const totalTeamOrders = useMemo(
    () => report.reduce((s, v) => s + Number(v.total_orders || 0), 0),
    [report]
  );

  const visits = stats.visits_status || { pending: 0, visited: 0, ordered: 0 };
  // درخواست‌های عمده‌ای که همین ویزیتور ثبت کرده است
  const visitorWholesale = useMemo(() => {
    if (!selected) return [];
    return wholesale
      .filter((w) => Number(w.user) === Number(selected.visitor_id))
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [wholesale, selected]);

  const visitSegments = [
    { label: "در انتظار", value: visits.pending || 0, color: "#f59e0b" },
    { label: "بازدید شده", value: visits.visited || 0, color: "#10b981" },
    { label: "سفارش ثبت شد", value: visits.ordered || 0, color: "#dc2626" },
  ];
  const visitTotal = visitSegments.reduce((s, x) => s + x.value, 0);

  const todayLabel = new Date().toLocaleDateString("fa-IR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const hour = new Date().getHours();
  const greeting = hour < 6 ? "شب‌بخیر" : hour < 12 ? "صبح‌بخیر" : hour < 18 ? "عصر‌بخیر" : "شب‌بخیر";

  const recentRetail = [...retail]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);
  const recentWholesale = [...wholesale]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6" dir="rtl">
      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 p-7 text-white shadow-2xl sm:p-9">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-paprika-600/20 blur-[90px]" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-gold-500/15 blur-[90px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] bg-[size:28px_28px] opacity-40" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 backdrop-blur">
              <CrownIcon className="h-3.5 w-3.5 text-gold-400" />
              <span className="text-[10px] font-black tracking-widest text-stone-200">
                پنل مدیر کل
              </span>
            </div>
            <h1 className="mt-4 font-display text-3xl font-black sm:text-4xl">
              {greeting}، مدیر عزیز 👋
            </h1>
            <p className="mt-2 text-sm text-stone-300">
              {todayLabel} · اینجا خلاصه‌ای از عملکرد امروز کسب‌وکار شماست
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
              <p className="text-[10px] font-bold text-stone-400">فروش امروز</p>
              <p className="mt-1 text-xl font-black text-emerald-300">
                {loading ? "…" : `${compact(stats.today_sales)}`}
                <span className="mr-1 text-[10px] font-bold text-stone-400">تومان</span>
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-4 text-xs font-black text-white backdrop-blur transition hover:bg-white/20 disabled:opacity-50"
            >
              <RefreshIcon className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              بروزرسانی
            </button>
          </div>
        </div>
      </div>

      {/* ─── KPI Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[132px]" />)
        ) : (
          <>
            <KpiCard
              title="فروش امروز"
              value={compact(stats.today_sales)}
              unit="تومان"
              tone="bg-emerald-50 text-emerald-600" glow="bg-emerald-300"
            >
              <WalletIcon />
            </KpiCard>
            <KpiCard
              title="سفارش‌های امروز"
              value={nf(stats.today_orders)}
              unit="سفارش"
              tone="bg-indigo-50 text-indigo-600" glow="bg-indigo-300"
            >
              <ReceiptIcon />
            </KpiCard>
            <KpiCard
              title="ویزیتورهای فعال"
              value={nf(stats.active_visitors)}
              unit="نفر امروز"
              tone="bg-gold-50 text-gold-600" glow="bg-gold-300"
            >
              <UsersIcon />
            </KpiCard>
            <KpiCard
              title="بدهکاران"
              value={nf(stats.debtors_count)}
              unit="مشتری"
              hint={`${compact(stats.total_debt)} تومان`}
              tone="bg-paprika-50 text-paprika-600" glow="bg-paprika-300"
            >
              <DebtIcon />
            </KpiCard>
            <KpiCard
              title="موجودی کم"
              value={nf(stats.low_stock)}
              unit="محصول"
              tone="bg-amber-50 text-amber-600" glow="bg-amber-300"
            >
              <AlertIcon />
            </KpiCard>
            <KpiCard
              title="ناموجود"
              value={nf(stats.out_of_stock)}
              unit="محصول"
              tone="bg-rose-50 text-rose-600" glow="bg-rose-300"
            >
              <PackageIcon className="h-5 w-5" />
            </KpiCard>
          </>
        )}
      </div>

      {/* ─── Charts row ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <SectionCard
          className="xl:col-span-2"
          title="عملکرد فروش ویزیتورها"
          subtitle={`${nf(totalTeamOrders)} سفارش · ${compact(totalTeamSales)} تومان فروش کل`}
          icon={<TruckIcon className="h-4 w-4" />}
        >
          {loading ? (
            <div className="space-y-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9" />
              ))}
            </div>
          ) : sortedReport.length === 0 ? (
            <p className="py-10 text-center text-xs font-bold text-stone-400">
              هنوز داده‌ای برای نمایش وجود ندارد
            </p>
          ) : (
            <div className="space-y-5">
              {sortedReport.slice(0, 6).map((v) => {
                const pct = Math.max(3, (Number(v.total_sales || 0) / maxSales) * 100);
                return (
                  <div key={v.visitor_id}>
                    <div className="mb-2 flex items-baseline justify-between gap-3">
                      <span className="truncate text-xs font-bold text-stone-700">
                        {v.visitor_name}
                      </span>
                      <span className="shrink-0 text-[11px] font-black text-stone-900">
                        {compact(v.total_sales)}
                        <span className="mr-1 text-[9px] font-bold text-stone-400">تومان</span>
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-l from-paprika-600 via-paprika-500 to-gold-400 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="وضعیت بازدیدهای امروز"
          subtitle="گزارش زنده تیم فروش"
          icon={<UsersIcon className="h-4 w-4" />}
        >
          {loading ? (
            <Skeleton className="mx-auto h-[148px] w-[148px] rounded-full" />
          ) : (
            <>
              <Donut
                segments={visitSegments}
                centerLabel="کل بازدیدها"
                centerValue={nf(visitTotal)}
              />
              <div className="mt-6 space-y-2.5">
                {visitSegments.map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                      <span className="text-[11px] font-bold text-stone-600">{s.label}</span>
                    </div>
                    <span className="text-xs font-black text-stone-900">{nf(s.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>
      </div>

      {/* ─── Leaderboard ──────────────────────────────────────────────── */}
      <SectionCard
        title="رتبه‌بندی ویزیتورها"
        subtitle="برای مشاهده سفارش‌های هر ویزیتور روی آن کلیک کنید"
        icon={<CrownIcon className="h-4 w-4" />}
      >
        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        ) : sortedReport.length === 0 ? (
          <p className="py-10 text-center text-xs font-bold text-stone-400">
            ویزیتوری ثبت نشده است
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {sortedReport.map((v, idx) => {
              const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null;
              return (
                <button
                  key={v.visitor_id}
                  onClick={() => loadVisitorOrders(v)}
                  className="group rounded-2xl border border-stone-200 bg-white p-4 text-right transition-all duration-300 hover:-translate-y-1 hover:border-stone-900 hover:shadow-xl hover:shadow-stone-900/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-stone-900 to-stone-700 text-sm font-black text-white">
                      {v.visitor_name?.charAt(0) || "؟"}
                      {medal && (
                        <span className="absolute -bottom-1.5 -left-1.5 text-sm">{medal}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black text-stone-900">{v.visitor_name}</p>
                      <p className="truncate text-[10px] font-bold text-stone-400">
                        @{v.visitor_username}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-1 border-t border-stone-100 pt-3 text-center">
                    <div>
                      <p className="text-[9px] font-bold text-stone-400">فروش</p>
                      <p className="mt-0.5 text-[11px] font-black text-emerald-600">
                        {compact(v.total_sales)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-stone-400">سفارش</p>
                      <p className="mt-0.5 text-[11px] font-black text-stone-900">
                        {nf(v.total_orders)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-stone-400">بازدید</p>
                      <p className="mt-0.5 text-[11px] font-black text-stone-900">
                        {nf(v.total_visits)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* ─── Recent orders ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard
          title="آخرین سفارش‌های خرده"
          subtitle={`${nf(retail.length)} سفارش`}
          icon={<ShoppingBagIcon className="h-4 w-4" />}
        >
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : recentRetail.length === 0 ? (
            <p className="py-10 text-center text-xs font-bold text-stone-400">
              سفارش خرده‌ای ثبت نشده است
            </p>
          ) : (
            <div className="space-y-2.5">
              {recentRetail.map((o) => {
                const st = ORDER_STATUS[o.order_status] ?? {
                  label: o.order_status,
                  cls: "bg-stone-100 text-stone-700 border-stone-200",
                };
                return (
                  <div
                    key={o.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-stone-100 bg-stone-50/60 px-4 py-3 transition hover:border-stone-300 hover:bg-white"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black text-stone-900">{o.name}</p>
                      <p className="mt-0.5 text-[10px] font-bold text-stone-400">
                        {o.order_number} · {relTime(o.created_at)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs font-black text-stone-900">
                        {compact(o.total_amount)}
                      </span>
                      <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black ${st.cls}`}>
                        {st.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="آخرین درخواست‌های عمده"
          subtitle={`${nf(wholesale.length)} درخواست`}
          icon={<PackageIcon className="h-4 w-4" />}
        >
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : recentWholesale.length === 0 ? (
            <p className="py-10 text-center text-xs font-bold text-stone-400">
              درخواست عمده‌ای ثبت نشده است
            </p>
          ) : (
            <div className="space-y-2.5">
              {recentWholesale.map((w) => {
                const st = WHOLESALE_STATUS[w.status] ?? {
                  label: w.status,
                  cls: "bg-stone-100 text-stone-700 border-stone-200",
                };
                return (
                  <div
                    key={w.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-amber-100 bg-gradient-to-l from-amber-50/70 to-white px-4 py-3 transition hover:border-amber-300"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black text-stone-900">{w.company_name}</p>
                      <p className="mt-0.5 text-[10px] font-bold text-stone-400">
                        {w.request_number} · {w.contact_person}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black ${st.cls}`}>
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ─── Visitor detail modal ─────────────────────────────────────── */}
      {selected && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-stone-900/70 p-3 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={() => setSelected(null)}
        >
          <div
            className="my-auto w-full max-w-4xl overflow-hidden rounded-[1.75rem] bg-cream-50 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Header ── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 p-6 text-white sm:p-7">
              <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-paprika-600/20 blur-[90px]" />
              <div className="absolute -bottom-28 -right-16 h-64 w-64 rounded-full bg-gold-500/15 blur-[90px]" />

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-gold-400 to-paprika-600 text-2xl font-black text-stone-900 shadow-lg">
                    {selected.visitor_name?.charAt(0) || "؟"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black tracking-widest text-stone-400">
                      گزارش عملکرد ویزیتور
                    </p>
                    <h3 className="mt-1 truncate font-display text-2xl font-black">
                      {selected.visitor_name}
                    </h3>
                    <p className="mt-1 text-[11px] font-bold text-stone-400">
                      @{selected.visitor_username}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="shrink-0 rounded-2xl bg-white/10 p-3 transition hover:bg-white/20"
                  aria-label="بستن"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                  <p className="text-[9px] font-bold text-stone-400">کل فروش</p>
                  <p className="mt-1 text-lg font-black text-emerald-300">
                    {compact(selected.total_sales)}
                  </p>
                  <p className="truncate text-[9px] font-bold text-stone-500">
                    خرده {compact(selected.retail_sales)} · عمده {compact(selected.wholesale_sales)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                  <p className="text-[9px] font-bold text-stone-400">سفارش‌ها</p>
                  <p className="mt-1 text-lg font-black">{nf(selected.total_orders)}</p>
                  <p className="truncate text-[9px] font-bold text-stone-500">
                    {nf(selected.retail_orders)} خرده · {nf(selected.wholesale_orders)} عمده
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                  <p className="text-[9px] font-bold text-stone-400">بازدیدها</p>
                  <p className="mt-1 text-lg font-black">{nf(selected.total_visits)}</p>
                  <p className="text-[9px] font-bold text-stone-500">
                    {nf(selected.completed_visits)} انجام‌شده
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                  <p className="text-[9px] font-bold text-stone-400">پورسانت</p>
                  <p className="mt-1 text-lg font-black text-gold-300">{compact(commission.total)}</p>
                  <p className="text-[9px] font-bold text-stone-500">تومان</p>
                </div>
              </div>
            </div>

            {/* ── Commission strip ── */}
            <div className="grid grid-cols-3 gap-3 border-b border-stone-200 bg-white px-6 py-4">
              <div className="text-center">
                <p className="text-[9px] font-bold text-stone-400">کل پورسانت</p>
                <p className="mt-1 text-sm font-black text-stone-900">{nf(commission.total)}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] font-bold text-stone-400">پرداخت‌شده</p>
                <p className="mt-1 text-sm font-black text-emerald-600">{nf(commission.paid)}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] font-bold text-stone-400">در انتظار</p>
                <p className="mt-1 text-sm font-black text-amber-600">{nf(commission.unpaid)}</p>
              </div>
            </div>

            {/* ── Tabs: خرده / عمده ── */}
            <div className="flex items-center gap-2 border-b border-stone-200 bg-white px-5 py-3 sm:px-6">
              <button
                onClick={() => setDetailTab("retail")}
                className={`flex-1 rounded-2xl px-4 py-2.5 text-xs font-black transition ${
                  detailTab === "retail"
                    ? "bg-stone-900 text-white shadow-lg"
                    : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                }`}
              >
                🛒 سفارش‌های خرده ({nf(visitorOrders.length)})
              </button>
              <button
                onClick={() => setDetailTab("wholesale")}
                className={`flex-1 rounded-2xl px-4 py-2.5 text-xs font-black transition ${
                  detailTab === "wholesale"
                    ? "bg-stone-900 text-white shadow-lg"
                    : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                }`}
              >
                🏢 سفارش‌های عمده ({nf(visitorWholesale.length)})
              </button>
            </div>

            {/* ── Orders ── */}
            <div className="max-h-[50vh] space-y-3 overflow-y-auto p-5 sm:p-6">
              {ordersLoading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)
              ) : detailTab === "retail" ? (
                visitorOrders.length === 0 ? (
                  <div className="py-14 text-center">
                    <div className="text-4xl">📭</div>
                    <p className="mt-3 text-xs font-bold text-stone-400">
                      این ویزیتور هنوز سفارش خرده‌ای ثبت نکرده است
                    </p>
                  </div>
                ) : (
                  visitorOrders.map((o, i) => {
                  const st = ORDER_STATUS[o.order_status] ?? {
                    label: o.order_status,
                    cls: "bg-stone-100 text-stone-700 border-stone-200",
                  };
                  return (
                    <div
                      key={o.order_number ?? i}
                      className="overflow-hidden rounded-3xl border border-stone-200 bg-white"
                    >
                      {/* order top */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 bg-stone-50/70 px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="rounded-xl bg-stone-900 px-3 py-1.5 font-mono text-[11px] font-black text-white">
                            {o.order_number}
                          </span>
                          <span className="text-[10px] font-bold text-stone-500">
                            {fmtDate(o.created_at)} · {relTime(o.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-stone-900">
                            {nf(o.total_amount)}
                            <span className="mr-1 text-[9px] font-bold text-stone-400">تومان</span>
                          </span>
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[9px] font-black ${st.cls}`}
                          >
                            {st.label}
                          </span>
                        </div>
                      </div>

                      {/* customer */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 pt-3 text-[10px] font-bold text-stone-500">
                        <span>👤 {o.name}</span>
                        {!!o.phone && <span className="font-mono">📞 {o.phone}</span>}
                        {!!o.address && (
                          <span className="max-w-full truncate">📍 {o.address}</span>
                        )}
                      </div>

                      {/* items with images */}
                      <div className="space-y-2 p-4">
                        {!o.items?.length ? (
                          <p className="py-2 text-[10px] font-bold text-stone-400">
                            جزئیات اقلام در دسترس نیست
                          </p>
                        ) : (
                          o.items.map((it) => (
                            <div
                              key={it.id}
                              className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-cream-50/70 p-2.5 transition hover:border-stone-200 hover:bg-white"
                            >
                              <ProductThumb src={it.product_image} alt={it.product_name} />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-black text-stone-900">
                                  {it.product_name}
                                </p>
                                <p className="mt-1 text-[10px] font-bold text-stone-500">
                                  {nf(it.quantity)} × {nf(it.price)} تومان
                                </p>
                              </div>
                              <span className="shrink-0 text-xs font-black text-emerald-700">
                                {nf(it.subtotal)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>

                      {/* commission footer */}
                      {o.commission && (
                        <div className="flex items-center justify-between border-t border-stone-100 bg-gold-50/50 px-4 py-2.5">
                          <span className="text-[10px] font-bold text-stone-500">
                            پورسانت ({nf(Number(o.commission.percentage))}٪)
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="text-xs font-black text-gold-700">
                              {nf(o.commission.amount)} تومان
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[9px] font-black ${
                                o.commission.is_paid
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {o.commission.is_paid ? "پرداخت‌شده" : "در انتظار"}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
                )
              ) : visitorWholesale.length === 0 ? (
                <div className="py-14 text-center">
                  <div className="text-4xl">🏢</div>
                  <p className="mt-3 text-xs font-bold text-stone-400">
                    این ویزیتور هنوز سفارش عمده‌ای ثبت نکرده است
                  </p>
                </div>
              ) : (
                visitorWholesale.map((w) => {
                  const st = WHOLESALE_STATUS[w.status] ?? {
                    label: w.status,
                    cls: "bg-stone-100 text-stone-700 border-stone-200",
                  };
                  return (
                    <div
                      key={w.id}
                      className="overflow-hidden rounded-3xl border border-stone-200 bg-white"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 bg-amber-50/60 px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="rounded-xl bg-stone-900 px-3 py-1.5 font-mono text-[11px] font-black text-white">
                            {w.request_number}
                          </span>
                          <span className="text-[10px] font-bold text-stone-500">
                            {fmtDate(w.created_at)} · {relTime(w.created_at)}
                          </span>
                          {Number(w.total_amount) > 0 && (
                            <span className="rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">
                              {nf(Number(w.total_amount) || 0)} تومان
                            </span>
                          )}
                        </div>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[9px] font-black ${st.cls}`}
                        >
                          {st.label}
                        </span>
                      </div>

                      <div className="px-4 pt-3">
                        <p className="text-xs font-black text-stone-900">🏢 {w.company_name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-bold text-stone-500">
                          <span>👤 {w.contact_person}</span>
                          {!!w.phone && <span className="font-mono">📞 {w.phone}</span>}
                        </div>
                        {!!w.address && (
                          <p className="mt-1 truncate text-[10px] font-bold text-stone-400">
                            📍 {w.address}
                          </p>
                        )}
                        {!!w.description && (
                          <p className="mt-1.5 text-[10px] font-bold text-stone-500">
                            📝 {w.description}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 p-4">
                        {!w.items?.length ? (
                          <p className="py-2 text-[10px] font-bold text-stone-400">
                            اقلامی برای این درخواست ثبت نشده است
                          </p>
                        ) : (
                          w.items.map((it) => (
                            <div
                              key={it.id}
                              className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50/40 p-2.5 transition hover:bg-white"
                            >
                              <ProductThumb src={it.product_image} alt={it.product_name} />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-black text-stone-900">
                                  {it.product_name}
                                </p>
                                <p className="mt-1 text-[10px] font-bold text-stone-500">
                                  تعداد: {nf(it.quantity)}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
