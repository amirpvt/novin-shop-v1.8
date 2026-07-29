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

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-[2.5rem] border border-stone-200 bg-white shadow-sm transition-all duration-500 hover:-translate-y-2 hover:border-paprika-400 hover:shadow-2xl hover:shadow-paprika-900/10">
      {/* Image & Overlay */}
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-50">
        <img
          src={product.image}
          alt={product.name}
          className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 ${isOutOfStock ? 'grayscale opacity-60' : ''}`}
          onClick={() => !isOutOfStock && onClick(product)}
        />
        {/* Badges */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {product.tag && (
            <span className="rounded-full bg-paprika-600 px-3 py-1 text-[10px] font-black text-white shadow-lg">
              {product.tag === "best" ? "پرفروش" : product.tag === "new" ? "جدید" : product.tag === "discount" ? "تخفیف" : product.tag}
            </span>
          )}
          {product.badge && (
            <span className="rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold text-paprika-700 shadow-md backdrop-blur">
              {product.badge}
            </span>
          )}
          {isOutOfStock && (
            <span className="rounded-full bg-stone-800 px-3 py-1 text-[10px] font-black text-white shadow-lg">
              ناموجود
            </span>
          )}
        </div>

        {/* Stock badge */}
        {product.stock !== undefined && product.stock > 0 && product.stock <= 20 && (
          <div className="absolute bottom-4 left-4 rounded-full bg-amber-500 px-2.5 py-1 text-[9px] font-bold text-white shadow">
            تنها {product.stock} عدد باقی مانده
          </div>
        )}

        {/* Quick view */}
        <div className="absolute left-4 top-1/2 flex -translate-y-1/2 flex-col gap-2 opacity-0 transition-all duration-300 group-hover:left-6 group-hover:opacity-100">
          <button 
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-stone-800 shadow-xl transition hover:bg-paprika-600 hover:text-white"
            title="مشاهده سریع"
            onClick={() => onClick(product)}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-6 text-right">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black text-gold-600 uppercase tracking-widest">
            {product.category_name || product.category}
          </span>
          {product.brand && (
            <span className="text-[9px] text-stone-400">{product.brand}</span>
          )}
        </div>

        <h3 
          className="text-lg font-black text-stone-800 transition-colors group-hover:text-paprika-700 cursor-pointer"
          onClick={() => onClick(product)}
        >
          {product.name}
        </h3>
        <p className="mt-2 flex-1 text-xs font-medium leading-relaxed text-stone-500 line-clamp-2">
          {product.description}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-[10px] font-bold text-stone-400 bg-stone-50 px-2 py-1 rounded-lg">
            {product.unit}
          </span>
          {isOutOfStock ? (
            <span className="text-[10px] font-bold text-paprika-400">ناموجود</span>
          ) : (
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              موجود در انبار
            </div>
          )}
        </div>

        <div className="mt-5 border-t border-stone-100 pt-4">
          <div className="flex items-end justify-between mb-4">
            <span className="font-display text-2xl font-black text-paprika-700">
              {formatPrice(product.price)}
            </span>
            {product.stock !== undefined && product.stock > 0 && (
              <span className="text-[10px] text-stone-400">{product.stock} عدد موجود</span>
            )}
          </div>
          
          <div className="grid grid-cols-5 gap-2">
            <button
              onClick={() => !isOutOfStock && addRetailItem(product)}
              disabled={isOutOfStock}
              className={`col-span-3 flex items-center justify-center gap-2 rounded-2xl py-3.5 text-[11px] font-black shadow-lg transition active:scale-95 cursor-pointer ${
                isOutOfStock 
                  ? "bg-stone-200 text-stone-400 cursor-not-allowed shadow-none" 
                  : "bg-paprika-600 text-white shadow-paprika-600/20 hover:bg-paprika-700"
              }`}
            >
              <CartIcon className="h-4 w-4" />
              {isOutOfStock ? "ناموجود" : "خرید تکی"}
            </button>
            <button
              onClick={() => onWholesale(product)}
              disabled={isOutOfStock}
              className={`col-span-2 flex items-center justify-center rounded-2xl border-2 text-[11px] font-black transition active:scale-95 cursor-pointer ${
                isOutOfStock
                  ? "border-stone-100 bg-stone-50 text-stone-300 cursor-not-allowed"
                  : "border-stone-100 bg-white text-stone-600 hover:border-paprika-600 hover:text-paprika-700"
              }`}
            >
              عمده
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
