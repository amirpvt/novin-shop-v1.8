import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ordersApi, wholesaleApi, type Order, type WholesaleRequest } from "../api/client";
import { formatPrice } from "../data";

type Tab = "retail" | "wholesale";

export default function MyOrders() {
  const [tab, setTab] = useState<Tab>("retail");
  const [orders, setOrders] = useState<Order[]>([]);
  const [wholesale, setWholesale] = useState<WholesaleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        if (tab === "retail") {
          const data: any = await ordersApi.myOrders();
          setOrders(data.results ?? data);
        } else {
          const data: any = await wholesaleApi.myRequests();
          setWholesale(data.results ?? data);
        }
      } catch (e: any) {
        if (e.message.includes("401") || e.message.includes("Unauthorized")) {
          setError("برای مشاهده سفارشات باید وارد شوید");
        } else {
          setError(e.message || "خطا در دریافت سفارشات");
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tab]);

  return (
    <div className="min-h-screen bg-cream-50 pt-28 pb-20 px-4" dir="rtl">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black">سفارشات من</h1>
          <button onClick={() => navigate("/")} className="text-sm font-bold text-stone-500 hover:text-paprika-600">بازگشت به فروشگاه</button>
        </div>

        <div className="flex gap-2 mb-6 p-1 bg-stone-100 rounded-2xl w-fit">
          <button onClick={() => setTab("retail")} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition ${tab === "retail" ? "bg-white shadow text-stone-900" : "text-stone-500"}`}>تکی ({orders.length})</button>
          <button onClick={() => setTab("wholesale")} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition ${tab === "wholesale" ? "bg-white shadow text-stone-900" : "text-stone-500"}`}>عمده ({wholesale.length})</button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin text-3xl mb-4">⏳</div>
            <p className="text-stone-500">در حال بارگذاری...</p>
          </div>
        ) : error ? (
          <div className="rounded-3xl bg-white border p-12 text-center">
            <div className="text-5xl mb-4">🔒</div>
            <p className="text-stone-700 font-bold">{error}</p>
            <button onClick={() => navigate("/")} className="mt-6 bg-paprika-600 text-white px-8 py-3 rounded-2xl font-bold">ورود / ثبت‌نام</button>
            <div className="mt-6">
              <p className="text-xs text-stone-400 mb-2">اگر مهمان سفارش داده‌اید، با شماره سفارش پیگیری کنید:</p>
              <button onClick={() => navigate("/track")} className="text-sm font-bold text-paprika-600 underline">پیگیری با شماره سفارش</button>
            </div>
          </div>
        ) : tab === "retail" ? (
          orders.length === 0 ? (
            <div className="rounded-3xl bg-white border p-12 text-center text-stone-400">هنوز سفارشی ثبت نکرده‌اید</div>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => (
                <div key={o.id} className="bg-white rounded-3xl p-6 border shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-mono font-black text-stone-900">{o.order_number}</p>
                      <p className="text-xs text-stone-400 mt-1">{new Date(o.created_at).toLocaleDateString("fa-IR")}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${o.order_status === "PENDING" ? "bg-amber-100 text-amber-700" : o.order_status === "CONFIRMED" ? "bg-blue-100 text-blue-700" : o.order_status === "SHIPPED" ? "bg-purple-100 text-purple-700" : o.order_status === "DELIVERED" ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-600"}`}>
                      {o.order_status === "PENDING" ? "در انتظار" : o.order_status === "CONFIRMED" ? "تایید شده" : o.order_status === "PREPARING" ? "آماده‌سازی" : o.order_status === "SHIPPED" ? "ارسال شده" : o.order_status === "DELIVERED" ? "تحویل شده" : o.order_status}
                    </span>
                  </div>
                  <div className="text-sm text-stone-600 mb-3">
                    {o.items?.map((i) => `${i.product_name} × ${i.quantity}`).join("، ")}
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="text-sm text-stone-500">مبلغ</span>
                    <span className="font-black text-paprika-700">{formatPrice(o.total_amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : wholesale.length === 0 ? (
          <div className="rounded-3xl bg-white border p-12 text-center text-stone-400">درخواست عمده‌ای ندارید</div>
        ) : (
          <div className="space-y-4">
            {wholesale.map((w) => (
              <div key={w.id} className="bg-white rounded-3xl p-6 border shadow-sm">
                <div className="flex justify-between">
                  <p className="font-mono font-bold">{w.request_number}</p>
                  <span className="px-3 py-1 rounded-full bg-stone-100 text-xs font-bold">{w.status}</span>
                </div>
                <p className="mt-2 font-bold text-stone-800">{w.company_name}</p>
                <p className="text-sm text-stone-500 mt-1">{w.items?.map((i) => `${i.product_name} × ${i.quantity}`).join("، ")}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
