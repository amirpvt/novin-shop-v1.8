// @ts-nocheck
/**
 * AdminStoreDashboard.tsx - پنل ادمین فروشگاه کامل و اصلاح شده
 * - ثبت سفارش جدید با انتخاب جزئی/عمده (قیمت خودکار)
 * - سفارشات ثبت شده توسط ویزیتورها - حرفه‌ای با عکس و کلیک برای جزئیات
 * - موجودی انبار حرفه‌ای
 * به بقیه سایت دست نمی‌زند
 */
import { useEffect, useState } from "react";
import { dashboardApi } from "../services/dashboardApi";

function formatPrice(n: any) {
  const num = typeof n === "string" ? parseFloat(n) : n;
  return (isNaN(num) ? 0 : num).toLocaleString("en-US") + " تومان";
}

export default function AdminStoreDashboard() {
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [stock, setStock] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderForm, setOrderForm] = useState({
    customer_id: "",
    sale_type: "retail" as "retail" | "wholesale",
    address: "",
    items: [{ product_id: "", quantity: 1 }] as { product_id: string; quantity: number }[],
  });

  const loadPending = async () => {
    setLoading(true);
    try {
      const data = await dashboardApi.admin.pendingOrders();
      setPendingOrders(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadStock = async () => {
    try {
      const data = await dashboardApi.admin.stock(20);
      setStock(data);
    } catch {}
  };

  useEffect(() => {
    loadPending();
    loadStock();
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        customer_id: parseInt(orderForm.customer_id),
        sale_type: orderForm.sale_type,
        address: orderForm.address,
        items: orderForm.items.map((it) => ({ product_id: parseInt(it.product_id), quantity: parseInt(String(it.quantity)) })),
      };
      const res = await dashboardApi.admin.orderCreate(payload);
      alert(`✅ سفارش ثبت شد: ${res.order_number} با قیمت ${orderForm.sale_type === "wholesale" ? "عمده" : "جزئی"}`);
      setOrderForm({ customer_id: "", sale_type: "retail", address: "", items: [{ product_id: "", quantity: 1 }] });
      loadPending();
    } catch (err: any) {
      alert("❌ " + err.message);
    }
  };

  const handleConfirm = async (order_id: number, action: "confirm" | "reject") => {
    try {
      await dashboardApi.admin.pendingAction(order_id, action);
      alert(action === "confirm" ? "✅ تایید شد" : "❌ رد شد");
      setSelectedOrder(null);
      loadPending();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] pt-28 pb-20" dir="rtl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-8">
        {/* هدر */}
        <div className="rounded-[2.5rem] bg-stone-900 p-8 text-white flex flex-col lg:flex-row justify-between gap-6 shadow-2xl">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold border border-white/10">🛡️ پنل ادمین فروشگاه</div>
            <h1 className="mt-4 text-3xl font-black">مدیریت فروش و سفارشات</h1>
            <p className="mt-2 text-stone-400 text-sm">ثبت سفارش جدید با انتخاب جزئی/عمده، تایید سفارشات ویزیتورها، موجودی انبار</p>
          </div>
          <button onClick={() => window.location.reload()} className="self-start rounded-2xl bg-white/10 px-6 py-3 text-sm font-bold hover:bg-white/15">🔄 رفرش همه</button>
        </div>

        {/* ثبت سفارش جدید */}
        <div className="bg-white rounded-[2rem] border p-6 md:p-8 shadow-sm">
          <h3 className="font-black text-lg flex items-center gap-2">➕ ثبت سفارش جدید برای مشتری</h3>
          <p className="text-xs text-stone-500 mt-1">نوع فروش جزئی یا عمده را انتخاب کنید - قیمت خودکار تغییر می‌کند</p>
          
          <form onSubmit={handleCreateOrder} className="mt-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-black mb-1.5">ID مشتری *</label>
                <input required value={orderForm.customer_id} onChange={(e) => setOrderForm({ ...orderForm, customer_id: e.target.value })} placeholder="مثلا 2" type="number" className="w-full rounded-xl border-2 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-amber-500 font-mono" />
              </div>
              <div>
                <label className="block text-xs font-black mb-1.5">نوع فروش *</label>
                <select value={orderForm.sale_type} onChange={(e) => setOrderForm({ ...orderForm, sale_type: e.target.value as any })} className="w-full rounded-xl border-2 bg-amber-50 border-amber-200 px-4 py-3 text-sm font-black text-amber-800 outline-none focus:border-amber-500">
                  <option value="retail">جزئی (قیمت پایه)</option>
                  <option value="wholesale">عمده (قیمت عمده - فقط مشتری تایید شده)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 text-stone-600">آدرس (اختیاری)</label>
                <input value={orderForm.address} onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })} placeholder="آدرس تحویل" className="w-full rounded-xl border bg-stone-50 px-4 py-3 text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black mb-2">محصولات:</label>
              <div className="space-y-3">
                {orderForm.items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-stone-50 p-3 rounded-2xl border">
                    <input required value={item.product_id} onChange={(e) => { const arr = [...orderForm.items]; arr[idx].product_id = e.target.value; setOrderForm({ ...orderForm, items: arr }); }} placeholder="ID محصول" type="number" className="flex-1 rounded-xl border bg-white px-3 py-2.5 text-sm font-mono" />
                    <input required value={item.quantity} onChange={(e) => { const arr = [...orderForm.items]; arr[idx].quantity = parseInt(e.target.value) || 1; setOrderForm({ ...orderForm, items: arr }); }} placeholder="تعداد" type="number" min="1" className="w-24 rounded-xl border bg-white px-3 py-2.5 text-sm font-mono" dir="ltr" />
                    <button type="button" onClick={() => setOrderForm({ ...orderForm, items: orderForm.items.filter((_, i) => i !== idx) })} className="px-3 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100">حذف</button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setOrderForm({ ...orderForm, items: [...orderForm.items, { product_id: "", quantity: 1 }] })} className="mt-3 text-xs bg-stone-900 text-white px-4 py-2 rounded-full font-bold hover:bg-black">+ افزودن محصول</button>
            </div>

            <button type="submit" className="w-full bg-stone-900 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-black transition flex items-center justify-center gap-2">
              <span>📦</span> ثبت سفارش با قیمت {orderForm.sale_type === "wholesale" ? "عمده" : "جزئی"}
            </button>
          </form>
        </div>

        {/* سفارشات ویزیتورها - حرفه‌ای با عکس و کلیک */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black flex items-center gap-2">📝 سفارشات ثبت شده توسط ویزیتورها</h2>
              <p className="text-sm text-stone-500 mt-1">با کلیک روی هر سفارش، جزئیات کامل با عکس محصولات را ببینید و تایید یا رد کنید</p>
            </div>
            <div className="flex gap-2 self-start">
              <div className="rounded-full bg-amber-100 text-amber-700 border border-amber-200 px-4 py-2 text-xs font-black">⏳ در انتظار تایید: {pendingOrders.length}</div>
              <button onClick={loadPending} className="px-4 py-2 bg-white border rounded-xl text-xs font-bold hover:bg-stone-50">🔄 رفرش</button>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4">
              {[1,2,3].map(i => <div key={i} className="h-32 bg-white rounded-[2rem] border animate-pulse" />)}
            </div>
          ) : pendingOrders.length === 0 ? (
            <div className="rounded-[2.5rem] bg-white border p-16 text-center shadow-sm">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-black">سفارش ویزیتوری در انتظار نیست</h3>
              <p className="text-sm text-stone-500 mt-2">وقتی ویزیتورها در محل سفارش ثبت کنند اینجا می‌آید</p>
            </div>
          ) : (
            <div className="grid gap-5">
              {pendingOrders.map((order: any) => (
                <div key={order.id} onClick={() => setSelectedOrder(order)} className="group relative overflow-hidden rounded-[2rem] bg-white border border-stone-200 shadow-sm hover:shadow-2xl hover:border-amber-200 hover:-translate-y-1 transition-all duration-500 cursor-pointer">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-50 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition" />
                  
                  <div className="relative p-6 md:p-7">
                    <div className="flex flex-col lg:flex-row justify-between gap-5">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-black text-lg">{order.order_number}</span>
                          <span className="px-3 py-1 rounded-full text-[11px] font-black border bg-amber-50 text-amber-700 border-amber-200">⏳ در انتظار تایید شما</span>
                          <span className="hidden md:inline-flex text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-bold">ویزیتور</span>
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
        </div>

        {/* موجودی انبار حرفه‌ای */}
        <div className="bg-white rounded-[2.5rem] border p-6 md:p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-xl flex items-center gap-2">📦 موجودی انبار</h3>
            <button onClick={() => { const base = (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api"; const token = JSON.parse(localStorage.getItem("novin_auth_tokens") || "{}")?.access; fetch(`${base}/dashboard/admin/stock/`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(d => { (window as any).setStock?.(d); window.location.reload(); }); }} className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold">🔄 رفرش موجودی</button>
          </div>

          {stock ? (
            <>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="rounded-2xl bg-stone-50 p-4 text-center border"><p className="text-2xl font-black">{stock.all?.length || 0}</p><p className="text-xs text-stone-500 mt-1">کل محصولات</p></div>
                <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-center"><p className="text-2xl font-black text-amber-700">{stock.low_stock_count}</p><p className="text-xs text-amber-700 mt-1">کم‌موجود</p></div>
                <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-center"><p className="text-2xl font-black text-red-700">{stock.out_of_stock_count}</p><p className="text-xs text-red-700 mt-1">ناموجود</p></div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {(stock.all || []).slice(0, 20).map((item: any) => (
                  <div key={item.id} className={`flex justify-between items-center p-3 rounded-xl border ${item.status === 'out' ? 'bg-red-50 border-red-200' : item.status === 'low' ? 'bg-amber-50 border-amber-200' : 'bg-stone-50'}`}>
                    <span className="font-bold text-sm">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black ${item.status === 'out' ? 'bg-red-600 text-white' : item.status === 'low' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>{item.stock} عدد</span>
                      <span className={`text-[10px] px-2 py-1 rounded-full ${item.status === 'out' ? 'bg-red-100 text-red-700' : item.status === 'low' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{item.status === 'out' ? 'ناموجود' : item.status === 'low' ? 'کم‌موجود' : 'موجود'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-stone-400">
              <p>در حال بارگذاری موجودی...</p>
              <p className="text-xs mt-2">اگر نیامد، دوباره رفرش کنید</p>
            </div>
          )}
        </div>
      </div>

      {/* مودال جزئیات حرفه‌ای با عکس محصولات */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => setSelectedOrder(null)}>
          <div className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-[0_25px_80px_rgba(0,0,0,0.4)] overflow-hidden my-8 animate-in zoom-in" onClick={(e) => e.stopPropagation()}>
            <div className="relative bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 p-8 text-white overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
              <div className="relative">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/10 px-3 py-1 text-[11px] font-black tracking-widest">جزئیات کامل سفارش ویزیتور</div>
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

              <div>
                <h3 className="font-black text-lg flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-900 text-white text-sm">📦</span>محصولات سفارش ({selectedOrder.items?.length || 0} قلم) - با عکس</h3>
                <div className="mt-4 grid gap-3">
                  {(selectedOrder.items || []).map((item: any) => (
                    <div key={item.id} className="group flex gap-4 items-center bg-white border-2 border-stone-100 rounded-[1.5rem] p-4 hover:border-amber-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                      <div className="relative">
                        <img src={item.product_image || "/images/placeholder.jpg"} alt={item.product_name} className="h-20 w-20 rounded-2xl object-cover bg-stone-50 border shadow-sm group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute -top-2 -right-2 h-7 w-7 bg-stone-900 text-white rounded-full flex items-center justify-center text-[11px] font-black shadow-lg">{item.quantity}</div>
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
                </div>
                <div className="mt-6 rounded-2xl bg-stone-900 text-white p-5 flex justify-between items-center">
                  <span className="font-bold">💰 مبلغ قابل پرداخت</span>
                  <span className="text-2xl font-black text-amber-300">{formatPrice(selectedOrder.total_amount)}</span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-stone-50 flex gap-3">
              <button onClick={() => { const base = (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api"; const token = JSON.parse(localStorage.getItem("novin_auth_tokens") || "{}")?.access; fetch(`${base}/dashboard/admin/orders/pending/`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ order_id: selectedOrder.id, action: "confirm" }) }).then(() => { alert("✅ تایید شد"); setSelectedOrder(null); window.location.reload(); }); }} className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-4 rounded-2xl font-black shadow-lg shadow-emerald-600/20 hover:from-emerald-500 hover:to-emerald-600 transition flex items-center justify-center gap-2"><span>✅</span> تایید نهایی سفارش ویزیتور</button>
              <button onClick={() => { const base = (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api"; const token = JSON.parse(localStorage.getItem("novin_auth_tokens") || "{}")?.access; fetch(`${base}/dashboard/admin/orders/pending/`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ order_id: selectedOrder.id, action: "reject" }) }).then(() => { alert("❌ رد شد"); setSelectedOrder(null); window.location.reload(); }); }} className="flex-1 bg-white border-2 border-red-200 text-red-600 py-4 rounded-2xl font-black hover:bg-red-50 transition">❌ رد سفارش</button>
              <button onClick={() => setSelectedOrder(null)} className="px-8 py-4 bg-white border border-stone-200 rounded-2xl font-bold hover:bg-stone-50">بستن</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
