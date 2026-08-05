/**
 * AdminStoreDashboard.tsx - پنل ادمین فروشگاه
 * ثبت سفارش جدید با انتخاب جزئی/عمده، تایید سفارشات ویزیتور، موجودی انبار
 */
import { useEffect, useState } from "react";
import { dashboardApi } from "../services/dashboardApi";

export default function AdminStoreDashboard() {
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [stock, setStock] = useState<any>(null);
  const [loading, setLoading] = useState(false);
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
      alert(`✅ سفارش ثبت شد: ${res.order_number}`);
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
      loadPending();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black">📦 پنل ادمین فروشگاه</h1>
        <p className="text-sm text-stone-500 mt-1">ثبت سفارش برای مشتری، تایید سفارشات ویزیتور، موجودی انبار</p>
      </div>

      {/* ثبت سفارش جدید */}
      <div className="bg-white rounded-[2rem] border p-6 shadow-sm">
        <h3 className="font-black mb-4">➕ ثبت سفارش جدید برای مشتری</h3>
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input required value={orderForm.customer_id} onChange={(e) => setOrderForm({ ...orderForm, customer_id: e.target.value })} placeholder="ID مشتری *" type="number" className="rounded-xl border-2 bg-stone-50 px-4 py-2.5 text-sm" />
            <select value={orderForm.sale_type} onChange={(e) => setOrderForm({ ...orderForm, sale_type: e.target.value as any })} className="rounded-xl border-2 bg-stone-50 px-4 py-2.5 text-sm">
              <option value="retail">جزئی (قیمت پایه)</option>
              <option value="wholesale">عمده (قیمت عمده - فقط مشتری تایید شده)</option>
            </select>
            <input value={orderForm.address} onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })} placeholder="آدرس (اختیاری)" className="rounded-xl border-2 bg-stone-50 px-4 py-2.5 text-sm" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold">آیتم‌ها:</label>
            {orderForm.items.map((item, idx) => (
              <div key={idx} className="flex gap-2">
                <input required value={item.product_id} onChange={(e) => { const newItems = [...orderForm.items]; newItems[idx].product_id = e.target.value; setOrderForm({ ...orderForm, items: newItems }); }} placeholder="ID محصول" type="number" className="flex-1 rounded-xl border px-3 py-2 text-sm" />
                <input required value={item.quantity} onChange={(e) => { const newItems = [...orderForm.items]; newItems[idx].quantity = parseInt(e.target.value) || 1; setOrderForm({ ...orderForm, items: newItems }); }} placeholder="تعداد" type="number" min="1" className="w-24 rounded-xl border px-3 py-2 text-sm" />
                <button type="button" onClick={() => setOrderForm({ ...orderForm, items: orderForm.items.filter((_, i) => i !== idx) })} className="px-3 bg-red-50 text-red-600 rounded-xl text-xs">حذف</button>
              </div>
            ))}
            <button type="button" onClick={() => setOrderForm({ ...orderForm, items: [...orderForm.items, { product_id: "", quantity: 1 }] })} className="text-xs bg-stone-100 px-3 py-1.5 rounded-full">+ افزودن محصول</button>
          </div>

          <button type="submit" className="w-full bg-stone-900 text-white py-3 rounded-xl font-black">ثبت سفارش با قیمت {orderForm.sale_type === "wholesale" ? "عمده" : "جزئی"}</button>
        </form>
      </div>

      {/* سفارشات در انتظار تایید */}
      <div className="bg-white rounded-[2rem] border p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-black">⏳ سفارشات ثبت شده توسط ویزیتورها (در انتظار تایید)</h3>
          <button onClick={loadPending} className="px-4 py-2 bg-stone-100 rounded-xl text-xs">رفرش</button>
        </div>

        {loading ? <div className="text-center py-8">⏳</div> : pendingOrders.length === 0 ? <p className="text-sm text-stone-400 text-center py-8">سفارش در انتظاری نیست</p> : (
          <div className="space-y-3">
            {pendingOrders.map((o: any) => (
              <div key={o.id} className="flex flex-col md:flex-row justify-between gap-3 p-4 border rounded-2xl hover:bg-stone-50">
                <div>
                  <p className="font-mono font-bold text-sm">{o.order_number} - {o.name}</p>
                  <p className="text-xs text-stone-500 mt-1">{o.items?.map((i: any) => `${i.product_name}×${i.quantity}`).join("، ")}</p>
                </div>
                <div className="flex gap-2 self-start">
                  <button onClick={() => handleConfirm(o.id, "confirm")} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">تایید نهایی</button>
                  <button onClick={() => handleConfirm(o.id, "reject")} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold">رد</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* موجودی انبار */}
      <div className="bg-white rounded-[2rem] border p-6 shadow-sm">
        <h3 className="font-black mb-4">📦 موجودی انبار</h3>
        {stock ? (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-stone-50 p-4 rounded-2xl text-center"><p className="text-2xl font-black">{stock.all?.length || 0}</p><p className="text-xs text-stone-500">کل محصولات</p></div>
              <div className="bg-amber-50 p-4 rounded-2xl text-center border border-amber-200"><p className="text-2xl font-black text-amber-700">{stock.low_stock_count}</p><p className="text-xs text-amber-700">کم‌موجود</p></div>
              <div className="bg-red-50 p-4 rounded-2xl text-center border border-red-200"><p className="text-2xl font-black text-red-700">{stock.out_of_stock_count}</p><p className="text-xs text-red-700">ناموجود</p></div>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stock.low_stock_items?.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                  <span className="font-bold text-sm">{item.name}</span>
                  <span className="bg-amber-200 text-amber-800 px-2.5 py-1 rounded-full text-xs font-black">{item.stock} عدد</span>
                </div>
              ))}
            </div>
          </>
        ) : <p className="text-sm text-stone-400">در حال بارگذاری...</p>}
      </div>
    </div>
  );
}
