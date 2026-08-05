/**
 * DashboardLayout.tsx - لایه‌اوت جدا برای داشبوردها با سایدبار مخصوص هر نقش
 * کاملا جدا از لایه‌اوت اصلی سایت (هدر/فوتر اصلی دست نمی‌خورد)
 */
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

type Role = "manager" | "admin" | "visitor" | "customer";

interface Props {
  children: React.ReactNode;
  role: Role;
}

const menuByRole: Record<Role, { label: string; path: string; icon: string }[]> = {
  manager: [
    { label: "داشبورد", path: "/dashboard/manager", icon: "📊" },
    { label: "قیمت‌گذاری", path: "/dashboard/manager/pricing", icon: "💰" },
    { label: "مدیریت کاربران", path: "/dashboard/manager/users", icon: "👥" },
    { label: "گزارش ویزیتورها", path: "/dashboard/manager/visitors", icon: "📈" },
    { label: "بدهکاران", path: "/dashboard/manager/debtors", icon: "💳" },
  ],
  admin: [
    { label: "داشبورد", path: "/dashboard/admin", icon: "📊" },
    { label: "ثبت سفارش جدید", path: "/dashboard/admin/orders/new", icon: "➕" },
    { label: "سفارشات در انتظار تایید", path: "/dashboard/admin/orders/pending", icon: "⏳" },
    { label: "موجودی انبار", path: "/dashboard/admin/stock", icon: "📦" },
  ],
  visitor: [
    { label: "برنامه امروز", path: "/dashboard/visitor/today", icon: "📅" },
    { label: "ثبت سفارش", path: "/dashboard/visitor/order", icon: "📝" },
    { label: "دریافت وجه", path: "/dashboard/visitor/cash", icon: "💵" },
    { label: "پورسانت من", path: "/dashboard/visitor/commission", icon: "💎" },
  ],
  customer: [
    { label: "قیمت‌ها", path: "/dashboard/customer/prices", icon: "💲" },
    { label: "سفارشات من", path: "/dashboard/customer/orders", icon: "📦" },
    { label: "پیگیری سفارش", path: "/dashboard/customer/track", icon: "🔍" },
  ],
};

const roleNames: Record<Role, string> = {
  manager: "مدیر کل",
  admin: "ادمین فروشگاه",
  visitor: "ویزیتور",
  customer: "مشتری",
};

export default function DashboardLayout({ children, role }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const menu = menuByRole[role] || menuByRole.customer;

  const handleLogout = () => {
    localStorage.removeItem("novin_auth_tokens");
    localStorage.removeItem("novin_user_profile");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex" dir="rtl">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-72 bg-stone-900 text-white transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-paprika-600 flex items-center justify-center font-black">N</div>
              <div>
                <p className="font-black text-sm">پنل {roleNames[role]}</p>
                <p className="text-[11px] text-stone-400">نوین - داشبورد فروش</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menu.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition ${isActive ? "bg-white text-stone-900 shadow" : "text-stone-400 hover:bg-white/10 hover:text-white"}`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/10 space-y-2">
            <button onClick={() => navigate("/")} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-stone-400 hover:bg-white/10 hover:text-white transition">
              <span>🏠</span> بازگشت به سایت اصلی
            </button>
            <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm bg-paprika-600/20 text-paprika-300 hover:bg-paprika-600 hover:text-white transition">
              <span>🚪</span> خروج
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 lg:mr-72">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-stone-200 lg:hidden">
          <div className="flex items-center justify-between p-4">
            <button onClick={() => setSidebarOpen(true)} className="h-10 w-10 rounded-xl bg-stone-900 text-white flex items-center justify-center">☰</button>
            <span className="font-black text-sm">پنل {roleNames[role]}</span>
            <div className="h-10 w-10" />
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
