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
    const loadAll = async () => {
      setLoading(true);
      setError("");
      try {
        const [ordersData, wholesaleData] = await Promise.all([
          ordersApi.myOrders().catch(() => []),
          wholesaleApi.myRequests().catch(() => []),
        ]);
        setOrders((ordersData as any).results ?? (ordersData as any) ?? []);
        setWholesale((wholesaleData as any).results ?? (wholesaleData as any) ?? []);
      } catch (e: any) {
        setError(e.message || "خطا");
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      if (tab === "retail") {
        const data: any = await ordersApi.myOrders();
        setOrders(data.results ?? data);
      } else {
        const data: any = await wholesaleApi.myRequests();
        setWholesale(data.results ?? data);
      }
    } catch {}
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-cream-50 pt-28 pb-20 px-4" dir="rtl">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black">سفارشات من</h1>
          <button onClick={() => navigate("/")} className="text-sm font-bold text-stone-500 hover:text-paprika-600">بازگشت به فروشگاه</button>
        </div>

        <div className="flex gap-2 mb-6 p-1 bg-stone-100 rounded-2xl w-fit">
          <button onClick={() => setTab("retail")} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition ${tab === "retail" ? "bg-white shadow text-stone-900" : "text-stone-500"}`}>تکی ({orders.length})</button>
          <button onClick={() => setTab("wholesale")} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition ${tab === "wholesale" ? "bg-white shadow text-stone-900" : "text-stone-500"}`}>عمده ({wholesale.length})</button>
        </div>

        {loading ? (
          <div className="text-center py-20">⏳ در حال بارگذاری...</div>
        ) : error ? (
          <div className="rounded-3xl bg-white border p-12 text-center">
            <p className="font-bold">{error}</p>
            <button onClick={() => navigate("/")} className="mt-6 bg-paprika-600 text-white px-8 py-3 rounded-2xl font-bold">ورود</button>
          </div>
        ) : tab === "retail" ? (
          orders.length === 0 ? (
            <div className="rounded-3xl bg-white border p-12 text-center text-stone-400">سفارش تکی ندارید</div>
          ) : (
            <div className="space-y-5">
              {orders.map((o) => (
                <div key={o.id} className="bg-white rounded-[2rem] border shadow-sm overflow-hidden hover:shadow-lg transition">
                  <div className="p-6 flex justify-between items-start">
                    <div>
                      <p className="font-mono font-black">{o.order_number}</p>
                      <p className="text-xs text-stone-400 mt-1">{new Date(o.created_at).toLocaleDateString("fa-IR")}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${o.order_status === "DELIVERED" ? "bg-emerald-100 text-emerald-700" : o.order_status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-stone-100"}`}>{o.order_status}</span>
                  </div>

                  {/* 🆕 عکس محصولات */}
                  <div className="px-6 pb-4">
                    <p className="text-xs font-bold text-stone-500 mb-3">محصولات سفارش:</p>
                    <div className="grid gap-3">
                      {(o.items as any)?.map((item: any) => (
                        <div key={item.id} className="flex gap-3 items-center bg-stone-50 p-3 rounded-2xl border">
                          <img src={item.product_image || "/images/placeholder.jpg"} alt={item.product_name} className="h-16 w-16 rounded-xl object-cover bg-white border" />
                          <div className="flex-1">
                            <p className="font-bold text-sm text-stone-800">{item.product_name}</p>
                            <p className="text-xs text-stone-500 mt-1">تعداد: {item.quantity} × {formatPrice(item.price)}</p>
                          </div>
                          <div className="text-left">
                            <p className="font-black text-sm text-paprika-700">{formatPrice(item.price * item.quantity)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-stone-50 border-t flex justify-between items-center">
                    <span className="text-sm text-stone-500">مبلغ کل</span>
                    <span className="font-black text-lg text-stone-900">{formatPrice(o.total_amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : wholesale.length === 0 ? (
          <div className="rounded-3xl bg-white border p-12 text-center text-stone-400">درخواست عمده ندارید</div>
        ) : (
          <div className="space-y-5">
            {wholesale.map((w) => (
              <div key={w.id} className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
                <div className="p-6 flex justify-between">
                  <div>
                    <p className="font-mono font-bold">{w.request_number}</p>
                    <p className="text-xs text-stone-400 mt-1">{new Date(w.created_at).toLocaleDateString("fa-IR")}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-stone-100 text-xs font-bold">{w.status}</span>
                </div>

                <div className="px-6 pb-2">
                  <p className="font-bold">{w.company_name}</p>
                  <p className="text-xs text-stone-500 mt-1">👤 {w.contact_person} - 📞 {w.phone}</p>
                </div>

                {/* 🆕 عکس محصولات عمده */}
                <div className="px-6 pb-4">
                  <p className="text-xs font-bold text-stone-500 mb-3">محصولات درخواستی:</p>
                  <div className="grid gap-3">
                    {(w.items as any)?.map((item: any) => (
                      <div key={item.id} className="flex gap-3 items-center bg-stone-50 p-3 rounded-2xl border">
                        <img src={item.product_image || "/images/placeholder.jpg"} alt={item.product_name} className="h-16 w-16 rounded-xl object-cover bg-white border" />
                        <div className="flex-1">
                          <p className="font-bold text-sm">{item.product_name}</p>
                          <p className="text-xs text-stone-500 mt-1">تعداد: {item.quantity}</p>
                          {item.notes && <p className="text-[10px] text-stone-400 mt-1">📝 {item.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-center mt-6">
          <button onClick={refresh} className="text-xs bg-white border px-6 py-2.5 rounded-full font-bold hover:bg-stone-50">🔄 رفرش</button>
        </div>
      </div>
    </div>
  );
}
