import { categories } from "../data";

const CAT_IMAGES: Record<string, string> = {
  سوسیس:
    "https://images.pexels.com/photos/4113462/pexels-photo-4113462.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1200",
  کالباس:
    "https://images.pexels.com/photos/13149103/pexels-photo-13149103.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=900",
  "فرآورده های منجمد":
    "https://images.pexels.com/photos/6941033/pexels-photo-6941033.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1000&w=1200",
};

const CAT_SUB: Record<string, string> = {
  سوسیس: "سوسیس آلمانی، دودی، مرغ و کوکتل",
  کالباس: "کالباس گوشت، مرغ، ژامبون و کم‌نمک",
  "فرآورده های منجمد": "ناگت، کتلت، برگر و سمبوسه",
};

type Props = {
  onSelect: (category: string) => void;
};

export default function Categories({ onSelect }: Props) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-cream-50 to-white py-20 sm:py-28">
      {/* decorative blobs */}
      <div className="pointer-events-none absolute -top-20 left-1/4 h-72 w-72 rounded-full bg-paprika-200/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-gold-200/30 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-paprika-50 px-4 py-1.5 text-xs font-bold text-paprika-700">
            ★ کاتالوگ محصولات نوین
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold text-stone-800 sm:text-5xl">
            دسته‌بندی محصولات
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-stone-500">
            روی هر دسته کلیک کنید تا محصولات آن را در فروشگاه مشاهده کنید
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
          {categories.map((c, idx) => (
            <button
              key={c}
              onClick={() => onSelect(c)}
              style={{ animationDelay: `${idx * 120}ms` }}
              className="group relative flex h-[30rem] flex-col justify-end overflow-hidden rounded-[2rem] border border-stone-200/70 bg-stone-900 text-right shadow-xl shadow-stone-900/10 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-paprika-900/20 cursor-pointer sm:h-[34rem]"
            >
              {/* Background image */}
              <img
                src={CAT_IMAGES[c]}
                alt={c}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-110"
              />

              {/* Dark gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-stone-950/10 transition group-hover:from-paprika-950 group-hover:via-stone-950/75" />



              {/* Content */}
              <div className="relative z-10 p-8 text-white">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-paprika-500" />
                  دسته‌بندی
                </div>
                <h3 className="font-display text-3xl font-bold drop-shadow-lg sm:text-4xl">
                  {c}
                </h3>
                <p className="mt-2 text-sm text-stone-200/90 leading-relaxed">
                  {CAT_SUB[c]}
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-white/20 pt-4">
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-gold-300 transition group-hover:gap-3">
                    مشاهده محصولات
                    <span className="transition group-hover:-translate-x-1">←</span>
                  </span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur transition group-hover:bg-paprika-600">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                    >
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
