import { useEffect, useState } from "react";
import { MenuIcon, CloseIcon, PhoneIcon, UserIcon, LogOutIcon, CrownIcon, CheckIcon, TruckIcon, PackageIcon } from "./icons";
import { siteName } from "../data";
type Props = { siteName: string; user: any; cartCount: number; currentPage: string; onHome: () => void; onShop: () => void; onOrder: () => void; onAbout: () => void; onContact: () => void; onOpenAuth: () => void; onOpenAdmin: () => void; onLogout: () => void; onOpenCart: () => void; onSearch: (query: string) => void; onMyOrders?: () => void; };

export default function Navbar({ user, cartCount, currentPage, onHome, onShop, onOrder, onAbout, onContact, onOpenAuth, onOpenAdmin, onLogout, onOpenCart, onSearch, onMyOrders }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [mobileSearchValue, setMobileSearchValue] = useState("");
  const submitSearch = (value: string) => { const q = value.trim(); if (!q) return; onSearch(q); };
  useEffect(() => { const handleScroll = () => setScrolled(window.scrollY > 20); window.addEventListener("scroll", handleScroll); return () => window.removeEventListener("scroll", handleScroll); }, []);
  const navLinks = [
    { label: "خانه", onClick: onHome, id: "home" },
    { label: "فروشگاه", onClick: onShop, id: "shop" },
    { label: "سفارش عمده", onClick: onOrder, id: "wholesale-request" },
    { label: "درباره ما", onClick: onAbout, id: "about" },
    { label: "تماس با ما", onClick: onContact, id: "contact" },
  ];
  const isAdmin = user && (user.role === "admin" || user.role === "superadmin");
  const userDisplayName = user ? (user.name || user.username || "کاربر") : "";
  const goMyOrders = () => { if (onMyOrders) onMyOrders(); else window.location.href = "/my-orders"; };

  return (
    <header className="fixed inset-x-0 top-0 z-[100] w-full font-sans transition-all duration-300">
      {/* Top bar - کوچک‌تر شده */}
      <div className={`hidden lg:block bg-stone-900 py-1.5 text-white transition-all duration-300 ${scrolled ? "-translate-y-full opacity-0 h-0 py-0" : "translate-y-0 opacity-100"}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 text-[10px] font-bold">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-gold-400"><TruckIcon className="h-3 w-3" /><span>ارسال سریع با ناوگان نوین</span></div>
            <div className="flex items-center gap-1.5 text-emerald-400"><CheckIcon className="h-3 w-3" /><span>تضمین تازگی</span></div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-stone-400">ساعات کاری: 9 تا 21</span>
            <a href="tel:09300117977" className="flex items-center gap-1.5 hover:text-paprika-400"><PhoneIcon className="h-3 w-3 text-paprika-500" /><span dir="ltr">۰۹۳۰ ۰۱۱ ۷۹۷۷</span></a>
          </div>
        </div>
      </div>

      {/* Main header - خیلی جمع‌وجورتر */}
      <div className={`transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-xl shadow-lg py-1.5" : "bg-cream-50 py-2.5 lg:py-3"}`}>
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6 lg:min-w-[180px]">
            <button onClick={onHome} className="group flex items-center gap-2.5 text-right cursor-pointer">
              <img src="/images/logo.png" alt={siteName} className="h-9 w-9 lg:h-10 lg:w-10 rounded-lg object-cover shadow-md" />
              <div className="flex flex-col">
                <span className="font-display text-lg font-black tracking-tight text-stone-800 sm:text-xl">{siteName.split(' ')[0]} <span className="text-paprika-600">{siteName.split(' ').slice(1).join(' ')}</span></span>
                <span className="hidden lg:block text-[9px] font-bold text-stone-400">توزیع تخصصی فرآورده‌های گوشتی</span>
              </div>
            </button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); submitSearch(searchValue); }} className="hidden lg:flex flex-1 max-w-md mx-6">
            <div className="group relative w-full">
              <button type="submit" className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 group-focus-within:text-paprika-600"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg></button>
              <input type="text" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder="جستجوی سوسیس، کالباس..." className="w-full rounded-xl border-2 border-transparent bg-stone-100 py-2 pr-9 pl-3 text-xs font-bold text-stone-800 outline-none focus:border-paprika-600/20 focus:bg-white" />
            </div>
          </form>

          <div className="flex items-center gap-2 lg:min-w-[300px] justify-end">
            <div className="hidden sm:flex items-center">
              {user ? (
                <div className="flex items-center gap-1.5 ml-1">
                  {isAdmin ? (
                    <>
                      <button onClick={onOpenAdmin} className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-2 text-[11px] font-bold text-gold-400 shadow"><CrownIcon className="h-3.5 w-3.5" /><span className="hidden lg:inline">پنل مدیریت</span></button>
                      <button onClick={goMyOrders} className="rounded-lg bg-white border px-2.5 py-2 text-[11px] font-bold">سفارشات من</button>
                      <div className="rounded-lg bg-white border px-2.5 py-2 text-[10px] font-bold max-w-[60px] truncate">{userDisplayName}</div>
                    </>
                  ) : (
                    <>
                      <button onClick={goMyOrders} className="flex items-center gap-1.5 rounded-lg bg-paprika-50 border border-paprika-200 px-3 py-2 text-[11px] font-bold text-paprika-700"><span>📦</span><span className="hidden lg:inline">سفارشات من</span></button>
                      <div className="flex items-center gap-1.5 rounded-lg bg-white border px-3 py-2 text-[11px] font-bold"><UserIcon className="h-3.5 w-3.5 text-paprika-600" /><span className="max-w-[70px] truncate">{userDisplayName}</span></div>
                    </>
                  )}
                  <button onClick={onLogout} className="flex h-8 w-8 items-center justify-center rounded-lg bg-paprika-50 text-paprika-600 hover:bg-paprika-600 hover:text-white"><LogOutIcon className="h-3.5 w-3.5" /></button>
                </div>
              ) : (
                <button onClick={onOpenAuth} className="flex items-center gap-1.5 rounded-lg border bg-white px-4 py-2 text-[11px] font-bold hover:border-paprika-600"><UserIcon className="h-3.5 w-3.5" />ورود</button>
              )}
            </div>

            <button onClick={onOpenCart} className="relative flex h-9 w-9 lg:h-10 lg:w-10 items-center justify-center rounded-lg bg-stone-900 text-white shadow"><span className="text-base">🛒</span>{cartCount > 0 && (<span className="absolute -left-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-paprika-500 px-1 text-[10px] font-black text-white">{cartCount}</span>)}</button>
            <button onClick={() => setMobileMenuOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border lg:hidden"><MenuIcon className="h-5 w-5" /></button>
            <button onClick={onOrder} className="hidden lg:flex items-center gap-1.5 rounded-xl bg-paprika-600 px-4 py-2 text-xs font-black text-white shadow">ثبت عمده</button>
          </div>
        </nav>

        {/* Secondary nav - جمع‌وجورتر */}
        <div className="hidden lg:block border-t border-stone-200/50 mt-2 pt-1.5">
          <div className="mx-auto max-w-7xl flex items-center justify-center gap-1">
            {navLinks.map((l) => { const isActive = currentPage === l.id; return (<button key={l.id} onClick={l.onClick} className={`relative px-4 py-2 text-xs font-bold ${isActive ? "text-paprika-600" : "text-stone-600 hover:text-paprika-600"}`}>{l.label}{isActive && (<span className="absolute bottom-0 inset-x-3 h-0.5 rounded-full bg-paprika-600" />)}</button>); })}
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className={`fixed inset-0 z-[110] lg:hidden ${mobileMenuOpen ? "visible" : "invisible pointer-events-none"}`}>
        <div className={`absolute inset-0 bg-stone-900/60 ${mobileMenuOpen ? "opacity-100" : "opacity-0"}`} onClick={() => setMobileMenuOpen(false)} />
        <div className={`absolute inset-y-0 right-0 w-80 max-w-[85vw] bg-white shadow-2xl ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex flex-col h-full text-right" dir="rtl">
            <div className="flex items-center justify-between p-5 border-b"><span className="font-black">منو</span><button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg bg-stone-50"><CloseIcon className="h-5 w-5" /></button></div>
            <div className="p-4 flex-1 overflow-y-auto">
              <div className="space-y-1">
                {navLinks.map((l) => (<button key={l.id} onClick={() => { l.onClick(); setMobileMenuOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-right text-sm font-bold text-stone-700 hover:bg-stone-50">{l.label}</button>))}
              </div>
              {user && (<div className="mt-6 space-y-2"><button onClick={() => { goMyOrders(); setMobileMenuOpen(false); }} className="w-full rounded-xl bg-paprika-50 border py-3 font-bold text-paprika-700">📦 سفارشات من</button>{isAdmin && (<button onClick={() => { onOpenAdmin(); setMobileMenuOpen(false); }} className="w-full rounded-xl bg-stone-900 py-3 text-gold-400 font-black">پنل مدیریت</button>)}<button onClick={() => { onLogout(); setMobileMenuOpen(false); }} className="w-full rounded-xl bg-paprika-50 py-3 text-paprika-600 font-bold">خروج</button></div>)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
