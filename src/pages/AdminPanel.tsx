// پنل ادمین دو سطحی - ادمین معمولی و مدیر کل
// گزینه افزودن محصول عالی قبلی دست نخورده - فقط تب مدیریت ادمین‌ها اضافه شده برای مدیر کل

import { useState, useEffect } from "react";
import { formatPrice } from "../data";
import { productsApi, ordersApi, wholesaleApi } from "../api/client";
import { useAuth } from "../hooks/useAuth";

type Tab = "dashboard" | "products" | "orders" | "sales" | "wholesale" | "admins";

export default function AdminPanelWithAdminMgmt({ onBack }: any) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [wholesale, setWholesale] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [statusFilter] = useState("");

  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === "superadmin";

  // محصول - فرم عالی قبلی بدون تغییر
  const [editing, setEditing] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [brandLogoFile, setBrandLogoFile] = useState<File | null>(null);
  const [brandLogoPreview, setBrandLogoPreview] = useState<string | null>(null);
  const [hasDiscount, setHasDiscount] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [form, setForm] = useState<any>({
    name: "", description: "", price: 0, wholesale_price: "", discount_price: "", stock: 10, unit: "pack", category: 1, brand: "", sku: "", tag: "", badge: "", is_featured: false,
  });

  // ادمین جدید - فقط برای مدیر کل
  const [adminForm, setAdminForm] = useState<any>({
    username: "", password: "", first_name: "", last_name: "", phone: "", email: "", role: "admin",
  });

  const loadProducts = async () => {
    try {
      const data: any = await productsApi.getAll();
      setProducts(data.results ?? data);
    } catch {}
  };
  const loadOrders = async () => {
    try {
      const data: any = await ordersApi.list(statusFilter ? { order_status: statusFilter } : undefined);
      setOrders(data.results ?? data);
    } catch {}
  };
  const loadWholesale = async () => {
    try { const data: any = await wholesaleApi.list(); setWholesale(data.results ?? data); } catch {}
  };
  const loadStats = async () => {
    try { await ordersApi.stats(); } catch {}
  };
  const loadMeta = async () => {
    try {
      const base = (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
      const token = JSON.parse(localStorage.getItem("novin_auth_tokens") || "{}")?.access;
      const headers: any = token ? { Authorization: `Bearer ${token}` } : {};
      const [brandsRes, catsRes] = await Promise.all([
        fetch(`${base}/products/brands/`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${base}/products/categories/`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
      ]);
      setBrands(brandsRes.results ?? brandsRes ?? []);
      setCategories(catsRes.results ?? catsRes ?? []);
    } catch {}
  };
  const loadAdmins = async () => {
    if (!isSuperAdmin) return;
    try {
      const base = (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
      const token = JSON.parse(localStorage.getItem("novin_auth_tokens") || "{}")?.access;
      const res = await fetch(`${base}/auth/admins/`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.results ?? data);
      }
    } catch {}
  };

  useEffect(() => { loadProducts(); loadStats(); loadMeta(); loadOrders(); loadWholesale(); if (isSuperAdmin) loadAdmins(); }, []);
  useEffect(() => { if (tab === "orders" || tab === "sales") loadOrders(); if (tab === "wholesale") loadWholesale(); if (tab === "dashboard") loadStats(); if (tab === "admins") loadAdmins(); }, [tab, statusFilter]);

  const resetForm = () => {
    setForm({ name: "", description: "", price: 0, wholesale_price: "", discount_price: "", stock: 10, unit: "pack", category: categories[0]?.id || 1, brand: "", sku: "", tag: "", badge: "", is_featured: false });
    setImageFile(null); setImagePreview(null); setBrandLogoFile(null); setBrandLogoPreview(null); setHasDiscount(false);
  };
  const openAdd = () => { resetForm(); setEditing(null); setIsAdding(true); };
  const handleImageChange = (e: any) => {
    const file = e.target.files?.[0];
    if (file) { setImageFile(file); const reader = new FileReader(); reader.onload = (ev) => setImagePreview(ev.target?.result as string); reader.readAsDataURL(file); }
  };
  const handleBrandLogoChange = (e: any) => {
    const file = e.target.files?.[0];
    if (file) { setBrandLogoFile(file); const reader = new FileReader(); reader.onload = (ev) => setBrandLogoPreview(ev.target?.result as string); reader.readAsDataURL(file); }
  };
  const handleSaveProduct = async (e: any) => {
    e.preventDefault();
    try {
      const base = (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
      const token = JSON.parse(localStorage.getItem("novin_auth_tokens") || "{}")?.access;
      const fd = new FormData();
      fd.append("name", form.name); fd.append("description", form.description); fd.append("price", String(form.price)); fd.append("stock", String(form.stock)); fd.append("unit", form.unit); fd.append("category", String(form.category));
      if (form.brand) fd.append("brand", String(form.brand));
      if (form.sku) fd.append("sku", form.sku);
      if (form.tag) fd.append("tag", form.tag);
      if (form.badge) fd.append("badge", form.badge);
      fd.append("is_featured", form.is_featured ? "true" : "false");
      fd.append("available", form.stock > 0 ? "true" : "false");
      if (form.wholesale_price) fd.append("wholesale_price", String(form.wholesale_price));
      if (hasDiscount && form.discount_price) fd.append("discount_price", String(form.discount_price));
      if (imageFile) fd.append("image", imageFile);
      if (brandLogoFile) fd.append("brand_logo", brandLogoFile);
      const url = isAdding ? `${base}/products/` : `${base}/products/${editing.id}/`;
      const method = isAdding ? "POST" : "PATCH";
      const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (!res.ok) throw new Error(await res.text());
      alert(isAdding ? "✅ محصول ساخته شد" : "✅ ویرایش شد");
      setIsAdding(false); setEditing(null); resetForm(); loadProducts();
    } catch (err: any) { alert("❌ " + err.message); }
  };
  const handleDelete = async (id: any) => { if (!confirm("حذف؟")) return; try { await productsApi.delete(id); loadProducts(); } catch (e: any) { alert(e.message); } };

  // ادمین
  const handleCreateAdmin = async (e: any) => {
    e.preventDefault();
    try {
      const base = (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
      const token = JSON.parse(localStorage.getItem("novin_auth_tokens") || "{}")?.access;
      const res = await fetch(`${base}/auth/admins/create/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(adminForm),
      });
      if (!res.ok) throw new Error(await res.text());
      alert("✅ ادمین ساخته شد");
      setAdminForm({ username: "", password: "", first_name: "", last_name: "", phone: "", email: "", role: "admin" });
      loadAdmins();
    } catch (err: any) { alert("❌ " + err.message); }
  };

  const handleDeleteAdmin = async (id: number) => {
    if (!confirm("این ادمین حذف شود؟")) return;
    try {
      const base = (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
      const token = JSON.parse(localStorage.getItem("novin_auth_tokens") || "{}")?.access;
      const res = await fetch(`${base}/auth/admins/${id}/`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(await res.text());
      alert("✅ حذف شد");
      loadAdmins();
    } catch (err: any) { alert("❌ " + err.message); }
  };

  const deliveredOrders = orders.filter((o: any) => o.order_status === "DELIVERED");
  const totalRevenueDelivered = deliveredOrders.reduce((s: number, o: any) => s + parseFloat(o.total_amount || 0), 0);

  const updateOrderStatus = async (id: number, newStatus: string) => {
    try {
      const base = (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
      const token = JSON.parse(localStorage.getItem("novin_auth_tokens") || "{}")?.access;
      await fetch(`${base}/orders/${id}/status/`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ order_status: newStatus }) });
      loadOrders(); loadStats();
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] pb-24 pt-28" dir="rtl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-[2.5rem] bg-stone-900 p-8 text-white flex flex-col lg:flex-row justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold">
              {isSuperAdmin ? "👑 مدیر کل - دسترسی کامل" : "🛡️ ادمین فروشگاه - ویزیتور"}
            </div>
            <h1 className="mt-4 text-3xl font-black">{isSuperAdmin ? "پنل مدیر کل" : "پنل ادمین فروشگاه"}</h1>
            <p className="mt-2 text-stone-400 text-sm">
              {isSuperAdmin ? "مدیریت ادمین‌ها، محصولات، فروش و سفارشات" : "مدیریت محصولات، سفارشات و فروش"}
            </p>
          </div>
          <div className="flex gap-2 self-start">
            <button onClick={onBack} className="rounded-2xl bg-white/10 px-6 py-3 text-sm font-bold">بازگشت</button>
            <button onClick={openAdd} className="rounded-2xl bg-paprika-600 px-6 py-3 text-sm font-black">+ افزودن محصول</button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2 border-b pb-4">
          {[
            { id: "dashboard", label: "داشبورد", icon: "📊", show: true },
            { id: "products", label: `محصولات (${products.length})`, icon: "📦", show: true },
            { id: "orders", label: `سفارشات (${orders.length})`, icon: "🛒", show: true },
            { id: "sales", label: "فروش", icon: "💰", show: true },
            { id: "delivered", label: `تحویل شده`, icon: "✅", show: true },
            { id: "wholesale", label: `عمده (${wholesale.length})`, icon: "🏢", show: true },
            { id: "admins", label: `مدیریت ادمین‌ها ${isSuperAdmin ? "" : "🔒"}`, icon: "👥", show: isSuperAdmin },
          ].filter(t => t.show).map((t) => (
            <button key={t.id} onClick={() => setTab(t.id as any)} className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition ${tab === t.id ? "bg-stone-900 text-white shadow" : "bg-white border text-stone-600 hover:bg-stone-50"}`}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {tab === "dashboard" && (
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white"><p className="text-xs font-bold opacity-80">فروش تحویل شده</p><p className="mt-2 text-2xl font-black">{formatPrice(totalRevenueDelivered)}</p></div>
            <div className="rounded-3xl bg-white p-6 border"><p className="text-xs text-stone-400 font-bold">محصولات</p><p className="mt-2 text-3xl font-black">{products.length}</p></div>
            <div className="rounded-3xl bg-white p-6 border"><p className="text-xs text-stone-400 font-bold">سفارشات</p><p className="mt-2 text-3xl font-black">{orders.length}</p></div>
            {isSuperAdmin && <div className="rounded-3xl bg-amber-50 border border-amber-200 p-6"><p className="text-xs font-bold text-amber-700">ادمین‌ها</p><p className="mt-2 text-3xl font-black text-amber-700">{admins.length}</p></div>}
          </div>
        )}

        {tab === "admins" && isSuperAdmin && (
          <div className="mt-8 space-y-6">
            <div className="rounded-3xl bg-white p-6 border">
              <h3 className="font-black text-lg mb-1">👑 مدیریت ادمین‌ها - فقط مدیر کل</h3>
              <p className="text-sm text-stone-500 mb-6">اینجا می‌تونی ادمین‌های جدید (ویزیتورهای فروشگاه) بسازی یا حذف کنی. ادمین‌ها فقط به محصولات و سفارشات دسترسی دارند، نه مدیریت ادمین‌ها.</p>
              
              <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-stone-50 p-5 rounded-2xl border">
                <input required value={adminForm.username} onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })} placeholder="نام کاربری *" className="rounded-xl border px-4 py-2.5 text-sm" />
                <input required type="password" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} placeholder="رمز عبور (حداقل 8 کاراکتر) *" className="rounded-xl border px-4 py-2.5 text-sm" />
                <input value={adminForm.first_name} onChange={(e) => setAdminForm({ ...adminForm, first_name: e.target.value })} placeholder="نام" className="rounded-xl border px-4 py-2.5 text-sm" />
                <input value={adminForm.last_name} onChange={(e) => setAdminForm({ ...adminForm, last_name: e.target.value })} placeholder="نام خانوادگی" className="rounded-xl border px-4 py-2.5 text-sm" />
                <input value={adminForm.phone} onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })} placeholder="موبایل" className="rounded-xl border px-4 py-2.5 text-sm" />
                <input value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} placeholder="ایمیل (اختیاری)" className="rounded-xl border px-4 py-2.5 text-sm" />
                <select value={adminForm.role} onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value })} className="rounded-xl border px-4 py-2.5 text-sm md:col-span-2">
                  <option value="admin">ادمین فروشگاه (ویزیتور) - فقط محصولات و سفارشات</option>
                  <option value="superadmin">مدیر کل - دسترسی کامل + مدیریت ادمین‌ها</option>
                </select>
                <button type="submit" className="md:col-span-2 bg-stone-900 text-white py-3 rounded-xl font-black">+ ایجاد ادمین جدید</button>
              </form>
            </div>

            <div className="rounded-3xl bg-white border overflow-hidden">
              <div className="p-5 border-b bg-stone-50 font-black">لیست ادمین‌ها ({admins.length})</div>
              <div className="divide-y">
                {admins.map((a: any) => (
                  <div key={a.id} className="p-4 flex justify-between items-center hover:bg-stone-50">
                    <div>
                      <p className="font-bold">{a.username} - {a.name || `${a.first_name} ${a.last_name}`}</p>
                      <p className="text-xs text-stone-500 mt-1">{a.email || "بدون ایمیل"} | {a.role === "superadmin" ? "👑 مدیر کل" : "🛡️ ادمین"} | {a.phone || "بدون موبایل"}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${a.role === "superadmin" ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-600"}`}>{a.role}</span>
                      {a.id !== currentUser?.id && <button onClick={() => handleDeleteAdmin(a.id)} className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold hover:bg-red-100">حذف</button>}
                      {a.id === currentUser?.id && <span className="text-xs text-stone-400">خودت</span>}
                    </div>
                  </div>
                ))}
                {admins.length === 0 && <div className="p-8 text-center text-stone-400">ادمینی نیست</div>}
              </div>
            </div>
          </div>
        )}

        {tab === "products" && (
          <div className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {products.map((p: any) => (
                <div key={p.id} className="rounded-3xl bg-white border overflow-hidden">
                  <div className="aspect-[4/3] bg-stone-100"><img src={p.image || `/images/p${p.id}.jpg`} alt={p.name} className="h-full w-full object-cover" /></div>
                  <div className="p-4"><h4 className="font-bold">{p.name}</h4><p className="text-xs text-stone-500 mt-1">{p.stock} موجود • {formatPrice(p.price)}</p><div className="flex gap-2 mt-3"><button onClick={() => { setEditing(p); setForm({ name: p.name, description: p.description || "", price: p.price, wholesale_price: p.wholesale_price || "", discount_price: p.discount_price || "", stock: p.stock ?? 10, unit: p.unit || "pack", category: p.category || 1, brand: p.brand_name || p.brand || "", sku: p.sku || "", tag: p.tag || "", badge: p.badge || "", is_featured: p.is_featured || false }); setImagePreview(p.image); setBrandLogoFile(null); setBrandLogoPreview(null); setIsAdding(false); }} className="flex-1 bg-amber-50 text-amber-700 py-2 rounded-xl text-xs font-bold">ویرایش</button><button onClick={() => handleDelete(p.id)} className="flex-1 bg-red-50 text-red-600 py-2 rounded-xl text-xs font-bold">حذف</button></div></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "orders" && (
          <div className="mt-8 space-y-3">
            {orders.map((o: any) => (
              <div key={o.id} className="rounded-2xl bg-white p-4 border flex justify-between">
                <div><p className="font-mono font-bold">{o.order_number} - {o.name}</p><p className="text-xs text-stone-500">{o.phone}</p></div>
                <select value={o.order_status} onChange={(e) => updateOrderStatus(o.id, e.target.value)} className="rounded-xl border px-3 py-1.5 text-xs font-bold">
                  <option value="PENDING">در انتظار پرداخت</option><option value="PAID_PENDING_REVIEW">پرداخت شده / در انتظار بررسی</option><option value="CONFIRMED">تایید شده</option><option value="PREPARING">در حال آماده‌سازی</option><option value="SHIPPED">ارسال شده</option><option value="DELIVERED">تحویل داده شده</option><option value="CANCELLED">لغو شده</option>
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      {(isAdding || editing) && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-3xl bg-white rounded-[2rem] shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b bg-stone-50 rounded-t-[2rem]"><h3 className="font-black text-xl">{isAdding ? "افزودن محصول حرفه‌ای" : "ویرایش"}</h3><button onClick={() => { setIsAdding(false); setEditing(null); }} className="h-9 w-9 rounded-full bg-stone-200 grid place-items-center">✕</button></div>
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black mb-2">عکس محصول</label>
                <div className="border-2 border-dashed rounded-2xl p-6 text-center bg-stone-50">
                  {imagePreview ? <img src={imagePreview} alt="preview" className="h-40 w-40 object-cover rounded-2xl mx-auto" /> : <p className="text-sm">عکس انتخاب کنید</p>}
                  <input type="file" accept="image/*" onChange={handleImageChange} className="mt-4 block w-full text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black mb-1.5">نام محصول *</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="نام *" className="w-full rounded-xl border px-4 py-3 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-black mb-1.5">قیمت اصلی *</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} placeholder="قیمت *" className="w-full rounded-xl border px-4 py-3 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-black mb-1.5 text-emerald-700">قیمت عمده</label>
                  <input type="number" value={form.wholesale_price} onChange={(e) => setForm({ ...form, wholesale_price: e.target.value })} placeholder="قیمت عمده" className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} placeholder="موجودی" className="rounded-xl border px-4 py-3 text-sm" />
                <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="برند - تایپ جدید" list="brands-list" className="rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold" />
                <datalist id="brands-list">
                  {brands.map((b: any) => <option key={b.id} value={b.name} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-black mb-2">لوگوی برند</label>
                <div className="rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/40 p-4 text-center">
                  {brandLogoPreview ? (
                    <div className="relative inline-block">
                      <img src={brandLogoPreview} alt="brand preview" className="mx-auto h-24 w-24 rounded-2xl border bg-white object-contain p-2 shadow-sm" />
                      <button type="button" onClick={() => { setBrandLogoFile(null); setBrandLogoPreview(null); }} className="absolute -right-2 -top-2 h-7 w-7 rounded-full bg-red-500 text-xs text-white">✕</button>
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-stone-500">برای برند انتخاب‌شده یا برند جدید، عکس لوگو انتخاب کنید</p>
                  )}
                  <input type="file" accept="image/*" onChange={handleBrandLogoChange} className="mt-3 block w-full text-sm" />
                </div>
              </div>
              <button type="submit" className="w-full bg-stone-900 text-white py-3.5 rounded-2xl font-black">ذخیره</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
