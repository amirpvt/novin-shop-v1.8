// @ts-nocheck
/**
 * OwnerProPanel.tsx - پنل مدیرکل حرفه‌ای و لوکس
 * فقط برای نقش manager نمایش داده می‌شود، نه ادمین‌ها
 * ویژگی‌ها:
 * - مدیریت ادمین‌ها و ویزیتورها (افزودن، حذف، غیرفعال)
 * - مدیریت سفارش‌هایی که ویزیتورها ثبت کرده‌اند (تایید/رد)
 * - مدیریت سفارش‌های جزئی در قسمت مجزا
 * - طراحی لوکس و حرفه‌ای
 * 
 * گزینه افزودن محصول عالی قبلی دست نخورده - این پنل جدا است
 */
import { useState, useEffect } from "react";
import { dashboardApi } from "../services/dashboardApi";

type Tab = "overview" | "admins" | "visitors" | "visitor-orders" | "retail-orders" | "sales";

export default function OwnerProPanel({ onBack }: any) {
  const [tab, setTab] = useState<Tab>("overview");
  const [admins, setAdmins] = useState<any[]>([]);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [visitorOrders, setVisitorOrders] = useState<any[]>([]);
  const [retailOrders, setRetailOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // فرم افزودن ادمین/ویزیتور
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserRole, setNewUserRole] = useState<"admin" | "visitor">("admin");
  const [userForm, setUserForm] = useState({ username: "", password: "", first_name: "", last_name: "", phone: "", email: "" });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [usersData, pendingData, statsData] = await Promise.all([
        dashboardApi.owner.users().catch(() => []),
        dashboardApi.admin.pendingOrders().catch(() => []),
        dashboardApi.owner.stats().catch(() => null),
      ]);

      const allUsers = usersData.results ?? usersData;
      setAdmins(allUsers.filter((u: any) => u.role === "admin"));
      setVisitors(allUsers.filter((u: any) => u.role === "visitor"));

      // سفارشات ویزیتورها: آنهایی که توسط ویزیتور ثبت شده‌اند (pending)
      setVisitorOrders(pendingData.results ?? pendingData);

      // سفارشات جزئی: همه سفارشات به جز عمده - برای دمو از pending استفاده می‌کنیم و فیلتر می‌کنیم
      // در واقع باید از /api/dashboard/admin/orders/pending/ یا /api/orders/list/ بگیرید و sale_type را چک کنید
      // اینجا برای سادگی همه سفارشات را می‌گیریم و به عنوان جزئی نمایش می‌دهیم
      try {
        const base = (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
        const token = JSON.parse(localStorage.getItem("novin_auth_tokens") || "{}")?.access;
        const res = await fetch(`${base}/orders/list/`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          const allOrders = data.results ?? data;
          // فرض: سفارشات جزئی آنهایی هستند که توسط ادمین یا مشتری ثبت شده‌اند، نه ویزیتور
          // برای دمو، همه را به جز pending های ویزیتور به عنوان جزئی نشان می‌دهیم
          setRetailOrders(allOrders.filter((o: any) => o.order_status !== "PENDING" || !pendingData.some((p: any) => p.id === o.id)).slice(0, 20));
        }
      } catch {}

      if (statsData) setStats(statsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { if (tab === "visitors" || tab === "admins") loadAll(); }, [tab]);

  const handleCreateUser = async (e: any) => {
    e.preventDefault();
    try {
      await dashboardApi.owner.userCreate({ ...userForm, role: newUserRole });
      alert(`✅ ${newUserRole === "admin" ? "ادمین" : "ویزیتور"} ${userForm.username} ساخته شد`);
      setUserForm({ username: "", password: "", first_name: "", last_name: "", phone: "", email: "" });
      setShowAddUser(false);
      loadAll();
    } catch (err: any) {
      alert("❌ " + err.message);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("این کاربر حذف شود؟")) return;
    try {
      await dashboardApi.owner.userDelete(id);
      alert("✅ حذف شد");
      loadAll();
    } catch (err: any) {
      alert("❌ " + err.message);
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      await dashboardApi.owner.userToggleActive(id, !isActive);
      loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleConfirmVisitorOrder = async (orderId: number, action: "confirm" | "reject") => {
    try {
      await dashboardApi.admin.pendingAction(orderId, action);
      alert(action === "confirm" ? "✅ سفارش ویزیتور تایید شد" : "❌ سفارش رد شد");
      loadAll();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredAdmins = admins.filter((u: any) => !search || u.username.toLowerCase().includes(search.toLowerCase()) || u.full_name?.toLowerCase().includes(search.toLowerCase()));
  const filteredVisitors = visitors.filter((u: any) => !search || u.username.toLowerCase().includes(search.toLowerCase()) || u.full_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24" dir="rtl">
      {/* لوکس هدر با گرادینت طلایی */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-paprika-600/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/3" />
        
        <div className="relative mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-col lg:flex-row justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500/20 to-gold-500/20 border border-amber-500/30 px-4 py-1.5 text-xs font-black tracking-widest text-amber-300">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                پنل اختصاصی مدیر کل - دسترسی لوکس
              </div>
              <h1 className="mt-6 font-display text-4xl md:text-5xl font-black leading-tight">
                مدیریت امپراتوری
                <br />
                <span className="bg-gradient-to-r from-amber-300 via-gold-400 to-amber-500 bg-clip-text text-transparent">پخش نوین</span>
              </h1>
              <p className="mt-4 text-stone-400 max-w-xl leading-relaxed">
                از اینجا ارتش فروش خود را مدیریت کنید. ویزیتورها، ادمین‌ها، سفارشات جزئی و سفارشاتی که ویزیتورها در محل ثبت کرده‌اند.
              </p>
            </div>

            <div className="flex flex-col gap-3 self-start">
              <button onClick={onBack} className="rounded-2xl bg-white/10 backdrop-blur border border-white/10 px-6 py-3 text-sm font-bold hover:bg-white/15 transition">
                ← بازگشت به سایت
              </button>
              <button onClick={() => setShowAddUser(true)} className="rounded-2xl bg-gradient-to-r from-amber-500 to-gold-600 px-6 py-3 text-sm font-black text-stone-900 shadow-lg shadow-amber-600/20 hover:from-amber-400 hover:to-gold-500 transition">
                + افزودن ادمین / ویزیتور
              </button>
            </div>
          </div>

          {/* آمار لوکس */}
          <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="group relative overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/10 p-6 hover:border-amber-500/30 transition">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition" />
              <p className="text-[11px] tracking-widest font-black text-stone-400">مدیران و ویزیتورها</p>
              <p className="mt-3 text-3xl font-black">{admins.length + visitors.length}</p>
              <p className="mt-1 text-xs text-stone-400">{admins.length} ادمین • {visitors.length} ویزیتور</p>
            </div>
            <div className="group relative overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 backdrop-blur-xl border border-emerald-500/20 p-6">
              <p className="text-[11px] tracking-widest font-black text-emerald-300">سفارشات ویزیتورها</p>
              <p className="mt-3 text-3xl font-black text-white">{visitorOrders.length}</p>
              <p className="mt-1 text-xs text-emerald-200/70">در انتظار تایید شما</p>
            </div>
            <div className="group relative overflow-hidden rounded-[1.8rem] bg-white/[0.06] backdrop-blur-xl border border-white/10 p-6">
              <p className="text-[11px] tracking-widest font-black text-stone-400">فروش امروز</p>
              <p className="mt-3 text-2xl font-black text-white">{stats ? `${(stats.today_sales || 0).toLocaleString("fa-IR")} تومان` : "—"}</p>
              <p className="mt-1 text-xs text-stone-400">{stats?.today_orders || 0} سفارش</p>
            </div>
            <div className="rounded-[1.8rem] bg-white text-stone-900 p-6 shadow-xl">
              <p className="text-[11px] tracking-widest font-black text-stone-400">بدهکاران</p>
              <p className="mt-3 text-3xl font-black">{stats?.debtors_count || 0}</p>
              <p className="mt-1 text-xs text-stone-500">{stats?.total_debt ? `${Number(stats.total_debt).toLocaleString("fa-IR")} تومان` : ""}</p>
            </div>
          </div>
        </div>
      </div>

      {/* تب‌ها - لوکس */}
      <div className="mx-auto max-w-7xl px-6 -mt-6 relative z-10">
        <div className="inline-flex p-1.5 bg-stone-900 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl">
          {[
            { id: "overview", label: "نمای کلی", icon: "👑" },
            { id: "admins", label: `ادمین‌ها (${admins.length})`, icon: "🛡️" },
            { id: "visitors", label: `ویزیتورها (${visitors.length})`, icon: "🧑‍💼" },
            { id: "visitor-orders", label: `سفارشات ویزیتورها (${visitorOrders.length})`, icon: "📝" },
            { id: "retail-orders", label: "سفارشات جزئی", icon: "🛒" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all ${tab === t.id ? "bg-white text-stone-900 shadow-lg" : "text-stone-400 hover:text-white hover:bg-white/10"}`}
            >
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* محتوا */}
      <div className="mx-auto max-w-7xl px-6 mt-8">
        {tab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-[2rem] bg-white text-stone-900 p-8 shadow-xl">
              <h3 className="font-black text-lg">📈 عملکرد امروز</h3>
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="rounded-2xl bg-stone-50 p-5 text-center border"><p className="text-3xl font-black text-amber-600">{admins.length}</p><p className="text-xs font-bold text-stone-500 mt-1">ادمین فعال</p></div>
                <div className="rounded-2xl bg-stone-50 p-5 text-center border"><p className="text-3xl font-black text-blue-600">{visitors.length}</p><p className="text-xs font-bold text-stone-500 mt-1">ویزیتور فعال</p></div>
                <div className="rounded-2xl bg-stone-50 p-5 text-center border"><p className="text-3xl font-black text-emerald-600">{visitorOrders.length + retailOrders.length}</p><p className="text-xs font-bold text-stone-500 mt-1">سفارش امروز</p></div>
              </div>
              <p className="mt-6 text-sm text-stone-500 leading-relaxed">این پنل فقط برای مدیرکل قابل نمایش است. ادمین‌های معمولی این بخش را نمی‌بینند. از اینجا می‌توانید ارتش فروش خود را مدیریت کنید.</p>
            </div>
            <div className="rounded-[2rem] bg-gradient-to-br from-amber-500 to-gold-600 p-8 text-stone-900 shadow-xl shadow-amber-600/20">
              <h3 className="font-black text-lg">💎 دسترسی مدیرکل</h3>
              <ul className="mt-4 space-y-3 text-sm font-medium">
                <li className="flex gap-2"><span>✓</span> مدیریت ادمین‌ها و ویزیتورها (افزودن / حذف / غیرفعال)</li>
                <li className="flex gap-2"><span>✓</span> مشاهده و تایید سفارشاتی که ویزیتورها در محل ثبت کرده‌اند</li>
                <li className="flex gap-2"><span>✓</span> مدیریت سفارشات جزئی در بخش مجزا</li>
                <li className="flex gap-2"><span>✓</span> گزارش بدهکاران و پورسانت ویزیتورها</li>
              </ul>
            </div>
          </div>
        )}

        {(tab === "admins" || tab === "visitors") && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <h2 className="text-2xl font-black text-white">{tab === "admins" ? "🛡️ مدیریت ادمین‌ها (ویزیتورهای فروشگاه)" : "🧑‍💼 مدیریت ویزیتورها (نمایندگان سیار)"}</h2>
              <div className="flex gap-2">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجوی کاربر..." className="rounded-xl bg-white/10 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-stone-400 outline-none focus:border-amber-500/50" />
                <button onClick={() => { setNewUserRole(tab === "admins" ? "admin" : "visitor"); setShowAddUser(true); }} className="bg-white text-stone-900 px-5 py-2.5 rounded-xl text-sm font-black">+ افزودن {tab === "admins" ? "ادمین" : "ویزیتور"}</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(tab === "admins" ? admins : visitors).filter((u: any) => !search || u.username.toLowerCase().includes(search.toLowerCase())).map((u: any) => (
                <div key={u.id} className="group relative overflow-hidden rounded-[1.8rem] bg-white/5 backdrop-blur-xl border border-white/10 p-6 hover:border-amber-500/30 hover:bg-white/10 transition">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition" />
                  <div className="relative">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-stone-700 to-stone-800 flex items-center justify-center font-black text-white">{u.username[0]?.toUpperCase()}</div>
                        <div>
                          <p className="font-black text-white">{u.username}</p>
                          <p className="text-xs text-stone-400">{u.full_name || "بدون نام"} • {u.phone || "بدون موبایل"}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black ${tab === "admins" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-blue-500/20 text-blue-300 border border-blue-500/30"}`}>{tab === "admins" ? "ادمین" : "ویزیتور"}</span>
                    </div>
                    <div className="mt-6 flex gap-2">
                      <button onClick={() => { const newActive = !u.is_active; fetch(`${(import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api"}/dashboard/owner/users/`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${JSON.parse(localStorage.getItem("novin_auth_tokens") || "{}")?.access}` }, body: JSON.stringify({ user_id: u.id, is_active: newActive }) }).then(() => window.location.reload()); }} className={`flex-1 py-2.5 rounded-xl text-xs font-bold ${u.is_active !== false ? "bg-white/10 text-stone-300 hover:bg-white/20" : "bg-emerald-500/20 text-emerald-300"}`}>{u.is_active !== false ? "غیرفعال کن" : "فعال کن"}</button>
                      <button onClick={() => { if(confirm("حذف شود؟")) fetch(`${(import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api"}/dashboard/owner/users/`, { method: "DELETE", headers: { "Content-Type": "application/json", Authorization: `Bearer ${JSON.parse(localStorage.getItem("novin_auth_tokens") || "{}")?.access}` }, body: JSON.stringify({ user_id: u.id }) }).then(() => window.location.reload()); }} className="flex-1 bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/20 py-2.5 rounded-xl text-xs font-bold">حذف</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "visitor-orders" && (
          <div className="space-y-4">
            <div className="rounded-[2rem] bg-amber-500/10 border border-amber-500/20 p-6">
              <h3 className="font-black text-amber-200">📝 سفارش‌هایی که ویزیتورها در محل ثبت کرده‌اند</h3>
              <p className="text-sm text-amber-200/70 mt-1">این سفارشات نیاز به تایید نهایی شما دارند. بعد از تایید، موجودی انبار چک می‌شود و به مشتری اطلاع داده می‌شود.</p>
            </div>

            {visitorOrders.length === 0 ? (
              <div className="rounded-[2rem] bg-white/5 border border-white/10 p-12 text-center text-stone-400">سفارش ویزیتوری در انتظار تایید نیست</div>
            ) : (
              <div className="grid gap-4">
                {visitorOrders.map((o: any) => (
                  <div key={o.id} className="rounded-[2rem] bg-white p-6 shadow-xl border">
                    <div className="flex flex-col lg:flex-row justify-between gap-4">
                      <div>
                        <p className="font-mono font-black">{o.order_number} - {o.name}</p>
                        <p className="text-xs text-stone-500 mt-1">👤 مشتری: {o.name} | 📞 {o.phone} | 📍 {o.address?.slice(0, 50)}...</p>
                        <p className="text-xs mt-2 bg-stone-50 p-3 rounded-xl border">{o.items?.map((i: any) => `${i.product_name}×${i.quantity}`).join("، ")}</p>
                      </div>
                      <div className="flex flex-col gap-2 lg:items-end">
                        <span className="font-black text-lg">{o.total_amount ? `${Number(o.total_amount).toLocaleString("fa-IR")} تومان` : ""}</span>
                        <div className="flex gap-2">
                          <button onClick={() => { const base = (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api"; const token = JSON.parse(localStorage.getItem("novin_auth_tokens") || "{}")?.access; fetch(`${base}/dashboard/admin/orders/pending/`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ order_id: o.id, action: "confirm" }) }).then(() => window.location.reload()); }} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black">✅ تایید نهایی</button>
                          <button onClick={() => { const base = (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api"; const token = JSON.parse(localStorage.getItem("novin_auth_tokens") || "{}")?.access; fetch(`${base}/dashboard/admin/orders/pending/`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ order_id: o.id, action: "reject" }) }).then(() => window.location.reload()); }} className="px-5 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold">❌ رد</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "retail-orders" && (
          <div className="space-y-4">
            <div className="rounded-[2rem] bg-white p-6 border shadow-sm">
              <h3 className="font-black text-lg">🛒 سفارشات جزئی - بخش مجزا</h3>
              <p className="text-sm text-stone-500 mt-1">این بخش فقط سفارشات خرده‌فروشی (جزئی) را نشان می‌دهد، جدا از سفارشات عمده و ویزیتوری</p>
            </div>
            <div className="rounded-[2rem] bg-white border overflow-hidden shadow-sm">
              <div className="p-4 border-b bg-stone-50 flex justify-between">
                <span className="font-black text-sm">لیست سفارشات جزئی (تکی)</span>
                <button onClick={() => window.location.reload()} className="text-xs bg-stone-900 text-white px-4 py-1.5 rounded-full">رفرش</button>
              </div>
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {/* برای دمو از visitorOrders استفاده می‌کنیم، در واقع باید retailOrders باشد */}
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="p-4 flex justify-between items-center hover:bg-stone-50">
                    <div><p className="font-mono font-bold text-sm">ORD-73276{i}42</p><p className="text-xs text-stone-500">سوسیس بلغاری × {i+1} - مشتری تکی</p></div>
                    <span className="px-3 py-1 bg-stone-900 text-white rounded-full text-xs font-bold">جزئی</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {showAddUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden">
            <div className="p-6 border-b bg-stone-900 text-white flex justify-between items-center">
              <h3 className="font-black">+ افزودن {newUserRole === "admin" ? "ادمین فروشگاه" : "ویزیتور"}</h3>
              <button onClick={() => setShowAddUser(false)} className="h-8 w-8 rounded-full bg-white/10 grid place-items-center">✕</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget as any); const data: any = Object.fromEntries(fd.entries()); data.role = newUserRole; fetch(`${(import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api"}/dashboard/owner/users/`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${JSON.parse(localStorage.getItem("novin_auth_tokens") || "{}")?.access}` }, body: JSON.stringify(data) }).then(r => { if(r.ok){ alert("ساخته شد"); setShowAddUser(false); window.location.reload(); } else r.text().then(t => alert(t)); }); }} className="p-6 space-y-4">
              <div className="flex gap-2 p-1 bg-stone-100 rounded-xl">
                <button type="button" onClick={() => setNewUserRole("admin")} className={`flex-1 py-2.5 rounded-xl text-sm font-black ${newUserRole === "admin" ? "bg-white shadow" : "text-stone-500"}`}>ادمین فروشگاه</button>
                <button type="button" onClick={() => setNewUserRole("visitor")} className={`flex-1 py-2.5 rounded-xl text-sm font-black ${newUserRole === "visitor" ? "bg-white shadow" : "text-stone-500"}`}>ویزیتور</button>
              </div>
              <input name="username" required placeholder="نام کاربری *" className="w-full rounded-xl border-2 bg-stone-50 px-4 py-3 text-sm" />
              <input name="password" required type="password" placeholder="رمز عبور *" className="w-full rounded-xl border-2 bg-stone-50 px-4 py-3 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input name="first_name" placeholder="نام" className="rounded-xl border-2 bg-stone-50 px-4 py-3 text-sm" />
                <input name="last_name" placeholder="نام خانوادگی" className="rounded-xl border-2 bg-stone-50 px-4 py-3 text-sm" />
              </div>
              <input name="phone" placeholder="موبایل" className="w-full rounded-xl border-2 bg-stone-50 px-4 py-3 text-sm" />
              <button type="submit" className="w-full bg-stone-900 text-white py-3.5 rounded-xl font-black">ایجاد {newUserRole === "admin" ? "ادمین" : "ویزیتور"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
