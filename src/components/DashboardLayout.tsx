/**
 * DashboardLayout.tsx - لایه‌اوت جدا برای داشبوردها با سایدبار مخصوص هر نقش
 * کاملا جدا از لایه‌اوت اصلی سایت (هدر/فوتر اصلی دست نمی‌خورد)
 */
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { CloseIcon, MenuIcon } from "./icons";

type Role = "manager" | "admin" | "visitor" | "customer";

interface Props {
  children: React.ReactNode;
  role: Role;
}

const menuByRole: Record<Role, { label: string; path: string; icon: string }[]> = {
  manager: [
    { label: "داشبورد", path: "/dashboard/manager", icon: "📊" },
    { label: "برنامه امروز", path: "/dashboard/manager/today", icon: "📅" },
    { label: "مدیریت محصولات", path: "/dashboard/manager/pricing", icon: "💰" },
    { label: "مدیریت سفارش‌ها", path: "/dashboard/manager/orders", icon: "📦" },
    { label: "پورسانت‌ها", path: "/dashboard/manager/commissions", icon: "💎" },
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
    { label: "سفارشات ثبت‌شده من", path: "/dashboard/visitor/orders", icon: "📦" },
    { label: "مشتری‌ها", path: "/dashboard/visitor/customers", icon: "👥" },
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
  // روی دسکتاپ (lg به بالا) پیش‌فرض باز است، روی موبایل بسته
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 1024
  );
  const navigate = useNavigate();
  const location = useLocation();
  const menu = menuByRole[role] || menuByRole.customer;

  const isDesktop = () => typeof window !== "undefined" && window.innerWidth >= 1024;

  const handleLogout = () => {
    localStorage.removeItem("novin_auth_tokens");
    localStorage.removeItem("novin_user_profile");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex" dir="rtl">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-72 bg-stone-900 text-white transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <img
                src="/images/logo.png"
                alt="پخش سوسیس و کالباس نوین"
                className="h-10 w-10 shrink-0 rounded-xl bg-white object-contain p-0.5 ring-1 ring-inset ring-white/20"
              />
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
                  onClick={() => { if (!isDesktop()) setSidebarOpen(false); }}
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
      <div className={`flex-1 transition-[margin] duration-300 ${sidebarOpen ? "lg:mr-72" : "lg:mr-0"}`}>
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-stone-200">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label={sidebarOpen ? "بستن منو" : "باز کردن منو"}
              title={sidebarOpen ? "بستن منو" : "باز کردن منو"}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-white transition hover:bg-stone-700"
            >
              {sidebarOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
            <span className="font-black text-sm">پنل {roleNames[role]}</span>
            <div className="h-10 w-10" />
          </div>
        </header>

        <main className={role === "visitor" ? "p-0" : "p-4 sm:p-6 lg:p-8"}>
          {children}
        </main>
      </div>
    </div>
  );
}
