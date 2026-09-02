/**
 * OwnerPricing.tsx - فقط بخش افزودن و ویرایش حرفه‌ای‌تر شد
 * قابلیت‌ها: توضیحات، برچسب، نشان، برند، SKU، دسته، واحد، ویژه
 * بقیه سایت دست نخورده
 */
import { useEffect, useState } from "react";
import { dashboardApi } from "../services/dashboardApi";
import { productsApi } from "../api/client";
import { formatPrice } from "../data";

export default function OwnerPricing() {
  const [products, setProducts] = useState<any[]>([]);
  const [pricings, setPricings] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingPrice, setEditingPrice] = useState<number | null>(null);
  const [priceForm, setPriceForm] = useState({ base_price: "", wholesale_price: "" });

  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [hasDiscount, setHasDiscount] = useState(false);

  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  const [productForm, setProductForm] = useState<any>({
    name: "",
    description: "",
    price: "",
    discount_price: "",
    stock: 10,
    unit: "pack",
    category: 1,
    brand: "",
    sku: "",
    tag: "",
    badge: "",
    is_featured: false,
    status: "published",
    weight: 1000,
  });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [prodsData, pricingData] = await Promise.all([
        productsApi.getAll(),
        dashboardApi.owner.pricingList().catch(() => []),
      ]);
      const prods = (prodsData as any).results ?? prodsData;
      setProducts(prods);
      const pricingMap: Record<number, any> = {};
      (pricingData as any[]).forEach((p: any) => { pricingMap[p.product] = p; });
      setPricings(pricingMap);

      const base = (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
      const token = JSON.parse(localStorage.getItem("novin_auth_tokens") || "{}")?.access;
      const headers: any = token ? { Authorization: `Bearer ${token}` } : {};
      const [brandsRes, catsRes] = await Promise.all([
        fetch(`${base}/products/brands/`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${base}/products/categories/`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
      ]);
      setBrands(brandsRes.results ?? brandsRes ?? []);
      setCategories(catsRes.results ?? catsRes ?? []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, []);

  const handlePriceEdit = (product: any) => {
    const pricing = pricings[product.id];
    setEditingPrice(product.id);
    setPriceForm({
      base_price: pricing ? String(pricing.base_price) : String(product.price),
      wholesale_price: pricing ? String(pricing.wholesale_price) : String(Math.round(product.price * 0.85)),
    });
  };

  const handlePriceSave = async (productId: number) => {
    try {
      const base = parseFloat(priceForm.base_price);
      const wholesale = parseFloat(priceForm.wholesale_price);
      if (wholesale >= base) { alert("❌ قیمت عمده باید کمتر از پایه باشد"); return; }
      if (pricings[productId]) {
        await dashboardApi.owner.pricingUpdate(productId, { base_price: base, wholesale_price: wholesale });
      } else {
        await dashboardApi.owner.pricingCreate({ product: productId, base_price: base, wholesale_price: wholesale });
      }
      alert("✅ قیمت ذخیره شد");
      setEditingPrice(null);
      loadAll();
    } catch (e: any) { alert("❌ " + e.message); }
  };

  const handleAddProduct = () => {
    setProductForm({ name: "", description: "", price: "", discount_price: "", stock: 10, unit: "pack", category: categories[0]?.id || 1, brand: "", sku: "", tag: "", badge: "", is_featured: false, status: "published", weight: 1000 });
    setEditingProduct(null);
    setImageFile(null);
    setImagePreview(null);
    setHasDiscount(false);
    setIsAddingProduct(true);
  };

  const handleEditProduct = (p: any) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      description: p.description || "",
      price: p.price,
      discount_price: p.discount_price || "",
      stock: p.stock ?? 10,
      unit: p.unit || "pack",
      category: p.category || categories[0]?.id || 1,
      brand: p.brand || "",
      sku: p.sku || "",
      tag: p.tag || "",
      badge: p.badge || "",
      is_featured: p.is_featured || false,
      status: p.status || "published",
      weight: p.weight || 1000,
    });
    setHasDiscount(!!p.discount_price);
    setImagePreview(p.image || null);
    setImageFile(null);
    setIsAddingProduct(true);
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
      fd.append("name", productForm.name);
      fd.append("description", productForm.description);
      fd.append("price", String(productForm.price));
      fd.append("stock", String(productForm.stock));
      fd.append("unit", productForm.unit);
      fd.append("category", String(productForm.category));
      if (productForm.brand) fd.append("brand", String(productForm.brand));
      if (productForm.sku) fd.append("sku", productForm.sku);
      if (productForm.tag) fd.append("tag", productForm.tag);
      if (productForm.badge) fd.append("badge", productForm.badge);
      fd.append("is_featured", productForm.is_featured ? "true" : "false");
      fd.append("status", productForm.status);
      fd.append("weight", String(productForm.weight));
      fd.append("available", productForm.stock > 0 ? "true" : "false");
      if (hasDiscount && productForm.discount_price) fd.append("discount_price", String(productForm.discount_price));
      if (imageFile) fd.append("image", imageFile);
      const url = editingProduct ? `${base}/products/${editingProduct.id}/` : `${base}/products/`;
      const method = editingProduct ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (!res.ok) throw new Error(await res.text());
      alert(editingProduct ? "✅ ویرایش شد" : "✅ محصول ساخته شد");
      setIsAddingProduct(false); setEditingProduct(null); loadAll();
    } catch (err: any) { alert("❌ " + err.message); }
  };

  const filtered = products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  const discountPercent = productForm.price && productForm.discount_price ? Math.round(((Number(productForm.price) - Number(productForm.discount_price)) / Number(productForm.price)) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px]" />
        <div className="relative">
          <h1 className="text-3xl font-black">💰 قیمت‌گذاری و مدیریت محصولات</h1>
          <p className="mt-3 text-stone-400 text-sm">کلیه محصولات + افزودن حرفه‌ای با توضیحات، برچسب و...</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجوی محصول..." className="w-full rounded-2xl border-2 bg-white px-5 py-3 pr-12 text-sm" />
          <span className="absolute right-4 top-1/2 -translate-y-1/2">🔍</span>
        </div>
        <button onClick={handleAddProduct} className="rounded-2xl bg-gradient-to-r from-amber-500 to-gold-600 px-8 py-3 text-sm font-black text-stone-900 shadow-lg">+ افزودن محصول حرفه‌ای</button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{[1,2,3,4,5,6].map(i => <div key={i} className="h-80 bg-stone-100 rounded-[2rem] animate-pulse" />)}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((product: any) => {
            const pricing = pricings[product.id];
            const isEditingThis = editingPrice === product.id;
            return (
              <div key={product.id} className="group rounded-[2rem] bg-white border shadow-sm hover:shadow-xl transition-all">
                <div className="aspect-[4/3] bg-stone-50 relative overflow-hidden rounded-t-[2rem]">
                  <img src={product.image || `/images/p${product.id}.jpg`} alt={product.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur text-white px-2.5 py-1 rounded-full text-[10px] font-bold">{product.stock} موجود</div>
                </div>
                <div className="p-5">
                  <h3 className="font-black line-clamp-1">{product.name}</h3>
                  <p className="text-xs text-stone-500 line-clamp-2 mt-1">{product.description || "بدون توضیحات"}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {product.tag && <span className="text-[10px] bg-paprika-50 text-paprika-700 border border-paprika-200 px-2 py-1 rounded-full font-bold">{product.tag}</span>}
                    {product.badge && <span className="text-[10px] bg-gold-50 text-gold-700 border border-gold-200 px-2 py-1 rounded-full font-bold">{product.badge}</span>}
                    {product.brand_name && <span className="text-[10px] bg-stone-50 border px-2 py-1 rounded-full">{product.brand_name}</span>}
                  </div>
                  <div className="mt-4 rounded-2xl bg-stone-50 border p-3">
                    {isEditingThis ? (
                      <div className="space-y-2">
                        <input type="number" value={priceForm.base_price} onChange={(e) => setPriceForm({ ...priceForm, base_price: e.target.value })} placeholder="قیمت پایه" className="w-full rounded-xl border px-3 py-2 text-sm" />
                        <input type="number" value={priceForm.wholesale_price} onChange={(e) => setForm({ ...priceForm, wholesale_price: e.target.value })} placeholder="قیمت عمده" className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm" />
                        <div className="flex gap-2"><button onClick={() => handlePriceSave(product.id)} className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-xs font-black">ذخیره</button><button onClick={() => setEditingPrice(null)} className="flex-1 bg-stone-200 py-2 rounded-xl text-xs">لغو</button></div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div><p className="text-[10px] text-stone-400 font-bold">پایه</p><p className="font-mono font-black">{pricing ? Number(pricing.base_price).toLocaleString("en-US") : Number(product.price).toLocaleString("en-US")}</p></div>
                        <div className="text-left"><p className="text-[10px] text-emerald-600 font-bold">عمده</p><p className="font-mono font-black text-emerald-700">{pricing ? Number(pricing.wholesale_price).toLocaleString("en-US") : "—"}</p></div>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <button onClick={() => handlePriceEdit(product)} className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 py-2 rounded-xl text-xs font-black">💰 قیمت</button>
                    <button onClick={() => handleEditProduct(product)} className="bg-stone-50 hover:bg-stone-100 border py-2 rounded-xl text-xs font-bold">✏️ ویرایش</button>
                    <button onClick={() => { if(confirm("حذف؟")) { const base = (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000/api"; const token = JSON.parse(localStorage.getItem("novin_auth_tokens") || "{}")?.access; fetch(`${base}/products/${product.id}/`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }).then(() => loadAll()); } }} className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 py-2 rounded-xl text-xs font-bold">🗑️ حذف</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isAddingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-[2rem] shadow-2xl my-8">
            <div className="p-6 border-b bg-gradient-to-r from-stone-900 to-stone-800 text-white rounded-t-[2rem] flex justify-between items-center">
              <h3 className="font-black text-xl">✨ {editingProduct ? "ویرایش حرفه‌ای محصول" : "افزودن محصول حرفه‌ای"}</h3>
              <button onClick={() => setIsAddingProduct(false)} className="h-9 w-9 rounded-full bg-white/10 grid place-items-center">✕</button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* عکس */}
              <div>
                <label className="block text-xs font-black mb-2">🖼️ عکس محصول</label>
                <div className="border-2 border-dashed border-stone-200 rounded-2xl p-6 text-center bg-stone-50">
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img src={imagePreview} alt="preview" className="h-40 w-40 object-cover rounded-2xl mx-auto border shadow" />
                      <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute -top-2 -right-2 h-7 w-7 bg-red-500 text-white rounded-full text-xs">✕</button>
                    </div>
                  ) : (
                    <div><div className="text-4xl mb-2">📸</div><p className="text-sm font-bold">عکس را انتخاب کنید</p><p className="text-[11px] text-stone-400 mt-1">JPG, PNG تا 5MB - از لوکال</p></div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageChange} className="mt-4 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-stone-900 file:text-white file:text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black mb-1.5">نام محصول *</label>
                  <input required value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} placeholder="مثلا سوسیس بلغاری" className="w-full rounded-xl border-2 border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5">کد SKU</label>
                  <input value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} placeholder="NOV-001" className="w-full rounded-xl border-2 border-stone-100 bg-stone-50 px-4 py-3 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black mb-1.5">📝 توضیحات کامل</label>
                <textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} rows={4} placeholder="توضیحات کامل محصول، مواد اولیه، طعم، نحوه نگهداری..." className="w-full rounded-xl border-2 border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-500 leading-relaxed" />
                <p className="text-[10px] text-stone-400 mt-1">{productForm.description.length} کاراکتر</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black mb-1.5">🏷️ برچسب (Tag)</label>
                  <select value={productForm.tag} onChange={(e) => setProductForm({ ...productForm, tag: e.target.value })} className="w-full rounded-xl border-2 border-stone-200 bg-white px-4 py-3 text-sm">
                    <option value="">بدون برچسب</option>
                    <option value="best">پرفروش (best)</option>
                    <option value="new">جدید (new)</option>
                    <option value="discount">تخفیف (discount)</option>
                    <option value="special">ویژه (special)</option>
                  </select>
                  <p className="text-[10px] text-stone-400 mt-1">برای نمایش بج روی کارت محصول</p>
                </div>
                <div>
                  <label className="block text-xs font-black mb-1.5">🎖️ نشان (Badge)</label>
                  <select value={productForm.badge} onChange={(e) => setForm({ ...productForm, badge: e.target.value })} className="w-full rounded-xl border-2 border-stone-200 bg-white px-4 py-3 text-sm">
                    <option value="">بدون نشان</option>
                    <option value="fresh">تازه (fresh)</option>
                    <option value="hot">محبوب (hot)</option>
                    <option value="premium">پریمیوم (premium)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black mb-1.5">دسته‌بندی</label>
                  <select value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} className="w-full rounded-xl border-2 bg-stone-50 px-3 py-3 text-sm">
                    {categories.length > 0 ? categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>) : <><option value="1">سوسیس</option><option value="2">کالباس</option><option value="3">منجمد</option></>}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black mb-1.5">برند</label>
                  <input list="brands-list" value={productForm.brand} onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })} placeholder="تایپ یا انتخاب برند" className="w-full rounded-xl border-2 border-amber-200 bg-amber-50/30 px-4 py-3 text-sm font-bold" />
                  <datalist id="brands-list">
                    {brands.map((b: any) => <option key={b.id} value={b.name} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-black mb-1.5">واحد</label>
                  <select value={productForm.unit} onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })} className="w-full rounded-xl border-2 bg-stone-50 px-3 py-3 text-sm">
                    <option value="pack">بسته</option>
                    <option value="kg">کیلوگرم</option>
                    <option value="piece">عدد</option>
                    <option value="carton">کارتن</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-black mb-1.5">قیمت اصلی *</label>
                  <input required type="number" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })} className="w-full rounded-xl border-2 bg-stone-50 px-4 py-3 text-sm font-mono font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-black mb-1.5">موجودی *</label>
                  <input required type="number" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })} className="w-full rounded-xl border-2 bg-stone-50 px-4 py-3 text-sm font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5">وزن (گرم)</label>
                  <input type="number" value={productForm.weight} onChange={(e) => setProductForm({ ...productForm, weight: Number(e.target.value) })} className="w-full rounded-xl border-2 bg-stone-50 px-4 py-3 text-sm" />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer bg-stone-50 border-2 rounded-xl px-4 py-3 w-full">
                    <input type="checkbox" checked={productForm.is_featured} onChange={(e) => setProductForm({ ...productForm, is_featured: e.target.checked })} className="h-4 w-4" />
                    <span className="text-xs font-bold">ویژه صفحه اصلی</span>
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border-2 border-amber-100 bg-amber-50/50 p-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={hasDiscount} onChange={(e) => setHasDiscount(e.target.checked)} className="h-4 w-4" />
                  <span className="text-sm font-black text-amber-800">این محصول تخفیف دارد؟</span>
                  {hasDiscount && productForm.price && productForm.discount_price && (
                    <span className="mr-auto bg-red-600 text-white px-3 py-1 rounded-full text-xs font-black">%{Math.round(((Number(productForm.price) - Number(productForm.discount_price)) / Number(productForm.price)) * 100)} تخفیف</span>
                  )}
                </label>
                {hasDiscount && (
                  <div className="mt-4">
                    <label className="block text-[11px] font-bold text-emerald-700 mb-1">قیمت بعد تخفیف</label>
                    <input type="number" value={productForm.discount_price} onChange={(e) => setProductForm({ ...productForm, discount_price: e.target.value })} placeholder="مثلا 59000" className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700" />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button type="submit" className="flex-1 bg-stone-900 text-white py-3.5 rounded-2xl font-black shadow-lg">💾 ذخیره محصول حرفه‌ای</button>
                <button type="button" onClick={() => setIsAddingProduct(false)} className="px-8 py-3.5 bg-stone-100 rounded-2xl font-bold">انصراف</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
