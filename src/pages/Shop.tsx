import { useState, useEffect, useMemo } from "react";
import { type Product } from "../data";
import { ArrowRightIcon } from "../components/icons";
import { apiService, type Category } from "../api";
import ProductCard from "../components/ProductCard";
import { useNavigate, useSearchParams } from "react-router-dom";

type Props = {
  products: Product[];
  onProductClick: (product: Product) => void;
  onWholesale: (product: Product) => void;
};

type SortOption = "relevant" | "newest" | "bestselling" | "price-asc" | "price-desc";

export default function Shop({
  products: localProducts,
  onProductClick,
  onWholesale,
}: Props) {

const navigate = useNavigate();
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

  const sortTabClass = (active: boolean) =>
    `px-4 py-2 text-sm font-bold transition-all border-b-2 ${
      active
        ? "border-paprika-600 text-paprika-700"
        : "border-transparent text-stone-500 hover:text-stone-800"
    }`;

  return (
    <section className="min-h-screen bg-cream-50 pt-24 pb-28 font-sans">
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
              <span className="text-xs font-bold text-stone-600">وضعیت انبار: بروز • {filteredProducts.length} محصول</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          <aside className="w-full lg:w-72 space-y-6 shrink-0 order-1 lg:order-2">
            
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
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedBrand(null)}
                    className={`flex items-center justify-between w-full px-3 py-2 text-xs font-bold transition rounded-lg ${
                      selectedBrand === null
                        ? "bg-paprika-50 text-paprika-700"
                        : "text-stone-500 hover:bg-stone-50"
                    }`}
                  >
                    همه برندها
                  </button>
                  {/* ✅ برندهای واقعی از محصولات */}
                  {uniqueBrands.map((b) => (
                    <button
                      key={b}
                      onClick={() => setSelectedBrand(b)}
                      className={`flex items-center justify-between w-full px-3 py-2 text-xs font-bold transition rounded-lg ${
                        normalize(b) === normalize(selectedBrand || "")
                          ? "bg-paprika-50 text-paprika-700"
                          : "text-stone-500 hover:bg-stone-50"
                      }`}
                    >
                      <span>{b.replace("فرآورده های گوشتی ", "")}</span>
                      <span className="text-[10px] bg-stone-100 px-2 py-0.5 rounded-full">{localProducts.filter(p => normalize(p.brand || (p as any).brand_name || "") === normalize(b)).length}</span>
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
          </aside>

          <div className="flex-1 order-2 lg:order-1">
            
            <div className="bg-white p-2 rounded-2xl border border-stone-200 shadow-sm flex items-center overflow-x-auto scrollbar-hide mb-8">
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
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((p) => (
                  <ProductCard
                      key={p.id}
                      product={p}
                      onClick={onProductClick}
                      onWholesale={onWholesale}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-16 text-center py-20 rounded-[3rem] bg-white border border-stone-200 shadow-sm">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-stone-500 font-bold text-lg">هیچ محصولی با این مشخصات یافت نشد.</p>
                <p className="text-xs text-stone-400 mt-2">فیلتر برند: {selectedBrand || "هیچ"} | دسته: {selectedCategory || "همه"}</p>
                <button onClick={() => {setSearch(""); setSelectedCategory(null); setSelectedBrand(null); setShowOnlyAvailable(false); setPriceRange([absoluteMin, absoluteMax])}} className="mt-4 text-paprika-600 font-bold text-sm underline underline-offset-4">پاک کردن تمام فیلترها</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
