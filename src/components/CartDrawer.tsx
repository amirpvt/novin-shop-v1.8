import { useEffect } from "react";
import { CloseIcon, TrashIcon } from "./icons";
import { formatPrice } from "../data";
import type { CartItem } from "../storage";

type Props = {
  open: boolean;
  items: CartItem[];
  onClose: () => void;
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
  onNavigateToShop: () => void;
};

export default function CartDrawer({
  open,
  items,
  onClose,
  onUpdateQty,
  onRemove,
  onCheckout,
  onNavigateToShop,
}: Props) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const totalCount = items.reduce((s, i) => s + i.qty, 0);

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[160] bg-stone-950/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 right-0 z-[170] flex w-full max-w-md flex-col bg-cream-50 shadow-2xl transition-transform duration-300 font-sans text-stone-800 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center gap-2 font-display text-xl font-bold text-paprika-700">
            <span>🛒</span>
            سبد خرید شما ({totalCount} محصول)
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition hover:bg-paprika-50 hover:text-paprika-700 cursor-pointer"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-stone-400">
              <span className="text-6xl pb-3">🛒</span>
              <p className="font-bold text-base text-stone-600">
                سبد خرید شما در حال حاضر خالی است.
              </p>
              <p className="mt-1 text-xs text-stone-400 max-w-xs">
                به بخش فروشگاه یا دسته‌بندی‌ها سر بزنید و محصولات دلخواه خود را به سبد اضافه کنید.
              </p>
              <button
                onClick={() => {
                  onNavigateToShop();
                  onClose();
                }}
                className="mt-6 rounded-2xl bg-paprika-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-paprika-600/30 transition hover:bg-paprika-700 cursor-pointer"
              >
                مشاهده محصولات فروشگاه
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((it) => (
                <li
                  key={it.id}
                  className="flex flex-col gap-3 rounded-3xl border border-stone-200/80 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-stone-100 border border-stone-200/60">
                      <img
                        src={it.image}
                        alt={it.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 text-right">
                      <h4 className="font-bold text-stone-900 text-base">
                        {it.name}
                      </h4>
                      <span className="mt-1 block text-xs font-semibold text-stone-400">
                        {it.unit}
                      </span>
                      <span className="mt-1 block font-display text-sm font-bold text-paprika-700">
                        {formatPrice(it.price)}
                      </span>
                    </div>
                  </div>

                  {/* Quantity controls & total item price */}
                  <div className="flex items-center justify-between border-t border-stone-100 pt-3">
                    <div className="flex items-center gap-1 bg-cream-50 border border-stone-200/80 rounded-2xl p-1">
                      <button
                        onClick={() => onUpdateQty(it.id, 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-stone-800 font-bold hover:bg-paprika-600 hover:text-white transition shadow-sm cursor-pointer"
                        title="افزایش تعداد"
                      >
                        +
                      </button>
                      <span className="w-8 text-center font-mono font-bold text-sm">
                        {it.qty}
                      </span>
                      <button
                        onClick={() => onUpdateQty(it.id, -1)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-stone-800 font-bold hover:bg-paprika-600 hover:text-white transition shadow-sm cursor-pointer"
                        title="کاهش تعداد"
                      >
                        -
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-display font-bold text-stone-800 text-base">
                        {formatPrice(it.price * it.qty)}
                      </span>
                      <button
                        onClick={() => onRemove(it.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-paprika-50 text-paprika-700 transition hover:bg-paprika-600 hover:text-white cursor-pointer"
                        title="حذف از سبد"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-stone-200 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between text-base mb-4">
              <span className="font-bold text-stone-600">مبلغ کل سفارش:</span>
              <span className="font-display text-2xl font-bold text-paprika-700">
                {formatPrice(total)}
              </span>
            </div>
            <button
              onClick={onCheckout}
              className="w-full rounded-2xl bg-paprika-600 py-4 font-bold text-white shadow-lg shadow-paprika-600/30 transition hover:bg-paprika-700 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>✅</span>
              تأیید و هدایت به فرم ثبت نهایی
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
