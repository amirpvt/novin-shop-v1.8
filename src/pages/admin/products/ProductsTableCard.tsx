import ProductsTable from "./ProductsTable";
import EmptyProducts from "./EmptyProducts";
import { Product } from "../../../data";
import ProductsPagination from "./ProductsPagination";

type Props = {
  products: Product[];
  selectedProducts: string[];
  onSelectProduct: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  onAddProduct: () => void;
};

export default function ProductsTableCard({
  products,
  selectedProducts,
  onSelectProduct,
  onSelectAll,
  onEdit,
  onDelete,
  currentPage,
  setCurrentPage,
  onAddProduct,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Products Table Container */}
      <div className="rounded-3xl border border-stone-200 bg-white shadow-sm overflow-hidden">
        {products.length === 0 ? (
          <div className="py-20">
            <EmptyProducts onAddProduct={onAddProduct} />
          </div>
        ) : (
          <ProductsTable
            products={products}
            selectedProducts={selectedProducts}
            onSelectProduct={onSelectProduct}
            onSelectAll={onSelectAll}
            onEdit={onEdit}
            onDelete={onDelete}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        )}
      </div>
        {products.length > 0 && (
            <ProductsPagination
                totalProducts={products.length}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                itemsPerPage={10}
            />
        )}
    </div>
  );
}