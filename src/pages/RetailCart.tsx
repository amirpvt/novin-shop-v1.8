import { useRetailCart } from "../context/RetailCartContext";
import { formatPrice } from "../data";
import { TrashIcon, ArrowRightIcon } from "../components/icons";

type Props = {
  onBack: () => void;
  onCheckout: () => void;
};

const getCartItemEffectivePrice = (item: any) => {
  const discount = Number(item.discount_price || 0);
  const price = Number(item.price || 0);
  return discount > 0 && discount < price ? discount : price;
};

export default function RetailCart({ onBack, onCheckout }: Props) {
  const {
    retailCart,
    increaseRetailQuantity,
    decreaseRetailQuantity,
    removeRetailItem,
    clearRetailCart,
    getRetailTotal,
    getRetailCount,
  } = useRetailCart();

  if (retailCart.length === 0) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-4 font-sans text-right" dir="rtl">
        <div className="text-8xl mb-6 text-paprika-100">🛒</div>
        <h2 className="text-2xl font-bold text-stone-800 mb-2">سبد خرید شما خالی است</h2>
        <p className="text-stone-500 mb-8 text-center max-w-sm">
          به نظر می‌رسد هنوز محصولی به سبد خرید مصرف‌کننده خود اضافه نکرده‌اید.
        </p>
        <button
          onClick={onBack}
          className="bg-paprika-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-paprika-600/30 hover:bg-paprika-700 transition"
        >
          شروع خرید تک‌فروشی
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 pt-24 pb-20 font-sans text-right" dir="rtl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-bold text-stone-800 sm:text-4xl">
            سبد خرید (مصرف‌کننده)
          </h1>
          <button
            onClick={clearRetailCart}
            className="text-paprika-600 text-sm font-bold hover:underline"
          >
            خالی کردن سبد
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {retailCart.map((item) => (
              <div key={item.id} className="bg-white rounded-3xl p-4 sm:p-6 border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center gap-6">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-stone-100">
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 text-center sm:text-right">
                  <h3 className="text-lg font-bold text-stone-900">{item.name}</h3>
                  <p className="text-sm text-stone-400 mt-1">{item.unit}</p>
                  {getCartItemEffectivePrice(item) < Number(item.original_price || item.price) ? (
                    <div className="mt-2">
                      <p className="text-xs font-bold text-stone-400 line-through">{formatPrice(item.original_price || item.price)}</p>
                      <p className="text-emerald-600 font-display text-lg font-bold">{formatPrice(getCartItemEffectivePrice(item))}</p>
                    </div>
                  ) : (
                    <p className="text-paprika-700 font-display text-lg font-bold mt-2">{formatPrice(getCartItemEffectivePrice(item))}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 bg-stone-50 rounded-2xl p-2 border border-stone-100">
                  <button onClick={() => increaseRetailQuantity(item.id)} className="h-10 w-10 flex items-center justify-center bg-white rounded-xl shadow-sm font-bold text-xl hover:bg-paprika-50 hover:text-paprika-600 transition">+</button>
                  <span className="w-8 text-center font-mono font-bold text-lg">{item.qty}</span>
                  <button onClick={() => decreaseRetailQuantity(item.id)} className="h-10 w-10 flex items-center justify-center bg-white rounded-xl shadow-sm font-bold text-xl hover:bg-paprika-50 hover:text-paprika-600 transition">-</button>
                </div>
                <div className="text-center sm:text-left min-w-[120px]">
                  <p className="text-stone-400 text-xs mb-1">جمع جزئی</p>
                  <p className="font-display text-xl font-bold text-stone-800">{formatPrice(getCartItemEffectivePrice(item) * item.qty)}</p>
                </div>
                <button onClick={() => removeRetailItem(item.id)} className="p-3 text-stone-400 hover:text-paprika-600 transition"><TrashIcon className="h-6 w-6" /></button>
              </div>
            ))}
            <button onClick={onBack} className="inline-flex items-center gap-2 text-stone-500 font-bold hover:text-paprika-700 transition">
              <ArrowRightIcon className="h-5 w-5" />
              ادامه خرید و افزودن محصولات دیگر
            </button>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-[2.5rem] p-8 border border-stone-200 shadow-xl sticky top-28">
              <h2 className="text-xl font-bold text-stone-800 mb-6 border-b border-stone-100 pb-4">خلاصه سفارش</h2>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-stone-500">
                  <span>تعداد محصولات</span>
                  <span className="font-mono font-bold">{getRetailCount()}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-lg font-bold text-stone-800">مبلغ قابل پرداخت</span>
                  <span className="font-display text-2xl font-bold text-paprika-700">{formatPrice(getRetailTotal())}</span>
                </div>
              </div>
              <button onClick={onCheckout} className="w-full bg-paprika-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-paprika-600/30 hover:bg-paprika-700 transition active:scale-[0.98]">پرداخت آنلاین و تکمیل سفارش</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
