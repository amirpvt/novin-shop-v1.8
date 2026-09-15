/**
 * CustomerOrdersPro - فقط سفارشات خود مشتری (نه ویزیتور)
 * دو قسمت عمده و جزئی حرفه‌ای
 * فیکس: سفارش ویزیتور اینجا نمایش داده نمی‌شود - فقط خود مشتری
 */
import { useEffect, useState } from "react";
import { formatJalaliDate } from "../utils/date";
import { retailOrderStatusLabel } from "../utils/orderStatus";

function formatPrice(n: any) {
  const num = typeof n === "string" ? parseFloat(n) : n;
  return (isNaN(num) ? 0 : num).toLocaleString("en-US") + " تومان";
}

export default function CustomerOrdersProSelfOnly() {
  const [retailOrders, setRetailOrders] = useState<any[]>([]);
  const [wholesaleOrders, setWholesaleOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"retail" | "wholesale">("retail");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const base = (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
      const token = JSON.parse(localStorage.getItem("novin_auth_tokens") || "{}")?.access;
      const headers: any = token ? { Authorization: `Bearer ${token}` } : {};

      // ✅ فقط سفارشات خود مشتری - بدون سفارشات ویزیتور
      // از API جدید my-orders-self استفاده می‌کنیم که کمیسیون‌ها را حذف می‌کند
      const [retailRes, wholesaleRes] = await Promise.all([
        fetch(`${base}/dashboard/customer/my-orders-self/`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${base}/dashboard/customer/my-wholesale-self/`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
      ]);

      // اگر API جدید نبود (404)، از my-orders قدیمی استفاده کن ولی کمیسیون‌ها را دستی فیلتر کن
      let retailData = retailRes;
      let wholesaleData = wholesaleRes;

      if ((!Array.isArray(retailRes) || retailRes.length === 0) && !retailRes.results) {
        // fallback: my-orders بگیر و کمیسیون‌ها را حذف کن
        try {
          const [myOrdersRes, commissionRes] = await Promise.all([
            fetch(`${base}/orders/my-orders/`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
            fetch(`${base}/dashboard/visitor/commission/`, { headers }).then(r => r.ok ? r.json() : { commissions: [] }).catch(() => ({ commissions: [] })),
          ]);
          const myOrders = myOrdersRes.results ?? myOrdersRes ?? [];
          const commissions = (commissionRes as any).commissions ?? commissionRes ?? [];
          const commissionOrderIds = new Set(commissions.map((c: any) => c.order));
          // فقط آنهایی که کمیسیون ندارند = خود مشتری
          retailData = (myOrders as any[]).filter((o: any) => !commissionOrderIds.has(o.id));
        } catch {}
      }

      setRetailOrders(retailData.results ?? retailData ?? []);
      setWholesaleOrders(wholesaleData.results ?? wholesaleData ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredRetail = retailOrders.filter((o: any) => !search || o.order_number?.toLowerCase().includes(search.toLowerCase()));
  const filteredWholesale = wholesaleOrders.filter((o: any) => !search || o.request_number?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#faf8f5] pt-28 pb-20" dir="rtl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-stone-900 p-8 md:p-10 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-gold-500/10 rounded-full blur-[100px]" />
          <div className="relative">
            <h1 className="text-3xl font-black">📦 سفارشات ثبت شده توسط خود شما</h1>
            <p className="text-stone-400 text-sm mt-2">این صفحه فقط سفارشات جزئی و عمده‌ای را نشان می‌دهد که خودتان ثبت کرده‌اید، نه سفارشات ویزیتورها</p>
            <div className="mt-4 inline-flex gap-2">
              <span className="bg-white/10 border border-white/10 px-4 py-2 rounded-full text-xs font-bold">🛒 {retailOrders.length} جزئی (خود شما)</span>
              <span className="bg-amber-500/20 border border-amber-500/20 px-4 py-2 rounded-full text-xs font-bold text-amber-300">🏢 {wholesaleOrders.length} عمده (خود شما)</span>
              <span className="bg-emerald-500/20 border border-emerald-500/20 px-4 py-2 rounded-full text-xs font-bold text-emerald-200">✅ بدون سفارشات ویزیتور</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="inline-flex p-1.5 bg-stone-900 rounded-2xl border border-white/10 shadow-2xl">
            <button onClick={() => setActiveTab("retail")} className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === "retail" ? "bg-white text-stone-900 shadow-lg" : "text-stone-400 hover:text-white"}`}>
              🛒 جزئی ({retailOrders.length}) - خود شما
            </button>
            <button onClick={() => setActiveTab("wholesale")} className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${activeTab === "wholesale" ? "bg-white text-stone-900 shadow-lg" : "text-stone-400 hover:text-white"}`}>
              🏢 عمده ({wholesaleOrders.length}) - خود شما
            </button>
          </div>
          <div className="flex gap-2 flex-1 max-w-md">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجوی شماره سفارش..." className="flex-1 rounded-xl border-2 bg-white px-4 py-2.5 text-sm outline-none focus:border-amber-500 shadow-sm" />
            <button onClick={load} className="px-5 bg-white border rounded-xl text-sm font-bold hover:bg-stone-50 shadow-sm">🔄</button>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-white rounded-[2rem] border animate-pulse" />)}</div>
        ) : activeTab === "retail" ? (
          filteredRetail.length === 0 ? (
            <div className="rounded-[2.5rem] bg-white border p-16 text-center shadow-sm">
              <div className="text-6xl mb-4">🛒</div>
              <h3 className="text-xl font-black">سفارش جزئی که خودتان ثبت کرده باشید ندارید</h3>
              <p className="text-sm text-stone-500 mt-2">سفارشات ویزیتورها اینجا نمایش داده نمی‌شود - فقط سفارشاتی که خودتان ثبت کرده‌اید</p>
              <button onClick={() => window.location.href = "/shop"} className="mt-6 bg-stone-900 text-white px-8 py-3 rounded-xl font-bold">رفتن به فروشگاه</button>
            </div>
          ) : (
            <div className="grid gap-5">
              {filteredRetail.map((order: any) => (
                <div key={order.id} onClick={() => setSelectedOrder(order)} className="group relative overflow-hidden rounded-[2rem] bg-white border border-stone-200 shadow-sm hover:shadow-2xl hover:border-stone-300 hover:-translate-y-1 transition-all duration-500 cursor-pointer">
                  <div className="relative p-6 md:p-7">
                    <div className="flex flex-col lg:flex-row justify-between gap-5">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center gap-2 rounded-full bg-stone-900 text-white px-3 py-1 text-[11px] font-black"><span>🛒</span> جزئی - خود شما</span>
                          <span className="font-mono font-black text-lg">{order.order_number}</span>
                        </div>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="bg-stone-50 rounded-2xl p-3 border"><p className="text-[10px] font-black tracking-widest text-stone-400">تاریخ</p><p className="text-sm mt-1">{order.created_at ? formatJalaliDate(order.created_at) : ""}</p></div>
                          <div className="bg-stone-50 rounded-2xl p-3 border"><p className="text-[10px] font-black tracking-widest text-stone-400">وضعیت</p><p className="text-sm font-bold mt-1">{retailOrderStatusLabel(order.order_status)}</p></div>
                          <div className="bg-stone-900 rounded-2xl p-3 text-white"><p className="text-[10px] tracking-widest font-black text-stone-400">مبلغ</p><p className="font-black text-gold-400 mt-1">{formatPrice(order.total_amount)}</p></div>
                        </div>
                      </div>
                      <div className="hidden lg:flex h-12 w-12 rounded-2xl bg-stone-50 border items-center justify-center group-hover:bg-stone-900 group-hover:text-white transition"><span>👁️</span></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          filteredWholesale.length === 0 ? (
            <div className="rounded-[2.5rem] bg-white border p-16 text-center shadow-sm">
              <div className="text-6xl mb-4">🏢</div>
              <h3 className="text-xl font-black">سفارش عمده‌ای که خودتان ثبت کرده باشید ندارید</h3>
              <p className="text-sm text-stone-500 mt-2">سفارشات ویزیتورها اینجا نیست - فقط خودتان</p>
            </div>
          ) : (
            <div className="grid gap-5">
              {filteredWholesale.map((order: any) => (
                <div key={order.id} className="group relative overflow-hidden rounded-[2rem] bg-white border-2 border-amber-100 shadow-sm hover:shadow-2xl hover:border-amber-300 hover:-translate-y-1 transition-all cursor-pointer">
                  <div className="p-6 md:p-7">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-gold-600 text-stone-900 px-3 py-1 text-[11px] font-black shadow"><span>🏢</span> عمده - خود شما</span>
                      <span className="font-mono font-black text-lg">{order.request_number}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-amber-50/50 rounded-2xl p-3 border border-amber-100"><p className="text-[10px] font-black tracking-widest text-amber-700">شرکت</p><p className="font-bold text-sm mt-1">{order.company_name}</p></div>
                      <div className="bg-stone-50 rounded-2xl p-3 border"><p className="text-[10px] font-black tracking-widest text-stone-400">تماس</p><p className="text-sm mt-1">📞 {order.phone}</p></div>
                      <div className="bg-stone-900 rounded-2xl p-3 text-white"><p className="text-[10px] tracking-widest font-black text-stone-400">وضعیت</p><p className="font-black mt-1 text-amber-300">{order.status}</p></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedOrder(null)}>
          <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-[0_25px_80px_rgba(0,0,0,0.4)] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b bg-stone-900 text-white flex justify-between items-center">
              <div><h3 className="font-mono font-black text-xl">{selectedOrder.order_number}</h3><p className="text-sm text-stone-300 mt-1">سفارش ثبت شده توسط خود شما - جزئی</p></div>
              <button onClick={() => setSelectedOrder(null)} className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 grid place-items-center">✕</button>
            </div>
            <div className="p-6">
              <div className="space-y-2">
                {(selectedOrder.items || []).map((item: any) => (
                  <div key={item.id} className="flex gap-3 items-center bg-stone-50 p-3 rounded-2xl border">
                    <img src={item.product_image || "/images/placeholder.jpg"} alt={item.product_name} className="h-14 w-14 rounded-xl object-cover bg-white border" />
                    <div className="flex-1"><p className="font-bold text-sm">{item.product_name}</p><p className="text-xs text-stone-500">تعداد: {item.quantity}</p></div>
                    <span className="font-black text-sm">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-between items-center pt-4 border-t">
                <span className="font-bold">مبلغ کل</span>
                <span className="text-xl font-black">{formatPrice(selectedOrder.total_amount || 0)}</span>
              </div>
            </div>
            <div className="p-6 border-t bg-stone-50 flex justify-end"><button onClick={() => setSelectedOrder(null)} className="px-8 py-3 bg-stone-900 text-white rounded-xl font-bold">بستن</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
