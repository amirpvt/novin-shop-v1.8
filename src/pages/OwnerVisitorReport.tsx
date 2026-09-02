// @ts-nocheck
/**
 * VisitorOrders - حرفه‌ای با عکس - نمایش در همان صفحه
 * فقط همین فایل - بقیه دست نخورده
 */
import { useEffect, useState } from "react";
import { dashboardApi } from "../services/dashboardApi";

function formatPrice(n: any) {
  const num = typeof n === "string" ? parseFloat(n) : n;
  return (isNaN(num) ? 0 : num).toLocaleString("en-US") + " تومان";
}

export default function VisitorOrdersSamePageImages() {
  const [report, setReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisitor, setSelectedVisitor] = useState<any>(null);
  const [visitorOrders, setVisitorOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await dashboardApi.owner.visitorReport();
      setReport(data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadReport(); }, []);

  const loadVisitorOrders = async (visitor: any) => {
    setSelectedVisitor(visitor);
    setOrdersLoading(true);
    try {
      const base = (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
      const token = JSON.parse(localStorage.getItem("novin_auth_tokens") || "{}")?.access;
      const headers: any = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${base}/dashboard/admin/visitor-orders-only/?visitor_id=${visitor.visitor_id}`, { headers });
      if (res.ok) {
        const data = await res.json();
        const orders = data.results ?? data;
        // اطمینان از داشتن عکس محصول
        const enriched = await Promise.all(
          orders.map(async (o: any) => {
            // اگر items عکس ندارد، از track بگیر
            if (!o.items || o.items.length === 0 || !o.items[0].product_image) {
              try {
                const trackRes = await fetch(`${base}/orders/track/${o.order_number}/`);
                if (trackRes.ok) {
                  const detail = await trackRes.json();
                  return { ...detail, visitor_name: visitor.visitor_name, visitor_username: visitor.visitor_username };
                }
              } catch {}
            }
            return { ...o, visitor_name: visitor.visitor_name, visitor_username: visitor.visitor_username };
          })
        );
        setVisitorOrders(enriched);
      } else {
        setVisitorOrders([]);
      }
    } catch {
      setVisitorOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] pt-28 pb-20" dir="rtl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-900 via-slate-900 to-stone-900 p-8 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]" />
          <div className="relative">
            <h1 className="text-3xl font-black">📦 سفارشات ویزیتورها با عکس - حرفه‌ای در همین صفحه</h1>
            <p className="mt-2 text-stone-400 text-sm">روی هر ویزیتور کلیک کنید، سفارشاتش با عکس محصولات همینجا نمایش داده می‌شود (نه در مودال جدا)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* لیست ویزیتورها */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="font-black text-sm">ویزیتورها ({report.length}) - کلیک کنید</h3>
            <div className="space-y-3 max-h-[800px] overflow-y-auto pr-1">
              {loading ? [1,2,3].map(i => <div key={i} className="h-24 bg-white rounded-2xl border animate-pulse" />) :
                report.map((v, idx) => (
                  <div key={v.visitor_id} onClick={() => loadVisitorOrders(v)} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg ${selectedVisitor?.visitor_id === v.visitor_id ? "bg-stone-900 border-stone-900 text-white shadow-xl" : "bg-white border-stone-200 hover:border-indigo-200"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-black ${selectedVisitor?.visitor_id === v.visitor_id ? "bg-white text-stone-900" : "bg-stone-900 text-white"}`}>{idx+1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black truncate">{v.visitor_name}</p>
                        <p className={`text-xs truncate ${selectedVisitor?.visitor_id === v.visitor_id ? "text-stone-400" : "text-stone-500"}`}>@{v.visitor_username} • {v.total_orders} سفارش</p>
                      </div>
                      <div className={`h-8 w-8 rounded-full grid place-items-center transition ${selectedVisitor?.visitor_id === v.visitor_id ? "bg-white text-stone-900 rotate-90" : "bg-stone-50 text-stone-400"}`}>→</div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* سفارشات همان صفحه با عکس - حرفه‌ای */}
          <div className="lg:col-span-8">
            {!selectedVisitor ? (
              <div className="h-full min-h-[500px] rounded-[2.5rem] bg-white border-2 border-dashed border-stone-200 flex flex-col items-center justify-center p-12 text-center">
                <div className="h-20 w-20 rounded-[1.5rem] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-3xl mb-4">👈</div>
                <h3 className="font-black text-lg">ویزیتور را انتخاب کنید</h3>
                <p className="text-sm text-stone-500 mt-2">سفارشات با عکس محصولات همینجا نمایش داده می‌شود</p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-[2rem] bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 text-white shadow-lg flex justify-between items-center">
                  <div>
                    <h3 className="font-black text-xl">📸 سفارشات {selectedVisitor.visitor_name} با عکس</h3>
                    <p className="text-sm text-indigo-100 mt-1">ویزیتور: <span className="font-mono font-black bg-white/20 px-2 py-1 rounded-full text-xs">{selectedVisitor.visitor_name} (@{selectedVisitor.visitor_username})</span></p>
                  </div>
                  <span className="bg-white text-indigo-700 px-4 py-2 rounded-full text-sm font-black">{visitorOrders.length} سفارش</span>
                </div>

                {ordersLoading ? (
                  <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-40 bg-white rounded-[2rem] border animate-pulse" />)}</div>
                ) : visitorOrders.length === 0 ? (
                  <div className="rounded-[2rem] bg-white border p-12 text-center">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="font-bold">این ویزیتور سفارشی ندارد</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {visitorOrders.map((order: any) => (
                      <div key={order.id || order.order_number} className="rounded-[2rem] bg-white border-2 border-stone-100 shadow-sm overflow-hidden hover:shadow-xl hover:border-indigo-100 hover:-translate-y-0.5 transition-all duration-500">
                        <div className="p-5 bg-gradient-to-r from-indigo-50 to-white border-b flex justify-between items-center">
                          <div>
                            <p className="font-mono font-black text-lg">{order.order_number}</p>
                            <p className="text-xs text-stone-500 mt-1">👤 {order.name} | 📞 {order.phone} | 📅 {order.created_at ? new Date(order.created_at).toLocaleDateString("fa-IR") : ""}</p>
                          </div>
                          <div className="text-left">
                            <p className="text-[10px] font-black tracking-widest text-stone-400">مبلغ</p>
                            <p className="font-black text-indigo-700">{formatPrice(order.total_amount || 0)}</p>
                          </div>
                        </div>

                        {/* عکس محصولات - حرفه‌ای در همان صفحه */}
                        <div className="p-6">
                          <h4 className="text-xs font-black tracking-widest text-stone-400 mb-3">🖼️ محصولات سفارش با عکس</h4>
                          <div className="grid gap-3">
                            {(order.items || []).map((item: any) => (
                              <div key={item.id} className="group flex gap-4 items-center bg-stone-50 border-2 border-stone-100 rounded-2xl p-4 hover:bg-white hover:border-indigo-200 hover:shadow-md transition-all">
                                <div className="relative">
                                  <img src={item.product_image || "/images/placeholder.jpg"} alt={item.product_name} className="h-20 w-20 rounded-2xl object-cover bg-white border-2 border-white shadow-lg group-hover:scale-105 transition-transform duration-500" />
                                  <div className="absolute -top-2 -right-2 h-7 w-7 bg-stone-900 text-white rounded-full flex items-center justify-center text-xs font-black shadow-lg">{item.quantity}</div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-black text-stone-900 truncate">{item.product_name}</h5>
                                  <p className="text-xs text-stone-500 mt-1">کد: {item.product || "—"} | قیمت واحد: {formatPrice(item.price)}</p>
                                  <div className="mt-2 flex gap-2">
                                    <span className="text-[11px] bg-white border px-2.5 py-1 rounded-full font-bold">تعداد: {item.quantity}</span>
                                    <span className="text-[11px] bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1 rounded-full font-bold">{item.product_image ? "با عکس" : "بدون عکس"}</span>
                                  </div>
                                </div>
                                <div className="text-left">
                                  <p className="text-[10px] font-black tracking-widest text-stone-400">جمع</p>
                                  <p className="font-black text-lg mt-1">{formatPrice(item.price * item.quantity)}</p>
                                  <p className="text-[11px] text-stone-500 mt-1">{item.quantity} × {formatPrice(item.price)}</p>
                                </div>
                              </div>
                            ))}
                            {(!order.items || order.items.length === 0) && (
                              <div className="text-center py-8 bg-stone-50 rounded-2xl border-2 border-dashed">
                                <p className="text-sm text-stone-500">جزئیات محصولات در دسترس نیست</p>
                                <p className="text-xs text-stone-400 mt-1">سفارش {order.order_number} توسط {selectedVisitor.visitor_name}</p>
                              </div>
                            )}
                          </div>

                          <div className="mt-6 rounded-2xl bg-stone-900 text-white p-4 flex justify-between items-center">
                            <span className="font-bold flex items-center gap-2">💰 مبلغ نهایی</span>
                            <span className="text-xl font-black text-amber-300">{formatPrice(order.total_amount)}</span>
                          </div>
                        </div>

                        <div className="px-6 py-3 bg-stone-50 border-t flex justify-between items-center text-xs">
                          <span>👤 ثبت توسط: <span className="font-black text-indigo-700">{order.visitor_name || selectedVisitor.visitor_name}</span></span>
                          <span className="font-mono text-stone-500">{order.order_number}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
