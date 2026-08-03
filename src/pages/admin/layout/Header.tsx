import { CrownIcon, ArrowRightIcon } from "../../../components/icons";

type HeaderProps = {
  onBack: () => void;
};

export default function Header({ onBack }: HeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl bg-stone-900 p-8 text-white shadow-xl">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-paprika-600/30 border border-paprika-500/30 px-4 py-1 text-xs font-bold text-paprika-400">
          <CrownIcon className="h-4 w-4 text-gold-400" />
          بخش ویژه مدیریت کسب و کار
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
          پنل مدیریت فروشگاه
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
  );
}