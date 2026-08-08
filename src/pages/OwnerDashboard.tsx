// @ts-nocheck
// OwnerDashboard نهایی - شامل هر دو قابلیت خواسته شده:
// 1- گزارش ویزیتورها با سفارشات مخصوص هر ویزیتور + نام ویزیتور
// 2- صفحه جدید سفارشات مشتری‌ها با دو قسمت عمده و جزئی حرفه‌ای
// فقط همین فایل - بقیه سایت دست نخورده

import { useEffect, useState } from "react";
import { dashboardApi } from "../services/dashboardApi";
import { productsApi } from "../api/client";

function formatPrice(n: any) {
  const num = typeof n === "string" ? parseFloat(n) : n;
  return (isNaN(num) ? 0 : num).toLocaleString("en-US") + " تومان";
}

export default function OwnerDashboardFinal() {
  const [activeMainTab, setActiveMainTab] = useState<"visitors-report" | "customer-orders">("visitors-report");
  const [report, setReport] = useState<any[]>([]);
  const [selectedVisitor, setSelectedVisitor] = useState<any>(null);
  const [visitorOrders, setVisitorOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [retailOrders, setRetailOrders] = useState<any[]>([]);
  const [wholesaleOrders, setWholesaleOrders] = useState<any[]>([]);
  const [customerTab, setCustomerTab] = useState<"retail" | "wholesale">("retail");
  const [search, setSearch] = useState("");

  // لود گزارش ویزیتورها
  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await dashboardApi.owner.visitorReport();
      setReport(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  // لود سفارشات هر ویزیتور
  const loadVisitorOrders = async (visitor: any) => {
    setSelectedVisitor(visitor);
    setOrdersLoading(true);
    try {
      const commissionData = await dashboardApi.visitor.commission(visitor.visitor_id);
      const commissions = commissionData.commissions ?? commissionData ?? [];
      // ساخت لیست سفارشات از روی کمیسیون‌ها
      const orders = commissions.map((c: any) => ({
        id: c.order,
        order_number: c.order_number,
        total_amount: c.order_total,
        visitor_name: visitor.visitor_name,
        visitor_username: visitor.visitor_username,
        commission: c,
      }));
      // تلاش برای گرفتن جزئیات کامل
      const detailed = await Promise.all(
        orders.slice(0, 10).map(async (o: any) => {
          try {
            const base = (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
            const res = await fetch(`${base}/orders/track/${o.order_number}/`);
            if (res.ok) {
              const detail = await res.json();
              return { ...detail, visitor_name: o.visitor_name, visitor_username: o.visitor_username, commission: o.commission };
            }
            return o;
          } catch { return o; }
        })
      );
      setVisitorOrders(detailed);
    } catch {
      setVisitorOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  // لود سفارشات مشتری‌ها (جزئی و عمده)
  const loadCustomerOrders = async () => {
    try {
      const base = (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
      const token = JSON.parse(localStorage.getItem("novin_auth_tokens") || "{}")?.access;
      const headers: any = token ? { Authorization: `Bearer ${token}` } : {};
      const [retailRes, wholesaleRes] = await Promise.all([
        fetch(`${base}/orders/list/`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${base}/orders/wholesale/list/`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
      ]);
      setRetailOrders(retailRes.results ?? retailRes ?? []);
      setWholesaleOrders(wholesaleRes.results ?? wholesaleRes ?? []);
    } catch {}
  };

  useEffect(() => { loadReport(); loadCustomerOrders(); }, []);

  const filteredRetail = retailOrders.filter((o: any) => !search || o.order_number?.toLowerCase().includes(search.toLowerCase()));
  const filteredWholesale = wholesaleOrders.filter((o: any) => !search || o.request_number?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#faf8f5] pt-28 pb-20" dir="rtl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
        
        {/* تب اصلی */}
        <div className="flex justify-center">
          <div className="inline-flex p-1.5 bg-stone-900 rounded-[1.5rem] border border-white/10 shadow-2xl">
            <button onClick={() => setActiveMainTab("visitors-report")} className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${activeMainTab === "visitors-report" ? "bg-white text-stone-900 shadow-lg" : "text-stone-400 hover:text-white"}`}>
              📈 گزارش ویزیتورها با سفارشات
            </button>
            <button onClick={() => setActiveMainTab("customer-orders")} className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${activeMainTab === "customer-orders" ? "bg-white text-stone-900 shadow-lg" : "text-stone-400 hover:text-white"}`}>
              📦 سفارشات مشتری‌ها (عمده/جزئی)
            </button>
          </div>
        </div>

        {activeMainTab === "visitors-report" && (
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-900 via-slate-900 to-stone-900 p-8 text-white shadow-2xl">
              <h1 className="text-3xl font-black">📈 گزارش ویزیتورها - سفارشات هر ویزیتور با نام</h1>
              <p className="mt-2 text-stone-400 text-sm">روی هر ویزیتور کلیک کنید تا سفارشات مخصوص او با نام ویزیتور نمایش داده شود</p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-40 bg-white rounded-2xl border animate-pulse" />)}</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-3">
                  <h3 className="font-black text-sm">ویزیتورها ({report.length})</h3>
                  {report.map((v: any, idx: number) => (
                    <div key={v.visitor_id} onClick={() => loadVisitorOrders(v)} className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedVisitor?.visitor_id === v.visitor_id ? "bg-stone-900 text-white border-stone-900 shadow-xl" : "bg-white border-stone-200 hover:border-indigo-300 hover:shadow-lg"}`}>
                      <div className="flex justify-between">
                        <div>
                          <p className="font-black">{v.visitor_name}</p>
                          <p className="text-xs opacity-70">@{v.visitor_username} • {v.total_orders} سفارش</p>
                        </div>
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-black text-sm ${selectedVisitor?.visitor_id === v.visitor_id ? "bg-white text-stone-900" : "bg-stone-900 text-white"}`}>{idx+1}</div>
                      </div>
                      <div className="mt-3 flex gap-2 text-[10px]">
                        <span className={`px-2 py-1 rounded-full ${selectedVisitor?.visitor_id === v.visitor_id ? "bg-white/20" : "bg-stone-100"}`}>{v.total_visits} بازدید</span>
                        <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{v.total_sales ? `${Number(v.total_sales).toLocaleString("en-US")} فروش` : ""}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="lg:col-span-2">
                  {!selectedVisitor ? (
                    <div className="h-full min-h-[400px] rounded-[2.5rem] bg-white border-2 border-dashed border-stone-200 flex flex-col items-center justify-center p-12 text-center">
                      <div className="text-5xl mb-4">👈</div>
                      <h3 className="font-black text-lg">یک ویزیتور را انتخاب کنید</h3>
                      <p className="text-sm text-stone-500 mt-2">سفارشات مخصوص <span className="font-mono font-bold bg-stone-100 px-2 py-1 rounded-full">نام ویزیتور</span> نمایش داده می‌شود</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-[2rem] bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 text-white">
                        <h3 className="font-black text-xl">📦 سفارشات {selectedVisitor.visitor_name}</h3>
                        <p className="text-sm text-indigo-100 mt-1">نام ویزیتور: <span className="font-mono font-black bg-white/20 px-3 py-1 rounded-full">{selectedVisitor.visitor_name} (@{selectedVisitor.visitor_username})</span></p>
                      </div>

                      {ordersLoading ? <div className="text-center py-12">⏳</div> : visitorOrders.length === 0 ? (
                        <div className="rounded-[2rem] bg-white border p-12 text-center"><p>این ویزیتور هنوز سفارشی ثبت نکرده</p></div>
                      ) : (
                        <div className="space-y-3">
                          {visitorOrders.map((order: any) => (
                            <div key={order.id || order.order_number} className="rounded-2xl bg-white border p-5 shadow-sm">
                              <div className="flex justify-between">
                                <span className="font-mono font-black">{order.order_number}</span>
                                <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-1 rounded-full font-bold">ویزیتور: {order.visitor_name || selectedVisitor.visitor_name}</span>
                              </div>
                              <p className="text-sm mt-2">👤 {order.name} - {formatPrice(order.total_amount || 0)}</p>
                              <p className="text-xs text-stone-500 mt-1">محصولات: {order.items?.map((i: any) => `${i.product_name}×${i.quantity}`).join("، ") || `${order.total_amount} - سفارش ویزیتوری`}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeMainTab === "customer-orders" && (
          <div className="space-y-6">
            <div className="rounded-[2.5rem] bg-stone-900 p-8 text-white">
              <h1 className="text-3xl font-black">📦 سفارشات مشتری‌ها - صفحه جدید</h1>
              <p className="text-stone-400 text-sm mt-2">دو قسمت عمده و جزئی حرفه‌ای - فقط همین صفحه جدید</p>
            </div>

            <div className="flex gap-3">
              <div className="flex p-1 bg-stone-900 rounded-2xl">
                <button onClick={() => setActiveMainTab("customer-orders")} className="px-6 py-2.5 rounded-xl bg-white text-stone-900 font-black text-sm">این صفحه جدید است</button>
              </div>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجوی شماره سفارش..." className="flex-1 max-w-md rounded-xl border-2 bg-white px-4 py-2.5 text-sm" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-[2rem] bg-white border p-6 shadow-sm">
                <h3 className="font-black flex items-center gap-2">🛒 جزئی ({filteredRetail.length})</h3>
                <div className="mt-4 space-y-3 max-h-[600px] overflow-y-auto">
                  {filteredRetail.slice(0, 10).map((o: any) => (
                    <div key={o.id} className="p-4 bg-stone-50 rounded-2xl border">
                      <p className="font-mono font-bold text-sm">{o.order_number}</p>
                      <p className="text-xs mt-1">{o.name} - {formatPrice(o.total_amount)}</p>
                      <p className="text-[10px] text-stone-500 mt-1">جزئی</p>
                    </div>
                  ))}
                  {filteredRetail.length === 0 && <p className="text-sm text-stone-400 text-center py-8">سفارش جزئی نیست</p>}
                </div>
              </div>

              <div className="rounded-[2rem] bg-gradient-to-br from-amber-50 to-gold-50 border border-amber-200 p-6 shadow-sm">
                <h3 className="font-black flex items-center gap-2">🏢 عمده ({filteredWholesale.length})</h3>
                <div className="mt-4 space-y-3 max-h-[600px] overflow-y-auto">
                  {filteredWholesale.slice(0, 10).map((o: any) => (
                    <div key={o.id} className="p-4 bg-white rounded-2xl border border-amber-100 shadow-sm">
                      <p className="font-mono font-bold text-sm">{o.request_number}</p>
                      <p className="text-xs mt-1">{o.company_name} - {o.contact_person}</p>
                      <p className="text-[10px] text-amber-700 mt-2 bg-amber-50 px-2 py-1 rounded-full inline-block">عمده - {o.status}</p>
                    </div>
                  ))}
                  {filteredWholesale.length === 0 && <p className="text-sm text-stone-400 text-center py-8">سفارش عمده نیست</p>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
