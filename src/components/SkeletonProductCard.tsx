export default function SkeletonProductCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-[2.5rem] border border-stone-200 bg-white p-0 shadow-sm animate-pulse">
      <div className="aspect-[4/3] bg-stone-100" />
      <div className="p-6 space-y-4">
        <div className="h-3 w-16 bg-stone-100 rounded-full" />
        <div className="h-5 w-3/4 bg-stone-200 rounded-xl" />
        <div className="h-3 w-full bg-stone-100 rounded-full" />
        <div className="h-3 w-2/3 bg-stone-100 rounded-full" />
        <div className="mt-4 flex justify-between items-center pt-4 border-t border-stone-100">
          <div className="h-6 w-24 bg-stone-200 rounded-xl" />
          <div className="h-10 w-24 bg-stone-100 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonProductCard key={i} />
      ))}
    </div>
  );
}
