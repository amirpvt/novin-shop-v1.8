import { formatPrice, type Product } from "../data";
import { ArrowRightIcon, TruckIcon, CheckIcon, PhoneIcon } from "../components/icons";
import { useRetailCart } from "../context/RetailCartContext";
import { useWholesaleRequest } from "../context/WholesaleRequestContext";
type Props = {
  products: Product[];
};

import { useParams, useNavigate } from "react-router-dom";

export default function ProductDetails({
  products,
}: Props) {

  const { id } = useParams();

  const navigate = useNavigate();

  const product = products.find(
    (p) => p.id === Number(id)
  );

  const { addRetailItem } = useRetailCart();
  const { addWholesaleItem } = useWholesaleRequest();

  if (!product) {
    return (
      <div className="pt-32 text-center">
        محصول پیدا نشد.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 pt-24 pb-20 font-sans text-right" dir="rtl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Breadcrumb */}
        <button
          onClick={() => navigate("/shop")}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-stone-500 transition hover:text-paprika-700 mb-8"
        >
          <ArrowRightIcon className="h-4 w-4" />
          بازگشت به فروشگاه
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-[3rem] border border-stone-200 shadow-xl overflow-hidden p-8 sm:p-12">
          {/* Right: Product Image */}
          <div className="relative group">
            <div className="absolute inset-0 bg-paprika-600/5 rounded-[2.5rem] blur-2xl group-hover:bg-paprika-600/10 transition-colors" />
            <div className="relative aspect-square overflow-hidden rounded-[2.5rem] border border-stone-100 shadow-inner">
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            {product.tag && (
              <span className="absolute top-6 right-6 bg-paprika-600 text-white px-5 py-2 rounded-full text-xs font-bold shadow-lg">
                {product.tag}
              </span>
            )}
          </div>

          {/* Left: Product Info */}
          <div className="flex flex-col">
            <div className="mb-6">
              <span className="inline-block px-4 py-1.5 rounded-full bg-gold-50 text-gold-700 text-xs font-bold mb-4">
                دسته: {product.category}
              </span>
              <h1 className="font-display text-3xl sm:text-5xl font-bold text-stone-800 leading-tight">
                {product.name}
              </h1>
              <p className="mt-4 text-stone-400 font-medium">{product.unit}</p>
            </div>

            <div className="flex items-center gap-4 mb-8 p-6 rounded-3xl bg-stone-50 border border-stone-100">
              <div>
                <p className="text-xs text-stone-400 font-bold mb-1">قیمت تک‌فروشی:</p>
                <p className="font-display text-3xl font-bold text-paprika-700">
                  {formatPrice(product.price)}
                </p>
              </div>
              {product.available ? (
                <div className="mr-auto flex items-center gap-1.5 text-emerald-600 font-bold text-sm">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  موجود در انبار
                </div>
              ) : (
                <div className="mr-auto text-paprika-400 font-bold text-sm">ناموجود</div>
              )}
            </div>

            <div className="space-y-6 flex-1 text-stone-600 leading-relaxed mb-8">
              <h3 className="font-bold text-stone-800 text-lg">توضیحات محصول:</h3>
              <p>{product.description}</p>
              
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm">
                  <CheckIcon className="h-5 w-5 text-paprika-600" />
                  تولید روز با گوشت تازه ۱۰۰٪
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckIcon className="h-5 w-5 text-paprika-600" />
                  بدون مواد نگهدارنده غیرمجاز
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckIcon className="h-5 w-5 text-paprika-600" />
                  بسته‌بندی وکیوم بهداشتی
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => addRetailItem(product)}
                className="flex items-center justify-center gap-3 bg-paprika-600 text-white py-5 rounded-[1.5rem] font-bold text-lg shadow-lg shadow-paprika-600/30 hover:bg-paprika-700 transition active:scale-95"
              >
                <span>🛒</span>
                افزودن به سبد خرید
              </button>
              <button
                onClick={() => {
                  addWholesaleItem(product);
                  navigate("/wholesale");
                }}
                className="flex items-center justify-center gap-3 border-2 border-paprika-200 bg-paprika-50 text-paprika-700 py-5 rounded-[1.5rem] font-bold text-lg hover:bg-paprika-100 transition active:scale-95"
              >
                <span>📦</span>
                استعلام قیمت عمده
              </button>
            </div>

            {/* Trust badges */}
            <div className="mt-8 pt-8 border-t border-stone-100 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <TruckIcon className="h-6 w-6 text-stone-400" />
                <span className="text-[11px] font-bold text-stone-500">ارسال با ماشین یخچال‌دار</span>
              </div>
              <div className="flex items-center gap-3">
                <PhoneIcon className="h-6 w-6 text-stone-400" />
                <span className="text-[11px] font-bold text-stone-500">پشتیبانی ۲۴ ساعته</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
