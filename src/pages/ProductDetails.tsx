import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { formatPrice, type Product, mapApiProduct } from "../data";
import { ArrowRightIcon, TruckIcon, CheckIcon, PhoneIcon } from "../components/icons";
import { useRetailCart } from "../context/RetailCartContext";
import { useWholesaleRequest } from "../context/WholesaleRequestContext";
import { productsApi, type ApiProduct } from "../api/client";

type Props = {
  products: Product[];
};

export default function ProductDetails({ products: propProducts }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState<Product[]>([]);

  const { addRetailItem } = useRetailCart();
  const { addWholesaleItem } = useWholesaleRequest();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const found = propProducts.find((p) => String(p.id) === String(id));
      if (found) {
        setProduct(found);
        setLoading(false);
        const rel = propProducts.filter((p) => p.category === found.category && String(p.id) !== String(id)).slice(0, 4);
        setRelated(rel);
        return;
      }
      try {
        const apiProduct: ApiProduct = await productsApi.getById(id as any);
        const mapped = mapApiProduct(apiProduct);
        setProduct(mapped);
        try {
          const all = await productsApi.getAll({ category: String(apiProduct.category) });
          const results = (all as any).results ?? all;
          const relMapped = results.filter((p: any) => String(p.id) !== String(id)).slice(0, 4).map(mapApiProduct);
          setRelated(relMapped);
        } catch {}
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    load();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id, propProducts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 pt-32 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 animate-pulse">
          <div className="h-8 w-32 bg-stone-200 rounded-xl mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-[3rem] p-12">
            <div className="aspect-square bg-stone-100 rounded-[2.5rem]" />
            <div className="space-y-6">
              <div className="h-8 bg-stone-200 rounded-xl w-1/3" />
              <div className="h-12 bg-stone-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-cream-50 pt-40 pb-20 flex flex-col items-center justify-center text-center px-4">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-2xl font-bold">محصول پیدا نشد</h2>
        <button onClick={() => navigate("/shop")} className="mt-6 bg-paprika-600 text-white px-8 py-3 rounded-2xl font-bold">رفتن به فروشگاه</button>
      </div>
    );
  }

  const isOutOfStock = !product.available || (product.stock !== undefined && product.stock <= 0);
  const hasDiscount = product.discount_price && product.discount_price > 0 && product.discount_price < product.price;

  return (
    <div className="min-h-screen bg-cream-50 pt-10 lg:pt-6 pb-20 font-sans text-right" dir="rtl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center gap-2 text-xs font-bold text-stone-400 mb-6 pt-6">
          <button onClick={() => navigate("/")} className="hover:text-paprika-600">خانه</button>
          <span>/</span>
          <button onClick={() => navigate("/shop")} className="hover:text-paprika-600">فروشگاه</button>
          <span>/</span>
          <span className="text-stone-700">{product.category}</span>
          <span>/</span>
          <span className="text-paprika-600">{product.name}</span>
        </div>

        <button onClick={() => navigate("/shop")} className="inline-flex items-center gap-1.5 text-sm font-bold text-stone-500 hover:text-paprika-700 mb-8">
          <ArrowRightIcon className="h-4 w-4" />
          بازگشت به فروشگاه
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-[3rem] border border-stone-200 shadow-xl overflow-hidden p-8 sm:p-12">
          <div className="relative group">
            <div className="absolute inset-0 bg-paprika-600/5 rounded-[2.5rem] blur-2xl group-hover:bg-paprika-600/10 transition-colors" />
            <div className="relative aspect-square overflow-hidden rounded-[2.5rem] border border-stone-100 shadow-inner bg-stone-50">
              <img src={product.image} alt={product.name} className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${isOutOfStock ? 'grayscale' : ''}`} />
            </div>
            <div className="absolute top-6 right-6 flex flex-col gap-2">
              {hasDiscount ? (
                <span className="bg-red-600 text-white px-5 py-2 rounded-full text-sm font-black shadow-lg animate-pulse">%{product.discount_percent} تخفیف</span>
              ) : product.tag ? (
                <span className="bg-paprika-600 text-white px-5 py-2 rounded-full text-xs font-bold shadow-lg">{product.tag}</span>
              ) : null}
              {isOutOfStock && <span className="bg-stone-800 text-white px-5 py-2 rounded-full text-xs font-black shadow-lg">ناموجود</span>}
            </div>
            {product.stock !== undefined && product.stock > 0 && product.stock <= 20 && !isOutOfStock && (
              <div className="absolute bottom-6 left-6 bg-amber-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg">تنها {product.stock} عدد باقی مانده</div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full bg-gold-50 text-gold-700 text-[10px] font-black">{product.category}</span>
                {product.brand && <span className="text-[10px] text-stone-400 font-bold">{product.brand}</span>}
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-black text-stone-800 leading-tight">{product.name}</h1>
              <p className="mt-3 text-stone-400 text-sm font-medium flex items-center gap-2"><span>{product.unit}</span>{product.stock !== undefined && <span>• {product.stock} عدد موجود</span>}</p>
            </div>

            {/* ✅ FIX: قیمت با تخفیف */}
            <div className="flex items-center gap-4 mb-8 p-5 rounded-3xl bg-stone-50 border border-stone-100">
              <div>
                <p className="text-[10px] text-stone-400 font-bold mb-1">قیمت:</p>
                {hasDiscount ? (
                  <div>
                    <p className="text-sm line-through text-stone-400 font-bold">{formatPrice(product.price)}</p>
                    <p className="font-display text-3xl font-black text-emerald-600">{formatPrice(product.discount_price!)}</p>
                    <span className="mt-2 inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-[11px] font-black">%{product.discount_percent} تخفیف - {formatPrice(product.price - product.discount_price!)} سود شما</span>
                  </div>
                ) : (
                  <p className="font-display text-3xl font-black text-paprika-700">{formatPrice(product.price)}</p>
                )}
              </div>
              {isOutOfStock ? (
                <div className="mr-auto text-paprika-500 font-bold text-sm">ناموجود</div>
              ) : (
                <div className="mr-auto flex items-center gap-1.5 text-emerald-600 font-bold text-sm"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />موجود در انبار</div>
              )}
            </div>

            <div className="space-y-4 flex-1 mb-8">
              <h3 className="font-bold text-stone-800">توضیحات:</h3>
              <p className="text-stone-600 leading-relaxed text-sm">{product.description}</p>
              <ul className="space-y-2.5 mt-6">
                <li className="flex items-center gap-2 text-sm"><CheckIcon className="h-4 w-4 text-emerald-500" />تولید روز با گوشت تازه ۱۰۰٪</li>
                <li className="flex items-center gap-2 text-sm"><CheckIcon className="h-4 w-4 text-emerald-500" />بدون مواد نگهدارنده</li>
                <li className="flex items-center gap-2 text-sm"><CheckIcon className="h-4 w-4 text-emerald-500" />بسته‌بندی وکیوم بهداشتی</li>
              </ul>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button onClick={() => !isOutOfStock && addRetailItem(product)} disabled={isOutOfStock} className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-lg shadow-lg transition active:scale-95 ${isOutOfStock ? "bg-stone-200 text-stone-400 cursor-not-allowed" : "bg-paprika-600 text-white shadow-paprika-600/30 hover:bg-paprika-700"}`}>🛒 {isOutOfStock ? "ناموجود" : "افزودن به سبد"}</button>
              <button onClick={() => { addWholesaleItem(product); navigate("/wholesale"); }} disabled={isOutOfStock} className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-lg border-2 transition ${isOutOfStock ? "border-stone-100 bg-stone-50 text-stone-300" : "border-stone-200 bg-white text-stone-700 hover:border-paprika-600"}`}>📦 استعلام عمده</button>
            </div>

            <div className="mt-8 pt-6 border-t border-stone-100 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-[11px] font-bold text-stone-500"><TruckIcon className="h-5 w-5" />ارسال یخچال‌دار</div>
              <div className="flex items-center gap-2 text-[11px] font-bold text-stone-500"><PhoneIcon className="h-5 w-5" />پشتیبانی 24 ساعته</div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-16">
            <h3 className="text-2xl font-black mb-6">محصولات مشابه</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((p) => (
                <div key={p.id} onClick={() => navigate(`/product/${p.id}`)} className="bg-white rounded-3xl border p-4 hover:shadow-xl hover:border-paprika-200 transition cursor-pointer">
                  <img src={p.image} alt={p.name} className="h-40 w-full object-cover rounded-2xl mb-3" />
                  <h4 className="font-bold text-sm">{p.name}</h4>
                  <div className="mt-2">
                    {p.discount_price ? (
                      <div className="flex items-center gap-2"><span className="text-xs line-through text-stone-400">{formatPrice(p.price)}</span><span className="text-sm font-black text-emerald-600">{formatPrice(p.discount_price)}</span></div>
                    ) : (
                      <p className="text-xs text-stone-500">{formatPrice(p.price)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
