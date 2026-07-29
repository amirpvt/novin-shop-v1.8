import { useState, useMemo } from "react";
import { Product } from "../../../data";
import type { StoredOrder } from "../../../storage";

import ProductStats from "./ProductStats";
import ProductsToolbar from "./ProductsToolbar";
import ProductsTableCard from "./ProductsTableCard";

type Props = {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
};

export default function ProductsPage({
  products,
  onUpdateProducts,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "price-low" | "price-high">("newest");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading] = useState(false);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(term) ||
          (product.brand && product.brand.toLowerCase().includes(term))
      );
    }

    if (selectedCategory) {
      result = result.filter((product) => product.category === selectedCategory);
    }

    if (selectedBrand) {
      result = result.filter((product) => product.brand === selectedBrand);
    }

    if (sortBy === "price-low") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, searchTerm, selectedCategory, selectedBrand, sortBy]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(filteredProducts.map((p) => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts((prev) => [...prev, id]);
    } else {
      setSelectedProducts((prev) => prev.filter((pid) => pid !== id));
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(`آیا از حذف ${selectedProducts.length} محصول اطمینان دارید؟`)) {
      const remaining = products.filter((p) => !selectedProducts.includes(p.id));
      onUpdateProducts(remaining);
      setSelectedProducts([]);
    }
  };

  const handleBulkStatusChange = (status: boolean) => {
    const updated = products.map((p) =>
      selectedProducts.includes(p.id) ? { ...p, available: status } : p
    );
    onUpdateProducts(updated);
    setSelectedProducts([]);
  };

  const clearSelection = () => {
    setSelectedProducts([]);
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-stone-200 bg-white p-6">
              <div className="h-4 w-20 bg-stone-200 rounded mb-4" />
              <div className="h-9 w-16 bg-stone-200 rounded mb-2" />
              <div className="h-3 w-24 bg-stone-200 rounded" />
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="h-11 bg-stone-200 rounded-2xl flex-1" />
            <div className="h-11 bg-stone-200 rounded-2xl w-40" />
            <div className="h-11 bg-stone-200 rounded-2xl w-40" />
            <div className="h-11 bg-stone-200 rounded-2xl w-48" />
          </div>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white overflow-hidden">
          <div className="h-14 bg-stone-100 border-b" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b last:border-none">
              <div className="h-5 w-5 bg-stone-200 rounded" />
              <div className="h-12 w-12 bg-stone-200 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 bg-stone-200 rounded" />
                <div className="h-3 w-24 bg-stone-200 rounded" />
              </div>
              <div className="h-4 w-20 bg-stone-200 rounded" />
              <div className="h-4 w-16 bg-stone-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 py-3 text-sm shadow-sm">
        <span className="text-stone-400">داشبورد</span>
        <span className="text-stone-300">/</span>
        <span className="font-medium text-stone-800">مدیریت محصولات</span>
      </div>

      {/* Statistics Cards */}
      <div className="animate-in fade-in duration-300">
        <ProductStats products={products} />
      </div>

      {/* Sticky Toolbar */}
      <div className="sticky top-16 z-30 -mx-1 px-1">
        <div className="rounded-3xl border border-stone-200 bg-white/95 backdrop-blur-lg shadow-sm p-4 transition-all">
          <ProductsToolbar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedBrand={selectedBrand}
            setSelectedBrand={setSelectedBrand}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onAddProduct={onAddProduct}
            selectedCount={selectedProducts.length}
            onBulkDelete={handleBulkDelete}
            onBulkEnable={() => handleBulkStatusChange(true)}
            onBulkDisable={() => handleBulkStatusChange(false)}
          />
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedProducts.length > 0 && (
        <div className="animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border border-gold-200 bg-gold-50 px-6 py-4">
            <div className="flex items-center gap-3 text-sm font-medium text-gold-800">
              <span className="font-bold">{selectedProducts.length}</span>
              محصول انتخاب شده
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleBulkStatusChange(true)}
                className="rounded-2xl bg-white px-5 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100 transition flex items-center gap-2 border border-emerald-200"
              >
                فعال کردن
              </button>
              <button
                onClick={() => handleBulkStatusChange(false)}
                className="rounded-2xl bg-white px-5 py-2 text-sm font-bold text-amber-700 hover:bg-amber-100 transition flex items-center gap-2 border border-amber-200"
              >
                غیرفعال کردن
              </button>
              <button
                onClick={handleBulkDelete}
                className="rounded-2xl bg-white px-5 py-2 text-sm font-bold text-red-600 hover:bg-red-100 transition flex items-center gap-2 border border-red-200"
              >
                حذف انتخاب‌شده‌ها
              </button>
              <button
                onClick={clearSelection}
                className="rounded-2xl px-5 py-2 text-sm font-bold text-stone-600 hover:bg-stone-100 transition"
              >
                پاک کردن انتخاب
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Table + Pagination */}
      <ProductsTableCard
        filteredProducts={filteredProducts}
        selectedProducts={selectedProducts}
        onSelectProduct={handleSelectProduct}
        onSelectAll={handleSelectAll}
        onEdit={onEditProduct}
        onDelete={onDeleteProduct}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onAddProduct={onAddProduct}
      />
    </div>
  );
}