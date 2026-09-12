import { useEffect, useMemo, useRef, useState } from "react";
import { dashboardApi } from "../services/dashboardApi";
import { useProducts } from "../hooks/useProducts";
import { getUnitLabel, type Product } from "../data";
import { CustomerCreateModal } from "./VisitorCustomers";

type VisitCustomer = {
  id: number;
  customer: number;
  customer_name: string;
  customer_phone: string;
  priority: number;
  status: string;
  notes?: string;
  admin_notes?: string;
  address?: string;
  source?: "today" | "saved";
};

type CartLine = {
  product: Product;
  quantity: number;
};

function money(value: number | string | null | undefined) {
  const num = Number(value ?? 0);
  return (Number.isFinite(num) ? num : 0).toLocaleString("en-US") + " تومان";
}

function productPrice(product: Product) {
  const price = Number(product.wholesale_price || product.base_price || product.price || 0);
  return Number.isFinite(price) ? price : 0;
}

function lineTotal(line: CartLine) {
  return productPrice(line.product) * line.quantity;
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "در انتظار بازدید",
    visited: "بازدید شده",
    ordered: "سفارش ثبت شده",
    no_order: "سفارش نداشت",
    postponed: "به تعویق افتاد",
    saved: "مشتری ذخیره‌شده",
  };
  return labels[status] || status || "نامشخص";
}

export default function VisitorOrderCreate() {
  const { products, loading: productsLoading } = useProducts();
  const [customers, setCustomers] = useState<VisitCustomer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">("");
  const [query, setQuery] = useState("");
  const [address, setAddress] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successOrder, setSuccessOrder] = useState<any>(null);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [addedProductId, setAddedProductId] = useState<number | null>(null);
  const [addAnimationKey, setAddAnimationKey] = useState(0);
  const addTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let ignore = false;
    setCustomersLoading(true);

    Promise.allSettled([
      dashboardApi.visitor.todayList(),
      dashboardApi.visitor.customers(),
    ])
      .then(([todayResult, savedResult]) => {
        if (ignore) return;

        const todayCustomers: VisitCustomer[] = todayResult.status === "fulfilled" && Array.isArray(todayResult.value)
          ? todayResult.value.map((customer: any) => ({ ...customer, source: "today" as const }))
          : [];

        const savedCustomers: VisitCustomer[] = savedResult.status === "fulfilled" && Array.isArray(savedResult.value)
          ? savedResult.value.map((customer: any, index: number) => ({
              id: -Number(customer.id || index + 1),
              customer: Number(customer.id),
              customer_name: customer.full_name || `${customer.first_name || ""} ${customer.last_name || ""}`.trim() || customer.username || "مشتری بدون نام",
              customer_phone: customer.phone || "",
              priority: 0,
              status: "saved",
              address: customer.address || "",
              source: "saved" as const,
            }))
          : [];

        const merged = new Map<number, VisitCustomer>();
        savedCustomers.forEach((customer) => merged.set(customer.customer, customer));
        todayCustomers.forEach((customer) => merged.set(customer.customer, customer));
        setCustomers(Array.from(merged.values()));

        if (todayResult.status === "rejected" && savedResult.status === "rejected") {
          setError("خطا در دریافت مشتریان");
        }
      })
      .finally(() => {
        if (!ignore) setCustomersLoading(false);
      });

    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    return () => {
      if (addTimeoutRef.current) window.clearTimeout(addTimeoutRef.current);
    };
  }, []);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.customer === selectedCustomerId),
    [customers, selectedCustomerId]
  );

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => p.available !== false)
      .filter((p) => !q || `${p.name} ${p.brand} ${p.category}`.toLowerCase().includes(q))
      .slice(0, 18);
  }, [products, query]);

  const total = useMemo(() => cart.reduce((sum, line) => sum + lineTotal(line), 0), [cart]);
  const totalCount = useMemo(() => cart.reduce((sum, line) => sum + line.quantity, 0), [cart]);

  const addProduct = (product: Product) => {
    setSuccessOrder(null);
    setError("");
    setAddedProductId(product.id);
    setAddAnimationKey((prev) => prev + 1);
    if (addTimeoutRef.current) window.clearTimeout(addTimeoutRef.current);
    addTimeoutRef.current = window.setTimeout(() => setAddedProductId(null), 1200);

    setCart((prev) => {
      const exists = prev.find((line) => line.product.id === product.id);
      if (exists) {
        return prev.map((line) => line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateLine = (productId: number, patch: Partial<CartLine>) => {
    setCart((prev) => prev.map((line) => line.product.id === productId ? { ...line, ...patch } : line));
  };

  const removeLine = (productId: number) => {
    setCart((prev) => prev.filter((line) => line.product.id !== productId));
  };

  const handleCustomerCreated = (customer: any) => {
    const visitCustomer: VisitCustomer = {
      id: Date.now(),
      customer: customer.id,
      customer_name: customer.full_name || `${customer.first_name || ""} ${customer.last_name || ""}`.trim() || customer.username,
      customer_phone: customer.phone || "",
      priority: Math.min(customers.length + 1, 5),
      status: "pending",
    };
    setCustomers((prev) => [visitCustomer, ...prev]);
    setSelectedCustomerId(customer.id);
    setAddress(customer.address || "");
    setCustomerModalOpen(false);
    setSuccessOrder(null);
  };

  const submitOrder = async () => {
    setError("");
    setSuccessOrder(null);

    if (!selectedCustomerId) {
      setError("ابتدا مشتری را از برنامه امروز انتخاب کنید.");
      return;
    }
    if (cart.length === 0) {
      setError("حداقل یک محصول به سفارش اضافه کنید.");
      return;
    }

    const invalid = cart.find((line) => line.quantity < 1);
    if (invalid) {
      setError(`تعداد محصول «${invalid.product.name}» معتبر نیست.`);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        customer_id: Number(selectedCustomerId),
        sale_type: "wholesale" as const,
        address,
        items: cart.map((line) => ({
          product_id: line.product.id,
          quantity: line.quantity,
        })),
      };
      const order = await dashboardApi.visitor.orderCreate(payload);
      setSuccessOrder(order);
      setCart([]);
      setAddress("");
    } catch (err: any) {
      setError(err.message || "خطا در ثبت سفارش ویزیتور");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]" dir="rtl">
      <div className="relative overflow-hidden bg-gradient-to-br from-stone-950 via-blue-950 to-indigo-900 px-4 py-8 text-white sm:px-6 lg:px-10">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-500/25 blur-3xl" />
        <div className="absolute -left-24 top-16 h-80 w-80 rounded-full bg-gold-400/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.10)_1px,transparent_0)] bg-[size:30px_30px] opacity-30" />

        <div className="relative mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-black backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-lg shadow-emerald-300/50" />
            ثبت سفارش اختصاصی ویزیتور
          </div>
          <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <h1 className="font-display text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                ثبت سفارش حضوری
                <span className="block text-gold-300">سریع، دقیق و لوکس</span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm font-bold leading-8 text-blue-100/80">
مشتری برنامه امروز را انتخاب کنید، محصولات عمده را اضافه کنید و درخواست عمده را برای پیگیری و تایید ثبت نمایید.
              </p>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between text-xs font-black text-blue-100">
                <span>جمع سفارش</span>
                <span>{cart.length} قلم</span>
              </div>
              <div className="mt-3 text-3xl font-black text-gold-300">{money(total)}</div>
              <div className="mt-2 text-[11px] font-bold text-blue-100/70">مجموع تعداد: {totalCount.toLocaleString("en-US")}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-30">
        <div className="rounded-[2rem] border border-blue-100 bg-gradient-to-l from-blue-50 via-white to-cyan-50 p-5 shadow-xl shadow-blue-900/5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-700 text-xl text-white shadow-lg shadow-blue-700/20">🏬</span>
              <div>
                <h2 className="text-base font-black text-stone-900">ثبت سفارش عمده</h2>
                <p className="mt-1 text-xs font-bold text-stone-500">این بخش مخصوص سفارش‌های عمده ویزیتور است؛ فروش خرده در این پنل فعال نیست.</p>
              </div>
            </div>
            <span className="rounded-full bg-blue-700 px-4 py-2 text-xs font-black text-white shadow-lg shadow-blue-700/20">فقط عمده</span>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[310px_1fr_300px] lg:px-0">
        <aside className="space-y-4">
          <div className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-xl shadow-stone-900/5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-stone-900">انتخاب مشتری</h2>
                <p className="mt-1 text-[10px] font-bold text-stone-400">از برنامه امروز، مشتری‌های ذخیره‌شده یا مشتری جدید</p>
              </div>
              <button onClick={() => setCustomerModalOpen(true)} className="rounded-2xl bg-gradient-to-l from-blue-700 to-indigo-600 px-3 py-2 text-[10px] font-black text-white shadow-lg shadow-blue-700/15 transition hover:-translate-y-0.5" type="button">+ مشتری</button>
            </div>

            {customersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-stone-100" />)}
              </div>
            ) : customers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-5 text-center text-sm font-bold leading-7 text-stone-500">
هنوز مشتری‌ای برای انتخاب پیدا نشد؛ می‌توانید مشتری جدید اضافه کنید.
              </div>
            ) : (
              <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
                {customers.map((customer) => {
                  const active = selectedCustomerId === customer.customer;
                  return (
                    <button
                      key={customer.id}
                      onClick={() => { setSelectedCustomerId(customer.customer); setAddress(customer.address || ""); setSuccessOrder(null); }}
                      className={`w-full rounded-2xl border p-4 text-right transition ${active ? "border-blue-300 bg-blue-50 shadow-lg shadow-blue-900/10" : "border-stone-200 bg-white hover:border-blue-200 hover:bg-blue-50/40"}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-black text-stone-900">{customer.customer_name}</div>
                          <div dir="ltr" className="mt-1 text-right font-mono text-xs font-bold text-stone-500">{customer.customer_phone || "بدون شماره"}</div>
                        </div>
                        <span className={`flex h-9 min-w-9 shrink-0 items-center justify-center rounded-2xl px-2 text-xs font-black text-white ${customer.source === "today" ? "bg-stone-900" : "bg-blue-700"}`}>
                          {customer.source === "today" ? customer.priority : "ذخیره"}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black">
                        <span className="rounded-full bg-white px-2.5 py-1 text-stone-500">{statusLabel(customer.status)}</span>
                        {customer.source === "saved" && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">لیست مشتری‌ها</span>}
                        {customer.admin_notes && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">یادداشت مدیر</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-black text-stone-900">آدرس تحویل</h3>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={4}
              placeholder="آدرس دقیق مشتری یا توضیح مسیر را وارد کنید..."
              className="mt-3 w-full resize-none rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold leading-7 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </aside>

        <section className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-xl shadow-stone-900/5">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-black text-stone-900">انتخاب محصولات</h2>
              <p className="mt-1 text-xs font-bold text-stone-400">محصولات موجود را به سفارش اضافه کنید.</p>
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجوی محصول، برند یا دسته..."
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-blue-400 focus:bg-white sm:w-72"
            />
          </div>

          {productsLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-stone-100" />)}
            </div>
          ) : (
            <div className="grid max-h-[720px] gap-3 overflow-y-auto px-1 pt-12 sm:grid-cols-2">
              {filteredProducts.map((product) => {
                const isAdded = addedProductId === product.id;
                return (
                  <button
                    key={product.id}
                    onClick={() => addProduct(product)}
                    className={`group relative overflow-visible rounded-2xl border text-right transition active:scale-[0.98] ${isAdded ? "border-emerald-300 bg-emerald-50 shadow-2xl shadow-emerald-900/10" : "border-stone-200 bg-stone-50 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-xl"}`}
                  >
                    {isAdded && (
                      <div
                        key={addAnimationKey}
                        className="pointer-events-none absolute -top-11 left-1/2 z-20 flex -translate-x-1/2 animate-bounce items-center gap-2 whitespace-nowrap rounded-full border border-emerald-200 bg-white px-3.5 py-2 text-[11px] font-black text-emerald-700 shadow-2xl shadow-emerald-900/10"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-sm font-black text-white shadow-lg">+1</span>
                        <span>به سفارش اضافه شد</span>
                      </div>
                    )}
                    {isAdded && <span className="pointer-events-none absolute inset-0 animate-ping rounded-2xl bg-emerald-400/20" />}
                    <div className="relative flex gap-3 overflow-hidden rounded-2xl p-3">
                      <img src={product.image || "/images/placeholder.jpg"} alt={product.name} className={`h-20 w-20 rounded-2xl border bg-white object-cover shadow-sm transition duration-700 ${isAdded ? "scale-105 ring-4 ring-emerald-200" : "group-hover:scale-105"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-black text-stone-900">{product.name}</div>
                        <div className="mt-1 text-[11px] font-bold text-stone-500">{product.brand || "بدون برند"} • {getUnitLabel(product.unit)}</div>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <span className={`text-sm font-black ${isAdded ? "text-emerald-700" : "text-blue-700"}`}>{money(productPrice(product))}</span>
                          <span className={`relative overflow-hidden rounded-xl px-3 py-1.5 text-[10px] font-black text-white shadow-lg transition ${isAdded ? "scale-105 bg-emerald-600 shadow-emerald-600/25" : "bg-stone-900 group-hover:bg-blue-700"}`}>
                            <span className="relative inline-flex items-center gap-1.5">
                              {isAdded ? <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] text-emerald-600">+1</span> : null}
                              {isAdded ? "اضافه شد" : "افزودن +"}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
              {filteredProducts.length === 0 && (
                <div className="col-span-full rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-10 text-center text-sm font-bold text-stone-500">
                  محصولی با این جستجو پیدا نشد.
                </div>
              )}
            </div>
          )}
        </section>

        <aside className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-xl shadow-stone-900/5 lg:sticky lg:top-20 lg:self-start">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-black text-stone-900">سبد سفارش</h2>
            <button onClick={() => setCart([])} disabled={cart.length === 0} className="rounded-full bg-red-50 px-3 py-1.5 text-[10px] font-black text-red-600 disabled:opacity-40">پاک کردن</button>
          </div>

          {selectedCustomer && (
            <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <div className="text-[10px] font-black text-blue-600">مشتری انتخاب‌شده</div>
              <div className="mt-1 font-black text-stone-900">{selectedCustomer.customer_name}</div>
              <div dir="ltr" className="mt-1 text-right font-mono text-xs font-bold text-stone-500">{selectedCustomer.customer_phone}</div>
            </div>
          )}

          <div className="max-h-[430px] space-y-3 overflow-y-auto pr-1">
            {cart.map((line) => (
              <div key={line.product.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                <div className="flex gap-3">
                  <img src={line.product.image || "/images/placeholder.jpg"} alt={line.product.name} className="h-14 w-14 rounded-xl border bg-white object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-black text-stone-900">{line.product.name}</div>
                    <div className="mt-1 text-xs font-black text-blue-700">{money(lineTotal(line))}</div>
                  </div>
                  <button onClick={() => removeLine(line.product.id)} className="h-8 w-8 rounded-xl bg-white text-red-500 shadow-sm">×</button>
                </div>
                <div className="mt-3">
                  <label className="text-[10px] font-black text-stone-500">
                    تعداد عمده
                    <input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) => updateLine(line.product.id, { quantity: Math.max(1, Number(e.target.value || 1)) })}
                      className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-center font-mono text-sm font-black outline-none focus:border-blue-400"
                    />
                  </label>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-8 text-center text-sm font-bold leading-7 text-stone-500">
                هنوز محصولی اضافه نشده است.
              </div>
            )}
          </div>

          {error && <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-7 text-red-700">{error}</div>}
          {successOrder && (
            <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold leading-7 text-emerald-700">
              درخواست عمده با موفقیت ثبت شد: <span className="font-mono">{successOrder.request_number}</span>
            </div>
          )}

          <div className="mt-5 rounded-2xl bg-stone-900 p-4 text-white">
            <div className="flex items-center justify-between text-xs font-bold text-stone-300">
              <span>مبلغ نهایی</span>
              <span>{cart.length} قلم</span>
            </div>
            <div className="mt-2 text-2xl font-black text-gold-300">{money(total)}</div>
          </div>

          <button
            onClick={submitOrder}
            disabled={saving || cart.length === 0 || !selectedCustomerId}
            className="mt-4 w-full rounded-2xl bg-gradient-to-l from-blue-700 via-blue-600 to-indigo-600 py-4 text-sm font-black text-white shadow-xl shadow-blue-700/20 transition hover:-translate-y-0.5 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "در حال ثبت سفارش عمده..." : "ثبت نهایی سفارش عمده"}
          </button>
        </aside>
      </div>

      {customerModalOpen && (
        <CustomerCreateModal
          onClose={() => setCustomerModalOpen(false)}
          onCreated={handleCustomerCreated}
        />
      )}
    </div>
  );
}
