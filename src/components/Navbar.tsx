import { useEffect, useState } from "react";
import { MenuIcon, CloseIcon, PhoneIcon, UserIcon, LogOutIcon, CrownIcon, CheckIcon, TruckIcon } from "./icons";
import { siteName } from "../data";
type Props = { siteName: string; user: any; cartCount: number; currentPage: string; onHome: () => void; onShop: () => void; onOrder: () => void; onAbout: () => void; onContact: () => void; onOpenAuth: () => void; onLogout: () => void; onOpenCart: () => void; onSearch: (query: string) => void; onMyOrders?: () => void; };

export default function Navbar({ user, cartCount, currentPage, onHome, onShop, onOrder, onAbout, onContact, onOpenAuth, onLogout, onOpenCart, onSearch, onMyOrders }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const submitSearch = (value: string) => { const q = value.trim(); if (!q) return; onSearch(q); };
  useEffect(() => { const handleScroll = () => setScrolled(window.scrollY > 20); window.addEventListener("scroll", handleScroll); return () => window.removeEventListener("scroll", handleScroll); }, []);
  const navLinks = [
    { label: "خانه", onClick: onHome, id: "home" },
    { label: "فروشگاه", onClick: onShop, id: "shop" },
    { label: "سفارش عمده", onClick: onOrder, id: "wholesale-request" },
    { label: "درباره ما", onClick: onAbout, id: "about" },
    { label: "تماس با ما", onClick: onContact, id: "contact" },
  ];

  const isManager = user && (user.role === "manager" || user.role === "superadmin");
  const isAdmin = user && user.role === "admin";
  const isVisitor = user && user.role === "visitor";
  const isCustomer = user && user.role === "customer";
  const userDisplayName = user ? (user.name || [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || "کاربر") : "";
  const userPhone = user ? (user.phone || user.customer?.phone || user.mobile || "شماره ثبت نشده") : "";
  const userInitial = userDisplayName.trim().charAt(0) || "ن";
  const roleLabel = isManager ? "مدیر کل" : isAdmin ? "ادمین فروشگاه" : isVisitor ? "ویزیتور" : isCustomer ? "مشتری" : "کاربر";
  const roleBadgeClass = isManager
    ? "from-amber-400 via-gold-500 to-amber-600 text-stone-950"
    : isAdmin
      ? "from-stone-800 via-stone-900 to-black text-white"
      : isVisitor
        ? "from-blue-500 via-sky-500 to-cyan-500 text-white"
        : "from-paprika-500 via-paprika-600 to-red-600 text-white";

  // مسیرهای مخصوص هر نقش
  const goManagerPanel = () => { setAccountMenuOpen(false); window.location.href = "/dashboard/manager"; };
  const goAdminPanel = () => { setAccountMenuOpen(false); window.location.href = "/admin"; };
  const goVisitorPanel = () => { setAccountMenuOpen(false); window.location.href = "/dashboard/visitor/today"; };
  const goMyProfile = () => { setAccountMenuOpen(false); window.location.href = "/profile"; };
  const goMyOrders = () => { setAccountMenuOpen(false); if (onMyOrders) onMyOrders(); else window.location.href = "/my-orders"; };
  const handleAccountLogout = () => { setAccountMenuOpen(false); onLogout(); };

  return (
    <header className="fixed inset-x-0 top-0 z-[100] w-full font-sans transition-all duration-300">
      <div className={`hidden lg:block bg-stone-900 py-1.5 text-white transition-all duration-300 ${scrolled ? "-translate-y-full opacity-0 h-0 py-0" : "translate-y-0 opacity-100"}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 text-[10px] font-bold">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-gold-400"><TruckIcon className="h-3 w-3" /><span>ارسال سریع</span></div>
            <div className="flex items-center gap-1.5 text-emerald-400"><CheckIcon className="h-3 w-3" /><span>تضمین تازگی</span></div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-stone-400">ساعات کاری: 9 تا 21</span>
            <a href="tel:09300117977" className="flex items-center gap-1.5 hover:text-paprika-400"><PhoneIcon className="h-3 w-3 text-paprika-500" /><span dir="ltr">09300117977</span></a>
          </div>
        </div>
      </div>

      <div className={`transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-xl shadow-lg py-1.5" : "bg-cream-50 py-2.5 lg:py-3"}`}>
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6 lg:min-w-[180px]">
            <button onClick={onHome} className="group flex items-center gap-2.5 text-right cursor-pointer">
              <img src="/images/logo.png" alt={siteName} className="h-9 w-9 lg:h-10 lg:w-10 rounded-lg object-cover shadow-md" />
              <div className="flex min-w-0 flex-col">
                <span className="max-w-[190px] truncate font-display text-base font-black tracking-tight text-stone-800 sm:max-w-none sm:text-xl">{siteName.split(' ')[0]} <span className="text-paprika-600">{siteName.split(' ').slice(1).join(' ')}</span></span>
                <span className="hidden lg:block text-[9px] font-bold text-stone-400">توزیع تخصصی</span>
              </div>
            </button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); submitSearch(searchValue); }} className="hidden lg:flex flex-1 max-w-md mx-6">
            <div className="group relative w-full">
              <button type="submit" className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg></button>
              <input type="text" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder="جستجوی سوسیس، کالباس..." className="w-full rounded-xl border-2 border-transparent bg-stone-100 py-2 pr-9 pl-3 text-xs font-bold outline-none focus:border-paprika-600/20 focus:bg-white" />
            </div>
          </form>

          <div className="flex shrink-0 items-center gap-2 lg:min-w-[300px] justify-end">
            <div className="hidden sm:flex items-center">
              {user ? (
                <div className="relative ml-1">
                  <button
                    type="button"
                    onClick={() => setAccountMenuOpen((open) => !open)}
                    className={`group flex items-center gap-2 rounded-2xl border bg-white px-2.5 py-2 shadow-sm transition hover:-translate-y-0.5 hover:border-paprika-200 hover:shadow-xl ${accountMenuOpen ? "border-paprika-200 shadow-xl" : "border-stone-200"}`}
                  >
                    <span className={`flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br ${roleBadgeClass} text-sm font-black shadow-lg`}>
                      {userInitial}
                    </span>
                    <span className="hidden min-w-0 flex-col items-start text-right lg:flex">
                      <span className="max-w-[128px] truncate text-xs font-black text-stone-900">{userDisplayName}</span>
                      <span className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-stone-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        حساب کاربری
                      </span>
                    </span>
                    <span className={`text-xs text-stone-400 transition ${accountMenuOpen ? "rotate-180" : ""}`}>⌄</span>
                  </button>

                  {accountMenuOpen && (
                    <div className="absolute left-0 top-[calc(100%+12px)] z-[140] w-[330px] overflow-hidden rounded-[2rem] border border-stone-200 bg-white text-right shadow-2xl shadow-stone-900/15" dir="rtl">
                      <div className={`relative overflow-hidden bg-gradient-to-br ${roleBadgeClass} p-5`}>
                        <div className="absolute -left-10 -top-10 h-28 w-28 rounded-full bg-white/20 blur-2xl" />
                        <div className="relative flex items-center gap-3">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/95 text-xl font-black text-stone-900 shadow-xl">
                            {userInitial}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-black">{userDisplayName}</div>
                            <div dir="ltr" className="mt-1 text-right font-mono text-xs font-bold opacity-90">{userPhone}</div>
                            <div className="mt-2 inline-flex rounded-full bg-white/20 px-3 py-1 text-[10px] font-black backdrop-blur">
                              {roleLabel}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-3">
                        <div className="mb-3 rounded-2xl bg-stone-50 p-3">
                          <div className="mb-1 text-[10px] font-black text-stone-400">اطلاعات حساب</div>
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div className="rounded-xl bg-white p-2">
                              <span className="block text-stone-400">نام و نام خانوادگی</span>
                              <span className="mt-1 block truncate font-black text-stone-800">{userDisplayName}</span>
                            </div>
                            <div className="rounded-xl bg-white p-2">
                              <span className="block text-stone-400">شماره تماس</span>
                              <span dir="ltr" className="mt-1 block truncate text-right font-mono font-black text-stone-800">{userPhone}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <button onClick={goMyProfile} className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-xs font-black text-stone-700 transition hover:bg-gold-50 hover:text-amber-700">
                            <span className="flex items-center gap-2"><UserIcon className="h-4 w-4" /> ویرایش اطلاعات</span>
                            <span className="text-stone-300">←</span>
                          </button>
                          {isCustomer && (
                            <button onClick={goMyOrders} className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-xs font-black text-stone-700 transition hover:bg-paprika-50 hover:text-paprika-700">
                              <span className="flex items-center gap-2"><span>📦</span> سفارش‌های من</span>
                              <span className="text-stone-300">←</span>
                            </button>
                          )}
                          {isManager && (
                            <button onClick={goManagerPanel} className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-xs font-black text-stone-700 transition hover:bg-amber-50 hover:text-amber-700">
                              <span className="flex items-center gap-2"><CrownIcon className="h-4 w-4" /> مدیریت کل</span>
                              <span className="text-stone-300">←</span>
                            </button>
                          )}
                          {isAdmin && (
                            <button onClick={goAdminPanel} className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-xs font-black text-stone-700 transition hover:bg-stone-100">
                              <span className="flex items-center gap-2"><CrownIcon className="h-4 w-4" /> پنل ادمین</span>
                              <span className="text-stone-300">←</span>
                            </button>
                          )}
                          {isVisitor && (
                            <button onClick={goVisitorPanel} className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-xs font-black text-stone-700 transition hover:bg-blue-50 hover:text-blue-700">
                              <span className="flex items-center gap-2"><span>🧑‍💼</span> پنل ویزیتور</span>
                              <span className="text-stone-300">←</span>
                            </button>
                          )}
                          <button onClick={() => { setAccountMenuOpen(false); onOpenCart(); }} className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-xs font-black text-stone-700 transition hover:bg-emerald-50 hover:text-emerald-700">
                            <span className="flex items-center gap-2"><span>🛒</span> سبد خرید</span>
                            <span className="rounded-full bg-paprika-500 px-2 py-0.5 text-[10px] text-white">{cartCount}</span>
                          </button>
                        </div>

                        <div className="mt-3 border-t border-stone-100 pt-3">
                          <button onClick={handleAccountLogout} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-paprika-50 px-4 py-3 text-xs font-black text-paprika-700 transition hover:bg-paprika-600 hover:text-white">
                            <LogOutIcon className="h-4 w-4" />
                            خروج از حساب کاربری
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={onOpenAuth} className="group flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-3 py-2 shadow-sm transition hover:-translate-y-0.5 hover:border-paprika-200 hover:shadow-xl">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-stone-900 to-stone-700 text-white shadow-md transition group-hover:from-paprika-600 group-hover:to-red-600">
                    <UserIcon className="h-4 w-4" />
                  </span>
                  <span className="hidden flex-col items-start text-right lg:flex">
                    <span className="text-xs font-black text-stone-900">ورود / ثبت‌نام</span>
                    <span className="text-[10px] font-bold text-stone-400">حساب کاربری</span>
                  </span>
                  <span className="text-xs text-stone-400">⌄</span>
                </button>
              )}
            </div>

            <button onClick={onOpenCart} className="relative flex h-9 w-9 lg:h-10 lg:w-10 items-center justify-center rounded-lg bg-stone-900 text-white shadow"><span className="text-base">🛒</span>{cartCount > 0 && (<span className="absolute -left-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-paprika-500 px-1 text-[10px] font-black text-white">{cartCount}</span>)}</button>
            <button onClick={() => setMobileMenuOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border lg:hidden"><MenuIcon className="h-5 w-5" /></button>
            <button onClick={onOrder} className="hidden lg:flex items-center gap-1.5 rounded-xl bg-paprika-600 px-4 py-2 text-xs font-black text-white shadow">ثبت عمده</button>
          </div>
        </nav>

        <div className="hidden lg:block border-t border-stone-200/50 mt-2 pt-1.5">
          <div className="mx-auto max-w-7xl flex items-center justify-center gap-1">
            {navLinks.map((l) => { const isActive = currentPage === l.id; return (<button key={l.id} onClick={l.onClick} className={`relative px-4 py-2 text-xs font-bold ${isActive ? "text-paprika-600" : "text-stone-600 hover:text-paprika-600"}`}>{l.label}{isActive && (<span className="absolute bottom-0 inset-x-3 h-0.5 rounded-full bg-paprika-600" />)}</button>); })}
          </div>
        </div>
      </div>

      <div className={`fixed inset-0 z-[110] lg:hidden ${mobileMenuOpen ? "visible" : "invisible pointer-events-none"}`}>
        <div className={`absolute inset-0 bg-stone-900/60 ${mobileMenuOpen ? "opacity-100" : "opacity-0"}`} onClick={() => setMobileMenuOpen(false)} />
        <div className={`absolute inset-y-0 right-0 w-80 max-w-[85vw] bg-white shadow-2xl ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex flex-col h-full text-right" dir="rtl">
            <div className="flex items-center justify-between p-5 border-b"><span className="font-black">منو</span><button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg bg-stone-50"><CloseIcon className="h-5 w-5" /></button></div>
            <div className="p-4 flex-1 overflow-y-auto">
              <form onSubmit={(e) => { e.preventDefault(); submitSearch(searchValue); setMobileMenuOpen(false); }} className="mb-4">
                <div className="relative">
                  <button type="submit" className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400" aria-label="جستجو"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg></button>
                  <input type="text" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder="جستجوی محصول..." className="w-full rounded-2xl border-2 border-stone-100 bg-stone-50 py-3 pr-10 pl-3 text-sm font-bold outline-none focus:border-paprika-200 focus:bg-white" />
                </div>
              </form>
              <div className="space-y-1">
                {navLinks.map((l) => (<button key={l.id} onClick={() => { l.onClick(); setMobileMenuOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-right text-sm font-bold text-stone-700 hover:bg-stone-50">{l.label}</button>))}
              </div>
              {!user && (
                <div className="mt-6 rounded-[1.5rem] border border-stone-100 bg-stone-50 p-3">
                  <button onClick={() => { onOpenAuth(); setMobileMenuOpen(false); }} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 py-3 text-sm font-black text-white shadow-lg">
                    <UserIcon className="h-4 w-4" />
                    ورود / ثبت‌نام
                  </button>
                </div>
              )}
              {user && (
                <div className="mt-6 space-y-2">
                  <div className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${roleBadgeClass} p-4 shadow-xl`}>
                    <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-white/20 blur-2xl" />
                    <div className="relative flex items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-xl font-black text-stone-900 shadow-lg">{userInitial}</div>
                      <div className="min-w-0 flex-1 text-white">
                        <div className="truncate text-sm font-black">{userDisplayName}</div>
                        <div dir="ltr" className="mt-1 text-right font-mono text-xs font-bold opacity-90">{userPhone}</div>
                        <div className="mt-2 inline-flex rounded-full bg-white/20 px-3 py-1 text-[10px] font-black backdrop-blur">{roleLabel}</div>
                      </div>
                    </div>
                  </div>
                  {isManager && <button onClick={() => { goManagerPanel(); setMobileMenuOpen(false); }} className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-gold-600 py-3 text-stone-900 font-black shadow">👑 مدیریت کل</button>}
                  {isAdmin && <button onClick={() => { goAdminPanel(); setMobileMenuOpen(false); }} className="w-full rounded-xl bg-stone-900 py-3 text-white font-black">🛡️ پنل ادمین</button>}
                  {isVisitor && <button onClick={() => { goVisitorPanel(); setMobileMenuOpen(false); }} className="w-full rounded-xl bg-blue-600 py-3 text-white font-black">🧑‍💼 پنل ویزیتور</button>}
                  <button onClick={() => { goMyProfile(); setMobileMenuOpen(false); }} className="w-full rounded-xl bg-gold-50 border border-gold-100 py-3 font-bold text-amber-700">👤 ویرایش اطلاعات</button>
                  {isCustomer && <button onClick={() => { goMyOrders(); setMobileMenuOpen(false); }} className="w-full rounded-xl bg-paprika-50 border py-3 font-bold text-paprika-700">📦 سفارشات من</button>}
                  <button onClick={() => { handleAccountLogout(); setMobileMenuOpen(false); }} className="w-full rounded-xl bg-paprika-50 py-3 text-paprika-600 font-bold">خروج</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
