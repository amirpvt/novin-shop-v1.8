import { useState, useEffect } from "react";
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  CrownIcon,
  PackageIcon,
  ShoppingBagIcon,
  CloseIcon,
  ArrowRightIcon,
  BarChartIcon,
} from "../components/icons";
import { formatPrice, type Product } from "../data";
import { productsApi, ordersApi, wholesaleApi, type Order, type WholesaleRequest } from "../api/client";

type Tab = "products" | "orders" | "wholesale" | "stats";

type Props = {
  products: Product[];
  orders?: any[];
  onUpdateProducts: (products: Product[]) => void;
  onUpdateOrders?: (orders: any[]) => void;
  onBack: () => void;
};

export default function AdminPanel({ products: initialProducts, onBack }: Props) {
  const [tab, setTab] = useState<Tab>("products");
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wholesale, setWholesale] = useState<WholesaleRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const [editing, setEditing] = useState<Product | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<any>({
    name: "",
    description: "",
    price: 0,
    stock: 10,
    unit: "pack",
    category: 1,
    brand: 1,
    tag: "",
    badge: "",
    available: true,
    order: 0,
    is_featured: false,
  });

  // Fetch orders & wholesale on mount
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data: any = await ordersApi.list();
      setOrders(data.results ?? data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  const loadWholesale = async () => {
    setLoading(true);
    try {
      const data: any = await wholesaleApi.list();
      setWholesale(data.results ?? data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (tab === "orders") loadOrders();
    if (tab === "wholesale") loadWholesale();
  }, [tab]);

  const resetForm = () => setForm({ name: "", description: "", price: 0, stock: 10, unit: "pack", category: 1, brand: 1, tag: "", badge: "", available: true, order: 0, is_featured: false });

  const openAdd = () => { resetForm(); setEditing(null); setIsAdding(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description,
      price: p.price,
      stock: p.stock ?? 10,
      unit: "pack",
      category: 1,
      tag: p.tag || "",
      badge: p.badge || "",
      available: p.available,
      order: 0,
      is_featured: false,
    });
    setIsAdding(false);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isAdding) {
        const created: any = await productsApi.create({
          name: form.name,
          description: form.description,
          price: String(form.price),
          stock: form.stock,
          unit: form.unit,
          category: form.category,
          tag: form.tag,
          badge: form.badge,
          order: form.order,
        } as any);
        alert("محصول ساخته شد");
        setIsAdding(false);
        window.location.reload();
      } else if (editing) {
        await productsApi.update(editing.id as any, {
          name: form.name,
          description: form.description,
          price: String(form.price),
          stock: form.stock,
          unit: form.unit,
          tag: form.tag,
          badge: form.badge,
        } as any);
        alert("محصول ویرایش شد");
        setEditing(null);
        window.location.reload();
      }
    } catch (err: any) {
      alert("خطا: " + err.message);
    }
  };

  const handleDeleteProduct = async (id: any) => {
    if (!window.confirm("حذف شود؟")) return;
    try {
      await productsApi.delete(id);
      setProducts(products.filter((x) => x.id !== id));
    } catch (e: any) { alert(e.message); }
  };

  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total_amount as any || "0"), 0);
  const lowStock = products.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 20);

  return (
    <div className="min-h-screen bg-stone-100 pb-20 pt-24 text-stone-800 font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl bg-stone-900 p-8 text-white shadow-xl">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-paprika-600/30 border border-paprika-500/30 px-4 py-1 text-xs font-bold text-paprika-400">
              <CrownIcon className="h-4 w-4 text-gold-400" />
              فاز 3 - پنل واقعی با API
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold">پنل حرفه‌ای مدیریت (واقعی)</h1>
            <p className="mt-2 text-stone-400 text-sm">مدیریت موجودی، سفارشات تکی و عمده - متصل به Django</p>
          </div>
          <button onClick={onBack} className="flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur hover:bg-white/20 transition">
            <ArrowRightIcon className="h-4 w-4" />
            سایت اصلی
          </button>
        </div>

        <div className="mt-8 flex gap-3 border-b border-stone-200 pb-4 overflow-x-auto">
          {[
            { id: "products", label: `محصولات (${products.length})`, icon: PackageIcon },
            { id: "orders", label: `سفارشات تکی (${orders.length})`, icon: ShoppingBagIcon },
            { id: "wholesale", label: `عمده (${wholesale.length})`, icon: PackageIcon },
            { id: "stats", label: "آمار", icon: BarChartIcon },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id as Tab)} className={`flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold whitespace-nowrap transition ${tab === t.id ? "bg-paprika-600 text-white shadow-md" : "bg-white text-stone-600 hover:bg-stone-200"}`}>
              <t.icon className="h-5 w-5" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === "products" && (
          <div className="mt-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm border">
              <div>
                <h2 className="font-display text-xl font-bold">محصولات (واقعی از API)</h2>
                <p className="text-sm text-stone-500 mt-1">CRUD واقعی - بعد از افزودن/حذف صفحه رفرش می‌شود تا از API دوباره بخواند.</p>
              </div>
              <button onClick={openAdd} className="flex items-center justify-center gap-2 rounded-2xl bg-paprika-600 px-6 py-3.5 font-bold text-white shadow-lg hover:bg-paprika-700 transition">
                <PlusIcon className="h-5 w-5" />
                افزودن محصول
              </button>
            </div>

            {lowStock.length > 0 && (
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                ⚠️ {lowStock.length} محصول در آستانه اتمام: {lowStock.map(p => `${p.name} (${p.stock})`).join("، ")}
              </div>
            )}

            <div className="overflow-hidden rounded-3xl bg-white shadow-sm border">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-cream-50 border-b text-stone-600 font-bold">
                    <tr>
                      <th className="p-4">تصویر</th>
                      <th className="p-4">نام</th>
                      <th className="p-4">موجودی</th>
                      <th className="p-4">قیمت</th>
                      <th className="p-4">دسته</th>
                      <th className="p-4 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-stone-50/80">
                        <td className="p-4"><div className="h-14 w-14 overflow-hidden rounded-xl bg-stone-100"><img src={p.image} alt={p.name} className="h-full w-full object-cover" /></div></td>
                        <td className="p-4 font-bold">{p.name}</td>
                        <td className="p-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${ (p.stock ?? 0) === 0 ? "bg-red-100 text-red-700" : (p.stock ?? 0) <= 20 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                            {p.stock ?? 0} عدد
                          </span>
                        </td>
                        <td className="p-4 font-bold text-paprika-700">{formatPrice(p.price)}</td>
                        <td className="p-4">{p.category}</td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => openEdit(p)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-50 text-gold-700 hover:bg-gold-600 hover:text-white transition"><EditIcon className="h-4 w-4" /></button>
                            <button onClick={() => handleDeleteProduct(p.id)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-paprika-50 text-paprika-600 hover:bg-paprika-600 hover:text-white transition"><TrashIcon className="h-4 w-4" /></button>
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

        {tab === "orders" && (
          <div className="mt-8 space-y-4">
            <div className="rounded-3xl bg-white p-6 shadow-sm border flex justify-between items-center">
              <h2 className="text-xl font-bold">سفارشات تکی (واقعی)</h2>
              <button onClick={loadOrders} className="px-4 py-2 bg-stone-900 text-white rounded-xl text-sm">رفرش</button>
            </div>
            {loading ? <div className="text-center py-12">در حال بارگذاری...</div> : orders.length === 0 ? <div className="rounded-3xl bg-white p-12 text-center text-stone-400">سفارشی نیست. اول از سایت سفارش ثبت کن.</div> : (
              <div className="grid gap-4">
                {orders.map((o) => (
                  <div key={o.id} className="rounded-3xl bg-white p-6 border shadow-sm">
                    <div className="flex justify-between">
                      <span className="font-bold">{o.order_number} - {o.name}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${o.order_status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{o.order_status}</span>
                    </div>
                    <div className="mt-3 text-sm text-stone-600">📞 {o.phone} | 💰 {o.total_amount} تومان</div>
                    <div className="mt-2 text-xs text-stone-500">{o.items?.map((i: any) => `${i.product_name} x${i.quantity}`).join("، ")}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "wholesale" && (
          <div className="mt-8 space-y-4">
            <div className="rounded-3xl bg-white p-6 shadow-sm border flex justify-between items-center">
              <h2 className="text-xl font-bold">درخواست‌های عمده</h2>
              <button onClick={loadWholesale} className="px-4 py-2 bg-stone-900 text-white rounded-xl text-sm">رفرش</button>
            </div>
            {loading ? <div className="text-center py-12">...</div> : wholesale.length === 0 ? <div className="rounded-3xl bg-white p-12 text-center text-stone-400">درخواستی نیست</div> : (
              <div className="grid gap-4">
                {wholesale.map((w) => (
                  <div key={w.id} className="rounded-3xl bg-white p-6 border">
                    <div className="flex justify-between">
                      <span className="font-bold">{w.request_number} - {w.company_name}</span>
                      <span className="px-3 py-1 rounded-full bg-stone-100 text-xs">{w.status}</span>
                    </div>
                    <div className="mt-2 text-sm">👤 {w.contact_person} - 📞 {w.phone}</div>
                    <div className="mt-1 text-xs">{w.items?.map((i: any) => `${i.product_name} x${i.quantity}`).join("، ")}</div>
                    <div className="mt-3 flex gap-2">
                      {["QUOTED", "CONVERTED", "REJECTED"].map((s) => (
                        <button key={s} onClick={async () => { await wholesaleApi.updateStatus(w.request_number, s); loadWholesale(); }} className="px-3 py-1 rounded-xl bg-stone-900 text-white text-xs">{s}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "stats" && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl bg-white p-8 border text-center"><div className="text-4xl font-bold text-paprika-700">{products.length}</div><div className="mt-2 font-bold">محصولات</div></div>
            <div className="rounded-3xl bg-white p-8 border text-center"><div className="text-4xl font-bold text-gold-700">{orders.length}</div><div className="mt-2 font-bold">سفارش تکی</div></div>
            <div className="rounded-3xl bg-white p-8 border text-center"><div className="text-4xl font-bold text-emerald-600">{formatPrice(totalRevenue)}</div><div className="mt-2 font-bold">درآمد</div></div>
            <div className="rounded-3xl bg-white p-8 border text-center"><div className="text-4xl font-bold text-red-600">{lowStock.length}</div><div className="mt-2 font-bold">کم‌موجود</div></div>
          </div>
        )}
      </div>

      {(isAdding || editing) && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b bg-cream-50 px-6 py-4">
              <div className="text-xl font-bold">{isAdding ? "افزودن محصول جدید" : "ویرایش"}</div>
              <button onClick={() => { setIsAdding(false); setEditing(null); }} className="rounded-full p-2 hover:bg-stone-200"><CloseIcon className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div><label className="block text-sm font-bold mb-1">نام *</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-2xl border bg-cream-50 px-4 py-3" /></div>
              <div><label className="block text-sm font-bold mb-1">توضیحات</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-2xl border bg-cream-50 px-4 py-3" rows={3} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold mb-1">قیمت *</label><input required type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="w-full rounded-2xl border px-4 py-3" /></div>
                <div><label className="block text-sm font-bold mb-1">موجودی *</label><input required type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} className="w-full rounded-2xl border px-4 py-3" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold mb-1">برچسب</label><input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="best/new/discount" className="w-full rounded-2xl border px-4 py-3" /></div>
                <div><label className="block text-sm font-bold mb-1">نشان</label><input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="fresh/hot/premium" className="w-full rounded-2xl border px-4 py-3" /></div>
              </div>
              <button type="submit" className="w-full rounded-2xl bg-paprika-600 py-3 font-bold text-white">ذخیره</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
