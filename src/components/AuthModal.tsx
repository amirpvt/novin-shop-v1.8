import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";

type Tab = "login" | "register";

interface Props {
  open: boolean;
  onClose: () => void;
  onLogin?: (user: any) => void;
  initialTab?: Tab;
  checkoutMode?: boolean;
}

export default function AuthModal({ open, onClose, onLogin, initialTab = "login", checkoutMode = false }: Props) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<Tab>("login");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [r, setR] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    username: "",
    address: "",
    password: "",
    password2: "",
  });

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setErr(null);
    }
  }, [open, initialTab]);

  if (!open) return null;

  const reset = () => {
    setErr(null);
    setUsername("");
    setPassword("");
    setR({ first_name: "", last_name: "", phone: "", email: "", username: "", address: "", password: "", password2: "" });
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    reset();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const u = await login(username, password);
      onLogin?.(u);
      onClose();
      reset();
    } catch (e: any) {
      let msg = e.message || "نام کاربری یا رمز عبور اشتباه است";
      if (msg.includes("No active account")) msg = "حساب کاربری یافت نشد - رمز را چک کنید";
      if (msg.includes("400")) msg = "نام کاربری یا رمز عبور اشتباه است";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (r.password !== r.password2) {
      setErr("رمز عبور و تکرار آن یکسان نیست");
      return;
    }
    if (r.password.length < 8) {
      setErr("رمز عبور باید حداقل 8 کاراکتر باشد");
      return;
    }
    if (!/^09[0-9]{9}$/.test(r.phone)) {
      setErr("شماره موبایل باید با 09 شروع شود و 11 رقم باشد");
      return;
    }
    if (!r.address.trim() || r.address.trim().length < 10) {
      setErr("لطفاً آدرس کامل تحویل را وارد کنید");
      return;
    }
    setLoading(true);
    try {
      const u = await register(r);
      onLogin?.(u);
      onClose();
      reset();
    } catch (e: any) {
      let msg = e.message || "خطا در ثبت‌نام";
      try {
        const parsed = JSON.parse(msg);
        if (parsed.username) msg = "این نام کاربری قبلاً گرفته شده";
        else if (parsed.phone) msg = "این شماره موبایل قبلاً ثبت شده";
        else if (parsed.email) msg = "این ایمیل قبلاً ثبت شده";
        else if (parsed.address) msg = "وارد کردن آدرس کامل الزامی است";
        else if (typeof parsed === "object") msg = Object.values(parsed).flat().join(" - ") as string;
      } catch {}
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-stone-900/70 p-3 backdrop-blur-md sm:p-4 lg:items-center" onClick={onClose}>
      <div className="my-4 grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-[2rem] bg-white shadow-[0_25px_80px_rgba(0,0,0,0.3)] sm:rounded-[2.5rem] lg:grid-cols-2" onClick={(e) => e.stopPropagation()}>
        
        {/* Left - Branding */}
        <div className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-stone-900 via-stone-800 to-paprika-900 p-10 text-white overflow-hidden">
          <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-paprika-600/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-gold-500/10 blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <img src="/images/logo.png" alt="نوین" className="h-40 w-40 rounded-xl" />
            </div>
          </div>

          <div className="relative z-10">
            <h2 className="font-display text-4xl font-black leading-tight">
              به خانواده<br />
              <span className="text-gold-400">بزرگ نوین</span><br />
              خوش آمدید
            </h2>
            <p className="mt-4 text-stone-300 leading-relaxed">
              با ورود به حساب کاربری می‌توانید سفارشات خود را پیگیری کنید، از تخفیف‌های ویژه با خبر شوید و خرید عمده را سریع‌تر انجام دهید.
            </p>

            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">✓</div>
                <span>پیگیری لحظه‌ای سفارشات تکی و عمده</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">✓</div>
                <span>ذخیره آدرس و تسویه سریع‌تر</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">✓</div>
                <span>تخفیف‌های اختصاصی مشتریان وفادار</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 text-xs text-stone-500">
            © {new Date().getFullYear()} پخش نوین - تمامی حقوق محفوظ است
          </div>
        </div>

        {/* Right - Form */}
        <div className="flex flex-col">
          {/* Tabs */}
          <div className="flex p-2 gap-2 bg-stone-50 m-3 rounded-2xl">
            <button
              onClick={() => switchTab("login")}
              className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${tab === "login" ? "bg-white shadow text-stone-900" : "text-stone-500 hover:text-stone-700"}`}
            >
              ورود
            </button>
            <button
              onClick={() => switchTab("register")}
              className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${tab === "register" ? "bg-white shadow text-stone-900" : "text-stone-500 hover:text-stone-700"}`}
            >
              ثبت‌نام
            </button>
            <button onClick={onClose} className="h-11 w-11 grid place-items-center rounded-xl bg-white border text-stone-400 hover:text-stone-700">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            {err && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 flex gap-3 text-sm text-red-700">
                <span className="text-lg">⚠️</span>
                <span className="leading-relaxed">{err}</span>
              </div>
            )}

            {tab === "login" ? (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <h3 className="text-2xl font-black text-stone-900">خوش آمدید 👋</h3>
                  <p className="text-sm text-stone-500 mt-2">برای ادامه وارد حساب کاربری خود شوید</p>
                </div>

                <div className="space-y-4 pt-2">
                  <div>
                    <label className="text-[11px] font-black text-stone-500 tracking-widest uppercase">نام کاربری</label>
                    <div className="relative mt-2">
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400">👤</span>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full rounded-2xl border-2 border-stone-100 bg-stone-50 pr-11 pl-4 py-3.5 text-sm font-medium outline-none focus:border-paprika-500 focus:bg-white transition"
                        placeholder="admin یا شماره موبایل"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-black text-stone-500 tracking-widest uppercase">رمز عبور</label>
                    <div className="relative mt-2">
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400">🔒</span>
                      <input
                        type={showPass ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-2xl border-2 border-stone-100 bg-stone-50 pr-11 pl-12 py-3.5 text-sm font-medium outline-none focus:border-paprika-500 focus:bg-white transition"
                        placeholder="••••••••"
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-3 top-1/2 -translate-y-1/2 h-8 px-3 rounded-xl bg-white border text-[11px] font-bold text-stone-500">
                        {showPass ? "مخفی" : "نمایش"}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-stone-900 py-4 text-sm font-black text-white shadow-xl shadow-stone-900/20 hover:bg-black disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      در حال ورود...
                    </>
                  ) : (
                    "ورود به حساب"
                  )}
                </button>

                <div className="text-center text-xs text-stone-500 pt-2">
                  حساب ندارید؟{" "}
                  <button type="button" onClick={() => switchTab("register")} className="font-black text-paprika-600 hover:underline">
                    ثبت‌نام کنید
                  </button>
                </div>

                <div className="pt-4 border-t border-stone-100">
                  <p className="text-[11px] text-stone-400 text-center">با ورود، شرایط و قوانین نوین را می‌پذیرید</p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <h3 className="text-2xl font-black">ایجاد حساب جدید</h3>
                  <p className="text-sm text-stone-500 mt-1">{checkoutMode ? "برای ثبت سفارش، ثبت‌نام و آدرس تحویل الزامی است" : "ثبت‌نام کمتر از ۱ دقیقه"}</p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-bold text-stone-500">نام</label>
                    <input required value={r.first_name} onChange={(e) => setR({ ...r, first_name: e.target.value })} className="mt-1 w-full rounded-xl border-2 border-stone-100 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-paprika-500 focus:bg-white" placeholder="علی" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-stone-500">نام خانوادگی</label>
                    <input required value={r.last_name} onChange={(e) => setR({ ...r, last_name: e.target.value })} className="mt-1 w-full rounded-xl border-2 border-stone-100 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-paprika-500 focus:bg-white" placeholder="رضایی" />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-500">شماره موبایل *</label>
                  <input required type="tel" value={r.phone} onChange={(e) => setR({ ...r, phone: e.target.value })} className="mt-1 w-full rounded-xl border-2 border-stone-100 bg-stone-50 px-4 py-2.5 text-sm outline-none focus:border-paprika-500 focus:bg-white font-mono" placeholder="09123456789" dir="ltr" />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-500">نام کاربری *</label>
                  <input required value={r.username} onChange={(e) => setR({ ...r, username: e.target.value })} className="mt-1 w-full rounded-xl border-2 border-stone-100 bg-stone-50 px-4 py-2.5 text-sm outline-none focus:border-paprika-500 focus:bg-white" placeholder="مثلا ali123" dir="ltr" />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-500">آدرس کامل تحویل *</label>
                  <textarea required rows={3} value={r.address} onChange={(e) => setR({ ...r, address: e.target.value })} className="mt-1 w-full resize-none rounded-xl border-2 border-stone-100 bg-stone-50 px-4 py-2.5 text-sm outline-none focus:border-paprika-500 focus:bg-white" placeholder="شهر، خیابان، پلاک، واحد و توضیحات لازم برای ارسال" />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-500">ایمیل (اختیاری)</label>
                  <input type="email" value={r.email} onChange={(e) => setR({ ...r, email: e.target.value })} className="mt-1 w-full rounded-xl border-2 border-stone-100 bg-stone-50 px-4 py-2.5 text-sm outline-none focus:border-paprika-500 focus:bg-white" placeholder="ali@email.com" dir="ltr" />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-bold text-stone-500">رمز عبور *</label>
                    <input required type="password" minLength={8} value={r.password} onChange={(e) => setR({ ...r, password: e.target.value })} className="mt-1 w-full rounded-xl border-2 border-stone-100 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-paprika-500" placeholder="حداقل 8 کاراکتر" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-stone-500">تکرار رمز *</label>
                    <input required type="password" value={r.password2} onChange={(e) => setR({ ...r, password2: e.target.value })} className="mt-1 w-full rounded-xl border-2 border-stone-100 bg-stone-50 px-3 py-2.5 text-sm outline-none focus:border-paprika-500" placeholder="تکرار رمز" />
                  </div>
                </div>

                {r.password && (
                  <div className="flex gap-1">
                    <div className={`h-1 flex-1 rounded-full ${r.password.length >= 8 ? "bg-emerald-500" : "bg-stone-200"}`} />
                    <div className={`h-1 flex-1 rounded-full ${r.password.length >= 10 ? "bg-emerald-500" : "bg-stone-200"}`} />
                    <div className={`h-1 flex-1 rounded-full ${/[A-Z]/.test(r.password) && /[0-9]/.test(r.password) ? "bg-emerald-500" : "bg-stone-200"}`} />
                  </div>
                )}

                <button type="submit" disabled={loading} className="w-full rounded-2xl bg-paprika-600 py-4 text-sm font-black text-white shadow-xl shadow-paprika-600/20 hover:bg-paprika-700 disabled:opacity-50 transition">
                  {loading ? "در حال ثبت‌نام..." : "ثبت‌نام و ورود"}
                </button>

                <div className="text-center text-xs text-stone-500">
                  قبلاً ثبت‌نام کرده‌اید؟{" "}
                  <button type="button" onClick={() => switchTab("login")} className="font-black text-stone-900 hover:underline">
                    وارد شوید
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
