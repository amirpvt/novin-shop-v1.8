/**
 * AuthModal - Phase 1 (Login + Register)
 * طراحی RTL، موبایل فرندلی، اتصال به API واقعی
 */
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

type Tab = "login" | "register";

interface Props {
  open: boolean;
  onClose: () => void;
  onLogin?: (user: any) => void; // اختیاری - برای سازگاری با App.tsx
}

export default function AuthModal({ open, onClose, onLogin }: Props) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<Tab>("login");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Login form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Register form state
  const [r, setR] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    username: "",
    password: "",
    password2: "",
  });

  if (!open) return null;

  const reset = () => {
    setErr(null);
    setUsername("");
    setPassword("");
    setR({ first_name: "", last_name: "", phone: "", email: "", username: "", password: "", password2: "" });
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
    } catch (e: any) {
      setErr(e.message || "نام کاربری یا رمز عبور اشتباه است");
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
    setLoading(true);
    try {
      const u = await register(r);
      onLogin?.(u);
      onClose();
    } catch (e: any) {
      setErr(e.message || "خطا در ثبت‌نام. لطفاً اطلاعات را بررسی کنید.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tabs */}
        <div className="flex border-b border-stone-200">
          {(["login", "register"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className={`flex-1 py-4 text-center text-sm font-bold transition ${
                tab === t
                  ? "border-b-2 border-rose-700 text-rose-700"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              {t === "login" ? "ورود" : "ثبت‌نام"}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6">
          {err && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700">
              {err}
            </div>
          )}

          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-stone-700">نام کاربری یا موبایل</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none focus:border-rose-500"
                  placeholder="admin یا 0912..."
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-stone-700">رمز عبور</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm outline-none focus:border-rose-500"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-rose-700 py-3 text-sm font-bold text-white transition hover:bg-rose-800 disabled:opacity-50"
              >
                {loading ? "در حال ورود..." : "ورود"}
              </button>
              <p className="text-center text-xs text-stone-500">
                حساب ندارید؟{" "}
                <button type="button" onClick={() => switchTab("register")} className="font-bold text-rose-700">
                  ثبت‌نام کنید
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-stone-700">نام</label>
                  <input
                    type="text"
                    required
                    value={r.first_name}
                    onChange={(e) => setR({ ...r, first_name: e.target.value })}
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-stone-700">نام خانوادگی</label>
                  <input
                    type="text"
                    required
                    value={r.last_name}
                    onChange={(e) => setR({ ...r, last_name: e.target.value })}
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm outline-none focus:border-rose-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-stone-700">شماره موبایل</label>
                <input
                  type="tel"
                  required
                  pattern="09[0-9]{9}"
                  value={r.phone}
                  onChange={(e) => setR({ ...r, phone: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2 text-sm outline-none focus:border-rose-500"
                  placeholder="09123456789"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-stone-700">ایمیل (اختیاری)</label>
                <input
                  type="email"
                  value={r.email}
                  onChange={(e) => setR({ ...r, email: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2 text-sm outline-none focus:border-rose-500"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-stone-700">نام کاربری</label>
                <input
                  type="text"
                  required
                  value={r.username}
                  onChange={(e) => setR({ ...r, username: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2 text-sm outline-none focus:border-rose-500"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-stone-700">رمز عبور (حداقل ۸ کاراکتر)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={r.password}
                  onChange={(e) => setR({ ...r, password: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2 text-sm outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-stone-700">تکرار رمز عبور</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={r.password2}
                  onChange={(e) => setR({ ...r, password2: e.target.value })}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2 text-sm outline-none focus:border-rose-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-rose-700 py-3 text-sm font-bold text-white transition hover:bg-rose-800 disabled:opacity-50"
              >
                {loading ? "در حال ثبت‌نام..." : "ثبت‌نام"}
              </button>
              <p className="text-center text-xs text-stone-500">
                حساب دارید؟{" "}
                <button type="button" onClick={() => switchTab("login")} className="font-bold text-rose-700">
                  وارد شوید
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
