// @ts-nocheck
// AdminPanel - گزینه افزودن محصول حرفه‌ای - فیکس عکس و برند تایپی - بقیه دست نخورده
import { useState, useEffect } from "react";
import { formatPrice, type Product } from "../data";
import { productsApi, ordersApi, wholesaleApi } from "../api/client";

type Tab = "dashboard" | "products" | "orders" | "sales" | "wholesale";

export default function AdminPanelProductBrandImageFixed({ onBack }: any) {
  const [tab, setTab] = useState<Tab>("products");
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [wholesale, setWholesale] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // محصول - فرم عالی قبلی
  const [editing, setEditing] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [hasDiscount, setHasDiscount] = useState(false);
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState<any>({
    name: "", description: "", price: 0, discount_price: "", stock: 10, unit: "pack", category: 1, brand: "", sku: "", tag: "", badge: "", is_featured: false,
  });

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data: any = await productsApi.getAll();
      setProducts(data.results ?? data);
    } catch {} finally { setLoading(false); }
  };
  const loadOrders = async () => {
    setLoading(true);
    try {
      const data: any = await ordersApi.list(statusFilter ? { order_status: statusFilter } : undefined);
      setOrders(data.results ?? data);
    } catch {} finally { setLoading(false); }
  };
  const loadWholesale = async () => {
    try { const data: any = await wholesaleApi.list(); setWholesale(data.results ?? data); } catch {}
  };
  const loadStats = async () => {
    try { const data: any = await ordersApi.stats(); setStats(data); } catch {}
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

  useEffect(() => { loadProducts(); loadStats(); loadMeta(); loadOrders(); loadWholesale(); }, []);
  useEffect(() => { if (tab === "orders" || tab === "sales") loadOrders(); if (tab === "wholesale") loadWholesale(); if (tab === "dashboard") loadStats(); }, [tab, statusFilter]);

  const resetForm = () => {
    setForm({ name: "", description: "", price: 0, discount_price: "", stock: 10, unit: "pack", category: categories[0]?.id || 1, brand: "", sku: "", tag: "", badge: "", is_featured: false });
    setImageFile(null); setImagePreview(null); setHasDiscount(false);
  };
  const openAdd = () => { resetForm(); setEditing(null); setIsAdding(true); };
  const openEdit = (p: any) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description || "", price: parseFloat(p.price) || 0, discount_price: p.discount_price ? parseFloat(p.discount_price) : "", stock: p.stock ?? 10, unit: p.unit || "pack", category: p.category || categories[0]?.id || 1, brand: p.brand_name || p.brand || "", sku: p.sku || "", tag: p.tag || "", badge: p.badge || "", is_featured: p.is_featured || false });
    setHasDiscount(!!p.discount_price);
    setImagePreview(p.image || null);
    setImageFile(null);
    setIsAdding(false);
  };
  const handleImageChange = (e: any) => {
    const file = e.target.files?.[0];
    if (file) { setImageFile(file); const reader = new FileReader(); reader.onload = (ev) => setImagePreview(ev.target?.result as string); reader.readAsDataURL(file); }
  };
  const handleSaveProduct = async (e: any) => {
    e.preventDefault();
    try {
      const base = (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
      const token = JSON.parse(localStorage.getItem("novin_auth_tokens") || "{}")?.access;
      const fd = new FormData();
      fd.append("name", form.name); fd.append("description", form.description); fd.append("price", String(form.price)); fd.append("stock", String(form.stock)); fd.append("unit", form.unit); fd.append("category", String(form.category));
      // ✅ برند - چه id چه نام جدید، بک‌اند خودش می‌سازد
      if (form.brand) fd.append("brand", String(form.brand));
      if (form.sku) fd.append("sku", form.sku);
      if (form.tag) fd.append("tag", form.tag);
      if (form.badge) fd.append("badge", form.badge);
      fd.append("is_featured", form.is_featured ? "true" : "false");
      fd.append("available", form.stock > 0 ? "true" : "false");
      if (hasDiscount && form.discount_price) fd.append("discount_price", String(form.discount_price));
      if (imageFile) fd.append("image", imageFile);
      const url = isAdding ? `${base}/products/` : `${base}/products/${editing.id}/`;
      const method = isAdding ? "POST" : "PATCH";
      const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (!res.ok) throw new Error(await res.text());
      alert(isAdding ? "✅ محصول با عکس و برند ساخته شد" : "✅ ویرایش شد - عکس و برند هم آپدیت شد");
      setIsAdding(false); setEditing(null); resetForm(); loadProducts();
    } catch (err: any) { alert("❌ " + err.message); }
  };
  const handleDelete = async (id: any) => { if (!confirm("حذف؟")) return; try { await productsApi.delete(id); loadProducts(); } catch (e: any) { alert(e.message); } };

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
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold">👑 پنل ادمین - فیکس عکس و برند</div>
            <h1 className="mt-4 text-3xl font-black">مدیریت محصولات حرفه‌ای</h1>
          </div>
          <div className="flex gap-2 self-start">
            <button onClick={onBack} className="rounded-2xl bg-white/10 px-6 py-3 text-sm font-bold">بازگشت</button>
            <button onClick={openAdd} className="rounded-2xl bg-paprika-600 px-6 py-3 text-sm font-black">+ افزودن محصول</button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2 border-b pb-4">
          {[
            { id: "dashboard", label: "داشبورد", icon: "📊" },
            { id: "products", label: `محصولات (${products.length})`, icon: "📦" },
            { id: "orders", label: `سفارشات (${orders.length})`, icon: "🛒" },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id as any)} className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold ${tab === t.id ? "bg-stone-900 text-white shadow" : "bg-white border text-stone-600"}`}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {tab === "dashboard" && (
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white"><p className="text-xs font-bold opacity-80">فروش تحویل شده</p><p className="mt-2 text-2xl font-black">{formatPrice(totalRevenueDelivered)}</p></div>
            <div className="rounded-3xl bg-white p-6 border"><p className="text-xs text-stone-400 font-bold">محصولات</p><p className="mt-2 text-3xl font-black">{products.length}</p></div>
            <div className="rounded-3xl bg-white p-6 border"><p className="text-xs text-stone-400 font-bold">سفارشات</p><p className="mt-2 text-3xl font-black">{orders.length}</p></div>
          </div>
        )}

        {tab === "products" && (
          <div className="mt-8 space-y-4">
            <div className="rounded-3xl bg-white p-5 border flex gap-2">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجو..." className="flex-1 rounded-xl border bg-stone-50 px-4 py-2.5 text-sm" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase())).map((p: any) => (
                <div key={p.id} className="rounded-3xl bg-white border overflow-hidden">
                  <div className="aspect-[4/3] bg-stone-100 relative"><img src={p.image || `/images/p${p.id}.jpg`} alt={p.name} className="h-full w-full object-cover" /></div>
                  <div className="p-4"><h4 className="font-bold">{p.name}</h4><p className="text-xs text-stone-500 mt-1">{p.brand_name || p.brand || "بدون برند"} • {p.stock} موجود</p><div className="flex gap-2 mt-3"><button onClick={() => openEdit(p)} className="flex-1 bg-amber-50 text-amber-700 py-2 rounded-xl text-xs font-bold">ویرایش</button><button onClick={() => handleDelete(p.id)} className="flex-1 bg-red-50 text-red-600 py-2 rounded-xl text-xs font-bold">حذف</button></div></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "orders" && (
          <div className="mt-8 space-y-3">
            {orders.map((o: any) => (
              <div key={o.id} className="rounded-2xl bg-white p-4 border flex justify-between">
                <div><p className="font-mono font-bold">{o.order_number} - {o.name}</p><p className="text-xs text-stone-500">{o.items?.map((i: any) => `${i.product_name}×${i.quantity}`).join("، ")}</p></div>
                <select value={o.order_status} onChange={(e) => updateOrderStatus(o.id, e.target.value)} className="rounded-xl border px-3 py-1.5 text-xs font-bold">
                  <option value="PENDING">در انتظار</option><option value="CONFIRMED">تایید شده</option><option value="PREPARING">آماده‌سازی</option><option value="SHIPPED">ارسال شده</option><option value="DELIVERED">تحویل شده</option><option value="CANCELLED">لغو شده</option>
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      {(isAdding || editing) && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-[2rem] shadow-2xl my-8">
            <div className="flex justify-between items-center p-6 border-b bg-stone-50 rounded-t-[2rem]"><h3 className="font-black text-xl">{isAdding ? "افزودن محصول حرفه‌ای" : "ویرایش محصول"}</h3><button onClick={() => { setIsAdding(false); setEditing(null); }} className="h-9 w-9 rounded-full bg-stone-200 grid place-items-center">✕</button></div>
            <form onSubmit={handleSaveProduct} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-black mb-2">عکس محصول * (از لوکال)</label>
                <div className="border-2 border-dashed border-stone-200 rounded-2xl p-6 text-center bg-stone-50">
                  {imagePreview ? (<div className="relative inline-block"><img src={imagePreview} alt="preview" className="h-40 w-40 object-cover rounded-2xl mx-auto border shadow" /><button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute -top-2 -right-2 h-7 w-7 bg-red-500 text-white rounded-full text-xs">✕</button></div>) : (<div><div className="text-4xl mb-2">🖼️</div><p className="text-sm font-bold">عکس را انتخاب کنید</p><p className="text-[11px] text-stone-400 mt-1">بعد از ذخیره، همه جا با همین عکس نمایش داده می‌شود</p></div>)}
                  <input type="file" accept="image/*" onChange={handleImageChange} className="mt-4 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-stone-900 file:text-white file:text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1">نام محصول *</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border-2 border-stone-100 bg-stone-50 px-4 py-3 text-sm" /></div>
                <div><label className="block text-xs font-bold mb-1">کد SKU</label><input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="w-full rounded-xl border-2 border-stone-100 bg-stone-50 px-4 py-3 text-sm" /></div>
              </div>
              <div><label className="block text-xs font-bold mb-1">توضیحات</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-xl border-2 border-stone-100 bg-stone-50 px-4 py-3 text-sm" /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1">دسته‌بندی</label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-xl border-2 bg-stone-50 px-3 py-3 text-sm"><option value="1">سوسیس</option><option value="2">کالباس</option><option value="3">منجمد</option></select></div>
                <div>
                  <label className="block text-xs font-bold mb-1">برند - تایپ کن (جدید هم می‌سازی) *</label>
                  <input list="brands-list" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="مثلاً: گلچین یا برند جدید تایپ کن" className="w-full rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold" />
                  <datalist id="brands-list">
                    {brands.map((b: any) => <option key={b.id} value={b.name} />)}
                    <option value="فرآورده های گوشتی گلچین" />
                    <option value="202" />
                    <option value="لاله بناب" />
                  </datalist>
                  <p className="text-[10px] text-amber-700 mt-1">💡 اگر برند جدید تایپ کنی، خودکار ساخته می‌شود و در فیلتر فروشگاه می‌آید</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold mb-1">قیمت اصلی *</label><input required type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="w-full rounded-xl border-2 bg-stone-50 px-4 py-3 text-sm font-mono" /></div>
                <div><label className="block text-xs font-bold mb-1">موجودی *</label><input required type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} className="w-full rounded-xl border-2 bg-stone-50 px-4 py-3 text-sm font-mono" /></div>
              </div>
              <div className="rounded-2xl border-2 border-amber-100 bg-amber-50/50 p-4">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={hasDiscount} onChange={(e) => setHasDiscount(e.target.checked)} className="h-4 w-4" /><span className="text-sm font-black text-amber-800">تخفیف دارد؟</span></label>
                {hasDiscount && (
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div><label className="block text-[11px] font-bold mb-1">قیمت بعد تخفیف</label><input type="number" value={form.discount_price} onChange={(e) => setForm({ ...form, discount_price: e.target.value })} className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700" /></div>
                    <div className="flex items-end"><span className="text-xs">%{form.price && form.discount_price ? Math.round(((form.price - Number(form.discount_price)) / form.price) * 100) : 0} تخفیف</span></div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <button type="submit" className="flex-1 bg-stone-900 text-white py-3.5 rounded-2xl font-black">ذخیره محصول (با عکس و برند جدید)</button>
                <button type="button" onClick={() => { setIsAdding(false); setEditing(null); }} className="px-6 py-3.5 bg-stone-100 rounded-2xl font-bold">انصراف</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
