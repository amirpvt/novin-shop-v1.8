/**
 * VisitorDashboard.tsx - پنل ویزیتور
 * لیست امروز، ثبت سفارش با وزن دقیق، دریافت وجه، پورسانت
 */
import { useEffect, useState } from "react";
import { dashboardApi } from "../services/dashboardApi";

export default function VisitorDashboard() {
  const [todayList, setTodayList] = useState<any[]>([]);
  const [cashList, setCashList] = useState<any[]>([]);
  const [commissionData, setCommissionData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [orderForm, setOrderForm] = useState({
    customer_id: "",
    address: "",
    items: [{ product_id: "", quantity: 1, weight: "" }] as { product_id: string; quantity: number; weight: string }[],
  });

  const [cashForm, setCashForm] = useState({
    customer: "",
    amount: "",
    payment_type: "cash",
    receipt_number: "",
    notes: "",
  });

  const loadToday = async () => {
    setLoading(true);
    try {
      const data = await dashboardApi.visitor.todayList();
      setTodayList(data);
    } catch {}
    finally { setLoading(false); }
  };

  const loadCash = async () => {
    try {
      const data = await dashboardApi.visitor.cashList();
      setCashList(data);
    } catch {}
  };

  const loadCommission = async () => {
    try {
      const data = await dashboardApi.visitor.commission();
      setCommissionData(data);
    } catch {}
  };

  useEffect(() => {
    loadToday();
    loadCash();
    loadCommission();
  }, []);

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        customer_id: parseInt(orderForm.customer_id),
        address: orderForm.address,
        items: orderForm.items.map((it) => ({
          product_id: parseInt(it.product_id),
          quantity: parseInt(String(it.quantity)),
          weight: it.weight ? parseFloat(it.weight) : undefined,
        })),
      };
      const res = await dashboardApi.visitor.orderCreate(payload);
      alert(`✅ سفارش ثبت شد: ${res.order_number} - وزن دقیق لحاظ شد`);
      setOrderForm({ customer_id: "", address: "", items: [{ product_id: "", quantity: 1, weight: "" }] });
      loadToday();
      loadCommission();
    } catch (err: any) {
      alert("❌ " + err.message);
    }
  };

  const handleCashSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dashboardApi.visitor.cashCreate({
        customer: parseInt(cashForm.customer),
        amount: parseFloat(cashForm.amount),
        payment_type: cashForm.payment_type,
        receipt_number: cashForm.receipt_number,
        notes: cashForm.notes,
      });
      alert("✅ دریافت وجه ثبت شد");
      setCashForm({ customer: "", amount: "", payment_type: "cash", receipt_number: "", notes: "" });
      loadCash();
    } catch (err: any) {
      alert("❌ " + err.message);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black">🧑‍💼 پنل ویزیتور</h1>
        <p className="text-sm text-stone-500 mt-1">برنامه امروز، ثبت سفارش با وزن دقیق، دریافت وجه، پورسانت</p>
      </div>

      {/* کمیسیون */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-[2rem] p-6 shadow-lg">
          <p className="text-xs opacity-80">کل پورسانت</p>
          <p className="text-2xl font-black mt-2">{commissionData?.total_commission ? `${parseInt(commissionData.total_commission).toLocaleString("fa-IR")} تومان` : "0 تومان"}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-6">
          <p className="text-xs font-bold text-amber-800">پرداخت نشده</p>
          <p className="text-2xl font-black text-amber-700 mt-2">{commissionData?.unpaid_commission ? `${parseInt(commissionData.unpaid_commission).toLocaleString("fa-IR")} تومان` : "0"}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-[2rem] p-6">
          <p className="text-xs font-bold text-blue-800">پرداخت شده</p>
          <p className="text-2xl font-black text-blue-700 mt-2">{commissionData?.paid_commission ? `${parseInt(commissionData.paid_commission).toLocaleString("fa-IR")} تومان` : "0"}</p>
        </div>
      </div>

      {/* لیست امروز */}
      <div className="bg-white rounded-[2rem] border p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-black">📅 مشتریانی که امروز باید بازدید کنی ({todayList.length})</h3>
          <button onClick={loadToday} className="px-4 py-2 bg-stone-100 rounded-xl text-xs">رفرش</button>
        </div>

        {loading ? <div className="text-center py-8">⏳</div> : todayList.length === 0 ? <p className="text-sm text-stone-400 text-center py-8">برای امروز برنامه‌ای نداری - 5 مشتری نمونه نمایش داده می‌شود</p> : (
          <div className="space-y-3">
            {todayList.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center p-4 border rounded-2xl hover:bg-stone-50">
                <div>
                  <p className="font-bold">{item.customer_name}</p>
                  <p className="text-xs text-stone-500 mt-1">📞 {item.customer_phone} | 📍 {item.customer_address || "بدون آدرس"}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.status === 'pending' ? 'bg-amber-100 text-amber-700' : item.status === 'ordered' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100'}`}>{item.status}</span>
                  <button onClick={() => setOrderForm({ ...orderForm, customer_id: String(item.customer_id) })} className="text-xs bg-stone-900 text-white px-3 py-1 rounded-full">ثبت سفارش</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ثبت سفارش با وزن دقیق */}
      <div className="bg-white rounded-[2rem] border p-6 shadow-sm">
        <h3 className="font-black mb-4">⚖️ ثبت سفارش در محل با وزن دقیق</h3>
        <form onSubmit={handleOrderSubmit} className="space-y-4">
          <input required value={orderForm.customer_id} onChange={(e) => setOrderForm({ ...orderForm, customer_id: e.target.value })} placeholder="ID مشتری *" type="number" className="w-full rounded-xl border-2 bg-stone-50 px-4 py-2.5 text-sm" />
          <input value={orderForm.address} onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })} placeholder="آدرس تحویل (اختیاری)" className="w-full rounded-xl border-2 bg-stone-50 px-4 py-2.5 text-sm" />

          {orderForm.items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-3 gap-2 p-3 bg-stone-50 rounded-xl border">
              <input required value={item.product_id} onChange={(e) => { const arr = [...orderForm.items]; arr[idx].product_id = e.target.value; setOrderForm({ ...orderForm, items: arr }); }} placeholder="ID محصول" type="number" className="rounded-xl border px-3 py-2 text-sm" />
              <input required value={item.quantity} onChange={(e) => { const arr = [...orderForm.items]; arr[idx].quantity = parseInt(e.target.value) || 1; setOrderForm({ ...orderForm, items: arr }); }} placeholder="تعداد" type="number" min="1" className="rounded-xl border px-3 py-2 text-sm" />
              <input value={item.weight} onChange={(e) => { const arr = [...orderForm.items]; arr[idx].weight = e.target.value; setOrderForm({ ...orderForm, items: arr }); }} placeholder="وزن دقیق kg (مثلا 0.75)" type="number" step="0.01" className="rounded-xl border px-3 py-2 text-sm bg-amber-50" />
            </div>
          ))}
          <button type="button" onClick={() => setOrderForm({ ...orderForm, items: [...orderForm.items, { product_id: "", quantity: 1, weight: "" }] })} className="text-xs bg-stone-100 px-3 py-1.5 rounded-full">+ محصول</button>

          <button type="submit" className="w-full bg-stone-900 text-white py-3 rounded-xl font-black">ثبت سفارش با وزن دقیق + محاسبه پورسانت 5%</button>
        </form>
      </div>

      {/* دریافت وجه */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[2rem] border p-6 shadow-sm">
          <h3 className="font-black mb-4">💵 ثبت دریافت وجه نقد</h3>
          <form onSubmit={handleCashSubmit} className="space-y-3">
            <input required value={cashForm.customer} onChange={(e) => setCashForm({ ...cashForm, customer: e.target.value })} placeholder="ID مشتری *" type="number" className="w-full rounded-xl border px-4 py-2.5 text-sm" />
            <input required value={cashForm.amount} onChange={(e) => setCashForm({ ...cashForm, amount: e.target.value })} placeholder="مبلغ دریافتی *" type="number" className="w-full rounded-xl border px-4 py-2.5 text-sm" />
            <select value={cashForm.payment_type} onChange={(e) => setCashForm({ ...cashForm, payment_type: e.target.value })} className="w-full rounded-xl border px-4 py-2.5 text-sm">
              <option value="cash">نقدی</option>
              <option value="card">کارتخوان سیار</option>
              <option value="cheque">چک</option>
              <option value="online">آنلاین</option>
            </select>
            <input value={cashForm.receipt_number} onChange={(e) => setCashForm({ ...cashForm, receipt_number: e.target.value })} placeholder="شماره رسید" className="w-full rounded-xl border px-4 py-2.5 text-sm" />
            <textarea value={cashForm.notes} onChange={(e) => setCashForm({ ...cashForm, notes: e.target.value })} placeholder="توضیحات" className="w-full rounded-xl border px-4 py-2.5 text-sm" rows={2} />
            <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-black">ثبت دریافت وجه</button>
          </form>
        </div>

        <div className="bg-white rounded-[2rem] border p-6 shadow-sm">
          <h3 className="font-black mb-4">💰 آخرین دریافت‌ها</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {cashList.map((c: any) => (
              <div key={c.id} className="flex justify-between items-center p-3 bg-stone-50 rounded-xl border">
                <div>
                  <p className="font-bold text-sm">{c.customer_name}</p>
                  <p className="text-xs text-stone-500">{new Date(c.collected_at).toLocaleDateString("fa-IR")} - {c.payment_type}</p>
                </div>
                <span className="font-black text-sm text-emerald-700">{parseInt(c.amount).toLocaleString("fa-IR")} تومان</span>
              </div>
            ))}
            {cashList.length === 0 && <p className="text-sm text-stone-400 text-center py-8">هنوز وجهی ثبت نکرده‌ای</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
