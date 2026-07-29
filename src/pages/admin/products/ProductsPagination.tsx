type Props = {
  totalProducts: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  itemsPerPage: number;
};

const totalPages = Math.ceil(
  totalProducts / itemsPerPage
);

export default function ProductsPagination({
  totalProducts,
  currentPage,
  setCurrentPage,
}: Props) {
  if (totalProducts === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 text-sm text-stone-500">

      <div>
        نمایش{" "}
        <span className="font-medium text-stone-700">
          {totalProducts}
        </span>{" "}
        محصول
      </div>


      <div className="flex items-center gap-2">

        <button
          onClick={() =>
            setCurrentPage(Math.max(1, currentPage - 1))
          }
          disabled={currentPage === 1}
          className="
            rounded-2xl
            border
            border-stone-200
            px-4
            py-2
            font-medium
            hover:bg-stone-50
            disabled:opacity-50
            transition
          "
        >
          قبلی
        </button>


        <div
          className="
            rounded-2xl
            border
            border-stone-200
            px-4
            py-2
            font-medium
            bg-white
          "
        >
          صفحه {currentPage}
        </div>


        <button
          onClick={() =>
            setCurrentPage(currentPage + 1)
          }
          disabled={currentPage === totalPages}
          className="
            rounded-2xl
            border
            border-stone-200
            px-4
            py-2
            font-medium
            hover:bg-stone-50
            disabled:opacity-50
            transition
          "
        >
          بعدی
        </button>

      </div>

    </div>
  );
}