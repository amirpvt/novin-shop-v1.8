import { useState, useEffect, useMemo, useRef } from "react";
import { formatPrice, getUnitLabel, type Product } from "../data";
import { ArrowRightIcon, CartIcon, PackageIcon } from "../components/icons";
import { apiService, type Category } from "../api";
import ProductCard from "../components/ProductCard";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useRetailCart } from "../context/RetailCartContext";

type Props = {
  products: Product[];
  onProductClick: (product: Product) => void;
  onWholesale: (product: Product) => void;
};

type SortOption = "relevant" | "newest" | "bestselling" | "price-asc" | "price-desc";
type ViewMode = "cards" | "priceList";

export default function Shop({
  products: localProducts,
  onProductClick,
  onWholesale,
}: Props) {

const navigate = useNavigate();
const { addRetailItem } = useRetailCart();
const [searchParams] = useSearchParams();
const initialCategoryId = searchParams.get("category");
const initialBrandName = searchParams.get("brand");
const initialSearch = searchParams.get("search") ?? "";

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategoryId || null);
  const [search, setSearch] = useState(initialSearch || "");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(initialBrandName || null);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("relevant");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  // برندهای واقعی از محصولات (نه هاردکد اشتباه)
  const uniqueBrands = useMemo(() => {
    const set = new Set<string>();
    localProducts.forEach(p => {
      if (p.brand) set.add(p.brand);
      if ((p as any).brand_name) set.add((p as any).brand_name);
    });
    return Array.from(set).filter(Boolean);
  }, [localProducts]);

  const absoluteMin = useMemo(() => {
    if (!localProducts.length) return 0;
    return Math.min(...localProducts.map((p) => p.price));
  }, [localProducts]);
  const absoluteMax = useMemo(() => {
    if (!localProducts.length) return 0;
    return Math.max(...localProducts.map((p) => p.price));
  }, [localProducts]);
  const [priceRange, setPriceRange] = useState([absoluteMin, absoluteMax]);

  useEffect(() => {
    setPriceRange([absoluteMin, absoluteMax]);
  }, [absoluteMin, absoluteMax]);

  useEffect(() => {
    if (initialSearch !== undefined) setSearch(initialSearch);
  }, [initialSearch]);

  // ✅ FIX v2: فیلتر برند با تطبیق دقیق + نرمال‌سازی اعداد فارسی/انگلیسی
  const normalize = (s: string) => {
    if (!s) return "";
    return s
      .replace(/۰/g, "0").replace(/۱/g, "1").replace(/۲/g, "2").replace(/۳/g, "3").replace(/۴/g, "4")
      .replace(/۵/g, "5").replace(/۶/g, "6").replace(/۷/g, "7").replace(/۸/g, "8").replace(/۹/g, "9")
      .trim();
  };

  const filteredProducts = useMemo(() => {
    let result = localProducts.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCategory ? p.category === selectedCategory : true;
      // تطبیق برند با نرمال‌سازی برای جلوگیری از مشکل ۲۰۲ vs 202
      const pBrand = normalize(p.brand || (p as any).brand_name || "");
      const selBrand = normalize(selectedBrand || "");
      const matchBrand = selectedBrand ? pBrand === selBrand : true;
      const matchPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
      const matchStock = showOnlyAvailable ? p.available === true : true;
      return matchSearch && matchCat && matchBrand && matchPrice && matchStock;
    });

    switch (sortBy) {
      case "newest":
        result = [...result].reverse();
        break;
      case "price-asc":
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case "bestselling":
        result = [...result].sort((a, _b) => (a.tag === "پرفروش‌ترین" ? -1 : 1));
        break;
      default:
        break;
    }

    return result;
  }, [localProducts, search, selectedCategory, selectedBrand, priceRange, showOnlyAvailable, sortBy]);

  useEffect(() => {
    apiService.fetchCategories()
      .then(setCategories)
      .catch(() => {
        const uniqueCats = Array.from(new Set(localProducts.map(p => p.category)));
        const mockCats: Category[] = uniqueCats.map((name, id) => ({ id, name, slug: name }));
        setCategories(mockCats);
      });
  }, [localProducts]);

  const tabClass = (active: boolean) =>
    `flex items-center justify-between w-full px-4 py-3 text-sm font-bold transition rounded-xl ${
      active
        ? "bg-paprika-50 text-paprika-700 border border-paprika-200"
        : "text-stone-600 hover:bg-stone-50"
    }`;

  const activeFiltersCount = [
    selectedCategory,
    selectedBrand,
    showOnlyAvailable,
    priceRange[0] !== absoluteMin || priceRange[1] !== absoluteMax,
    search.trim(),
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory(null);
    setSelectedBrand(null);
    setShowOnlyAvailable(false);
    setPriceRange([absoluteMin, absoluteMax]);
  };

  return (
    <section className="min-h-screen bg-cream-50 pb-20 pt-8 font-sans sm:pb-28 lg:pt-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        
        <div className="flex flex-col gap-4 mb-8">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-stone-500 transition hover:text-paprika-700"
          >
            <ArrowRightIcon className="h-4 w-4" />
            بازگشت به خانه
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-stone-200 pb-6">
            <h2 className="font-display text-3xl font-bold text-stone-800 sm:text-4xl">
              {selectedCategory ?? "کاتالوگ محصولات نوین"}
            </h2>
            <div className="mt-4 sm:mt-0 flex items-center gap-2 rounded-2xl bg-white px-4 py-2 border border-stone-100 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-stone-600">وضعیت انبار: بروز</span>
            </div>
          </div>
        </div>

        <div className="mb-3 rounded-[1.6rem] border border-stone-200 bg-white p-3 shadow-sm lg:hidden">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-black text-stone-800">جستجو در فروشگاه</p>
            {search && (
              <button type="button" onClick={() => setSearch("")} className="rounded-full bg-stone-100 px-3 py-1 text-[10px] font-black text-stone-500">
                پاک کردن
              </button>
            )}
          </div>
          <div className="relative">
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="نام محصول، برند یا دسته‌بندی..."
              className="w-full rounded-2xl border-2 border-stone-100 bg-stone-50 py-3.5 pl-4 pr-11 text-sm font-bold text-stone-800 outline-none transition focus:border-paprika-300 focus:bg-white"
            />
          </div>
        </div>

        <div className="mb-4 lg:hidden">
          <div className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-stone-200 bg-white p-2 shadow-sm scrollbar-hide">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-black text-white shadow"
            >
              <span>☰</span>
              فیلترها
              {activeFiltersCount > 0 && <span className="rounded-full bg-paprika-600 px-2 py-0.5 text-[10px]">{activeFiltersCount.toLocaleString("en-US")}</span>}
            </button>
            <button
              type="button"
              onClick={() => setViewMode((mode) => mode === "priceList" ? "cards" : "priceList")}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black shadow ${viewMode === "priceList" ? "bg-gold-500 text-stone-950" : "bg-stone-50 text-stone-600"}`}
            >
              🧾 {viewMode === "priceList" ? "نمایش تصویری" : "لیست قیمت"}
            </button>
            <span className="shrink-0 rounded-xl bg-stone-50 px-3 py-2 text-[11px] font-black text-stone-500">
              کالاهای فروشگاه
            </span>
            {selectedCategory && <span className="shrink-0 rounded-xl bg-paprika-50 px-3 py-2 text-[11px] font-black text-paprika-700">{selectedCategory}</span>}
            {selectedBrand && <span className="shrink-0 rounded-xl bg-blue-50 px-3 py-2 text-[11px] font-black text-blue-700">{selectedBrand}</span>}
            {showOnlyAvailable && <span className="shrink-0 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] font-black text-emerald-700">فقط موجود</span>}
            {activeFiltersCount > 0 && (
              <button type="button" onClick={resetFilters} className="shrink-0 rounded-xl bg-stone-100 px-3 py-2 text-[11px] font-black text-stone-600">
                حذف فیلترها
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-5 lg:flex-row lg:gap-8">
          
          <aside className={`${mobileFiltersOpen ? "fixed" : "hidden"} inset-0 z-[130] shrink-0 order-1 lg:static lg:z-auto lg:block lg:w-72 lg:order-2`}>
            <button type="button" aria-label="بستن فیلترها" onClick={() => setMobileFiltersOpen(false)} className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm lg:hidden" />
            <div className="absolute inset-x-0 bottom-0 max-h-[86vh] space-y-4 overflow-y-auto rounded-t-[2rem] bg-cream-50 p-4 shadow-2xl lg:static lg:max-h-none lg:space-y-6 lg:overflow-visible lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none">
              <div className="sticky -top-4 z-10 -mx-4 -mt-4 mb-2 flex items-center justify-between border-b border-stone-200 bg-white/95 p-4 backdrop-blur lg:hidden">
                <div>
                  <p className="text-sm font-black text-stone-900">فیلتر محصولات</p>
                  <p className="mt-1 text-[11px] font-bold text-stone-400">مثل دیجی‌کالا؛ فیلترها فقط در صورت نیاز باز می‌شوند</p>
                </div>
                <button type="button" onClick={() => setMobileFiltersOpen(false)} className="rounded-xl bg-stone-100 px-3 py-2 text-xs font-black text-stone-700">بستن ✕</button>
              </div>
            
            <div className="bg-white p-5 rounded-[2rem] border border-stone-200 shadow-sm">
              <h3 className="text-sm font-bold text-stone-800 mb-4 flex items-center gap-2">
                <span>🔍</span> جستجوی هوشمند
              </h3>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="نام محصول..."
                  className="w-full rounded-xl border border-stone-100 bg-stone-50 py-3 pr-4 pl-3 text-sm font-bold text-stone-800 outline-none transition focus:border-paprika-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="bg-white p-5 rounded-[2rem] border border-stone-200 shadow-sm">
              <h3 className="text-sm font-bold text-stone-800 mb-4 flex items-center gap-2">
                <span>📁</span> دسته‌بندی‌ها
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={tabClass(selectedCategory === null)}
                >
                  <span>همه کالاها</span>
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.name)}
                    className={tabClass(selectedCategory === c.name)}
                  >
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-[2rem] border border-stone-200 shadow-sm">
              <h3 className="text-sm font-bold text-stone-800 mb-4 flex items-center gap-2">
                <span>📦</span> وضعیت موجودی
              </h3>
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm font-bold text-stone-600 group-hover:text-paprika-700 transition">فقط کالاهای موجود</span>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showOnlyAvailable}
                    onChange={(e) => setShowOnlyAvailable(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-1.25rem] after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-paprika-600"></div>
                </div>
              </label>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-stone-200 shadow-sm space-y-8">
              <h3 className="text-lg font-display font-bold text-paprika-700 border-b border-stone-100 pb-3">
                فیلتر محصولات
              </h3>

              <div>
                <h4 className="text-sm font-bold text-stone-800 mb-4 flex items-center gap-2">
                  <span>💰</span> محدوده قیمت
                </h4>
                <div className="flex items-center justify-between text-[11px] font-mono font-bold text-paprika-700 mb-4">
                  <span>{priceRange[0].toLocaleString("en-US")}</span>
                  <span className="text-stone-300">تا</span>
                  <span>{priceRange[1].toLocaleString("en-US")}</span>
                </div>
                <div className="relative h-6 flex items-center px-2">
                  <div className="absolute left-2 right-2 h-1.5 bg-stone-100 rounded-full" />
                  <div 
                    className="absolute h-1.5 bg-paprika-600 rounded-full" 
                    style={{
                      right: `${((priceRange[0] - absoluteMin) / (absoluteMax - absoluteMin)) * 100}%`,
                      left: `${100 - ((priceRange[1] - absoluteMin) / (absoluteMax - absoluteMin)) * 100}%`
                    }}
                  />
                  <input
                    type="range"
                    min={absoluteMin}
                    max={absoluteMax}
                    step={1000}
                    value={priceRange[0]}
                    onChange={(e) => {
                      const val = Math.min(Number(e.target.value), priceRange[1] - 1000);
                      setPriceRange([val, priceRange[1]]);
                    }}
                    className="absolute w-full appearance-none pointer-events-none bg-transparent left-0 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-paprika-600 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                  <input
                    type="range"
                    min={absoluteMin}
                    max={absoluteMax}
                    step={1000}
                    value={priceRange[1]}
                    onChange={(e) => {
                      const val = Math.max(Number(e.target.value), priceRange[0] + 1000);
                      setPriceRange([priceRange[0], val]);
                    }}
                    className="absolute w-full appearance-none pointer-events-none bg-transparent left-0 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-paprika-600 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-stone-50">
                <h4 className="text-sm font-bold text-stone-800 mb-4 flex items-center gap-2">
                  <span>🏢</span> برند کالا
                </h4>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide lg:block lg:space-y-2 lg:overflow-visible lg:pb-0">
                  <button
                    onClick={() => setSelectedBrand(null)}
                    className={`flex shrink-0 items-center justify-between whitespace-nowrap rounded-2xl border px-4 py-2.5 text-xs font-bold transition lg:w-full lg:rounded-lg lg:px-3 lg:py-2 ${
                      selectedBrand === null
                        ? "border-paprika-200 bg-paprika-50 text-paprika-700"
                        : "border-stone-100 bg-white text-stone-500 hover:bg-stone-50"
                    }`}
                  >
                    همه برندها
                  </button>
                  {/* ✅ برندهای واقعی از محصولات */}
                  {uniqueBrands.map((b) => (
                    <button
                      key={b}
                      onClick={() => setSelectedBrand(b)}
                      className={`flex shrink-0 items-center justify-between gap-2 whitespace-nowrap rounded-2xl border px-4 py-2.5 text-xs font-bold transition lg:w-full lg:rounded-lg lg:px-3 lg:py-2 ${
                        normalize(b) === normalize(selectedBrand || "")
                          ? "border-paprika-200 bg-paprika-50 text-paprika-700"
                          : "border-stone-100 bg-white text-stone-500 hover:bg-stone-50"
                      }`}
                    >
                      <span>{b.replace("فرآورده های گوشتی ", "")}</span>
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px]">{localProducts.filter(p => normalize(p.brand || (p as any).brand_name || "") === normalize(b)).length}</span>
                    </button>
                  ))}
                </div>
                {selectedBrand && (
                  <div className="mt-3 text-[11px] text-paprika-600 bg-paprika-50 p-2 rounded-lg flex justify-between items-center">
                    <span>✓ فیلتر برند: {selectedBrand}</span>
                    <button onClick={() => setSelectedBrand(null)} className="text-[10px] underline">حذف</button>
                  </div>
                )}
              </div>
            </div>

              <div className="grid grid-cols-2 gap-2 lg:hidden">
                <button type="button" onClick={resetFilters} className="rounded-2xl border border-stone-200 bg-white py-3 text-xs font-black text-stone-700">
                  حذف همه
                </button>
                <button type="button" onClick={() => setMobileFiltersOpen(false)} className="rounded-2xl bg-paprika-600 py-3 text-xs font-black text-white shadow-lg shadow-paprika-600/20">
                  مشاهده کالاها
                </button>
              </div>
            </div>
          </aside>

          <div className="flex-1 order-2 lg:order-1">
            
            <div className="mb-5 flex items-center overflow-x-auto rounded-2xl border border-stone-200 bg-white p-2 shadow-sm scrollbar-hide sm:mb-8">
              <div className="flex items-center gap-2 px-4 shrink-0 text-stone-400 text-sm">
                <span>⚖️</span>
                <span className="font-bold">مرتب‌سازی:</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setSortBy("relevant")} className={`px-4 py-2 text-sm font-bold transition-all border-b-2 ${sortBy === "relevant" ? "border-paprika-600 text-paprika-700" : "border-transparent text-stone-500 hover:text-stone-800"}`}>مرتبط‌ترین</button>
                <button onClick={() => setSortBy("newest")} className={`px-4 py-2 text-sm font-bold transition-all border-b-2 ${sortBy === "newest" ? "border-paprika-600 text-paprika-700" : "border-transparent text-stone-500 hover:text-stone-800"}`}>جدیدترین</button>
                <button onClick={() => setSortBy("bestselling")} className={`px-4 py-2 text-sm font-bold transition-all border-b-2 ${sortBy === "bestselling" ? "border-paprika-600 text-paprika-700" : "border-transparent text-stone-500 hover:text-stone-800"}`}>پرفروش‌ترین</button>
                <button onClick={() => setSortBy("price-asc")} className={`px-4 py-2 text-sm font-bold transition-all border-b-2 ${sortBy === "price-asc" ? "border-paprika-600 text-paprika-700" : "border-transparent text-stone-500 hover:text-stone-800"}`}>ارزان‌ترین</button>
                <button onClick={() => setSortBy("price-desc")} className={`px-4 py-2 text-sm font-bold transition-all border-b-2 ${sortBy === "price-desc" ? "border-paprika-600 text-paprika-700" : "border-transparent text-stone-500 hover:text-stone-800"}`}>گران‌ترین</button>
              </div>
              <div className="mr-auto flex shrink-0 rounded-2xl bg-stone-100 p-1 text-xs font-black">
                <button type="button" onClick={() => setViewMode("cards")} className={`rounded-xl px-4 py-2 transition ${viewMode === "cards" ? "bg-white text-stone-900 shadow" : "text-stone-500"}`}>تصویری</button>
                <button type="button" onClick={() => setViewMode("priceList")} className={`rounded-xl px-4 py-2 transition ${viewMode === "priceList" ? "bg-stone-900 text-white shadow" : "text-stone-500"}`}>لیست قیمت</button>
              </div>
            </div>

            {filteredProducts.length > 0 ? (
              viewMode === "priceList" ? (
                <PriceListView products={filteredProducts} onClick={onProductClick} onWholesale={onWholesale} onAddToCart={addRetailItem} />
              ) : (
                <>
                  <div className="space-y-3 md:hidden">
                    {filteredProducts.map((p) => (
                      <MobileShopProductCard
                        key={p.id}
                        product={p}
                        onClick={onProductClick}
                        onWholesale={onWholesale}
                        onAddToCart={addRetailItem}
                      />
                    ))}
                  </div>
                  <div className="hidden gap-4 md:grid md:grid-cols-2 sm:gap-6 xl:grid-cols-3">
                    {filteredProducts.map((p) => (
                      <ProductCard
                          key={p.id}
                          product={p}
                          onClick={onProductClick}
                          onWholesale={onWholesale}
                      />
                    ))}
                  </div>
                </>
              )
            ) : (
              <div className="mt-16 text-center py-20 rounded-[3rem] bg-white border border-stone-200 shadow-sm">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-stone-500 font-bold text-lg">هیچ محصولی با این مشخصات یافت نشد.</p>
                <p className="text-xs text-stone-400 mt-2">فیلتر برند: {selectedBrand || "هیچ"} | دسته: {selectedCategory || "همه"}</p>
                <button onClick={resetFilters} className="mt-4 text-paprika-600 font-bold text-sm underline underline-offset-4">پاک کردن تمام فیلترها</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}


function PriceListView({ products, onClick, onWholesale, onAddToCart }: { products: Product[]; onClick: (product: Product) => void; onWholesale: (product: Product) => void; onAddToCart: (product: Product) => void }) {
  const [addedProductId, setAddedProductId] = useState<number | string | null>(null);
  const [addAnimationKey, setAddAnimationKey] = useState(0);
  const addTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (addTimeoutRef.current) window.clearTimeout(addTimeoutRef.current);
    };
  }, []);

  const handleAdd = (product: Product) => {
    onAddToCart(product);
    setAddedProductId(product.id);
    setAddAnimationKey((prev) => prev + 1);
    if (addTimeoutRef.current) window.clearTimeout(addTimeoutRef.current);
    addTimeoutRef.current = window.setTimeout(() => setAddedProductId(null), 1200);
  };

  return (
    <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-xl shadow-stone-900/5" dir="rtl">
      <div className="relative overflow-hidden bg-gradient-to-l from-stone-950 via-stone-900 to-amber-950 p-5 text-white">
        <div className="absolute -left-20 -top-20 h-52 w-52 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black text-gold-200">لیست قیمت بدون تصویر</span>
            <h3 className="mt-2 text-xl font-black">لیست قیمت محصولات نوین</h3>
            <p className="mt-1 text-xs font-bold text-stone-300">نمایش سریع و خوانا برای بررسی قیمت‌ها، بدون نمایش تصویر محصولات</p>
          </div>
          <span className="rounded-2xl bg-gold-500 px-4 py-2 text-xs font-black text-stone-950">بروزرسانی قیمت‌ها</span>
        </div>
      </div>

      <div className="divide-y divide-stone-100">
        {products.map((product, index) => {
          const isOutOfStock = product.available === false || (product.stock !== undefined && product.stock <= 0);
          const hasDiscount = product.discount_price && product.discount_price > 0 && product.discount_price < product.price;
          const finalPrice = hasDiscount ? product.discount_price! : product.price;
          const unitLabel = product.retail_unit_display || getUnitLabel(product.retail_unit || product.unit);
          const brand = product.brand || (product as any).brand_name || "";
          return (
            <div key={product.id} className="grid gap-3 p-4 transition hover:bg-stone-50/70 lg:grid-cols-[64px_1fr_170px_220px] lg:items-center">
              <div className="flex items-center gap-3 lg:block lg:text-center">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-100 font-mono text-sm font-black text-stone-600">
                  {(index + 1).toLocaleString("en-US")}
                </span>
                <span className="text-[10px] font-black text-stone-400 lg:mt-1 lg:block">ردیف</span>
              </div>

              <button type="button" onClick={() => onClick(product)} className="min-w-0 text-right">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-black">
                  {(product.category_name || product.category) && <span className="rounded-full bg-stone-100 px-2.5 py-1 text-stone-600">{product.category_name || product.category}</span>}
                  {brand && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">{brand}</span>}
                  <span className="rounded-full bg-gold-50 px-2.5 py-1 text-gold-700">{unitLabel}</span>
                </div>
                <h4 className="mt-2 line-clamp-2 text-base font-black text-stone-900">{product.name}</h4>
                <p className="mt-1 line-clamp-1 text-xs font-bold text-stone-400">{product.description}</p>
              </button>

              <div className="rounded-2xl bg-stone-50 p-3 text-right lg:text-left">
                {hasDiscount && <p className="font-mono text-xs font-bold text-stone-400 line-through">{formatPrice(product.price)}</p>}
                <p className="font-display text-lg font-black text-stone-950">{formatPrice(finalPrice)}</p>
                {hasDiscount && <span className="mt-1 inline-flex rounded-full bg-paprika-50 px-2 py-0.5 text-[10px] font-black text-paprika-700">٪{product.discount_percent || Math.round(((product.price - finalPrice) / product.price) * 100)} تخفیف</span>}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
                <span className={`inline-flex items-center justify-center rounded-2xl px-3 py-2 text-[11px] font-black ${isOutOfStock ? "bg-stone-100 text-stone-400" : product.stock !== undefined && product.stock > 0 && product.stock < 3 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                  {isOutOfStock ? "ناموجود" : product.stock !== undefined && product.stock > 0 && product.stock < 3 ? `تنها ${product.stock.toLocaleString("en-US")} عدد موجود است` : "موجود"}
                </span>
                <div className="relative">
                  {addedProductId === product.id && (
                    <div
                      key={addAnimationKey}
                      className="pointer-events-none absolute -top-12 left-1/2 z-20 flex -translate-x-1/2 animate-bounce items-center gap-2 whitespace-nowrap rounded-full border border-emerald-200 bg-white px-3.5 py-2 text-[11px] font-black text-emerald-700 shadow-2xl shadow-emerald-900/10"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-sm font-black text-white shadow-lg">+1</span>
                      <span>۱ عدد به سبد خرید اضافه شد</span>
                    </div>
                  )}
                  <button type="button" onClick={() => handleAdd(product)} disabled={isOutOfStock} className={`relative overflow-hidden rounded-2xl px-4 py-2 text-xs font-black text-white shadow-lg transition hover:bg-paprika-700 disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none ${addedProductId === product.id ? "bg-emerald-600 shadow-emerald-600/25 scale-[1.02]" : "bg-paprika-600 shadow-paprika-600/20"}`}>
                    {addedProductId === product.id && <span className="absolute inset-0 animate-ping rounded-2xl bg-emerald-400/30" />}
                    <span className="relative">{addedProductId === product.id ? "اضافه شد" : "افزودن"}</span>
                  </button>
                </div>
                <button type="button" onClick={() => onWholesale(product)} disabled={isOutOfStock} className="rounded-2xl border border-stone-200 bg-white px-4 py-2 text-xs font-black text-stone-700 transition hover:border-stone-900 disabled:text-stone-300">
                  عمده
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MobileShopProductCard({ product, onClick, onWholesale, onAddToCart }: { product: Product; onClick: (product: Product) => void; onWholesale: (product: Product) => void; onAddToCart: (product: Product) => void }) {
  const isOutOfStock = product.available === false || (product.stock !== undefined && product.stock <= 0);
  const hasDiscount = product.discount_price && product.discount_price > 0 && product.discount_price < product.price;
  const finalPrice = hasDiscount ? product.discount_price! : product.price;
  const brand = product.brand || (product as any).brand_name || "";
  const unitLabel = product.retail_unit_display || getUnitLabel(product.retail_unit || product.unit);

  return (
    <article className="overflow-hidden rounded-[1.35rem] border border-stone-200 bg-white shadow-sm" dir="rtl">
      <div className="flex gap-3 p-3">
        <button
          type="button"
          onClick={() => !isOutOfStock && onClick(product)}
          className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl bg-stone-50 ring-1 ring-stone-100"
          aria-label={`مشاهده ${product.name}`}
        >
          <img src={product.image} alt={product.name} className={`h-full w-full object-cover ${isOutOfStock ? "grayscale opacity-60" : ""}`} loading="lazy" />
          {hasDiscount && (
            <span className="absolute right-2 top-2 rounded-full bg-paprika-600 px-2 py-0.5 text-[10px] font-black text-white shadow">
              ٪{product.discount_percent || Math.round(((product.price - finalPrice) / product.price) * 100)}
            </span>
          )}
          {isOutOfStock && (
            <span className="absolute inset-x-2 bottom-2 rounded-full bg-stone-900/85 px-2 py-1 text-[10px] font-black text-white backdrop-blur">
              ناموجود
            </span>
          )}
        </button>

        <div className="min-w-0 flex flex-1 flex-col">
          <button type="button" onClick={() => onClick(product)} className="text-right">
            <h3 className="line-clamp-2 text-sm font-black leading-6 text-stone-900">{product.name}</h3>
          </button>
          <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] font-bold">
            {(product.category_name || product.category) && <span className="rounded-full bg-stone-50 px-2 py-1 text-stone-500">{product.category_name || product.category}</span>}
            <span className="rounded-full bg-gold-50 px-2 py-1 text-gold-700">{unitLabel}</span>
            {brand && <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">{brand}</span>}
          </div>
          <p className="mt-2 line-clamp-2 text-[11px] font-medium leading-5 text-stone-500">{product.description}</p>

          <div className="mt-auto pt-3">
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0">
                {hasDiscount && <p className="font-mono text-[11px] font-bold text-stone-400 line-through">{formatPrice(product.price)}</p>}
                <p className="font-display text-base font-black text-stone-950">{formatPrice(finalPrice)}</p>
              </div>
              <div className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${isOutOfStock ? "bg-stone-100 text-stone-400" : product.stock !== undefined && product.stock > 0 && product.stock < 3 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                {isOutOfStock ? "ناموجود" : product.stock !== undefined && product.stock > 0 && product.stock < 3 ? `تنها ${product.stock.toLocaleString("en-US")} عدد موجود است` : "موجود"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-stone-100 bg-stone-50/60 p-2.5">
        <button
          type="button"
          onClick={() => onAddToCart(product)}
          disabled={isOutOfStock}
          className="flex items-center justify-center gap-2 rounded-2xl bg-paprika-600 px-3 py-3 text-xs font-black text-white shadow-sm shadow-paprika-600/20 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400 disabled:shadow-none"
        >
          <CartIcon className="h-4 w-4" />
          افزودن به سبد
        </button>
        <button
          type="button"
          onClick={() => onWholesale(product)}
          disabled={isOutOfStock}
          className="flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-3 py-3 text-xs font-black text-stone-800 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:text-stone-300"
        >
          <PackageIcon className="h-4 w-4" />
          سفارش عمده
        </button>
      </div>
    </article>
  );
}

