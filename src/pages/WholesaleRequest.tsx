import { useState } from "react";
import { useWholesaleRequest } from "../context/WholesaleRequestContext";
import { formatPrice, type Product, getUnitLabel } from "../data";
import { TrashIcon, ArrowRightIcon, CheckIcon, PackageIcon } from "../components/icons";

type Props = {
  products: Product[];
  onBack?: () => void;
  onSubmit: (formData: any, items: any[]) => void;
};

export default function WholesaleRequest({ products, onSubmit }: Props) {
  const {
    wholesaleItems,
    addWholesaleItem,
    removeWholesaleItem,
    updateWholesaleQuantity,
    clearWholesaleRequest,
  } = useWholesaleRequest();

  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({
    companyName: "",
    contactPerson: "",
    phone: "",
    address: "",
    description: "",
  });

  const handleNextStep = () => {
    if (wholesaleItems.length > 0) setStep(2);
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form, wholesaleItems);
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-cream-50 pb-20 pt-10 lg:pt-[60px] font-sans text-right" dir="rtl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 flex-wrap">
            <div>
              <h1 className="font-display text-3xl font-bold text-stone-800 sm:text-4xl">
                کاتالوگ استعلام عمده (B2B)
              </h1>
              <p className="text-stone-500 mt-2">محصولات مورد نظر را انتخاب و تعداد را با واحد عمده مشخص کنید.</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={clearWholesaleRequest}
                className="text-stone-400 text-sm font-bold hover:text-paprika-600 transition"
              >
                پاک‌سازی لیست
              </button>
              <button
                disabled={wholesaleItems.length === 0}
                onClick={handleNextStep}
                className="bg-gold-700 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-gold-700/20 hover:bg-gold-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                مرحله بعد: اطلاعات شرکت
                <ArrowRightIcon className="h-4 w-4 rotate-180" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => {
              const inWholesale = wholesaleItems.find((item: any) => String(item.id) === String(p.id));
              const wholesaleUnit = (p as any).wholesale_unit || p.unit;
              const wholesaleUnitLabel = (p as any).wholesale_unit_display || getUnitLabel(wholesaleUnit);
              const hasWholesalePrice = (p as any).wholesale_price !== undefined && (p as any).wholesale_price !== null && Number((p as any).wholesale_price) > 0;
              const hasDiscount = p.discount_price && p.discount_price > 0 && p.discount_price < p.price;
              const wholesalePrice = Number(hasWholesalePrice ? (p as any).wholesale_price : hasDiscount ? p.discount_price : p.price);
              const minQty = (p as any).wholesale_min_quantity || 1;
              return (
                <div 
                  key={p.id} 
                  className={`group relative flex flex-col overflow-hidden rounded-[2rem] border-2 transition-all duration-300 bg-white ${
                    inWholesale ? "border-gold-500 shadow-gold-900/10 shadow-xl" : "border-stone-100 shadow-sm hover:border-gold-200"
                  }`}
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
                    <img src={p.image} alt={p.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    {inWholesale && (
                      <div className="absolute inset-0 bg-gold-600/10 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="bg-gold-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">در لیست استعلام</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-stone-900/80 backdrop-blur text-white px-3 py-1 rounded-full text-[10px] font-bold">
                      حداقل: {minQty.toLocaleString("en-US")} {wholesaleUnitLabel}
                    </div>
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-stone-800 text-lg">{p.name}</h3>
                      <span className="text-[10px] font-bold text-gold-600 bg-gold-50 px-2 py-1 rounded-md">{p.category}</span>
                    </div>
                    <div className="flex gap-2 text-[10px] text-stone-500 mb-2">
                      <span className="bg-stone-50 px-2 py-1 rounded-full">جزئی: {getUnitLabel((p as any).retail_unit || p.unit)}</span>
                      <span className="bg-gold-50 text-gold-700 px-2 py-1 rounded-full font-bold">عمده: {wholesaleUnitLabel}</span>
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-stone-50 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-stone-400 font-bold mb-0.5">قیمت عمده:</div>
                        <div className="font-display text-lg font-bold text-stone-700">{formatPrice(wholesalePrice)}</div>
                      </div>

                      {inWholesale ? (
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2 bg-gold-50 p-1 rounded-xl">
                            <button 
                              onClick={() => updateWholesaleQuantity(p.id as any, (inWholesale as any).quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-gold-700 font-bold hover:bg-gold-100 transition shadow-sm"
                            >+</button>
                            <div className="flex flex-col items-center min-w-[50px]">
                              {/* ✅ عدد انگلیسی */}
                              <input 
                                type="number" 
                                dir="ltr"
                                lang="en"
                                className="w-14 text-center bg-transparent border-none font-mono font-black text-gold-900 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                value={inWholesale.quantity}
                                onChange={(e) => updateWholesaleQuantity(p.id as any, Number(e.target.value))}
                                min={minQty}
                                style={{ fontVariantNumeric: "lining-nums" }}
                              />
                              <span className="text-[9px] font-bold text-gold-700">{wholesaleUnitLabel}</span>
                            </div>
                            <button 
                              onClick={() => updateWholesaleQuantity(p.id as any, Math.max(minQty, (inWholesale as any).quantity - 1))}
                              className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-gold-700 font-bold hover:bg-gold-100 transition shadow-sm"
                            >-</button>
                          </div>
                          <span className="text-[10px] text-amber-600 font-mono" dir="ltr">min {minQty.toLocaleString("en-US")} {wholesaleUnitLabel}</span>
                        </div>
                      ) : (
                        <button 
                          onClick={() => addWholesaleItem(p)}
                          className="bg-gold-50 text-gold-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gold-600 hover:text-white transition-all flex items-center gap-2"
                        >
                          <PackageIcon className="h-4 w-4" />
                          افزودن
                        </button>
                      )}
                    </div>
                  </div>
                  {inWholesale && (
                    <button 
                      onClick={() => removeWholesaleItem(p.id as any)}
                      className="absolute top-3 left-3 bg-white/90 hover:bg-paprika-50 hover:text-paprika-600 text-stone-400 p-2 rounded-full shadow-md backdrop-blur transition"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 pt-12 lg:pt-[72px] pb-20 font-sans text-right" dir="rtl">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <button
          onClick={() => setStep(1)}
          className="inline-flex items-center gap-1 text-sm font-bold text-stone-500 transition hover:text-gold-700 mb-6 mt-4"
        >
          <ArrowRightIcon className="h-4 w-4" />
          بازگشت به کاتالوگ
        </button>

        <div className="bg-white rounded-[2.5rem] border border-stone-200 shadow-xl overflow-hidden">
          <div className="bg-gold-700 p-8 text-white">
            <h2 className="text-2xl font-display font-bold">تکمیل اطلاعات متقاضی عمده</h2>
          </div>

          <div className="p-6 bg-stone-50 border-b">
            <h4 className="text-sm font-black mb-3">لیست سفارش عمده:</h4>
            <div className="space-y-2">
              {wholesaleItems.map((item: any) => {
                const prod = products.find(p => String(p.id) === String(item.id)) as any;
                const unitLabel = prod ? (prod.wholesale_unit_display || getUnitLabel(prod.wholesale_unit || prod.unit)) : item.unit || "عدد";
                return (
                  <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded-xl border">
                    <span className="font-bold text-sm">{item.name}</span>
                    <span className="text-sm font-mono bg-gold-50 text-gold-700 px-3 py-1 rounded-full font-black" dir="ltr" lang="en">
                      {Number(item.quantity).toLocaleString("en-US")} {unitLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleFinalSubmit} className="p-8 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-stone-500 mb-2">نام شرکت</label>
                <input required value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} placeholder="مثلاً: رستوران ایکس" className="w-full rounded-2xl bg-stone-50 border border-stone-100 p-4 text-sm outline-none focus:border-gold-600" />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 mb-2">نام رابط</label>
                <input required value={form.contactPerson} onChange={e => setForm({...form, contactPerson: e.target.value})} placeholder="علی محمدی" className="w-full rounded-2xl bg-stone-50 border border-stone-100 p-4 text-sm outline-none focus:border-gold-600" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-500 mb-2">شماره تماس</label>
              <input required type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="0912..." className="w-full rounded-2xl bg-stone-50 border border-stone-100 p-4 text-sm outline-none focus:border-gold-600" />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-500 mb-2">آدرس</label>
              <textarea required value={form.address} onChange={e => setForm({...form, address: e.target.value})} rows={2} placeholder="آدرس..." className="w-full rounded-2xl bg-stone-50 border border-stone-100 p-4 text-sm outline-none focus:border-gold-600 resize-none" />
            </div>

            <button type="submit" className="w-full bg-gold-700 text-white py-5 rounded-[1.5rem] font-bold text-lg shadow-lg hover:bg-gold-800 transition flex items-center justify-center gap-3">
              <CheckIcon className="h-6 w-6" />
              ثبت درخواست
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
