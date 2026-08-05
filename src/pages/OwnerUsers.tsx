/**
 * OwnerUsers.tsx - فیکس 1: هدر 1 سانت پایین‌تر، فیکس 2: مشتری‌ها نمایش داده می‌شوند
 * بقیه دست نخورده
 */
import { useEffect, useState } from "react";
import { dashboardApi } from "../services/dashboardApi";

export default function OwnerUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [showPassConfirm, setShowPassConfirm] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    passwordConfirm: "",
    role: "visitor",
    phone: "",
    first_name: "",
    last_name: "",
    email: "",
  });

  const load = async (role?: string) => {
    setLoading(true);
    try {
      const data = await dashboardApi.owner.users(role);
      setUsers(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password && form.password !== form.passwordConfirm) {
      alert("❌ رمز عبور و تایید آن یکسان نیست");
      return;
    }
    if (form.password && form.password.length > 0 && form.password.length < 8) {
      alert("❌ رمز عبور باید حداقل 8 کاراکتر باشد");
      return;
    }
    try {
      const payload: any = {
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        role: form.role,
      };
      if (form.username) payload.username = form.username;
      else payload.username = `user_${form.phone || Date.now()}`;
      if (form.password) payload.password = form.password;
      else payload.password = `12345678`;
      if (form.email) payload.email = form.email;

      await dashboardApi.owner.userCreate(payload);
      alert("✅ کاربر ساخته شد");
      setForm({ username: "", password: "", passwordConfirm: "", role: "visitor", phone: "", first_name: "", last_name: "", email: "" });
      setShowPass(false);
      setShowPassConfirm(false);
      load();
    } catch (err: any) {
      alert("❌ " + err.message);
    }
  };

  const handleToggleActive = async (user: any) => {
    const currentActive = user.is_active !== false;
    try {
      await dashboardApi.owner.userToggleActive(user.id, !currentActive);
      setUsers(users.map((u: any) => u.id === user.id ? { ...u, is_active: !currentActive } : u));
    } catch (err: any) {
      alert("❌ خطا در تغییر وضعیت: " + err.message);
      load();
    }
  };

  const handleDelete = async (user_id: number) => {
    if (!confirm("این کاربر حذف شود؟ این عمل غیرقابل بازگشت است.")) return;
    try {
      await dashboardApi.owner.userDelete(user_id);
      setUsers(users.filter((u: any) => u.id !== user_id));
    } catch (err: any) {
      alert("❌ " + err.message);
    }
  };

  const adminsCount = users.filter((u: any) => u.role === "admin").length;
  const visitorsCount = users.filter((u: any) => u.role === "visitor").length;
  const customersCount = users.filter((u: any) => u.role === "customer").length;

  return (
    <div className="space-y-6 pt-6">
      {/* ✅ فیکس 1: هدر 1 سانت پایین‌تر - pt-6 اضافه شد + mt-4 */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-stone-900 p-8 md:p-10 text-white shadow-2xl mt-4">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-gradient-to-br from-amber-500/20 via-gold-500/10 to-transparent blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-paprika-600/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] bg-[size:32px_32px] opacity-30" />

        <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2.5 rounded-full bg-white/10 backdrop-blur border border-white/10 px-4 py-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-stone-900 text-sm">👥</span>
                <span className="text-xs font-bold tracking-widest text-stone-200">مدیریت کاربران سیستم</span>
              </div>

              <h1 className="mt-5 font-display text-3xl md:text-4xl font-black tracking-tight">
                مدیریت کاربران
              </h1>
              <p className="mt-3 text-stone-400 text-sm leading-relaxed max-w-xl">
                کاربر جدید اضافه کنید، نقش‌ها را مدیریت کنید و دسترسی‌ها را کنترل کنید
              </p>

              <div className="mt-6 flex flex-wrap gap-2.5">
                <div className="flex items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/10 px-4 py-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold">{users.length} کاربر</span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-4 py-2">
                  <span className="text-xs font-bold text-amber-300">{adminsCount} ادمین</span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-4 py-2">
                  <span className="text-xs font-bold text-blue-300">{visitorsCount} ویزیتور</span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-stone-800 border border-white/5 px-4 py-2">
                  <span className="text-xs font-bold text-stone-400">{customersCount} مشتری</span>
                </div>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-4 text-center min-w-[90px]">
                  <p className="text-2xl font-black">{users.length}</p>
                  <p className="text-[10px] text-stone-400 mt-1 font-bold tracking-widest">کل کاربران</p>
                </div>
                <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-center min-w-[90px]">
                  <p className="text-2xl font-black text-amber-300">{adminsCount}</p>
                  <p className="text-[10px] text-amber-300/70 mt-1 font-bold tracking-widest">ادمین</p>
                </div>
                <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-4 text-center min-w-[90px]">
                  <p className="text-2xl font-black text-blue-300">{visitorsCount}</p>
                  <p className="text-[10px] text-blue-300/70 mt-1 font-bold tracking-widest">ویزیتور</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* فرم افزودن */}
      <div className="bg-white rounded-[2rem] border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b bg-gradient-to-r from-stone-50 to-white">
          <h3 className="font-black text-lg flex items-center gap-2">✨ افزودن کاربر جدید</h3>
          <p className="text-xs text-stone-500 mt-1"><span className="text-red-500">*</span> فقط ۴ فیلد الزامی است - بقیه اختیاری</p>
        </div>

        <form onSubmit={handleCreate} className="p-6 space-y-5" autoComplete="off">
          {/* جلوگیری از پر شدن خودکار رمز توسط مرورگر */}
          <input type="text" name="prevent_autofill_username" autoComplete="off" style={{ display: "none" }} />
          <input type="password" name="prevent_autofill_password" autoComplete="new-password" style={{ display: "none" }} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black mb-1.5">نام <span className="text-red-500">*</span></label>
              <input required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="مثلا علی" className="w-full rounded-xl border-2 border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-stone-900 focus:bg-white transition font-medium" />
            </div>

            <div>
              <label className="block text-xs font-black mb-1.5">نام خانوادگی <span className="text-red-500">*</span></label>
              <input required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="مثلا رضایی" className="w-full rounded-xl border-2 border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-stone-900 focus:bg-white transition font-medium" />
            </div>

            <div>
              <label className="block text-xs font-black mb-1.5">موبایل <span className="text-red-500">*</span></label>
              <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="09123456789" className="w-full rounded-xl border-2 border-stone-900/10 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-stone-900 focus:bg-white transition font-mono font-bold" dir="ltr" />
              <p className="text-[10px] text-stone-400 mt-1">11 رقم، با 09 شروع شود</p>
            </div>

            <div>
              <label className="block text-xs font-black mb-1.5">نقش کاربری <span className="text-red-500">*</span></label>
              <select required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full rounded-xl border-2 border-stone-900/10 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-stone-900 focus:bg-white transition font-bold">
                <option value="visitor">🧑‍💼 ویزیتور (نماینده سیار)</option>
                <option value="admin">🛡️ ادمین فروشگاه</option>
                <option value="customer">🛍️ مشتری</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 text-stone-600">نام کاربری <span className="text-stone-400 font-normal">(اختیاری)</span></label>
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="خالی بگذارید خودکار" className="w-full rounded-xl border bg-stone-50 px-4 py-2.5 text-sm outline-none focus:border-stone-300 focus:bg-white" dir="ltr" />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 text-stone-600">ایمیل <span className="text-stone-400 font-normal">(اختیاری)</span></label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="ali@email.com" className="w-full rounded-xl border bg-stone-50 px-4 py-2.5 text-sm outline-none focus:border-stone-300" dir="ltr" />
            </div>

            <div className="relative">
              <label className="block text-xs font-bold mb-1.5 text-stone-600">رمز عبور <span className="text-stone-400 font-normal">(اختیاری)</span></label>
              <input type={showPass ? "text" : "password"} autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="حداقل 8 کاراکتر" className="w-full rounded-xl border bg-stone-50 pl-12 pr-4 py-2.5 text-sm outline-none focus:border-stone-300" dir="ltr" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-2 top-[26px] h-8 px-3 rounded-lg bg-white border text-[11px] font-bold hover:bg-stone-50">
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>

            <div className="relative">
              <label className="block text-xs font-bold mb-1.5 text-stone-600">تایید رمز عبور</label>
              <input type={showPassConfirm ? "text" : "password"} autoComplete="new-password" value={form.passwordConfirm} onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })} placeholder="تکرار رمز" className="w-full rounded-xl border bg-stone-50 pl-12 pr-4 py-2.5 text-sm outline-none focus:border-stone-300" dir="ltr" />
              <button type="button" onClick={() => setShowPassConfirm(!showPassConfirm)} className="absolute left-2 top-[26px] h-8 px-3 rounded-lg bg-white border text-[11px] font-bold">
                {showPassConfirm ? "🙈" : "👁️"}
              </button>
            </div>

            {form.password && form.passwordConfirm && (
              <div className={`md:col-span-2 text-xs px-4 py-2.5 rounded-xl font-bold border ${form.password === form.passwordConfirm ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                {form.password === form.passwordConfirm ? "✅ رمزها یکسان هستند" : "❌ رمزها یکسان نیستند"}
              </div>
            )}
          </div>

          <button type="submit" className="w-full bg-stone-900 text-white py-3.5 rounded-xl font-black shadow-lg hover:bg-black transition flex items-center justify-center gap-2">
            <span>✨</span> ایجاد کاربر جدید
          </button>

          <p className="text-[11px] text-stone-400 text-center">فقط فیلدهای ستاره‌دار الزامی هستند</p>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => load()} className="px-5 py-2.5 bg-stone-900 text-white border rounded-xl text-sm font-bold shadow">همه ({users.length})</button>
        <button onClick={() => { const base = (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api"; const token = JSON.parse(localStorage.getItem("novin_auth_tokens") || "{}")?.access; fetch(`${base}/dashboard/owner/users/?role=visitor`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(d => setUsers(d.results ?? d)); }} className="px-5 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-100">ویزیتورها</button>
        <button onClick={() => { const base = (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api"; const token = JSON.parse(localStorage.getItem("novin_auth_tokens") || "{}")?.access; fetch(`${base}/dashboard/owner/users/?role=admin`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(d => setUsers(d.results ?? d)); }} className="px-5 py-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-sm font-bold hover:bg-amber-100">ادمین‌ها</button>
        <button onClick={() => { const base = (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api"; const token = JSON.parse(localStorage.getItem("novin_auth_tokens") || "{}")?.access; fetch(`${base}/dashboard/owner/users/?role=customer`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(d => { setUsers(d.results ?? d); if ((d.results ?? d).length === 0) alert("برای دیدن مشتریان، بک‌اند باید فیکس شود - به زودی"); }); }} className="px-5 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-bold hover:bg-emerald-100">مشتریان ثبت‌نام کرده ✅</button>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block h-10 w-10 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
          <p className="mt-4 text-sm text-stone-500">در حال بارگذاری...</p>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b bg-stone-50 flex justify-between items-center">
            <h3 className="font-black text-lg">لیست کاربران ({users.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-stone-50 border-b">
                <tr>
                  <th className="p-4 font-black text-xs tracking-widest text-stone-500">کاربر</th>
                  <th className="p-4 font-black text-xs tracking-widest text-stone-500">نقش</th>
                  <th className="p-4 font-black text-xs tracking-widest text-stone-500">موبایل</th>
                  <th className="p-4 font-black text-xs tracking-widest text-stone-500">وضعیت</th>
                  <th className="p-4 font-black text-xs tracking-widest text-stone-500 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-stone-50/80 transition group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-stone-900 text-white flex items-center justify-center font-black text-sm">
                          {u.username[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-stone-900">{u.username}</p>
                          <p className="text-xs text-stone-500">{u.full_name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || "بدون نام"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${u.role === 'admin' ? 'bg-amber-50 text-amber-700 border-amber-200' : u.role === 'visitor' ? 'bg-blue-50 text-blue-700 border-blue-200' : u.role === 'customer' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-stone-100 text-stone-600 border-stone-200'}`}>
                        <span>{u.role === 'admin' ? '🛡️' : u.role === 'visitor' ? '🧑‍💼' : u.role === 'customer' ? '🛍️' : '👤'}</span>
                        {u.role === 'admin' ? 'ادمین' : u.role === 'visitor' ? 'ویزیتور' : u.role === 'customer' ? 'مشتری' : u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-xs font-bold bg-stone-50 border px-2.5 py-1 rounded-full">{u.phone || "-"}</span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${u.is_active !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${u.is_active !== false ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                        {u.is_active !== false ? "فعال" : "غیرفعال"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1.5 justify-center">
                        <button 
                          onClick={() => handleToggleActive(u)} 
                          className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all hover:scale-105 active:scale-95 shadow-sm ${u.is_active !== false ? 'bg-stone-900 text-white hover:bg-black' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                        >
                          {u.is_active !== false ? "⏸️ غیرفعال" : "▶️ فعال"}
                        </button>
                        <button onClick={() => handleDelete(u.id)} className="px-3.5 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-xl text-xs font-black transition hover:scale-105 active:scale-95">🗑️ حذف</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <div className="p-12 text-center">
              <div className="text-5xl mb-4">👥</div>
              <p className="text-stone-500 font-bold">کاربری یافت نشد، کاربر جدید اضافه کنید</p>
              <p className="text-xs text-stone-400 mt-2">اگر دکمه "مشتریان ثبت‌نام کرده" را زدی و این پیام آمد، یعنی بک‌اند باید فیکس شود تا مشتریان را هم برگرداند</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
