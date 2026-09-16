import { useState } from "react";
import { useWholesaleRequest } from "../context/WholesaleRequestContext";
import { formatPrice, type Product, getUnitLabel } from "../data";
import { TrashIcon, ArrowRightIcon, CheckIcon, PackageIcon } from "../components/icons";

type Props = {
  products: Product[];
  onBack?: () => void;
  onSubmit: (formData: any, items: any[]) => void;
};

function getWholesaleInfo(product: Product, inWholesale?: any) {
  const wholesaleUnit = (product as any).wholesale_unit || product.unit;
  const wholesaleUnitLabel = (product as any).wholesale_unit_display || getUnitLabel(wholesaleUnit);
  const options = ((product as any).wholesale_options || []).filter((o: any) => o.is_active !== false && Number(o.unit_price || 0) > 0);
  const hasWholesalePrice = (product as any).wholesale_price !== undefined && (product as any).wholesale_price !== null && Number((product as any).wholesale_price) > 0;
  const hasDiscount = product.discount_price && product.discount_price > 0 && product.discount_price < product.price;
  const fallbackWholesalePrice = Number(hasWholesalePrice ? (product as any).wholesale_price : hasDiscount ? product.discount_price : product.price);
  const selectedOption = options.find((o: any) => Number(o.id) === Number(inWholesale?.wholesale_option_id)) || options[0];
  const wholesalePrice = Number(selectedOption?.unit_price || inWholesale?.wholesale_unit_price || fallbackWholesalePrice);
  const minQty = (product as any).wholesale_min_quantity || 1;
  return { wholesaleUnit, wholesaleUnitLabel, options, selectedOption, wholesalePrice, minQty };
}

export default function WholesaleRequest({ products, onSubmit }: Props) {
  const {
    wholesaleItems,
    addWholesaleItem,
    removeWholesaleItem,
    updateWholesaleQuantity,
    updateWholesaleOption,
    clearWholesaleRequest,
  } = useWholesaleRequest();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
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

  const filteredProducts = products.filter((product) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${product.name} ${product.description || ""} ${product.brand || ""} ${product.category || ""} ${(product as any).category_name || ""}`
      .toLowerCase()
      .includes(q);
  });

  const selectedWholesaleDetails = wholesaleItems.map((item: any) => {
    const product = products.find((p) => String(p.id) === String(item.id)) as Product | undefined;
    const info = product ? getWholesaleInfo(product, item) : null;
    const unitLabel = item.wholesale_option_label || (product ? (info?.wholesaleUnitLabel || getUnitLabel((product as any).wholesale_unit || product.unit)) : item.unit || "عدد");
    const unitPrice = Number(item.wholesale_unit_price || info?.wholesalePrice || 0);
    const quantity = Number(item.quantity || 0);
    return {
      ...item,
      product,
      unitLabel,
      unitPrice,
      quantity,
      subtotal: unitPrice * quantity,
      optionLabel: item.wholesale_option_label || info?.selectedOption?.label || "",
    };
  });

  const selectedWholesaleTotal = selectedWholesaleDetails.reduce((sum, item) => sum + item.subtotal, 0);

  const handleBackToCatalogAndClear = () => {
    clearWholesaleRequest();
    setStep(1);
  };

  if (step === 1) {
    return (
      <>
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

            <div className="mb-6 rounded-[1.5rem] border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-black text-stone-900">جستجو در محصولات عمده</p>
                  <p className="mt-1 text-xs font-bold text-stone-400">بر اساس نام محصول، توضیحات، برند یا دسته‌بندی جستجو کنید.</p>
                </div>
                <div className="relative w-full md:max-w-md">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="جستجوی محصول عمده..."
                    className="w-full rounded-2xl border-2 border-stone-100 bg-stone-50 px-4 py-3 pl-12 text-sm font-bold outline-none transition focus:border-gold-600 focus:bg-white"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-xl bg-stone-200 px-3 py-1 text-xs font-black text-stone-600 hover:bg-stone-300"
                    >
                      پاک کردن
                    </button>
                  )}
                </div>
              </div>
              {search.trim() && (
                <p className="mt-3 text-xs font-bold text-stone-500">
                  {filteredProducts.length.toLocaleString("en-US")} محصول از {products.length.toLocaleString("en-US")} محصول پیدا شد
                </p>
              )}
            </div>

            <div className="space-y-4">
              {filteredProducts.map((p) => {
                const inWholesale = wholesaleItems.find((item: any) => String(item.id) === String(p.id));
                const { wholesaleUnitLabel, options, selectedOption, wholesalePrice, minQty } = getWholesaleInfo(p, inWholesale);
                const quantityUnitLabel = selectedOption?.label || wholesaleUnitLabel;
                return (
                  <div 
                    key={p.id} 
                    className={`relative rounded-[1.6rem] border-2 bg-white p-4 transition-all duration-300 ${
                      inWholesale ? "border-gold-500 shadow-gold-900/10 shadow-xl" : "border-stone-100 shadow-sm hover:border-gold-200"
                    }`}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                      <button
                        type="button"
                        onClick={() => setSelectedProduct(p)}
                        className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-stone-100 border border-stone-200 shadow-sm md:h-28 md:w-28"
                        title="مشاهده جزئیات محصول"
                      >
                        <img src={p.image} alt={p.name} className="h-full w-full object-cover transition-transform hover:scale-105" />
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-black text-stone-900">{p.name}</h3>
                            <p className="mt-1 line-clamp-2 text-xs font-bold leading-6 text-stone-500">{p.description}</p>
                          </div>
                          <span className="shrink-0 rounded-full bg-stone-900 px-3 py-1 text-[10px] font-black text-white">
                            حداقل: {minQty.toLocaleString("en-US")} {wholesaleUnitLabel}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold">
                          <span className="bg-stone-50 px-2 py-1 rounded-full text-stone-500">جزئی: {getUnitLabel((p as any).retail_unit || p.unit)}</span>
                          <span className="bg-gold-50 text-gold-700 px-2 py-1 rounded-full">عمده: {wholesaleUnitLabel}</span>
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">قیمت عمده: {formatPrice(wholesalePrice)}</span>
                          {options.length > 0 && <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{options.length.toLocaleString("en-US")} نوع عمده</span>}
                        </div>

                        {inWholesale && options.length > 0 && (
                          <div className="mt-3 max-w-md rounded-2xl border border-gold-100 bg-gold-50/50 p-3">
                            <label className="mb-2 block text-[10px] font-black text-gold-700">نوع سفارش عمده</label>
                            <select
                              value={selectedOption?.id || ""}
                              onChange={(e) => {
                                const option = options.find((o: any) => String(o.id) === e.target.value);
                                if (option) updateWholesaleOption(p.id as any, option.id, option.label, Number(option.unit_price || 0));
                              }}
                              className="w-full rounded-xl border border-gold-200 bg-white px-3 py-2 text-xs font-black text-stone-800 outline-none focus:border-gold-600"
                            >
                              {options.map((option: any) => (
                                <option key={option.id} value={option.id}>{option.label} - {formatPrice(Number(option.unit_price || 0))}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center justify-between gap-3 md:min-w-[230px] md:justify-end">
                        {inWholesale ? (
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2 bg-gold-50 p-1 rounded-xl">
                              <button 
                                onClick={() => updateWholesaleQuantity(p.id as any, (inWholesale as any).quantity + 1)}
                                className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-gold-700 font-bold hover:bg-gold-100 transition shadow-sm"
                              >+</button>
                              <div className="flex min-w-[86px] items-center justify-center gap-1 rounded-lg px-2">
                                <input 
                                  type="number" 
                                  dir="ltr"
                                  lang="en"
                                  className="w-12 text-center bg-transparent border-none font-mono font-black text-gold-900 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  value={inWholesale.quantity}
                                  onChange={(e) => updateWholesaleQuantity(p.id as any, Number(e.target.value))}
                                  min={minQty}
                                  style={{ fontVariantNumeric: "lining-nums" }}
                                />
                                <span className="whitespace-nowrap text-[10px] font-black text-gold-700">{quantityUnitLabel}</span>
                              </div>
                              <button 
                                onClick={() => updateWholesaleQuantity(p.id as any, Math.max(minQty, (inWholesale as any).quantity - 1))}
                                className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-gold-700 font-bold hover:bg-gold-100 transition shadow-sm"
                              >-</button>
                            </div>
                            <span className="text-[10px] text-amber-600 font-mono" dir="ltr">min {minQty.toLocaleString("en-US")} {quantityUnitLabel}</span>
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

                        {inWholesale && (
                          <button 
                            onClick={() => removeWholesaleItem(p.id as any)}
                            className="bg-white hover:bg-paprika-50 hover:text-paprika-600 text-stone-400 p-2 rounded-full shadow-md border transition"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {filteredProducts.length === 0 && (
              <div className="rounded-[2rem] border border-dashed border-stone-200 bg-white p-12 text-center shadow-sm">
                <div className="text-5xl mb-4">🔍</div>
                <p className="font-black text-stone-700">محصولی با این جستجو پیدا نشد</p>
                <p className="mt-2 text-xs font-bold text-stone-400">عبارت جستجو را تغییر دهید یا پاک کنید.</p>
              </div>
            )}
          </div>
        </div>

        {selectedProduct && <ProductDetailsModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-cream-50 pt-12 lg:pt-[72px] pb-20 font-sans text-right" dir="rtl">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <button
            onClick={handleBackToCatalogAndClear}
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
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h4 className="text-sm font-black">لیست سفارش عمده:</h4>
                <span className="rounded-full bg-gold-700 px-4 py-1.5 text-xs font-black text-white">
                  جمع کل: {formatPrice(selectedWholesaleTotal)}
                </span>
              </div>
              <div className="space-y-3">
                {selectedWholesaleDetails.map((item: any) => (
                  <div key={item.id} className="rounded-2xl border bg-white p-3 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <button
                        type="button"
                        onClick={() => item.product && setSelectedProduct(item.product)}
                        className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-stone-100 shadow-sm"
                        title="مشاهده جزئیات محصول"
                      >
                        <img src={item.image || item.product?.image} alt={item.name} className="h-full w-full object-cover" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="font-black text-sm text-stone-900">{item.name}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-bold">
                          {item.optionLabel && <span className="rounded-full bg-gold-50 px-2.5 py-1 text-gold-700">نوع عمده: {item.optionLabel}</span>}
                          <span className="rounded-full bg-stone-50 px-2.5 py-1 text-stone-600" dir="ltr">
                            {item.quantity.toLocaleString("en-US")} {item.unitLabel}
                          </span>
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">قیمت واحد: {formatPrice(item.unitPrice)}</span>
                        </div>
                      </div>
                      <div className="shrink-0 rounded-2xl bg-emerald-50 px-4 py-3 text-left">
                        <p className="text-[10px] font-black text-emerald-700">جمع این محصول</p>
                        <p className="mt-1 font-display text-base font-black text-emerald-800">{formatPrice(item.subtotal)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-gold-200 bg-gold-50 p-4">
                <div className="flex items-center justify-between font-black">
                  <span className="text-stone-800">مبلغ قابل پرداخت عمده</span>
                  <span className="font-display text-xl text-gold-800">{formatPrice(selectedWholesaleTotal)}</span>
                </div>
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
    {selectedProduct && <ProductDetailsModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
    </>
  );
}

function ProductDetailsModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const { wholesaleUnitLabel, options, wholesalePrice, minQty } = getWholesaleInfo(product);
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%");

  const handleZoomMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin(`${Math.max(0, Math.min(100, x))}% ${Math.max(0, Math.min(100, y))}%`);
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-sm" onClick={onClose} dir="rtl">
      <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b bg-stone-50 p-5">
          <h3 className="text-lg font-black text-stone-900">جزئیات محصول</h3>
          <button onClick={onClose} className="h-9 w-9 rounded-full bg-stone-200 text-stone-700">✕</button>
        </div>
        <div className="grid gap-5 p-5 md:grid-cols-[220px_1fr]">
          <div
            className="group h-56 w-full overflow-hidden rounded-2xl bg-stone-100 cursor-zoom-in"
            onMouseMove={handleZoomMove}
            onMouseLeave={() => setZoomOrigin("50% 50%")}
          >
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-150"
              style={{ transformOrigin: zoomOrigin }}
            />
          </div>
          <div>
            <h2 className="text-2xl font-black text-stone-900">{product.name}</h2>
            <p className="mt-3 text-sm font-bold leading-7 text-stone-500">{product.description || "توضیحاتی برای این محصول ثبت نشده است."}</p>
            <div className="mt-5 grid grid-cols-2 gap-3 text-xs font-black">
              <div className="rounded-2xl bg-stone-50 p-3"><p className="text-stone-400">دسته‌بندی</p><p className="mt-1 text-stone-800">{product.category || "—"}</p></div>
              <div className="rounded-2xl bg-stone-50 p-3"><p className="text-stone-400">برند</p><p className="mt-1 text-stone-800">{product.brand || "—"}</p></div>
              <div className="rounded-2xl bg-gold-50 p-3"><p className="text-gold-700">واحد عمده</p><p className="mt-1 text-stone-800">{wholesaleUnitLabel}</p></div>
              <div className="rounded-2xl bg-gold-50 p-3"><p className="text-gold-700">حداقل سفارش</p><p className="mt-1 text-stone-800">{minQty.toLocaleString("en-US")} {wholesaleUnitLabel}</p></div>
              <div className="col-span-2 rounded-2xl bg-emerald-50 p-3"><p className="text-emerald-700">قیمت عمده</p><p className="mt-1 text-stone-900">{formatPrice(wholesalePrice)}</p></div>
            </div>
            {options.length > 0 && (
              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                <p className="text-xs font-black text-blue-800">گزینه‌های قابل انتخاب عمده</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {options.map((option: any) => (
                    <span key={option.id} className="rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-black text-blue-700">
                      {option.label}: {formatPrice(Number(option.unit_price || 0))}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
