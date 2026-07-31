// @ts-nocheck
import { useState, useEffect } from "react";
import { formatPrice, type Product } from "../data";
import { productsApi, ordersApi, wholesaleApi } from "../api/client";

type Tab = "dashboard" | "products" | "orders" | "wholesale" | "categories";

export default function AdminPanelPro({ onBack }: { products?: Product[]; orders?: any[]; onUpdateProducts?: any; onUpdateOrders?: any; onBack: () => void; }) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [wholesale, setWholesale] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Product form
  const [editing, setEditing] = useState<Product | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<any>({
    name: "", description: "", price: 0, stock: 10, unit: "pack", category: 1, tag: "", badge: "", order: 0, is_featured: false,
  });

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data: any = await productsApi.getAll({ search: search || undefined });
      setProducts((data.results ?? data).map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: parseFloat(p.price),
        stock: p.stock,
        unit: p.unit,
        tag: p.tag,
        badge: p.badge,
        category: p.category_name || p.category,
        category_name: p.category_name,
        image: p.image || `/images/p${p.id}.jpg`,
        available: p.available,
      })));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data: any = await ordersApi.list(statusFilter ? { order_status: statusFilter } : undefined);
      setOrders(data.results ?? data);
    } catch {} finally { setLoading(false); }
  };

  const loadWholesale = async () => {
    setLoading(true);
    try {
      const data: any = await wholesaleApi.list(statusFilter ? { status: statusFilter } : undefined);
      setWholesale(data.results ?? data);
    } catch {} finally { setLoading(false); }
  };

  const loadStats = async () => {
    try {
      const data: any = await ordersApi.stats();
      setStats(data);
    } catch {}
  };

  useEffect(() => { loadProducts(); loadStats(); }, []);
  useEffect(() => {
    if (tab === "orders") loadOrders();
    if (tab === "wholesale") loadWholesale();
    if (tab === "dashboard") loadStats();
  }, [tab, statusFilter]);

  // Product CRUD
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isAdding) {
        await productsApi.create({ name: form.name, description: form.description, price: String(form.price), stock: form.stock, unit: form.unit, category: form.category, tag: form.tag, badge: form.badge, order: form.order, is_featured: form.is_featured } as any);
        setIsAdding(false);
        loadProducts();
      } else if (editing) {
        await productsApi.update(editing.id as any, { name: form.name, description: form.description, price: String(form.price), stock: form.stock, tag: form.tag, badge: form.badge } as any);
        setEditing(null);
        loadProducts();
      }
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: any) => {
    if (!confirm("حذف شود؟")) return;
    try { await productsApi.delete(id); loadProducts(); } catch (e: any) { alert(e.message); }
  };

  const updateOrderStatus = async (id: number, newStatus: string) => {
    try {
      await fetch(`${(import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api"}/orders/${id}/status/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${JSON.parse(localStorage.getItem("novin_auth_tokens") || "{}")?.access || ""}` },
        body: JSON.stringify({ order_status: newStatus }),
      });
      loadOrders();
    } catch {
      // fallback: try old endpoint
      try {
        await fetch(`${(import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api"}/orders/list/`, { method: "GET", headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem("novin_auth_tokens") || "{}")?.access || ""}` } });
      } catch {}
    }
  };

  const filteredProducts = products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  const totalRevenue = orders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
  const lowStock = products.filter(p => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 20);

  return (
    <div className="min-h-screen bg-[#faf8f5] pb-24 pt-28" dir="rtl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="rounded-[2.5rem] bg-stone-900 p-8 text-white flex flex-col lg:flex-row justify-between gap-6 shadow-2xl">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold border border-white/10">👑 پنل ادمین حرفه‌ای PRO</div>
            <h1 className="mt-4 text-3xl font-black">مدیریت کامل فروشگاه نوین</h1>
            <p className="mt-2 text-stone-400 text-sm">آمار لحظه‌ای، مدیریت موجودی، سفارشات و درخواست‌های عمده</p>
          </div>
          <div className="flex gap-2 self-start">
            <button onClick={onBack} className="rounded-2xl bg-white/10 px-6 py-3 text-sm font-bold hover:bg-white/20">بازگشت به سایت</button>
            <button onClick={() => window.location.reload()} className="rounded-2xl bg-paprika-600 px-6 py-3 text-sm font-black">رفرش داده‌ها</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 flex flex-wrap gap-2 border-b border-stone-200 pb-4">
          {[
            { id: "dashboard", label: "داشبورد", icon: "📊" },
            { id: "products", label: `محصولات (${products.length})`, icon: "📦" },
            { id: "orders", label: `سفارشات تکی (${orders.length})`, icon: "🛒" },
            { id: "wholesale", label: `عمده (${wholesale.length})`, icon: "🏢" },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id as any)} className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition ${tab === t.id ? "bg-stone-900 text-white shadow" : "bg-white border text-stone-600 hover:bg-stone-50"}`}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {tab === "dashboard" && (
          <div className="mt-8 space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-3xl bg-white p-6 border shadow-sm"><p className="text-xs text-stone-400 font-bold">کل سفارشات</p><p className="mt-2 text-3xl font-black">{stats?.total_orders ?? orders.length}</p><p className="mt-1 text-xs text-emerald-600">+{stats?.recent_orders ?? 0} در 7 روز</p></div>
              <div className="rounded-3xl bg-white p-6 border shadow-sm"><p className="text-xs text-stone-400 font-bold">درآمد کل</p><p className="mt-2 text-2xl font-black text-paprika-700">{formatPrice(stats?.total_revenue ?? totalRevenue)}</p><p className="mt-1 text-xs text-stone-500">{formatPrice(stats?.recent_revenue ?? 0)} هفته اخیر</p></div>
              <div className="rounded-3xl bg-amber-50 p-6 border border-amber-200"><p className="text-xs text-amber-700 font-bold">کم‌موجود</p><p className="mt-2 text-3xl font-black text-amber-700">{stats?.low_stock ?? lowStock.length}</p><p className="mt-1 text-xs text-amber-600">{stats?.out_of_stock ?? 0} ناموجود</p></div>
              <div className="rounded-3xl bg-emerald-50 p-6 border border-emerald-200"><p className="text-xs text-emerald-700 font-bold">در انتظار</p><p className="mt-2 text-3xl font-black text-emerald-700">{stats?.pending_orders ?? 0}</p><p className="mt-1 text-xs">نیاز به بررسی</p></div>
            </div>

            {stats?.top_products && stats.top_products.length > 0 && (
              <div className="rounded-3xl bg-white p-6 border">
                <h3 className="font-bold mb-4">پرفروش‌ترین محصولات</h3>
                <div className="space-y-3">
                  {stats.top_products.map((p: any, i: number) => (
                    <div key={i} className="flex justify-between items-center bg-stone-50 p-3 rounded-xl">
                      <span className="font-bold text-sm">{p.product_name}</span>
                      <div className="flex gap-4 text-xs"><span>{p.total_qty} عدد</span><span className="w-24 bg-stone-200 rounded-full h-2 overflow-hidden"><span className="block h-2 bg-paprika-600" style={{ width: `${Math.min(100, (p.total_qty / (stats.top_products[0].total_qty || 1)) * 100)}%` }} /></span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lowStock.length > 0 && (
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm">
                <p className="font-bold text-amber-800 mb-2">⚠️ محصولات در آستانه اتمام:</p>
                <p className="text-amber-700">{lowStock.map(p => `${p.name} (${p.stock})`).join("، ")}</p>
              </div>
            )}
          </div>
        )}

        {/* Products */}
        {tab === "products" && (
          <div className="mt-8 space-y-4">
            <div className="rounded-3xl bg-white p-5 border flex flex-col lg:flex-row gap-4 justify-between">
              <div className="flex gap-2 flex-1">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجوی محصول..." className="flex-1 rounded-2xl border bg-stone-50 px-4 py-2.5 text-sm outline-none focus:border-paprika-500" />
                <button onClick={loadProducts} className="px-4 py-2.5 bg-stone-900 text-white rounded-xl text-sm">جستجو</button>
              </div>
              <button onClick={() => { setForm({ name: "", description: "", price: 0, stock: 10, unit: "pack", category: 1, tag: "", badge: "", order: 0 }); setEditing(null); setIsAdding(true); }} className="rounded-2xl bg-paprika-600 px-6 py-2.5 text-sm font-black text-white">+ افزودن محصول</button>
            </div>

            <div className="rounded-3xl bg-white border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-stone-50 border-b font-bold text-stone-600">
                    <tr><th className="p-4">عکس</th><th className="p-4">نام</th><th className="p-4">موجودی</th><th className="p-4">قیمت</th><th className="p-4">دسته</th><th className="p-4 text-center">عملیات</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-stone-50">
                        <td className="p-3"><img src={p.image} alt={p.name} className="h-12 w-12 rounded-xl object-cover" /></td>
                        <td className="p-3 font-bold">{p.name}</td>
                        <td className="p-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${ (p.stock ?? 0) === 0 ? "bg-red-100 text-red-700" : (p.stock ?? 0) <= 20 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{p.stock ?? 0}</span></td>
                        <td className="p-3 font-bold text-paprika-700">{formatPrice(p.price)}</td>
                        <td className="p-3 text-xs">{p.category}</td>
                        <td className="p-3 text-center">
                          <div className="flex justify-center gap-1">
                            <button onClick={() => { setEditing(p); setForm({ name: p.name, description: p.description, price: p.price, stock: p.stock ?? 10, unit: p.unit, category: 1, tag: p.tag || "", badge: p.badge || "", order: 0 }); setIsAdding(false); }} className="h-8 w-8 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white">✏️</button>
                            <button onClick={() => handleDelete(p.id)} className="h-8 w-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Orders */}
        {tab === "orders" && (
          <div className="mt-8 space-y-4">
            <div className="rounded-3xl bg-white p-5 border flex gap-2">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border bg-stone-50 px-4 py-2.5 text-sm">
                <option value="">همه وضعیت‌ها</option>
                <option value="PENDING">در انتظار</option>
                <option value="CONFIRMED">تایید شده</option>
                <option value="PREPARING">آماده‌سازی</option>
                <option value="SHIPPED">ارسال شده</option>
                <option value="DELIVERED">تحویل شده</option>
                <option value="CANCELLED">لغو شده</option>
              </select>
              <button onClick={loadOrders} className="px-4 py-2.5 bg-stone-900 text-white rounded-xl text-sm">فیلتر</button>
            </div>

            {loading ? <div className="text-center py-20">⏳ در حال بارگذاری...</div> : (
              <div className="grid gap-3">
                {orders.map((o: any) => (
                  <div key={o.id} className="rounded-3xl bg-white p-5 border flex flex-col lg:flex-row justify-between gap-4">
                    <div>
                      <p className="font-mono font-bold">{o.order_number} - {o.name}</p>
                      <p className="text-xs text-stone-500 mt-1">📞 {o.phone} | {new Date(o.created_at).toLocaleDateString("fa-IR")}</p>
                      <p className="text-xs mt-2">{o.items?.map((i: any) => `${i.product_name}×${i.quantity}`).join("، ")}</p>
                    </div>
                    <div className="flex flex-col gap-2 items-start lg:items-end">
                      <span className="font-black text-paprika-700">{formatPrice(o.total_amount)}</span>
                      <select value={o.order_status} onChange={(e) => updateOrderStatus(o.id, e.target.value)} className="rounded-xl border px-3 py-1.5 text-xs font-bold">
                        <option value="PENDING">در انتظار</option>
                        <option value="CONFIRMED">تایید شده</option>
                        <option value="PREPARING">آماده‌سازی</option>
                        <option value="SHIPPED">ارسال شده</option>
                        <option value="DELIVERED">تحویل شده</option>
                        <option value="CANCELLED">لغو شده</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Wholesale */}
        {tab === "wholesale" && (
          <div className="mt-8 space-y-4">
            <div className="rounded-3xl bg-white p-5 border flex gap-2">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border bg-stone-50 px-4 py-2.5 text-sm">
                <option value="">همه</option><option value="NEW">جدید</option><option value="QUOTED">پیش‌فاکتور</option><option value="CONVERTED">تبدیل شده</option><option value="REJECTED">رد شده</option>
              </select>
              <button onClick={loadWholesale} className="px-4 py-2.5 bg-stone-900 text-white rounded-xl text-sm">فیلتر</button>
            </div>
            <div className="grid gap-3">
              {wholesale.map((w: any) => (
                <div key={w.id} className="rounded-3xl bg-white p-5 border">
                  <div className="flex justify-between"><span className="font-mono font-bold">{w.request_number} - {w.company_name}</span><span className="px-2 py-1 bg-stone-100 rounded-full text-xs">{w.status}</span></div>
                  <p className="text-sm mt-2">👤 {w.contact_person} - 📞 {w.phone}</p>
                  <p className="text-xs mt-1 text-stone-500">{w.items?.map((i: any) => `${i.product_name}×${i.quantity}`).join("، ")}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(isAdding || editing) && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b bg-stone-50"><h3 className="font-bold text-lg">{isAdding ? "افزودن محصول" : "ویرایش"}</h3><button onClick={() => { setIsAdding(false); setEditing(null); }} className="h-8 w-8 rounded-full bg-stone-200">✕</button></div>
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="نام محصول" className="w-full rounded-2xl border bg-stone-50 px-4 py-3 text-sm" />
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="توضیحات" rows={3} className="w-full rounded-2xl border bg-stone-50 px-4 py-3 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input required type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} placeholder="قیمت" className="rounded-2xl border bg-stone-50 px-4 py-3 text-sm" />
                <input required type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} placeholder="موجودی" className="rounded-2xl border bg-stone-50 px-4 py-3 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="برچسب (best/new)" className="rounded-2xl border px-4 py-3 text-sm" />
                <input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="نشان (fresh/hot)" className="rounded-2xl border px-4 py-3 text-sm" />
              </div>
              <button type="submit" className="w-full bg-paprika-600 text-white py-3 rounded-2xl font-black">ذخیره</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
