import { useEffect, useState } from "react";
import { 
  MenuIcon, 
  CloseIcon, 
  PhoneIcon, 
  UserIcon, 
  LogOutIcon, 
  CrownIcon, 
  CheckIcon,
  TruckIcon,
  PackageIcon
} from "./icons";
import { siteName } from "../data";
// FIXED: پشتیبانی از ApiUser هم + role superadmin
import type { User as OldUser } from "../storage";
import type { ApiUser } from "../api/client";

type User = OldUser | ApiUser;

type Props = {
  siteName: string;
  user: User | null;
  cartCount: number;
  currentPage: string;
  onHome: () => void;
  onShop: () => void;
  onOrder: () => void;
  onAbout: () => void;
  onContact: () => void;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
  onOpenCart: () => void;
  onSearch: (query: string) => void;
};

export default function Navbar({
  user,
  cartCount,
  currentPage,
  onHome,
  onShop,
  onOrder,
  onAbout,
  onContact,
  onOpenAuth,
  onOpenAdmin,
  onLogout,
  onOpenCart,
  onSearch,
}: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [mobileSearchValue, setMobileSearchValue] = useState("");

  const submitSearch = (value: string) => {
    const q = value.trim();
    if (!q) return;
    onSearch(q);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "خانه", onClick: onHome, id: "home" },
    { label: "فروشگاه", onClick: onShop, id: "shop" },
    { label: "سفارش عمده", onClick: onOrder, id: "wholesale-request" },
    { label: "درباره ما", onClick: onAbout, id: "about" },
    { label: "تماس با ما", onClick: onContact, id: "contact" },
  ];

  // 🐛 FIX: superadmin هم باید پنل ببیند، نه فقط admin
  const isAdmin = user && (user.role === "admin" || user.role === "superadmin");
  const userDisplayName = user ? (("name" in user && user.name) || (user as any).username || "کاربر") : "";

  return (
    <header className="fixed inset-x-0 top-0 z-[100] w-full font-sans transition-all duration-500">
      {/* --- TOP ANNOUNCEMENT BAR (Desktop Only) --- */}
      <div className={`hidden lg:block bg-stone-900 py-2.5 text-white transition-all duration-500 ${scrolled ? "-translate-y-full opacity-0 h-0" : "translate-y-0 opacity-100"}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 text-[11px] font-bold">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 text-gold-400">
              <TruckIcon className="h-3.5 w-3.5" />
              <span>ارسال سریع با ناوگان اختصاصی نوین</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckIcon className="h-3.5 w-3.5" />
              <span>تضمین کیفیت و تازگی فرآورده‌ها</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-stone-400">ساعات کاری: 9 صبح الی 21</span>
            </div>
            <a href="tel:09300117977" className="group flex items-center gap-2 transition hover:text-paprika-400">
              <PhoneIcon className="h-3.5 w-3.5 text-paprika-500 group-hover:animate-bounce" />
              <span dir="ltr">۰۹۳۰ ۰۱۱ ۷۹۷۷</span>
            </a>
          </div>
        </div>
      </div>

      {/* --- MAIN HEADER --- */}
      <div className={`transition-all duration-500 ${
        scrolled 
          ? "bg-white/90 backdrop-blur-xl shadow-2xl shadow-stone-900/5 py-2" 
          : "bg-cream-50 py-4 lg:py-6"
      }`}>
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-8 lg:min-w-[200px]">
            <button onClick={onHome} className="group flex items-center gap-3 text-right cursor-pointer">
                <div className="relative">
                  <img
                    src="/images/logo.png"
                    alt={siteName}
                    className="relative h-11 w-11 rounded-xl object-cover shadow-lg shadow-paprika-600/30 transition group-hover:scale-105 group-active:scale-95"
                  />
                </div>
              <div className="flex flex-col">
                <span className="font-display text-xl font-black tracking-tight text-stone-800 sm:text-2xl">
                  {siteName.split(' ')[0]} <span className="text-paprika-600">{siteName.split(' ').slice(1).join(' ')}</span>
                </span>
                <span className="text-[10px] font-bold text-stone-400">توزیع تخصصی فرآورده‌های گوشتی</span>
              </div>
            </button>
          </div>

          {/* Large Search Bar (Desktop Only) */}
          <form
            onSubmit={(e) => { e.preventDefault(); submitSearch(searchValue); }}
            className="hidden lg:flex flex-1 max-w-lg mx-8"
          >
            <div className="group relative w-full">
              <button
                type="submit"
                aria-label="جستجو"
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-stone-400 transition-colors group-focus-within:text-paprika-600 cursor-pointer"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </button>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="جستجوی سوسیس، کالباس، همبرگر..."
                className="w-full rounded-2xl border-2 border-transparent bg-stone-100 py-3 pr-11 pl-4 text-sm font-bold text-stone-800 outline-none transition-all focus:border-paprika-600/20 focus:bg-white focus:ring-4 focus:ring-paprika-600/5"
              />
            </div>
          </form>

          {/* Desktop Actions */}
          <div className="flex items-center gap-3 lg:min-w-[280px] justify-end">
            {/* User Auth Section */}
            <div className="hidden sm:flex items-center">
              {user ? (
                <div className="flex items-center gap-2 ml-2">
                  {isAdmin ? (
                    <>
                      <button
                        onClick={onOpenAdmin}
                        className="group flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-bold text-gold-400 shadow-xl transition hover:bg-stone-800 active:scale-95"
                      >
                        <CrownIcon className="h-4 w-4" />
                        <span className="hidden lg:inline">پنل مدیریت</span>
                      </button>
                      <div className="flex items-center gap-2 rounded-xl bg-white border border-stone-200 px-3 py-2 text-[10px] font-bold text-stone-600">
                        <span className="max-w-[80px] truncate">{userDisplayName}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl bg-white border border-stone-200 px-4 py-2 text-xs font-bold text-stone-700">
                      <UserIcon className="h-4 w-4 text-paprika-600" />
                      <span className="max-w-[80px] truncate">{userDisplayName}</span>
                    </div>
                  )}
                  <button
                    onClick={onLogout}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-paprika-50 text-paprika-600 transition hover:bg-paprika-600 hover:text-white"
                    title="خروج"
                  >
                    <LogOutIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-2 rounded-xl border-2 border-stone-200 bg-white px-5 py-2.5 text-xs font-bold text-stone-700 transition hover:border-paprika-600 hover:text-paprika-600 active:scale-95"
                >
                  <UserIcon className="h-4 w-4" />
                  ورود / ثبت‌ نام
                </button>
              )}
            </div>

            {/* Shopping Cart */}
            <button
              onClick={onOpenCart}
              className="group relative flex h-11 w-11 items-center justify-center rounded-xl bg-stone-900 text-white shadow-xl shadow-stone-900/10 transition-all hover:bg-paprika-600 active:scale-95 cursor-pointer"
              aria-label="سبد خرید"
            >
              <span className="text-xl">🛒</span>
              {cartCount > 0 && (
                <span className="absolute -left-2 -top-2 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-paprika-500 px-1.5 text-[11px] font-black text-white ring-4 ring-white shadow-lg animate-in zoom-in">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Hamburger (Mobile) */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-stone-800 shadow-sm border border-stone-200 lg:hidden cursor-pointer"
            >
              <MenuIcon className="h-6 w-6" />
            </button>

            {/* Desktop CTA */}
            <button
              onClick={onOrder}
              className="hidden lg:flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-paprika-600 to-paprika-700 px-6 py-3.5 text-sm font-black text-white shadow-xl shadow-paprika-600/30 transition-all hover:-translate-y-0.5 hover:shadow-paprika-600/40 active:translate-y-0 cursor-pointer"
            >
              <PackageIcon className="h-4 w-4" />
              <span>ثبت سفارش عمده</span>
            </button>
          </div>
        </nav>

        {/* Desktop Nav Links */}
        <div className="hidden lg:block border-t border-stone-200/50 mt-4 pt-2">
          <div className="mx-auto max-w-7xl flex items-center justify-center gap-1">
            {navLinks.map((l) => {
              const isActive = currentPage === l.id;
              return (
                <button
                  key={l.id}
                  onClick={l.onClick}
                  className={`relative px-6 py-3 text-sm font-bold transition-all hover:text-paprika-600 cursor-pointer ${
                    isActive ? "text-paprika-600" : "text-stone-600"
                  }`}
                >
                  {l.label}
                  {isActive && (
                    <span className="absolute bottom-0 inset-x-6 h-1 rounded-t-full bg-paprika-600 shadow-[0_-2px_8px_rgba(220,38,38,0.5)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- MOBILE DRAWER --- */}
      <div className={`fixed inset-0 z-[110] lg:hidden transition-all duration-500 ${mobileMenuOpen ? "visible" : "invisible pointer-events-none"}`}>
        <div 
          className={`absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity duration-500 ${mobileMenuOpen ? "opacity-100" : "opacity-0"}`} 
          onClick={() => setMobileMenuOpen(false)}
        />
        <div className={`absolute inset-y-0 right-0 w-80 max-w-[85vw] bg-white shadow-2xl transition-transform duration-500 ease-out ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex flex-col h-full text-right" dir="rtl">
            <div className="flex items-center justify-between p-6 border-b border-stone-100">
              <span className="font-display text-lg font-black text-stone-800">منوی اصلی</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg bg-stone-50 text-stone-400 cursor-pointer">
                <CloseIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 border-b border-stone-100 bg-stone-50/50">
              <form
                onSubmit={(e) => { e.preventDefault(); submitSearch(mobileSearchValue); setMobileMenuOpen(false); }}
                className="relative"
              >
                <button type="submit" className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 cursor-pointer">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </button>
                <input type="text" value={mobileSearchValue} onChange={(e) => setMobileSearchValue(e.target.value)} placeholder="جستجو میان محصولات..." className="w-full rounded-xl border border-stone-200 bg-white py-3 pr-10 pl-3 text-sm font-bold text-stone-800 outline-none focus:border-paprika-600/30" />
              </form>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-1">
                {navLinks.map((l) => {
                  const isActive = currentPage === l.id;
                  return (
                    <button key={l.id} onClick={() => { l.onClick(); setMobileMenuOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-4 py-4 text-right text-base font-bold transition-all cursor-pointer ${isActive ? "bg-paprika-50 text-paprika-600 shadow-sm" : "text-stone-700 hover:bg-stone-50"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-paprika-600" : "bg-stone-300"}`} />
                      {l.label}
                    </button>
                  );
                })}
              </div>
              {/* FIXED MOBILE ADMIN BUTTON */}
              {user && (
                <div className="mt-6 space-y-3">
                  {isAdmin && (
                    <button onClick={() => { onOpenAdmin(); setMobileMenuOpen(false); }} className="w-full flex items-center justify-center gap-2 rounded-2xl bg-stone-900 py-4 text-center font-black text-gold-400 shadow-xl">
                      <CrownIcon className="h-5 w-5" />
                      پنل مدیریت
                    </button>
                  )}
                  <button onClick={() => { onLogout(); setMobileMenuOpen(false); }} className="w-full rounded-2xl bg-paprika-50 py-3 text-center font-bold text-paprika-600">
                    خروج از حساب
                  </button>
                </div>
              )}
              {!user && (
                <div className="mt-6">
                  <button onClick={() => { onOpenAuth(); setMobileMenuOpen(false); }} className="w-full rounded-2xl bg-paprika-600 py-4 text-center font-black text-white shadow-xl">
                    ورود / ثبت‌نام
                  </button>
                </div>
              )}
              <div className="mt-8 px-2">
                <button onClick={() => { onOrder(); setMobileMenuOpen(false); }} className="w-full rounded-2xl bg-stone-900 py-4 text-center font-black text-white shadow-xl transition hover:bg-stone-800 cursor-pointer">
                  ثبت سفارش عمده نوین
                </button>
              </div>
            </div>
            <div className="p-6 border-t border-stone-100 bg-stone-50">
              <a href="tel:09300117977" className="flex flex-col gap-1 items-center text-center group">
                <div className="flex items-center gap-2 text-stone-900 font-black">
                  <PhoneIcon className="h-5 w-5 text-paprika-600" />
                  <span dir="ltr" className="text-lg tracking-wider">۰۹۳۰ ۰۱۱ ۷۹۷۷</span>
                </div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest leading-none">پشتیبانی ۲۴ ساعته مشتریان</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
