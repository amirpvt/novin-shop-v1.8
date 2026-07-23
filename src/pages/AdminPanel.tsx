import { useState } from "react";
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  CrownIcon,
  PackageIcon,
  ShoppingBagIcon,
  CloseIcon,
  CheckIcon,
  ArrowRightIcon,
  BarChartIcon,
} from "../components/icons";
import { categories, formatPrice, type Product } from "../data";
import type { StoredOrder } from "../storage";

type Props = {
  products: Product[];
  orders: StoredOrder[];
  onUpdateProducts: (products: Product[]) => void;
  onUpdateOrders: (orders: StoredOrder[]) => void;
  onBack: () => void;
};

export default function AdminPanel({
  products,
  orders,
  onUpdateProducts,
  onUpdateOrders,
  onBack,
}: Props) {
  const [tab, setTab] = useState<"products" | "orders" | "stats">("products");

  // Edit / Add Modal state
  const [editing, setEditing] = useState<Product | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<Omit<Product, "id">>({
    name: "",
    desc: "",
    price: 0,
    unit: "هر بسته ۵۰۰ گرم",
    category: "سوسیس",
    brand: "۲۰۲",
    image: "/images/p1.jpg",
    badge: "",
    tag: "",
    available: true,
  });

  const resetForm = () => {
    setForm({
      name: "",
      desc: "",
      price: 0,
      unit: "هر بسته ۵۰۰ گرم",
      category: "سوسیس",
      brand: "۲۰۲",
      image: "/images/p1.jpg",
      badge: "",
      tag: "",
      available: true,
    });
  };

  const openAdd = () => {
    resetForm();
    setEditing(null);
    setIsAdding(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      desc: p.desc,
      price: p.price,
      unit: p.unit,
      category: p.category,
      brand: p.brand || "۲۰۲",
      image: p.image,
      badge: p.badge ?? "",
      tag: p.tag ?? "",
      available: p.available,
    });
    setIsAdding(false);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || form.price <= 0) return;

    if (isAdding) {
      const newProd: Product = {
        ...form,
        id: "prod-" + Date.now(),
      };
      onUpdateProducts([newProd, ...products]);
      setIsAdding(false);
    } else if (editing) {
      const updated = products.map((x) =>
        x.id === editing.id ? { ...form, id: x.id } : x
      );
      onUpdateProducts(updated);
      setEditing(null);
    }
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm("آیا از حذف این محصول اطمینان دارید؟")) {
      onUpdateProducts(products.filter((x) => x.id !== id));
    }
  };

  const handleStatusChange = (orderId: string, newStatus: StoredOrder["status"]) => {
    const updated = orders.map((o) =>
      o.id === orderId ? { ...o, status: newStatus } : o
    );
    onUpdateOrders(updated);
  };

  return (
    <div className="min-h-screen bg-stone-100 pb-20 pt-24 text-stone-800 font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Top Breadcrumb & Owner Badge */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl bg-stone-900 p-8 text-white shadow-xl">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-paprika-600/30 border border-paprika-500/30 px-4 py-1 text-xs font-bold text-paprika-400">
              <CrownIcon className="h-4 w-4 text-gold-400" />
              بخش ویژه مدیریت کسب و کار
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
              پنل حرفه‌ای مدیریت فروشگاه
            </h1>
            <p className="mt-2 text-stone-400 text-sm">
              مدیریت لحظه‌ای کاتالوگ محصولات، قیمت‌ها و بررسی سفارش‌های عمده ثبت‌شده
            </p>
          </div>

          <button
            onClick={onBack}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur hover:bg-white/20 transition self-start sm:self-auto"
          >
            <ArrowRightIcon className="h-4 w-4" />
            مشاهده سایت اصلی
          </button>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="mt-8 flex gap-3 border-b border-stone-200 pb-4">
          <button
            onClick={() => setTab("products")}
            className={`flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold transition ${
              tab === "products"
                ? "bg-paprika-600 text-white shadow-md shadow-paprika-600/30"
                : "bg-white text-stone-600 hover:bg-stone-200"
            }`}
          >
            <PackageIcon className="h-5 w-5" />
            مدیریت محصولات ({products.length})
          </button>
          <button
            onClick={() => setTab("orders")}
            className={`flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold transition ${
              tab === "orders"
                ? "bg-paprika-600 text-white shadow-md shadow-paprika-600/30"
                : "bg-white text-stone-600 hover:bg-stone-200"
            }`}
          >
            <ShoppingBagIcon className="h-5 w-5" />
            سفارش‌های دریافتی ({orders.length})
          </button>
          <button
            onClick={() => setTab("stats")}
            className={`flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold transition ${
              tab === "stats"
                ? "bg-paprika-600 text-white shadow-md shadow-paprika-600/30"
                : "bg-white text-stone-600 hover:bg-stone-200"
            }`}
          >
            <BarChartIcon className="h-5 w-5" />
            آمار و گزارش‌ها
          </button>
        </div>

        {/* TAB 1: PRODUCTS MANAGEMENT */}
        {tab === "products" && (
          <div className="mt-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm border border-stone-200/60">
              <div>
                <h2 className="font-display text-xl font-bold text-stone-800">
                  لیست و ویرایش محصولات
                </h2>
                <p className="text-sm text-stone-500 mt-1">
                  شما می‌توانید قیمت‌ها، توضیحات و دسته‌بندی‌ها را تغییر دهید یا محصول جدید بیفزایید.
                </p>
              </div>
              <button
                onClick={openAdd}
                className="flex items-center justify-center gap-2 rounded-2xl bg-paprika-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-paprika-600/30 hover:bg-paprika-700 transition"
              >
                <PlusIcon className="h-5 w-5" />
                افزودن محصول جدید
              </button>
            </div>

            {/* Products Table */}
            <div className="overflow-hidden rounded-3xl bg-white shadow-sm border border-stone-200/60">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-cream-50 border-b border-stone-100 text-stone-600 font-bold">
                    <tr>
                      <th className="p-4">تصویر</th>
                      <th className="p-4">نام محصول</th>
                      <th className="p-4">دسته‌بندی</th>
                      <th className="p-4">قیمت (تومان)</th>
                      <th className="p-4">واحد فروش</th>
                      <th className="p-4">نشان / برچسب</th>
                      <th className="p-4 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-stone-50/80 transition">
                        <td className="p-4">
                          <div className="h-14 w-14 overflow-hidden rounded-xl bg-stone-100 border border-stone-200/50">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="p-4 font-bold text-stone-900">{p.name}</td>
                        <td className="p-4">
                          <span className="rounded-full bg-gold-50 px-3 py-1 text-xs font-bold text-gold-700">
                            {p.category}
                          </span>
                        </td>
                        <td className="p-4 font-display text-paprika-700 font-bold text-base">
                          {formatPrice(p.price)}
                        </td>
                        <td className="p-4 text-stone-600">{p.unit}</td>
                        <td className="p-4">
                          {p.badge ? (
                            <span className="rounded-full bg-gold-100 px-2.5 py-1 text-xs font-semibold text-gold-900">
                              {p.badge}
                            </span>
                          ) : (
                            <span className="text-stone-400">—</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEdit(p)}
                              className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-50 text-gold-700 hover:bg-gold-600 hover:text-white transition"
                              title="ویرایش"
                            >
                              <EditIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="flex h-9 w-9 items-center justify-center rounded-xl bg-paprika-50 text-paprika-700 hover:bg-paprika-600 hover:text-white transition"
                              title="حذف"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS MANAGEMENT */}
        {tab === "orders" && (
          <div className="mt-8 space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm border border-stone-200/60">
              <h2 className="font-display text-xl font-bold text-stone-800">
                سفارش‌های عمده ثبت‌شده توسط مشتریان
              </h2>
              <p className="text-sm text-stone-500 mt-1">
                در این بخش درخواست‌های ارسالی از صفحه «سفارش عمده» را مشاهده کرده و وضعیت پیگیری آن‌ها را مشخص کنید.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {orders.map((o) => (
                <div
                  key={o.id}
                  className="rounded-3xl bg-white p-6 shadow-sm border border-stone-200/80 flex flex-col justify-between hover:shadow-md transition"
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                      <span className="font-bold text-stone-900 text-lg">
                        {o.customerName}
                      </span>
                      <span className="text-xs font-medium text-stone-400">
                        {o.createdAt}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-stone-500">شماره موبایل:</span>
                        <span className="font-mono font-bold text-gold-700">
                          {o.customerPhone}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">محصول درخواستی:</span>
                        <span className="font-bold text-stone-800">
                          {o.productName || "سفارش عمده متفرقه"}
                        </span>
                      </div>
                      <div className="bg-cream-50 rounded-2xl p-4 border border-stone-200/60 mt-3">
                        <div className="text-xs text-stone-400 mb-1">توضیحات مشتری:</div>
                        <p className="text-stone-700 leading-relaxed font-medium">
                          {o.message || "بدون توضیحات"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status selector */}
                  <div className="mt-6 border-t border-stone-100 pt-4 flex items-center justify-between">
                    <span className="text-sm font-bold text-stone-700">وضعیت پیگیری:</span>
                    <select
                      value={o.status}
                      onChange={(e) =>
                        handleStatusChange(o.id, e.target.value as StoredOrder["status"])
                      }
                      className={`rounded-xl px-4 py-2 text-sm font-bold outline-none border cursor-pointer ${
                        o.status === "جدید"
                          ? "bg-gold-50 border-gold-300 text-gold-800"
                          : o.status === "در حال پیگیری"
                          ? "bg-gold-50 border-gold-300 text-gold-800"
                          : o.status === "انجام شده"
                          ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                          : "bg-paprika-50 border-paprika-300 text-paprika-800"
                      }`}
                    >
                      <option value="جدید">جدید</option>
                      <option value="در حال پیگیری">در حال پیگیری</option>
                      <option value="انجام شده">انجام شده</option>
                      <option value="لغو شده">لغو شده</option>
                    </select>
                  </div>
                </div>
              ))}

              {orders.length === 0 && (
                <div className="col-span-2 py-12 text-center text-stone-400">
                  سفارشی ثبت نشده است.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: STATS & REPORTS */}
        {tab === "stats" && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl bg-white p-8 shadow-sm border border-stone-200/60 text-center">
              <div className="font-display text-4xl text-paprika-700 font-bold">
                {products.length}
              </div>
              <div className="mt-2 font-bold text-stone-700">تعداد کل محصولات</div>
            </div>
            <div className="rounded-3xl bg-white p-8 shadow-sm border border-stone-200/60 text-center">
              <div className="font-display text-4xl text-gold-700 font-bold">
                {orders.length}
              </div>
              <div className="mt-2 font-bold text-stone-700">سفارش‌های دریافتی</div>
            </div>
            <div className="rounded-3xl bg-white p-8 shadow-sm border border-stone-200/60 text-center">
              <div className="font-display text-4xl text-emerald-600 font-bold">
                {orders.filter((o) => o.status === "انجام شده").length}
              </div>
              <div className="mt-2 font-bold text-stone-700">سفارش‌های تحویل‌شده</div>
            </div>
            <div className="rounded-3xl bg-white p-8 shadow-sm border border-stone-200/60 text-center">
              <div className="font-display text-4xl text-gold-600 font-bold">
                {orders.filter((o) => o.status === "جدید").length}
              </div>
              <div className="mt-2 font-bold text-stone-700">سفارش‌های جدید</div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL FOR ADDING/EDITING PRODUCT */}
      {(isAdding || editing) && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-100 bg-cream-50 px-6 py-4">
              <div className="font-display text-xl font-bold text-stone-800">
                {isAdding ? "افزودن محصول جدید" : "ویرایش اطلاعات محصول"}
              </div>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setEditing(null);
                }}
                className="rounded-full p-2 hover:bg-stone-200 transition"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">
                    نام محصول *
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="مثال: سوسیس آلمانی ویژه"
                    className="w-full rounded-2xl border bg-cream-50 px-4 py-3 text-stone-800 outline-none focus:border-paprika-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">
                    دسته‌بندی *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-2xl border bg-cream-50 px-4 py-3 text-stone-800 outline-none focus:border-paprika-500 focus:bg-white cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">
                  برند محصول *
                </label>
                <select
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  className="w-full rounded-2xl border bg-cream-50 px-4 py-3 text-stone-800 outline-none focus:border-paprika-500 focus:bg-white cursor-pointer"
                >
                  <option value="فرآورده های گوشتی گلچین">گلچین</option>
                  <option value="۲۰۲">۲۰۲</option>
                  <option value="آلاله بناب">آلاله بناب</option>
                  <option value="سس ۸۸">سس ۸۸</option>
                  <option value="شامیرانی">شامیرانی</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">
                    قیمت (تومان) *
                  </label>
                  <input
                    required
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="w-full rounded-2xl border bg-cream-50 px-4 py-3 text-stone-800 outline-none focus:border-paprika-500 focus:bg-white dir-ltr font-mono text-right"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">
                    واحد بسته‌بندی
                  </label>
                  <input
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    placeholder="مثال: هر بسته ۵۰۰ گرم"
                    className="w-full rounded-2xl border bg-cream-50 px-4 py-3 text-stone-800 outline-none focus:border-paprika-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">
                    نشان ویژه (مثل: گوشت تازه، کم‌چرب)
                  </label>
                  <input
                    value={form.badge}
                    onChange={(e) => setForm({ ...form, badge: e.target.value })}
                    placeholder="گوشت تازه"
                    className="w-full rounded-2xl border bg-cream-50 px-4 py-3 text-stone-800 outline-none focus:border-paprika-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1">
                    تگ کناری (مثل: پرفروش‌ترین)
                  </label>
                  <input
                    value={form.tag}
                    onChange={(e) => setForm({ ...form, tag: e.target.value })}
                    placeholder="پرفروش‌ترین"
                    className="w-full rounded-2xl border bg-cream-50 px-4 py-3 text-stone-800 outline-none focus:border-paprika-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">
                  آدرس تصویر (یا مسیر فایل در سرور)
                </label>
                <input
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="/images/p1.jpg"
                  className="w-full rounded-2xl border bg-cream-50 px-4 py-3 text-stone-800 outline-none focus:border-paprika-500 focus:bg-white dir-ltr text-right"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1">
                  توضیحات محصول
                </label>
                <textarea
                  rows={3}
                  value={form.desc}
                  onChange={(e) => setForm({ ...form, desc: e.target.value })}
                  placeholder="ترکیبات، میزان گوشت، ادویه‌ها..."
                  className="w-full resize-none rounded-2xl border bg-cream-50 px-4 py-3 text-stone-800 outline-none focus:border-paprika-500 focus:bg-white"
                />
              </div>

              <div className="border-t border-stone-100 pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditing(null);
                  }}
                  className="rounded-2xl bg-stone-200 px-6 py-3 text-sm font-bold text-stone-700 hover:bg-stone-300 transition"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-2xl bg-paprika-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-paprika-600/30 hover:bg-paprika-700 transition"
                >
                  <CheckIcon className="h-5 w-5" />
                  ذخیره اطلاعات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
