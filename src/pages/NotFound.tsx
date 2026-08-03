import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-4 pt-32 text-center" dir="rtl">
      <div className="relative">
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-paprika-100 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-gold-100 blur-2xl" />
        
        <div className="relative bg-white rounded-[3rem] p-12 border shadow-2xl max-w-lg">
          <div className="text-8xl mb-6">😕</div>
          <h1 className="font-display text-6xl font-black text-stone-800">404</h1>
          <h2 className="mt-4 text-2xl font-bold text-stone-700">صفحه پیدا نشد</h2>
          <p className="mt-3 text-stone-500 leading-relaxed">
            متاسفانه صفحه‌ای که دنبالش می‌گردی وجود نداره یا حذف شده.
            <br />
            بیا برگردیم به فروشگاه و محصولات خوشمزه رو ببینیم!
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate("/")}
              className="rounded-2xl bg-stone-900 px-8 py-3.5 text-sm font-black text-white shadow-lg hover:bg-black transition"
            >
              بازگشت به خانه
            </button>
            <button
              onClick={() => navigate("/shop")}
              className="rounded-2xl bg-paprika-600 px-8 py-3.5 text-sm font-black text-white shadow-lg shadow-paprika-600/20 hover:bg-paprika-700 transition"
            >
              رفتن به فروشگاه
            </button>
          </div>

          <div className="mt-10 pt-6 border-t border-stone-100 flex items-center justify-center gap-6 text-xs text-stone-400">
            <span>📞 { "09300117977"}</span>
            <span>•</span>
            <span>پشتیبانی 24 ساعته</span>
          </div>
        </div>
      </div>
    </div>
  );
}
