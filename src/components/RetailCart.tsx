import { useState } from "react";
import { useRetailCart } from "../context/RetailCartContext";
import { formatPrice } from "../data";
import { TrashIcon, ArrowRightIcon } from "./icons";
import { ordersApi } from "../api/client";

/**
 * RetailCart نهایی فاز 4 با پرداخت زرین‌پال
 */

export default function RetailCart({ onCheckoutSuccess: _onCheckoutSuccess, onContinueShopping }: { onCheckoutSuccess: (orderNumber: string) => void, onContinueShopping: () => void }) {
  const { retailCart, removeRetailItem, increaseRetailQuantity, decreaseRetailQuantity, getRetailTotal } = useRetailCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (retailCart.length === 0) return;
    setLoading(true);
    setError("");

    try {
      // 1. ثبت سفارش
      const order = await ordersApi.create({
        name,
        phone,
        address,    
        items: retailCart.map((i: any) => ({ product_id: Number(i.id), quantity: i.qty })),
      });

      // 2. ایجاد لینک پرداخت زرین‌پال
      try {
        const paymentRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api"}/orders/payments/create/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: order.id, order_number: order.order_number }),
        });
        const paymentData = await paymentRes.json();
        if (paymentRes.ok && paymentData.payment_url) {
          window.location.href = paymentData.payment_url;
          return;
        }

        throw new Error(paymentData.error || "خطا در ایجاد لینک پرداخت زرین‌پال");
      } catch (payErr: any) {
        console.error("Payment create failed", payErr);
        throw new Error(payErr.message || "خطا در ارتباط با زرین‌پال");
      }
    } catch (err: any) {
      setError(err.message || "خطا در ثبت سفارش - موجودی را چک کنید");
    } finally {
      setLoading(false);
    }
  };

  if (retailCart.length === 0) {
    return (
      <div className="min-h-screen bg-cream-50 pt-32 pb-20 flex flex-col items-center justify-center p-4 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold">سبد خرید خالی است</h2>
        <button onClick={onContinueShopping} className="mt-6 bg-paprika-600 text-white px-8 py-3 rounded-2xl font-bold">رفتن به فروشگاه</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 pt-28 pb-20 px-4" dir="rtl">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-black mb-8">سبد خرید ({retailCart.length})</h1>

        <div className="space-y-4 mb-8">
          {retailCart.map((item: any) => (
            <div key={item.id} className="bg-white rounded-2xl p-4 border flex gap-4 items-center">
              <img src={item.image} alt={item.name} className="h-20 w-20 rounded-xl object-cover" />
              <div className="flex-1">
                <h3 className="font-bold">{item.name}</h3>
                <p className="text-sm text-stone-500">{formatPrice(item.price)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => decreaseRetailQuantity(item.id)} className="h-8 w-8 rounded-full bg-stone-100">-</button>
                  <span className="w-8 text-center font-bold">{item.qty}</span>
                  <button onClick={() => increaseRetailQuantity(item.id)} className="h-8 w-8 rounded-full bg-stone-100">+</button>
                </div>
              </div>
              <button onClick={() => removeRetailItem(item.id)} className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center"><TrashIcon className="h-5 w-5" /></button>
            </div>
          ))}
        </div>

        <form onSubmit={handleCheckout} className="bg-white rounded-[2rem] p-6 border shadow-sm space-y-4">
          <h3 className="font-bold text-lg">اطلاعات تحویل</h3>

          {error && <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}

          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="نام و نام خانوادگی" className="w-full rounded-2xl border bg-stone-50 px-4 py-3 text-sm outline-none focus:border-paprika-500" />
          <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="شماره موبایل 0912..." className="w-full rounded-2xl border bg-stone-50 px-4 py-3 text-sm outline-none focus:border-paprika-500" pattern="09[0-9]{9}" />
          <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="آدرس (اختیاری)" className="w-full rounded-2xl border bg-stone-50 px-4 py-3 text-sm" rows={3} />

          <div className="flex justify-between items-center pt-4 border-t font-bold text-xl">
            <span>مبلغ کل</span>
            <span className="text-paprika-700">{formatPrice(getRetailTotal())}</span>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-paprika-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:bg-paprika-700 disabled:opacity-50">
            {loading ? "در حال ثبت..." : "ثبت سفارش و پرداخت با زرین‌پال"}
          </button>

          <button type="button" onClick={onContinueShopping} className="w-full border border-stone-200 py-3 rounded-2xl font-bold flex items-center justify-center gap-2">
            <ArrowRightIcon className="h-4 w-4" />
            ادامه خرید
          </button>
        </form>
      </div>
    </div>
  );
}
