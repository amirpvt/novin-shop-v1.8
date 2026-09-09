const JALALI_LOCALE = "fa-IR-u-ca-persian-nu-latn";

type DateInput = string | number | Date | null | undefined;

function toDate(value: DateInput): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatJalaliDate(value: DateInput, options?: Intl.DateTimeFormatOptions): string {
  const date = toDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat(JALALI_LOCALE, {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  }).format(date);
}

export function formatJalaliTime(value: DateInput): string {
  const date = toDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat(JALALI_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatJalaliDateTime(value: DateInput): string {
  const date = toDate(value);
  if (!date) return "—";
  return new Intl.DateTimeFormat(JALALI_LOCALE, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatTodayJalali(): string {
  return formatJalaliDate(new Date(), { weekday: "long" });
}
