import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function PaymentVerify() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "failed" | "cancelled">("loading");
  const [message, setMessage] = useState("");

  const authority = params.get("Authority") || params.get("authority");
  const paymentStatus = params.get("Status") || params.get("status");
  const orderNumber = params.get("order");
  const paymentNumber = params.get("payment_number") || (orderNumber ? `PAY-${orderNumber}` : null);

  useEffect(() => {
    const verify = async () => {
      if (paymentStatus === "NOK") {
        setStatus("cancelled");
        setMessage("پرداخت توسط شما لغو شد");
        return;
      }

      if (!authority) {
        setStatus("failed");
        setMessage("اطلاعات پرداخت ناقص است - Authority یافت نشد");
        return;
      }

      if (authority.startsWith("mock_")) {
        setStatus("success");
        setMessage("پرداخت تستی با موفقیت انجام شد (حالت آزمایشی sandbox)");
        try {
          const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
          await fetch(`${baseUrl}/orders/payments/verify/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              payment_number: paymentNumber,
              authority: authority,
              order_number: orderNumber,
              status: "OK",
            }),
          });
        } catch {}
        return;
      }

      try {
        const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
        const res = await fetch(`${baseUrl}/orders/payments/verify/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payment_number: paymentNumber,
            authority: authority,
            order_number: orderNumber,
            status: paymentStatus || "OK",
          }),
        });

        const data = await res.json();
        if (res.ok && data.status === "SUCCESS") {
          setStatus("success");
          setMessage(`پرداخت موفق! کد پیگیری: ${data.payment_number || authority}`);
        } else {
          setStatus("failed");
          setMessage(data.message || "تایید پرداخت ناموفق بود");
        }
      } catch (e: any) {
        setStatus("failed");
        setMessage(e.message || "خطا در ارتباط با سرور");
      }
    };

    verify();
  }, [authority, paymentStatus, orderNumber, paymentNumber]);

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4 pt-28" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 border shadow-xl text-center">
        {status === "loading" && (
          <>
            <div className="h-20 w-20 mx-auto bg-stone-100 rounded-full flex items-center justify-center mb-4 animate-pulse">⏳</div>
            <h2 className="text-xl font-bold">در حال تایید پرداخت...</h2>
            <p className="text-stone-500 mt-2 text-sm">لطفاً صبر کنید</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="h-20 w-20 mx-auto bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <CheckIcon className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold text-emerald-700">پرداخت موفق!</h2>
            <p className="text-stone-600 mt-3 text-sm">{message}</p>
            {orderNumber && <p className="mt-2 font-mono text-sm bg-stone-50 p-2 rounded-xl">{orderNumber}</p>}
            <button onClick={() => navigate(`/success`)} className="mt-6 w-full bg-emerald-600 text-white py-3 rounded-2xl font-bold">مشاهده رسید</button>
            <button onClick={() => navigate("/")} className="mt-3 w-full border border-stone-200 py-3 rounded-2xl font-bold">بازگشت به فروشگاه</button>
          </>
        )}
        {status === "failed" && (
          <>
            <div className="h-20 w-20 mx-auto bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <CloseIcon className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold text-red-700">پرداخت ناموفق</h2>
            <p className="text-stone-600 mt-3 text-sm">{message}</p>
            <button onClick={() => navigate("/")} className="mt-6 w-full bg-stone-900 text-white py-3 rounded-2xl font-bold">بازگشت</button>
          </>
        )}
        {status === "cancelled" && (
          <>
            <div className="h-20 w-20 mx-auto bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">⚠️</div>
            <h2 className="text-2xl font-bold">پرداخت لغو شد</h2>
            <p className="text-stone-600 mt-3 text-sm">{message}</p>
            <button onClick={() => navigate("/")} className="mt-6 w-full bg-stone-900 text-white py-3 rounded-2xl font-bold">بازگشت به فروشگاه</button>
          </>
        )}
      </div>
    </div>
  );
}
