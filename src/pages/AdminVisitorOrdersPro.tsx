// @ts-nocheck
/**
 * VisitorOrders لوکس - فقط همین بخش
 * - حرفه‌ای‌تر و لوکس‌تر
 * - تصویر محصول در سفارش ویزیتور
 * - با کلیک روی سفارش، تمام اطلاعات + توضیحات نمایش داده می‌شود
 * به بقیه سایت دست نمی‌زند
 */
import { useEffect, useState } from "react";
import { dashboardApi } from "../services/dashboardApi";

function formatPrice(n: any) {
  const num = typeof n === "string" ? parseFloat(n) : n;
  return (isNaN(num) ? 0 : num).toLocaleString("en-US") + " تومان";
}

export default function VisitorOrdersLuxuryPro() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed">("all");

  const load = async () => {
    setLoading(true);
    try {
      const data = await dashboardApi.admin.pendingOrders();
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = orders.filter((o: any) => {
    if (filter === "pending") return o.order_status === "PENDING";
    if (filter === "confirmed") return o.order_status === "CONFIRMED";
    return true;
  });

  const handleAction = async (orderId: number, action: "confirm" | "reject") => {
    try {
      await dashboardApi.admin.pendingAction(orderId, action);
      setSelectedOrder(null);
      load();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* هدر لوکس */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-amber-600 via-gold-600 to-amber-700 p-8 text-white shadow-[0_20px_60px_rgba(245,158,11,0.3)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[size:32px_32px] opacity-30" />
        
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-black/20 backdrop-blur-xl border border-white/20 px-4 py-2 text-xs font-black tracking-widest">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            سفارشات ثبت شده توسط ویزیتورها - نسخه لوکس
          </div>
          <h1 className="mt-5 font-display text-3xl md:text-4xl font-black leading-tight">
            سفارشات ویزیتورها
            <br />
            <span className="text-amber-100">با عکس محصولات</span>
          </h1>
          <p className="mt-3 text-amber-100/80 text-sm max-w-2xl leading-relaxed">
            با کلیک روی هر سفارش، تمام اطلاعات شامل توضیحات، آدرس، عکس محصولات و جزئیات کامل نمایش داده می‌شود
          </p>
          
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="rounded-2xl bg-black/20 backdrop-blur-xl border border-white/10 px-5 py-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white text-amber-700 flex items-center justify-center font-black">📦</div>
              <div>
                <p className="text-[10px] tracking-widest font-black opacity-70">کل سفارشات</p>
                <p className="text-xl font-black">{orders.length}</p>
              </div>
            </div>
            <div className="rounded-2xl bg-white text-stone-900 px-5 py-3 shadow-xl">
              <p className="text-[10px] tracking-widest font-black text-stone-400">در انتظار تایید شما</p>
              <p className="text-xl font-black">{orders.filter((o: any) => o.order_status === "PENDING").length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* فیلتر */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 p-1.5 bg-stone-900 rounded-2xl border border-white/10 shadow-xl">
          {[
            { id: "all", label: `همه (${orders.length})`, icon: "📦" },
            { id: "pending", label: `در انتظار (${orders.filter((o: any) => o.order_status === "PENDING").length})`, icon: "⏳" },
            { id: "confirmed", label: "تایید شده", icon: "✅" },
          ].map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id as any)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all ${filter === f.id ? "bg-white text-stone-900 shadow-lg" : "text-stone-400 hover:text-white hover:bg-white/10"}`}>
              <span>{f.icon}</span>{f.label}
            </button>
          ))}
        </div>
        <button onClick={load} className="px-5 py-2.5 bg-white border-2 border-stone-200 rounded-xl text-sm font-bold hover:bg-stone-50 shadow-sm">🔄 رفرش</button>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1,2,3].map(i => <div key={i} className="h-36 bg-white rounded-[2rem] border animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[2.5rem] bg-white border-2 border-dashed border-stone-200 p-20 text-center shadow-sm">
          <div className="h-24 w-24 mx-auto rounded-[1.5rem] bg-gradient-to-br from-amber-100 to-gold-100 border border-amber-200 flex items-center justify-center text-4xl mb-6">📭</div>
          <h3 className="text-xl font-black">سفارش ویزیتوری در انتظار نیست</h3>
          <p className="text-sm text-stone-500 mt-2">وقتی ویزیتورها در محل سفارش ثبت کنند اینجا با عکس محصولات نمایش داده می‌شود</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filtered.map((order: any) => (
            <div key={order.id} onClick={() => setSelectedOrder(order)} className="group relative overflow-hidden rounded-[2rem] bg-white border-2 border-stone-100 shadow-sm hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)] hover:border-amber-200 hover:-translate-y-1.5 transition-all duration-700 cursor-pointer">
              {/* افکت هاور طلایی */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-amber-50 via-gold-50/50 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 -translate-y-1/2 translate-x-1/3" />
              
              <div className="relative p-7">
                <div className="flex flex-col lg:flex-row justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-2 rounded-full bg-stone-900 text-white px-4 py-1.5 text-xs font-black shadow-lg">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        {order.order_number}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-[11px] font-black border-2 ${order.order_status === "PENDING" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                        {order.order_status === "PENDING" ? "⏳ در انتظار تایید شما" : order.order_status}
                      </span>
                      <span className="text-[11px] bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full font-bold">ویزیتور</span>
                    </div>

                    <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="group/card relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-50 to-white border-2 border-stone-100 p-4 hover:border-stone-200 hover:shadow-md transition-all">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-stone-100 rounded-full blur-xl group-hover/card:bg-stone-200 transition" />
                        <p className="relative text-[10px] font-black tracking-[0.2em] text-stone-400">مشتری</p>
                        <p className="relative font-black text-stone-900 mt-2 flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-900 text-white text-xs">👤</span>
                          {order.name}
                        </p>
                        <p className="relative text-xs text-stone-500 mt-2 flex items-center gap-1.5">📞 <span dir="ltr" className="font-mono font-bold">{order.phone}</span></p>
                      </div>

                      <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-gold-50 border-2 border-amber-100 p-4">
                        <p className="text-[10px] font-black tracking-widest text-amber-700">مبلغ کل</p>
                        <p className="font-black text-xl text-amber-800 mt-1">{formatPrice(order.total_amount)}</p>
                        <p className="text-[11px] text-amber-700/70 mt-1">{order.items?.length || 0} قلم کالا • کلیک برای جزئیات + عکس</p>
                      </div>

                      <div className="rounded-2xl bg-stone-50 border-2 border-stone-100 p-4">
                        <p className="text-[10px] font-black tracking-widest text-stone-400">تاریخ ثبت</p>
                        <p className="text-sm font-bold mt-1">{order.created_at ? new Date(order.created_at).toLocaleDateString("fa-IR") : ""}</p>
                        <p className="text-[11px] text-stone-500 mt-1">⏰ {order.created_at ? new Date(order.created_at).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }) : ""}</p>
                      </div>
                    </div>

                    {order.items && order.items.length > 0 && (
                      <div className="mt-5">
                        <p className="text-[11px] font-black tracking-widest text-stone-400 mb-3 flex items-center gap-2">
                          <span>🖼️</span> پیش‌نمایش محصولات ({order.items.length} قلم) - برای دیدن همه کلیک کنید
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-3 space-x-reverse">
                            {order.items.slice(0, 5).map((item: any, idx: number) => (
                              <div key={idx} className="relative group/img">
                                <img src={item.product_image || "/images/placeholder.jpg"} alt={item.product_name} className="h-14 w-14 rounded-2xl object-cover border-3 border-white shadow-lg group-hover/img:scale-110 group-hover/img:z-10 transition-all duration-500" style={{ zIndex: 5 - idx }} />
                                <div className="absolute -top-1 -right-1 h-5 w-5 bg-stone-900 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-lg border-2 border-white">{item.quantity}</div>
                              </div>
                            ))}
                            {order.items.length > 5 && (
                              <div className="h-14 w-14 rounded-2xl bg-stone-900 text-white border-3 border-white shadow-lg flex items-center justify-center text-xs font-black">
                                +{order.items.length - 5}
                              </div>
                            )}
                          </div>
                          <div className="mr-auto hidden md:flex items-center gap-2 text-xs font-bold text-stone-500 bg-stone-50 border px-3 py-2 rounded-full">
                            <span>👁️</span> کلیک برای مشاهده تمام اطلاعات + عکس‌ها + توضیحات
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex lg:flex-col gap-2 self-start">
                    <div className="hidden lg:flex h-14 w-14 rounded-2xl bg-gradient-to-br from-stone-900 to-stone-800 text-white items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all">
                      <span className="text-xl">👁️</span>
                    </div>
                    <div className="lg:hidden flex items-center gap-2 text-xs font-black text-amber-700 bg-amber-50 border-2 border-amber-200 px-4 py-2 rounded-full">
                      <span>👁️</span> جزئیات + عکس محصولات
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* مودال جزئیات لوکس با عکس - تمام اطلاعات سفارش */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/80 backdrop-blur-xl p-4 overflow-y-auto" onClick={() => setSelectedOrder(null)}>
          <div className="w-full max-w-5xl bg-white rounded-[2.5rem] shadow-[0_25px_100px_rgba(0,0,0,0.5)] overflow-hidden my-8 animate-in zoom-in-95 duration-500" onClick={(e) => e.stopPropagation()}>
            {/* هدر مودال لوکس */}
            <div className="relative bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 p-8 md:p-10 text-white overflow-hidden">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-amber-500/20 via-gold-500/10 to-transparent rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-paprika-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] bg-[size:32px_32px] opacity-30" />
              
              <div className="relative">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 px-4 py-2 text-xs font-black tracking-widest">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      جزئیات کامل سفارش ویزیتور - با عکس محصولات
                    </div>
                    <h2 className="mt-5 font-mono text-3xl md:text-4xl font-black tracking-tight">{selectedOrder.order_number}</h2>
                    <p className="mt-3 text-stone-300 text-sm leading-relaxed max-w-2xl">
                      سفارشی که توسط ویزیتور در محل مشتری ثبت شده - تمام اطلاعات شامل توضیحات، آدرس، عکس محصولات و جمع کل
                    </p>
                  </div>
                  <button onClick={() => setSelectedOrder(null)} className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 grid place-items-center text-white transition hover:rotate-90 duration-300">✕</button>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-[1.5rem] bg-white/10 backdrop-blur-xl border border-white/20 p-5">
                    <p className="text-[10px] tracking-[0.2em] font-black text-stone-400">مشتری</p>
                    <p className="font-black text-lg mt-2 flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-stone-900 text-sm">👤</span>{selectedOrder.name}</p>
                    <p className="text-sm text-stone-300 mt-2 flex items-center gap-2">📞 <span dir="ltr" className="font-mono font-bold">{selectedOrder.phone}</span></p>
                    <p className="text-xs text-stone-400 mt-3 leading-relaxed bg-black/20 rounded-xl p-3 border border-white/5">📍 {selectedOrder.address || "بدون آدرس"}</p>
                  </div>
                  <div className="rounded-[1.5rem] bg-gradient-to-br from-amber-500 to-gold-600 p-5 text-stone-900 shadow-xl shadow-amber-600/20">
                    <p className="text-[10px] tracking-[0.2em] font-black opacity-70">مبلغ نهایی</p>
                    <p className="font-black text-2xl mt-2">{formatPrice(selectedOrder.total_amount)}</p>
                    <p className="text-xs opacity-80 mt-1">{selectedOrder.items?.length || 0} قلم کالا • {selectedOrder.items?.reduce((s: number, i: any) => s + i.quantity, 0) || 0} عدد کل</p>
                    <div className="mt-3 flex gap-2">
                      <span className="bg-stone-900 text-gold-400 px-3 py-1 rounded-full text-[10px] font-black">💰 قابل پرداخت</span>
                      <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold border border-white/20">{selectedOrder.order_status}</span>
                    </div>
                  </div>
                  <div className="rounded-[1.5rem] bg-white/10 backdrop-blur-xl border border-white/10 p-5">
                    <p className="text-[10px] tracking-[0.2em] font-black text-stone-400">زمان ثبت</p>
                    <p className="font-bold mt-2">{selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleDateString("fa-IR") : ""}</p>
                    <p className="text-xs text-stone-400 mt-1">{selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }) : ""}</p>
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-[10px] font-black tracking-widest text-stone-400">شناسه سفارش</p>
                      <p className="font-mono text-xs mt-1 text-stone-300">#{selectedOrder.id} • {selectedOrder.order_number}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-10 space-y-8 max-h-[65vh] overflow-y-auto bg-[#faf8f5]">
              {/* توضیحات سفارش */}
              {(selectedOrder.message || selectedOrder.address) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-[1.5rem] bg-white border-2 border-stone-100 p-6 shadow-sm">
                    <h4 className="font-black text-sm flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-100">📍</span>آدرس کامل تحویل</h4>
                    <p className="mt-3 text-sm leading-loose text-stone-700 bg-stone-50 p-4 rounded-xl border">{selectedOrder.address || "بدون آدرس"}</p>
                  </div>
                  <div className="rounded-[1.5rem] bg-amber-50 border-2 border-amber-100 p-6">
                    <h4 className="font-black text-sm flex items-center gap-2 text-amber-800"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 border border-amber-200">📝</span>توضیحات و یادداشت سفارش</h4>
                    <p className="mt-3 text-sm leading-loose text-stone-700 bg-white p-4 rounded-xl border border-amber-100 shadow-sm">{selectedOrder.message || "بدون توضیحات"}</p>
                  </div>
                </div>
              )}

              {/* محصولات با عکس - حرفه‌ای */}
              <div>
                <h3 className="font-black text-xl flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-900 text-white shadow-lg">🖼️</span>
                  محصولات سفارش - با عکس واقعی
                  <span className="mr-auto bg-stone-900 text-white px-4 py-1.5 rounded-full text-xs font-black">{selectedOrder.items?.length || 0} قلم</span>
                </h3>

                <div className="mt-6 grid gap-4">
                  {(selectedOrder.items || []).map((item: any) => (
                    <div key={item.id} className="group relative overflow-hidden rounded-[1.8rem] bg-white border-2 border-stone-100 p-5 hover:border-amber-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-500">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-50 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition" />
                      <div className="relative flex gap-5 items-center">
                        <div className="relative">
                          <img src={item.product_image || "/images/placeholder.jpg"} alt={item.product_name} className="h-24 w-24 rounded-2xl object-cover bg-stone-50 border-2 border-white shadow-lg group-hover:scale-105 group-hover:shadow-xl transition-all duration-700" />
                          <div className="absolute -top-2 -right-2 h-8 w-8 bg-stone-900 text-white rounded-full flex items-center justify-center text-xs font-black shadow-lg border-2 border-white">{item.quantity}</div>
                          <div className="absolute -bottom-2 -left-2 bg-emerald-500 text-white px-2.5 py-1 rounded-full text-[10px] font-black shadow-lg">موجود</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-stone-900 text-base md:text-lg truncate">{item.product_name}</h4>
                          <p className="text-xs text-stone-500 mt-1.5 flex items-center gap-2">
                            <span className="bg-stone-100 border px-2.5 py-1 rounded-full">کد: {item.product || "—"}</span>
                            <span className="bg-stone-50 border px-2.5 py-1 rounded-full">واحد: {item.product_image ? "بسته بندی" : "عدد"}</span>
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1.5 text-xs bg-stone-900 text-white px-3 py-1.5 rounded-full font-bold shadow">
                              <span>🔢</span> تعداد: {item.quantity}
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-xs bg-white border-2 border-stone-200 px-3 py-1.5 rounded-full font-bold">
                              💲 قیمت واحد: {formatPrice(item.price)}
                            </span>
                            {item.product_image && <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-black">🖼️ با عکس</span>}
                          </div>
                        </div>
                        <div className="text-left min-w-[120px]">
                          <p className="text-[10px] font-black tracking-[0.2em] text-stone-400">جمع جزئی</p>
                          <p className="font-black text-xl mt-1 text-stone-900">{formatPrice(item.price * item.quantity)}</p>
                          <p className="text-[11px] text-stone-500 mt-1 font-mono">{item.quantity} × {formatPrice(item.price)}</p>
                          <div className="mt-2 h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                            <div className="h-1.5 bg-gradient-to-r from-amber-500 to-gold-600 rounded-full" style={{ width: "100%" }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                    <div className="text-center py-16 bg-white rounded-[2rem] border-2 border-dashed border-stone-200">
                      <div className="text-5xl mb-4">📦</div>
                      <p className="font-bold">جزئیات محصولات موجود نیست</p>
                      <p className="text-xs text-stone-500 mt-1">سفارش {selectedOrder.order_number}</p>
                    </div>
                  )}
                </div>

                <div className="mt-8 rounded-[2rem] bg-stone-900 text-white p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-4 shadow-2xl">
                  <div>
                    <p className="text-[11px] tracking-[0.2em] font-black text-stone-400">مبلغ نهایی قابل پرداخت</p>
                    <p className="text-xs text-stone-500 mt-1">شامل {selectedOrder.items?.length || 0} قلم کالا • {selectedOrder.items?.reduce((s: number, i: any) => s + i.quantity, 0) || 0} عدد کل</p>
                  </div>
                  <div className="text-left">
                    <p className="text-3xl font-black text-amber-300">{formatPrice(selectedOrder.total_amount)}</p>
                    <p className="text-[11px] text-stone-400 mt-1 text-right">پرداخت درب منزل / آنلاین</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white/80 backdrop-blur-xl border-t p-6 flex gap-3">
              <button onClick={() => handleAction(selectedOrder.id, "confirm")} className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-4 rounded-2xl font-black shadow-lg shadow-emerald-600/20 hover:from-emerald-500 hover:to-emerald-600 transition flex items-center justify-center gap-2">
                <span>✅</span> تایید نهایی سفارش ویزیتور
              </button>
              <button onClick={() => handleAction(selectedOrder.id, "reject")} className="flex-1 bg-white border-2 border-red-200 text-red-600 py-4 rounded-2xl font-black hover:bg-red-50 transition">❌ رد سفارش</button>
              <button onClick={() => setSelectedOrder(null)} className="px-8 py-4 bg-stone-100 hover:bg-stone-200 border-2 border-stone-200 rounded-2xl font-bold transition">بستن</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
