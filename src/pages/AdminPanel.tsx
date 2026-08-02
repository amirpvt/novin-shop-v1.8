// @ts-nocheck
import { useState, useEffect } from "react";
import { formatPrice, type Product } from "../data";
import { productsApi } from "../api/client";

export default function AdminPanelProductPro({ onBack }: any) {
  const [products, setProducts] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Form
  const [editing, setEditing] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [hasDiscount, setHasDiscount] = useState(false);

  const [form, setForm] = useState<any>({
    name: "",
    description: "",
    price: 0,
    discount_price: "",
    stock: 10,
    unit: "pack",
    category: 1,
    brand: "",
    sku: "",
    tag: "",
    badge: "",
    is_featured: false,
  });

  const load = async () => {
    setLoading(true);
    try {
      const data: any = await productsApi.getAll();
      setProducts(data.results ?? data);
    } catch {} finally { setLoading(false); }
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

  useEffect(() => { load(); loadMeta(); }, []);

  const resetForm = () => {
    setForm({ name: "", description: "", price: 0, discount_price: "", stock: 10, unit: "pack", category: categories[0]?.id || 1, brand: "", sku: "", tag: "", badge: "", is_featured: false });
    setImageFile(null);
    setImagePreview(null);
    setHasDiscount(false);
  };

  const openAdd = () => { resetForm(); setEditing(null); setIsAdding(true); };
  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description || "",
      price: parseFloat(p.price) || 0,
      discount_price: p.discount_price ? parseFloat(p.discount_price) : "",
      stock: p.stock ?? 10,
      unit: p.unit || "pack",
      category: p.category || categories[0]?.id || 1,
      brand: p.brand || "",
      sku: p.sku || "",
      tag: p.tag || "",
      badge: p.badge || "",
      is_featured: p.is_featured || false,
    });
    setHasDiscount(!!p.discount_price);
    setImagePreview(p.image || null);
    setImageFile(null);
    setIsAdding(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const base = (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
      const token = JSON.parse(localStorage.getItem("novin_auth_tokens") || "{}")?.access;
      
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("description", form.description);
      fd.append("price", String(form.price));
      fd.append("stock", String(form.stock));
      fd.append("unit", form.unit);
      fd.append("category", String(form.category));
      if (form.brand) fd.append("brand", String(form.brand));
      if (form.sku) fd.append("sku", form.sku);
      if (form.tag) fd.append("tag", form.tag);
      if (form.badge) fd.append("badge", form.badge);
      fd.append("is_featured", form.is_featured ? "true" : "false");
      fd.append("available", form.stock > 0 ? "true" : "false");
      
      // تخفیف
      if (hasDiscount && form.discount_price) {
        fd.append("discount_price", String(form.discount_price));
      }

      if (imageFile) {
        fd.append("image", imageFile);
      }

      const url = isAdding ? `${base}/products/` : `${base}/products/${editing.id}/`;
      const method = isAdding ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt);
      }

      alert(isAdding ? "✅ محصول با عکس و تخفیف ساخته شد" : "✅ محصول ویرایش شد");
      setIsAdding(false);
      setEditing(null);
      resetForm();
      load();
    } catch (err: any) {
      alert("❌ خطا: " + err.message);
    }
  };

  const handleDelete = async (id: any) => {
    if (!confirm("حذف شود؟")) return;
    try { await productsApi.delete(id); load(); } catch (e: any) { alert(e.message); }
  };

  const filtered = products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  const discountPercent = form.price && form.discount_price ? Math.round(((form.price - Number(form.discount_price)) / form.price) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#faf8f5] pb-24 pt-28" dir="rtl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-[2.5rem] bg-stone-900 p-8 text-white flex flex-col lg:flex-row justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold">📦 مدیریت حرفه‌ای محصولات</div>
            <h1 className="mt-4 text-3xl font-black">افزودن محصول با عکس، برند و تخفیف</h1>
            <p className="mt-2 text-stone-400 text-sm">عکس آپلود، انتخاب برند، قیمت قبل و بعد تخفیف</p>
          </div>
          <div className="flex gap-2 self-start">
            <button onClick={onBack} className="rounded-2xl bg-white/10 px-6 py-3 text-sm font-bold">بازگشت</button>
            <button onClick={openAdd} className="rounded-2xl bg-paprika-600 px-6 py-3 text-sm font-black">+ افزودن محصول حرفه‌ای</button>
          </div>
        </div>

        <div className="mt-6 rounded-3xl bg-white p-4 border flex gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجوی محصول..." className="flex-1 rounded-xl border bg-stone-50 px-4 py-2.5 text-sm" />
          <button onClick={load} className="px-5 bg-stone-900 text-white rounded-xl text-sm">جستجو</button>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p: any) => (
            <div key={p.id} className="rounded-3xl bg-white border overflow-hidden hover:shadow-xl transition">
              <div className="aspect-[4/3] bg-stone-100 overflow-hidden relative">
                <img src={p.image || `/images/p${p.id}.jpg`} alt={p.name} className="h-full w-full object-cover" />
                {p.discount_price && (
                  <span className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-black">%{Math.round(((parseFloat(p.price) - parseFloat(p.discount_price)) / parseFloat(p.price)) * 100)} تخفیف</span>
                )}
              </div>
              <div className="p-4">
                <h4 className="font-bold">{p.name}</h4>
                <p className="text-xs text-stone-500 mt-1">{p.category_name || p.category} • {p.brand_name || ""}</p>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    {p.discount_price ? (
                      <>
                        <p className="text-xs line-through text-stone-400">{formatPrice(parseFloat(p.price))}</p>
                        <p className="font-black text-emerald-600">{formatPrice(parseFloat(p.discount_price))}</p>
                      </>
                    ) : (
                      <p className="font-black text-paprika-700">{formatPrice(parseFloat(p.price))}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${p.stock > 20 ? "bg-emerald-50 text-emerald-700" : p.stock > 0 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>{p.stock} موجود</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => openEdit(p)} className="flex-1 bg-amber-50 text-amber-700 py-2 rounded-xl text-xs font-bold">ویرایش</button>
                  <button onClick={() => handleDelete(p.id)} className="flex-1 bg-red-50 text-red-600 py-2 rounded-xl text-xs font-bold">حذف</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal حرفه‌ای */}
      {(isAdding || editing) && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-[2rem] shadow-2xl my-8">
            <div className="flex justify-between items-center p-6 border-b bg-stone-50 rounded-t-[2rem]">
              <h3 className="font-black text-xl">{isAdding ? "افزودن محصول حرفه‌ای" : "ویرایش محصول"}</h3>
              <button onClick={() => { setIsAdding(false); setEditing(null); resetForm(); }} className="h-9 w-9 rounded-full bg-stone-200 grid place-items-center">✕</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* عکس */}
              <div>
                <label className="block text-xs font-black text-stone-700 mb-2">عکس محصول *</label>
                <div className="border-2 border-dashed border-stone-200 rounded-2xl p-6 text-center bg-stone-50 hover:bg-white transition">
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img src={imagePreview} alt="preview" className="h-40 w-40 object-cover rounded-2xl mx-auto border shadow" />
                      <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute -top-2 -right-2 h-7 w-7 bg-red-500 text-white rounded-full text-xs">✕</button>
                    </div>
                  ) : (
                    <div>
                      <div className="text-4xl mb-2">🖼️</div>
                      <p className="text-sm font-bold">عکس محصول را بکشید اینجا یا کلیک کنید</p>
                      <p className="text-[11px] text-stone-400 mt-1">JPG, PNG تا 5MB</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageChange} className="mt-4 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-stone-900 file:text-white file:text-xs file:font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">نام محصول *</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثلا سوسیس بلغاری" className="w-full rounded-xl border-2 border-stone-100 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-paprika-500 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">کد محصول (SKU)</label>
                  <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="مثلا NOV-001" className="w-full rounded-xl border-2 border-stone-100 bg-stone-50 px-4 py-3 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">توضیحات</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="توضیح کوتاه..." className="w-full rounded-xl border-2 border-stone-100 bg-stone-50 px-4 py-3 text-sm" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">دسته‌بندی *</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-xl border-2 border-stone-100 bg-stone-50 px-3 py-3 text-sm">
                    {categories.length > 0 ? categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>) : <><option value="1">سوسیس</option><option value="2">کالباس</option><option value="3">منجمد</option></>}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">برند *</label>
                  <select value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="w-full rounded-xl border-2 border-stone-100 bg-stone-50 px-3 py-3 text-sm">
                    <option value="">انتخاب برند</option>
                    {brands.length > 0 ? brands.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>) : <><option value="1">گلچین</option><option value="2">202</option><option value="3">لاله بناب</option></>}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">واحد</label>
                  <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full rounded-xl border-2 border-stone-100 bg-stone-50 px-3 py-3 text-sm">
                    <option value="pack">بسته</option><option value="kg">کیلوگرم</option><option value="piece">عدد</option><option value="carton">کارتن</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1">قیمت اصلی (تومان) *</label>
                  <input required type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="w-full rounded-xl border-2 border-stone-100 bg-stone-50 px-4 py-3 text-sm font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">موجودی *</label>
                  <input required type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} className="w-full rounded-xl border-2 border-stone-100 bg-stone-50 px-4 py-3 text-sm font-mono" />
                </div>
              </div>

              {/* تخفیف */}
              <div className="rounded-2xl border-2 border-amber-100 bg-amber-50/50 p-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={hasDiscount} onChange={(e) => setHasDiscount(e.target.checked)} className="h-4 w-4 rounded" />
                  <span className="text-sm font-black text-amber-800">این محصول تخفیف دارد؟</span>
                  {hasDiscount && discountPercent > 0 && <span className="mr-auto bg-red-600 text-white px-3 py-1 rounded-full text-xs font-black">%{discountPercent} تخفیف</span>}
                </label>

                {hasDiscount && (
                  <div className="mt-4 grid grid-cols-2 gap-4 animate-in fade-in">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">قیمت قبل (خط خورده)</label>
                      <div className="rounded-xl bg-white border px-4 py-2.5 text-sm font-mono line-through text-stone-400">{formatPrice(form.price)}</div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-700 mb-1">قیمت بعد تخفیف *</label>
                      <input type="number" required={hasDiscount} value={form.discount_price} onChange={(e) => setForm({ ...form, discount_price: e.target.value })} placeholder="مثلا 59000" className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-mono font-bold text-emerald-700 outline-none focus:border-emerald-500" />
                    </div>
                    {form.discount_price && (
                      <div className="col-span-2 text-xs bg-white p-3 rounded-xl border">
                        <span className="text-stone-500">مشتری می‌بیند:</span> <span className="line-through text-stone-400 ml-2">{formatPrice(form.price)}</span> <span className="font-black text-emerald-600 mr-2">{formatPrice(Number(form.discount_price))}</span> <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-[10px] font-black mr-2">%{discountPercent} تخفیف</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="برچسب: best/new/discount" className="rounded-xl border-2 border-stone-100 bg-stone-50 px-4 py-2.5 text-sm" />
                <input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="نشان: fresh/hot/premium" className="rounded-xl border-2 border-stone-100 bg-stone-50 px-4 py-2.5 text-sm" />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="h-4 w-4" />
                <label className="text-sm font-bold">نمایش در صفحه اصلی (ویژه)</label>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button type="submit" className="flex-1 bg-stone-900 text-white py-3.5 rounded-2xl font-black shadow">ذخیره محصول</button>
                <button type="button" onClick={() => { setIsAdding(false); setEditing(null); }} className="px-6 py-3.5 bg-stone-100 rounded-2xl font-bold">انصراف</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
