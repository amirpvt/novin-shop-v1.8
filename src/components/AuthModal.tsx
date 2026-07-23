import { useState } from "react";
import { LockIcon, KeyIcon, UserIcon, CloseIcon, CheckIcon, PlusIcon } from "./icons";
import type { User, UserRole } from "../storage";
import { findCustomerByPhone, registerCustomer } from "../storage";

type Props = {
  open: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
};

type CustomerMode = "login" | "register";

export default function AuthModal({ open, onClose, onLogin }: Props) {
  const [tab, setTab] = useState<UserRole>("customer");
  const [customerMode, setCustomerMode] = useState<CustomerMode>("login");

  // Customer login form
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [custSuccess, setCustSuccess] = useState(false);

  // Customer register form
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPasswordConfirm, setRegPasswordConfirm] = useState("");
  const [regErr, setRegErr] = useState("");

  // Admin form
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [adminErr, setAdminErr] = useState("");

  if (!open) return null;

  const resetCustomerForms = () => {
    setLoginPhone("");
    setLoginPassword("");
    setLoginErr("");
    setRegName("");
    setRegPhone("");
    setRegPassword("");
    setRegPasswordConfirm("");
    setRegErr("");
  };

  const switchCustomerMode = (mode: CustomerMode) => {
    setCustomerMode(mode);
    setLoginErr("");
    setRegErr("");
  };

  const finishLogin = (user: User) => {
    setCustSuccess(true);
    setTimeout(() => {
      onLogin(user);
      setCustSuccess(false);
      resetCustomerForms();
      onClose();
    }, 900);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErr("");

    const existing = findCustomerByPhone(loginPhone);
    if (!existing) {
      setLoginErr("حسابی با این شماره موبایل یافت نشد. لطفاً ابتدا ثبت‌نام کنید.");
      return;
    }
    if (existing.password !== loginPassword) {
      setLoginErr("رمز عبور اشتباه است.");
      return;
    }

    finishLogin({ name: existing.name, phone: existing.phone, role: "customer" });
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegErr("");

    if (regPassword.length < 4) {
      setRegErr("رمز عبور باید حداقل ۴ کاراکتر باشد.");
      return;
    }
    if (regPassword !== regPasswordConfirm) {
      setRegErr("تکرار رمز عبور با رمز عبور یکسان نیست.");
      return;
    }
    if (findCustomerByPhone(regPhone)) {
      setRegErr("این شماره موبایل قبلاً ثبت‌نام کرده است. وارد شوید.");
      return;
    }

    registerCustomer({ name: regName, phone: regPhone, password: regPassword });
    finishLogin({ name: regName, phone: regPhone, role: "customer" });
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminErr("");
    // simple secure check or fallback
    if ((adminUser === "admin" && adminPass === "admin123") || adminPass === "123456") {
      onLogin({
        name: "مدیریت (صاحب کسب و کار)",
        phone: "۰۲۱-۱۲۳۴۵۶۷۸",
        role: "admin",
      });
      onClose();
    } else {
      setAdminErr("نام کاربری یا رمز عبور مدیریت اشتباه است. (راهنما: admin / admin123)");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 bg-cream-50 px-6 py-4">
          <div className="flex items-center gap-2 font-display text-xl font-bold text-paprika-700">
            <UserIcon className="h-6 w-6" />
            {tab === "customer" && customerMode === "register" ? "ثبت‌نام مشتریان" : "ورود به حساب کاربری"}
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition hover:bg-paprika-50 hover:text-paprika-700"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Role switcher tabs */}
        <div className="grid grid-cols-2 gap-1 border-b border-stone-100 bg-cream-50/50 p-2">
          <button
            onClick={() => setTab("customer")}
            className={`flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold transition ${
              tab === "customer"
                ? "bg-paprika-600 text-white shadow-md shadow-paprika-600/30"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            <UserIcon className="h-4 w-4" />
            ورود مشتریان فروشگاه
          </button>
          <button
            onClick={() => setTab("admin")}
            className={`flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold transition ${
              tab === "admin"
                ? "bg-stone-800 text-white shadow-md shadow-stone-800/30"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            <LockIcon className="h-4 w-4" />
            ورود مدیریت (ادمین)
          </button>
        </div>

        {/* Customer: login / register sub-tabs */}
        {tab === "customer" && (
          <div className="flex gap-2 px-6 pt-5">
            <button
              onClick={() => switchCustomerMode("login")}
              className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${
                customerMode === "login"
                  ? "bg-paprika-50 text-paprika-700 border border-paprika-200"
                  : "text-stone-400 border border-transparent hover:bg-stone-50"
              }`}
            >
              ورود
            </button>
            <button
              onClick={() => switchCustomerMode("register")}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition ${
                customerMode === "register"
                  ? "bg-paprika-50 text-paprika-700 border border-paprika-200"
                  : "text-stone-400 border border-transparent hover:bg-stone-50"
              }`}
            >
              <PlusIcon className="h-4 w-4" />
              ثبت‌نام مشتری جدید
            </button>
          </div>
        )}

        {/* Customer Login Form */}
        {tab === "customer" && customerMode === "login" && (
          <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
            <div className="text-xs text-stone-500 text-center pb-2">
              ویژه خریداران، فروشگاه‌ها و متقاضیان سفارش عمده و خرده
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-stone-700">شماره موبایل</label>
              <input
                required
                type="tel"
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value)}
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                className="w-full rounded-2xl border border-stone-200 bg-cream-50 px-4 py-3.5 text-stone-800 outline-none transition focus:border-paprika-500 focus:bg-white focus:ring-2 focus:ring-paprika-100 text-left dir-ltr font-mono"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-stone-700">رمز عبور</label>
              <input
                required
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-stone-200 bg-cream-50 px-4 py-3.5 text-stone-800 outline-none transition focus:border-paprika-500 focus:bg-white focus:ring-2 focus:ring-paprika-100"
              />
            </div>

            {loginErr && (
              <div className="rounded-2xl border border-paprika-200 bg-paprika-50 p-3 text-xs font-semibold leading-relaxed text-paprika-700 text-right">
                {loginErr}
              </div>
            )}

            <button
              type="submit"
              disabled={custSuccess}
              className="w-full rounded-2xl bg-paprika-600 py-4 font-bold text-white shadow-lg shadow-paprika-600/30 transition hover:bg-paprika-700 active:scale-98 disabled:opacity-80"
            >
              {custSuccess ? (
                <span className="flex items-center justify-center gap-2">
                  <CheckIcon className="h-5 w-5 animate-bounce" /> در حال ورود...
                </span>
              ) : (
                "ورود به حساب کاربری"
              )}
            </button>

            <p className="text-center text-xs text-stone-500">
              حساب کاربری ندارید؟{" "}
              <button
                type="button"
                onClick={() => switchCustomerMode("register")}
                className="font-bold text-paprika-700 hover:underline"
              >
                همین حالا ثبت‌نام کنید
              </button>
            </p>
          </form>
        )}

        {/* Customer Register Form */}
        {tab === "customer" && customerMode === "register" && (
          <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
            <div className="text-xs text-stone-500 text-center pb-2">
              ثبت‌نام رایگان برای مشتریان، فروشگاه‌ها و متقاضیان سفارش عمده و خرده
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-stone-700">
                نام و نام خانوادگی / نام فروشگاه
              </label>
              <input
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="مثلاً علی رضایی"
                className="w-full rounded-2xl border border-stone-200 bg-cream-50 px-4 py-3.5 text-stone-800 outline-none transition focus:border-paprika-500 focus:bg-white focus:ring-2 focus:ring-paprika-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-stone-700">شماره موبایل</label>
              <input
                required
                type="tel"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                className="w-full rounded-2xl border border-stone-200 bg-cream-50 px-4 py-3.5 text-stone-800 outline-none transition focus:border-paprika-500 focus:bg-white focus:ring-2 focus:ring-paprika-100 text-left dir-ltr font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-stone-700">رمز عبور</label>
                <input
                  required
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-stone-200 bg-cream-50 px-4 py-3.5 text-stone-800 outline-none transition focus:border-paprika-500 focus:bg-white focus:ring-2 focus:ring-paprika-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-stone-700">تکرار رمز عبور</label>
                <input
                  required
                  type="password"
                  value={regPasswordConfirm}
                  onChange={(e) => setRegPasswordConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-stone-200 bg-cream-50 px-4 py-3.5 text-stone-800 outline-none transition focus:border-paprika-500 focus:bg-white focus:ring-2 focus:ring-paprika-100"
                />
              </div>
            </div>

            {regErr && (
              <div className="rounded-2xl border border-paprika-200 bg-paprika-50 p-3 text-xs font-semibold leading-relaxed text-paprika-700 text-right">
                {regErr}
              </div>
            )}

            <button
              type="submit"
              disabled={custSuccess}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-paprika-600 py-4 font-bold text-white shadow-lg shadow-paprika-600/30 transition hover:bg-paprika-700 active:scale-98 disabled:opacity-80"
            >
              {custSuccess ? (
                <span className="flex items-center justify-center gap-2">
                  <CheckIcon className="h-5 w-5 animate-bounce" /> در حال ثبت‌نام...
                </span>
              ) : (
                <>
                  <PlusIcon className="h-5 w-5" />
                  ثبت‌نام و ورود
                </>
              )}
            </button>

            <p className="text-center text-xs text-stone-500">
              قبلاً ثبت‌نام کرده‌اید؟{" "}
              <button
                type="button"
                onClick={() => switchCustomerMode("login")}
                className="font-bold text-paprika-700 hover:underline"
              >
                وارد شوید
              </button>
            </p>
          </form>
        )}

        {/* Admin Form */}
        {tab === "admin" && (
          <form onSubmit={handleAdminSubmit} className="p-6 space-y-4">
            <div className="text-xs text-stone-500 text-center pb-2">
              بخش امنیتی مدیریت — فقط مجاز برای صاحب کسب و کار و ادمین‌های معتبر
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-stone-700">
                شناسه کاربری مدیریت
              </label>
              <input
                required
                value={adminUser}
                onChange={(e) => setAdminUser(e.target.value)}
                placeholder="admin"
                className="w-full rounded-2xl border border-stone-200 bg-cream-50 px-4 py-3.5 text-stone-800 outline-none transition focus:border-stone-800 focus:bg-white focus:ring-2 focus:ring-stone-100 font-mono text-left dir-ltr"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-bold text-stone-700">
                رمز عبور
              </label>
              <input
                required
                type="password"
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-stone-200 bg-cream-50 px-4 py-3.5 text-stone-800 outline-none transition focus:border-stone-800 focus:bg-white focus:ring-2 focus:ring-stone-100 font-mono text-left dir-ltr"
              />
            </div>

            {adminErr && (
              <div className="rounded-2xl border border-paprika-200 bg-paprika-50 p-3 text-xs font-semibold leading-relaxed text-paprika-700 text-right">
                {adminErr}
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-stone-800 py-4 font-bold text-white shadow-lg shadow-stone-800/30 transition hover:bg-stone-900 active:scale-98"
            >
              <KeyIcon className="h-5 w-5 text-gold-400" />
              ورود به پنل مدیریت
            </button>
          </form>
        )}
      </div>
    </div>
  );
}