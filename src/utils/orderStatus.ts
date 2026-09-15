export const RETAIL_ORDER_STATUS_META: Record<string, { label: string; color: string; dot: string; desc: string }> = {
  PENDING: {
    label: "در انتظار پرداخت",
    desc: "سفارش ثبت شده و هنوز پرداخت نهایی تأیید نشده است",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  PAID_PENDING_REVIEW: {
    label: "پرداخت شده / در انتظار بررسی",
    desc: "پرداخت با موفقیت تأیید شده و سفارش منتظر بررسی فروشنده است",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  CONFIRMED: {
    label: "تایید شده",
    desc: "فروشنده سفارش را بررسی و تأیید کرده و آماده پردازش است",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  PREPARING: {
    label: "در حال آماده‌سازی",
    desc: "اقلام سفارش در حال آماده‌سازی هستند",
    color: "bg-violet-50 text-violet-700 border-violet-200",
    dot: "bg-violet-500",
  },
  SHIPPED: {
    label: "ارسال شده",
    desc: "سفارش از انبار خارج شده و در مسیر ارسال است",
    color: "bg-cyan-50 text-cyan-700 border-cyan-200",
    dot: "bg-cyan-500",
  },
  DELIVERED: {
    label: "تحویل داده شده",
    desc: "سفارش با موفقیت تحویل داده شده است",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  CANCELLED: {
    label: "لغو شده",
    desc: "این سفارش لغو شده است",
    color: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
};

export const RETAIL_ORDER_STATUS_OPTIONS = [
  "PENDING",
  "PAID_PENDING_REVIEW",
  "CONFIRMED",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
].map((value) => ({ value, ...RETAIL_ORDER_STATUS_META[value] }));

export function retailOrderStatusLabel(status?: string) {
  return RETAIL_ORDER_STATUS_META[status || ""]?.label || status || "نامشخص";
}

export function retailOrderStatusMeta(status?: string) {
  return RETAIL_ORDER_STATUS_META[status || ""] || {
    label: status || "نامشخص",
    desc: "وضعیت نامشخص",
    color: "bg-stone-50 text-stone-700 border-stone-200",
    dot: "bg-stone-400",
  };
}
