import { useState } from "react";

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function formatPrice(n: number | string) {
  const num = typeof n === "string" ? parseFloat(n) : n;
  return num.toLocaleString("en-US") + " تومان";
}

export default function OrderTracking() {
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const track = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOrder(null);

    try {
      // ✅ FIXED: fetch با پرانتز درست
      const baseUrl = (import.meta.env.VITE_API_BASE_URL as string) || "http://127.0.0.1:8000/api";
      const res = await fetch(`${baseUrl}/orders/track/${orderNumber}/`);
      
      if (!res.ok) {
        throw new Error("سفارش یافت نشد - شماره را چک کنید");
      }
      
      const data = await res.json();
      setOrder(data);
    } catch (err: any) {
      setError(err.message || "خطا در پیگیری");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 pt-32 pb-20 px-4" dir="rtl">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-black text-center mb-8">پیگیری سفارش</h1>

        <form onSubmit={track} className="bg-white rounded-3xl p-6 border shadow-sm flex gap-3">
          <input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="شماره سفارش مثل ORD-12345678"
            className="flex-1 rounded-2xl border bg-stone-50 px-4 py-3 font-mono text-sm outline-none focus:border-paprika-500"
            required
          />
          <button type="submit" disabled={loading} className="rounded-2xl bg-paprika-600 px-6 py-3 text-sm font-bold text-white hover:bg-paprika-700">
            {loading ? "..." : "پیگیری"}
          </button>
        </form>

        {error && (
          <div className="mt-6 rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 text-center">
            {error}
          </div>
        )}

        {order && (
          <div className="mt-8 bg-white rounded-[2rem] p-8 border shadow-xl">
            <div className="flex items-center justify-center gap-2 text-emerald-600 mb-6">
              <CheckIcon className="h-6 w-6" />
              <span className="font-bold">سفارش یافت شد</span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500">شماره سفارش</span>
                <span className="font-mono font-bold">{order.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">نام</span>
                <span className="font-bold">{order.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">وضعیت</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${order.order_status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                  {order.order_status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">پرداخت</span>
                <span className="px-3 py-1 rounded-full bg-stone-100 text-xs">{order.payment_status}</span>
              </div>
              <div className="flex justify-between pt-3 border-t font-bold text-lg">
                <span>مبلغ کل</span>
                <span className="text-paprika-700">{formatPrice(order.total_amount)}</span>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-bold text-sm mb-2">آیتم‌ها:</h4>
              <div className="space-y-2">
                {order.items?.map((i: any) => (
                  <div key={i.id} className="flex justify-between bg-stone-50 p-3 rounded-xl text-sm">
                    <span>{i.product_name} × {i.quantity}</span>
                    <span className="font-bold">{formatPrice(i.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
