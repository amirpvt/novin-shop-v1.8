// @ts-nocheck
/**
 * AdminVisitorOrdersPro.tsx - بخش سفارشات ویزیتورها حرفه‌ای
 * فقط همین بخش - با کلیک روی سفارش، جزئیات با عکس محصولات
 * به بقیه سایت دست نمی‌زند
 */
import { useEffect, useState } from "react";
import { dashboardApi } from "../../services/dashboardApi";

function formatPrice(n: any) {
  const num = typeof n === "string" ? parseFloat(n) : n;
  return (isNaN(num) ? 0 : num).toLocaleString("en-US") + " تومان";
}

export default function AdminVisitorOrdersPro() {
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

  const handleAction = async (orderId: number, action: "confirm" | "reject") => {
    try {
      await dashboardApi.admin.pendingAction(orderId, action);
      alert(action === "confirm" ? "✅ سفارش تایید شد - موجودی کم شد" : "❌ سفارش رد شد");
      setSelectedOrder(null);
      load();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const filtered = orders.filter((o: any) => {
    if (filter === "pending") return o.order_status === "PENDING";
    if (filter === "confirmed") return o.order_status === "CONFIRMED";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* هدر حرفه‌ای */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-amber-600 via-gold-600 to-amber-700 p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur border border-white/20 px-4 py-1.5 text-xs font-black tracking-widest">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            سفارشات ثبت شده توسط ویزیتورها - نیاز به تایید شما
          </div>
          <h1 className="mt-5 font-display text-3xl md:text-4xl font-black">📝 سفارشات ویزیتورها</h1>
          <p className="mt-3 text-amber-100/80 text-sm max-w-2xl leading-relaxed">
            اینجا سفارشاتی که ویزیتورها در محل مشتری ثبت کرده‌اند نمایش داده می‌شود. با کلیک روی هر سفارش، جزئیات کامل با عکس محصولات را ببینید و تایید یا رد کنید.
          </p>
          <div className="mt-6 flex gap-3">
            <div className="rounded-full bg-white/20 backdrop-blur border border-white/20 px-4 py-2 text-xs font-bold">📦 {orders.length} سفارش در انتظار</div>
            <div className="rounded-full bg-black/20 backdrop-blur border border-white/10 px-4 py-2 text-xs font-bold">👁️ کلیک برای جزئیات + عکس</div>
          </div>
        </div>
      </div>

      {/* فیلتر */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: "all", label: `همه (${orders.length})` },
          { id: "pending", label: "در انتظار تایید" },
          { id: "confirmed", label: "تایید شده" },
        ].map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id as any)} className={`px-5 py-2.5 rounded-xl text-sm font-black transition ${filter === f.id ? "bg-stone-900 text-white shadow" : "bg-white border text-stone-600 hover:bg-stone-50"}`}>
            {f.label}
          </button>
        ))}
        <button onClick={load} className="mr-auto px-5 py-2.5 bg-white border rounded-xl text-sm font-bold hover:bg-stone-50">🔄 رفرش</button>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-white rounded-[2rem] border animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[2.5rem] bg-white border p-16 text-center shadow-sm">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-black">سفارش ویزیتوری در انتظار نیست</h3>
          <p className="text-sm text-stone-500 mt-2">وقتی ویزیتورها سفارش ثبت کنند اینجا می‌آید</p>
        </div>
      ) : (
        <div className="grid gap-5">
          {filtered.map((order: any) => (
            <div key={order.id} onClick={() => setSelectedOrder(order)} className="group relative overflow-hidden rounded-[2rem] bg-white border border-stone-200 shadow-sm hover:shadow-2xl hover:border-amber-200 hover:-translate-y-1 transition-all duration-500 cursor-pointer">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-50 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition" />
              
              <div className="relative p-6 md:p-7">
                <div className="flex flex-col lg:flex-row justify-between gap-5">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-lg">{order.order_number}</span>
                      <span className={`px-3 py-1 rounded-full text-[11px] font-black border ${order.order_status === "PENDING" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                        {order.order_status === "PENDING" ? "⏳ در انتظار تایید شما" : order.order_status}
                      </span>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-stone-50 rounded-2xl p-3 border">
                        <p className="text-[10px] font-black tracking-widest text-stone-400">مشتری</p>
                        <p className="font-bold text-sm mt-1">{order.name}</p>
                        <p className="text-xs text-stone-500 mt-1">📞 {order.phone}</p>
                      </div>
                      <div className="bg-stone-50 rounded-2xl p-3 border">
                        <p className="text-[10px] font-black tracking-widest text-stone-400">آدرس</p>
                        <p className="text-xs mt-1 leading-relaxed line-clamp-2">{order.address || "بدون آدرس"}</p>
                      </div>
                      <div className="bg-amber-50 rounded-2xl p-3 border border-amber-100">
                        <p className="text-[10px] font-black tracking-widest text-amber-700">مبلغ</p>
                        <p className="font-black text-amber-800 mt-1">{formatPrice(order.total_amount)}</p>
                        <p className="text-[11px] text-stone-500 mt-1">{order.items?.length || 0} قلم کالا</p>
                      </div>
                    </div>

                    {order.items && order.items.length > 0 && (
                      <div className="mt-4 flex items-center gap-2">
                        <div className="flex -space-x-2 space-x-reverse">
                          {order.items.slice(0, 4).map((item: any, idx: number) => (
                            <img key={idx} src={item.product_image || "/images/placeholder.jpg"} alt={item.product_name} className="h-9 w-9 rounded-full object-cover border-2 border-white shadow-sm" />
                          ))}
                          {order.items.length > 4 && (
                            <div className="h-9 w-9 rounded-full bg-stone-900 text-white border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-black">
                              +{order.items.length - 4}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-stone-500">برای دیدن عکس محصولات کلیک کنید</span>
                      </div>
                    )}
                  </div>

                  <div className="flex lg:flex-col gap-2 self-start">
                    <div className="hidden lg:flex h-12 w-12 rounded-2xl bg-stone-50 border items-center justify-center group-hover:bg-amber-50 group-hover:border-amber-200 transition">
                      <span className="text-xl">👁️</span>
                    </div>
                    <span className="lg:hidden text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">کلیک برای جزئیات + عکس</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* مودال جزئیات حرفه‌ای با عکس */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => setSelectedOrder(null)}>
          <div className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-[0_25px_80px_rgba(0,0,0,0.4)] overflow-hidden my-8 animate-in zoom-in" onClick={(e) => e.stopPropagation()}>
            {/* هدر مودال */}
            <div className="relative bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 p-8 text-white overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
              <div className="relative">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/10 px-3 py-1 text-[11px] font-black tracking-widest">
                      جزئیات کامل سفارش ویزیتور
                    </div>
                    <h2 className="mt-4 font-mono text-2xl md:text-3xl font-black">{selectedOrder.order_number}</h2>
                    <p className="mt-2 text-stone-300 text-sm">ثبت شده توسط ویزیتور - نیاز به تایید نهایی شما</p>
                  </div>
                  <button onClick={() => setSelectedOrder(null)} className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur border border-white/10 grid place-items-center">✕</button>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                    <p className="text-[10px] tracking-widest font-black text-stone-400">مشتری</p>
                    <p className="font-black mt-1">{selectedOrder.name}</p>
                    <p className="text-xs text-stone-300 mt-1">{selectedOrder.phone}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 backdrop-blur border border-white/10 p-4 text-center">
                    <p className="text-[10px] tracking-widest font-black text-stone-400">مبلغ کل</p>
                    <p className="font-black mt-1 text-amber-300">{formatPrice(selectedOrder.total_amount)}</p>
                    <p className="text-xs text-stone-400 mt-1">{selectedOrder.items?.length || 0} قلم</p>
                  </div>
                  <div className="rounded-2xl bg-emerald-500/20 backdrop-blur border border-emerald-500/30 p-4 text-center">
                    <p className="text-[10px] tracking-widest font-black text-emerald-300">وضعیت</p>
                    <p className="font-black mt-1 text-emerald-200">{selectedOrder.order_status === "PENDING" ? "در انتظار تایید" : selectedOrder.order_status}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* آدرس */}
              <div className="rounded-2xl bg-stone-50 border p-4">
                <p className="text-[11px] font-black tracking-widest text-stone-400">📍 آدرس تحویل</p>
                <p className="text-sm mt-2 leading-relaxed">{selectedOrder.address || "بدون آدرس"}</p>
                {selectedOrder.message && (
                  <>
                    <p className="text-[11px] font-black tracking-widest text-stone-400 mt-4">📝 توضیحات مشتری</p>
                    <p className="text-sm mt-2 bg-amber-50 border border-amber-100 p-3 rounded-xl">{selectedOrder.message}</p>
                  </>
                )}
              </div>

              {/* محصولات با عکس - حرفه‌ای */}
              <div>
                <h3 className="font-black text-lg flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-900 text-white text-sm">📦</span>
                  محصولات سفارش ({selectedOrder.items?.length || 0} قلم) - با عکس
                </h3>

                <div className="mt-4 grid gap-3">
                  {(selectedOrder.items || []).map((item: any) => (
                    <div key={item.id} className="group flex gap-4 items-center bg-white border-2 border-stone-100 rounded-[1.5rem] p-4 hover:border-amber-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                      <div className="relative">
                        <img src={item.product_image || "/images/placeholder.jpg"} alt={item.product_name} className="h-20 w-20 rounded-2xl object-cover bg-stone-50 border shadow-sm group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute -top-2 -right-2 h-7 w-7 bg-stone-900 text-white rounded-full flex items-center justify-center text-[11px] font-black shadow-lg">
                          {item.quantity}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-stone-900 truncate">{item.product_name}</h4>
                        <p className="text-xs text-stone-500 mt-1">کد محصول: {item.product || "—"} | قیمت واحد: {formatPrice(item.price)}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs bg-stone-100 border px-2.5 py-1 rounded-full font-bold">تعداد: {item.quantity}</span>
                          <span className="text-xs bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1 rounded-full font-bold">واحد: {item.product_image ? "بسته بندی" : "عدد"}</span>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-black tracking-widest text-stone-400">جمع جزئی</p>
                        <p className="font-black text-lg mt-1">{formatPrice(item.price * item.quantity)}</p>
                        <p className="text-[11px] text-stone-400 mt-1">{item.quantity} × {formatPrice(item.price)}</p>
                      </div>
                    </div>
                  ))}

                  {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                    <div className="text-center py-12 bg-stone-50 rounded-2xl border border-dashed">
                      <p className="text-stone-400">جزئیات محصولات موجود نیست</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 rounded-2xl bg-stone-900 text-white p-5 flex justify-between items-center">
                  <span className="font-bold">💰 مبلغ قابل پرداخت</span>
                  <span className="text-2xl font-black text-amber-300">{formatPrice(selectedOrder.total_amount)}</span>
                </div>
              </div>
            </div>

            {/* دکمه‌های تایید */}
            <div className="p-6 border-t bg-stone-50 flex gap-3">
              <button onClick={() => handleAction(selectedOrder.id, "confirm")} className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-4 rounded-2xl font-black shadow-lg shadow-emerald-600/20 hover:from-emerald-500 hover:to-emerald-600 transition flex items-center justify-center gap-2">
                <span>✅</span> تایید نهایی سفارش ویزیتور
              </button>
              <button onClick={() => handleAction(selectedOrder.id, "reject")} className="flex-1 bg-white border-2 border-red-200 text-red-600 py-4 rounded-2xl font-black hover:bg-red-50 transition">
                ❌ رد سفارش
              </button>
              <button onClick={() => setSelectedOrder(null)} className="px-8 py-4 bg-white border border-stone-200 rounded-2xl font-bold hover:bg-stone-50">بستن</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
