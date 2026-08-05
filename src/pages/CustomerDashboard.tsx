/**
 * CustomerDashboard.tsx - پنل مشتری
 * نمایش قیمت جزئی برای عادی و عمده برای تایید شده، سبد خرید، پیگیری
 */
import { useEffect, useState } from "react";
import { dashboardApi } from "../services/dashboardApi";

export default function CustomerDashboard() {
  const [prices, setPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWholesaleApproved, setIsWholesaleApproved] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await dashboardApi.customer.prices();
        setPrices(data);

        // چک کن آیا کاربر عمده تایید شده است - از اولین آیتم is_wholesale_price
        if (data.length > 0 && data[0].is_wholesale_price) {
          setIsWholesaleApproved(true);
        }

        // همچنین از پروفایل چک کن
        const raw = localStorage.getItem("novin_user_profile");
        if (raw) {
          const profile = JSON.parse(raw);
          if (profile.customer?.is_wholesale_approved || profile.is_wholesale_approved) {
            setIsWholesaleApproved(true);
          }
        }
      } catch (e: any) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">🛍️ پنل مشتری</h1>
        <p className="text-sm text-stone-500 mt-1">
          {isWholesaleApproved ? "شما مشتری تایید شده عمده هستید - قیمت عمده نمایش داده می‌شود" : "شما مشتری عادی هستید - قیمت جزئی نمایش داده می‌شود. برای قیمت عمده باید توسط ادمین تایید شوید."}
        </p>
      </div>

      {isWholesaleApproved && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">⭐</span>
          <div>
            <p className="font-black text-sm">شما مشتری عمده تایید شده هستید</p>
            <p className="text-xs opacity-80 mt-1">قیمت‌های زیر با تخفیف عمده نمایش داده می‌شود</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-stone-100 rounded-[2rem] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {prices.map((p: any) => (
            <div key={p.id} className="bg-white rounded-[2rem] border overflow-hidden shadow-sm hover:shadow-xl transition group">
              <div className="aspect-[4/3] bg-stone-50 overflow-hidden">
                <img src={p.image} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-5">
                <p className="text-[10px] font-bold text-stone-400">{p.category}</p>
                <h3 className="font-bold mt-1">{p.name}</h3>
                <p className="text-xs text-stone-500 mt-1">{p.stock} موجود</p>

                <div className="mt-4">
                  {isWholesaleApproved ? (
                    <>
                      <p className="text-xs line-through text-stone-400">{parseInt(p.base_price).toLocaleString("fa-IR")} تومان (جزئی)</p>
                      <p className="text-lg font-black text-emerald-600">{parseInt(p.price).toLocaleString("fa-IR")} تومان</p>
                      <span className="inline-block mt-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-[10px] font-black">قیمت عمده</span>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-black">{parseInt(p.price).toLocaleString("fa-IR")} تومان</p>
                      <p className="text-[11px] text-stone-400 mt-1">برای قیمت عمده باید تایید شوید</p>
                    </>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button className="bg-stone-900 text-white py-2.5 rounded-xl text-xs font-black">افزودن به سبد</button>
                  <button className="bg-stone-100 py-2.5 rounded-xl text-xs font-bold">جزئیات</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-[2rem] border p-6">
        <h3 className="font-black mb-3">📦 سبد خرید و پیگیری</h3>
        <p className="text-sm text-stone-500">سبد خرید فعلی شما در سایت اصلی است. برای ثبت سفارش به فروشگاه بروید و پس از ثبت، وضعیت را اینجا یا در صفحه پیگیری ببینید.</p>
        <div className="mt-4 flex gap-2">
          <button onClick={() => (window.location.href = "/cart")} className="px-5 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-bold">رفتن به سبد خرید</button>
          <button onClick={() => (window.location.href = "/my-orders")} className="px-5 py-2.5 bg-white border rounded-xl text-sm font-bold">سفارشات من</button>
        </div>
      </div>
    </div>
  );
}
