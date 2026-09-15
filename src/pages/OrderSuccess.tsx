import { useEffect, useState } from "react";
import { CheckIcon, ArrowRightIcon } from "../components/icons";
import { formatPrice } from "../data";
import { useNavigate } from "react-router-dom";

type Props = {
  orderNumber: string;
  onBack?: () => void;
};

const STATUS_MAP: Record<string, string> = {
  PENDING: "در انتظار پرداخت",
  PAID_PENDING_REVIEW: "پرداخت شده / در انتظار بررسی",
  CONFIRMED: "تایید شده",
  PREPARING: "در حال آماده‌سازی",
  SHIPPED: "ارسال شده",
  DELIVERED: "تحویل داده شده",
  CANCELLED: "لغو شده",
};

const PAYMENT_MAP: Record<string, string> = {
  PENDING: "در انتظار پرداخت",
  SUCCESS: "پرداخت موفق",
  FAILED: "پرداخت ناموفق",
  REFUNDED: "مسترد شده",
};

export default function OrderSuccess({ orderNumber, onBack }: Props) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const goHome = () => {
    
    if (onBack) {
      try { onBack(); return; } catch {}
    }
    navigate("/", { replace: true });
    // fallback
    setTimeout(() => { window.location.href = "/"; }, 100);
  };

  useEffect(() => {
    if (!orderNumber) {
      setLoading(false);
      return;
    }
    const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
    fetch(`${baseUrl}/orders/track/${orderNumber}/`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setOrder(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
        <div className="animate-spin text-paprika-600 text-4xl">⏳</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 pt-28 pb-20 font-sans text-right" dir="rtl">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="bg-white rounded-[2.5rem] p-8 border border-stone-200 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 left-0 h-2 bg-emerald-500" />
          
          <div className="flex flex-col items-center text-center mb-8">
            <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <CheckIcon className="h-10 w-10" />
            </div>
            <h1 className="text-3xl font-display font-bold text-stone-800 mb-2">سفارش شما ثبت شد</h1>
            <p className="text-stone-500">سفارش شما با موفقیت ثبت گردید و در حال پردازش است.</p>
          </div>

          <div className="space-y-4 border-t border-b border-stone-100 py-6 mb-8">
            <div className="flex justify-between items-center">
              <span className="text-stone-500 font-medium">شماره سفارش</span>
              <span className="font-mono font-bold text-lg text-stone-900">{order?.order_number || orderNumber}</span>
            </div>
            {order && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 font-medium">وضعیت پرداخت</span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    {PAYMENT_MAP[order.payment_status] || order.payment_status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 font-medium">وضعیت سفارش</span>
                  <span className="rounded-full bg-gold-50 px-3 py-1 text-xs font-bold text-gold-700">
                    {STATUS_MAP[order.order_status] || order.order_status}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-stone-50">
                  <span className="text-lg font-bold text-stone-800">مبلغ کل</span>
                  <span className="font-display text-2xl font-bold text-paprika-700">{formatPrice(order.total_amount)}</span>
                </div>
              </>
            )}
          </div>

          {order && (
            <div className="bg-stone-50 rounded-2xl p-4 mb-8">
              <h3 className="font-bold text-stone-800 text-sm mb-2">اطلاعات تحویل:</h3>
              <p className="text-sm text-stone-600 leading-relaxed">
                {order.name} - {order.phone}<br />
                {order.address || "آدرس ثبت نشده"}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={goHome}
              className="flex-1 bg-paprika-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-paprika-600/20 hover:bg-paprika-700 transition"
            >
              بازگشت به فروشگاه
            </button>
            <button
              onClick={() => window.print()}
              className="px-8 py-4 rounded-2xl border border-stone-200 text-stone-600 font-bold hover:bg-stone-50 transition"
            >
              چاپ رسید
            </button>
          </div>
        </div>

        <button
          onClick={goHome}
          className="mt-8 flex items-center gap-2 text-stone-500 font-bold hover:text-paprika-700 transition"
        >
          <ArrowRightIcon className="h-5 w-5" />
          ادامه خرید و مشاهده محصولات دیگر
        </button>
      </div>
    </div>
  );
}
