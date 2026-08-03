import { formatPrice, type Product } from "../data";
import { CartIcon } from "./icons";
import { useRetailCart } from "../context/RetailCartContext";

type Props = {
  product: Product;
  onClick: (product: Product) => void;
  onWholesale: (product: Product) => void;
};

export default function ProductCard({ product, onClick, onWholesale }: Props) {
  const { addRetailItem } = useRetailCart();
  const isOutOfStock = product.available === false || (product.stock !== undefined && product.stock <= 0);
  const hasDiscount = product.discount_price && product.discount_price > 0 && product.discount_price < product.price;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-[2.5rem] border border-stone-200 bg-white shadow-sm transition-all duration-500 hover:-translate-y-2 hover:border-stone-400 hover:shadow-2xl">
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-50">
        <img
          src={product.image}
          alt={product.name}
          className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 ${isOutOfStock ? 'grayscale opacity-60' : ''}`}
          onClick={() => !isOutOfStock && onClick(product)}
        />
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {hasDiscount ? (
            <span className="rounded-full bg-black px-3 py-1 text-[11px] font-black text-white shadow-lg">%{product.discount_percent} تخفیف</span>
          ) : product.tag ? (
            <span className="rounded-full bg-stone-900 px-3 py-1 text-[10px] font-black text-white shadow-lg">
              {product.tag === "best" ? "پرفروش" : product.tag === "new" ? "جدید" : product.tag}
            </span>
          ) : null}
          {product.badge && !hasDiscount && (
            <span className="rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold text-stone-700 shadow-md backdrop-blur">
              {product.badge}
            </span>
          )}
          {isOutOfStock && (
            <span className="rounded-full bg-stone-800 px-3 py-1 text-[10px] font-black text-white shadow-lg">ناموجود</span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6 text-right">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">{product.category_name || product.category}</span>
          {product.brand && <span className="text-[9px] text-stone-400">{product.brand}</span>}
        </div>

        <h3 className="text-lg font-black text-stone-800 cursor-pointer" onClick={() => onClick(product)}>
          {product.name}
        </h3>
        <p className="mt-2 flex-1 text-xs font-medium leading-relaxed text-stone-500 line-clamp-2">{product.description}</p>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-[10px] font-bold text-stone-400 bg-stone-50 px-2 py-1 rounded-lg">{product.unit}</span>
          {isOutOfStock ? (
            <span className="text-[10px] font-bold text-stone-400">ناموجود</span>
          ) : (
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              موجود در انبار
            </div>
          )}
        </div>

        <div className="mt-5 border-t border-stone-100 pt-4">
          <div className="flex items-end justify-between mb-4">
            <div>
              {hasDiscount ? (
                <>
                  <span className="block text-[20px] line-through text-stone-400">{formatPrice(product.price)}</span>
                  <span className="font-display text-lg font-black text-black">{formatPrice(product.discount_price!)}</span>
                </>
              ) : (
                <span className="font-display text-lg font-black text-black">{formatPrice(product.price)}</span>
              )}
            </div>
            {product.stock !== undefined && product.stock > 0 && (
              <span className="text-[10px] text-stone-400">{product.stock} عدد موجود</span>
            )}
          </div>
          
          <div className="grid grid-cols-5 gap-2">
            {/* ✅ خرید تکی قرمز - قیمت مشکی می‌مونه */}
            <button
              onClick={() => !isOutOfStock && addRetailItem(product)}
              disabled={isOutOfStock}
              className={`col-span-3 flex items-center justify-center gap-2 rounded-2xl py-3.5 text-[11px] font-black shadow-lg transition active:scale-95 ${isOutOfStock ? "bg-stone-200 text-stone-400 cursor-not-allowed shadow-none" : "bg-paprika-600 text-white shadow-paprika-600/20 hover:bg-paprika-700"}`}
            >
              <CartIcon className="h-4 w-4" />
              {isOutOfStock ? "ناموجود" : "خرید تکی"}
            </button>
            <button
              onClick={() => onWholesale(product)}
              disabled={isOutOfStock}
              className={`col-span-2 flex items-center justify-center rounded-2xl border-2 text-[11px] font-black transition active:scale-95 ${isOutOfStock ? "border-stone-100 bg-stone-50 text-stone-300 cursor-not-allowed" : "border-stone-200 bg-white text-stone-700 hover:border-black hover:text-black"}`}
            >
              عمده
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
