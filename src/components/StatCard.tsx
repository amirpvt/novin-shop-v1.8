/**
 * StatCard.tsx - کارت آماری قابل استفاده مجدد
 */
type Props = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: "default" | "emerald" | "amber" | "blue" | "paprika";
  trend?: string;
};

const colorStyles = {
  default: "bg-white border-stone-200 text-stone-800",
  emerald: "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20",
  amber: "bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg",
  blue: "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg",
  paprika: "bg-gradient-to-br from-paprika-500 to-paprika-600 text-white shadow-lg shadow-paprika-500/20",
};

export default function StatCard({ title, value, subtitle, icon, color = "default", trend }: Props) {
  return (
    <div className={`rounded-[2rem] p-6 border ${colorStyles[color]} transition hover:-translate-y-1`}>
      <div className="flex justify-between items-start">
        <div>
          <p className={`text-xs font-bold ${color === "default" ? "text-stone-400" : "text-white/70"}`}>{title}</p>
          <p className="mt-2 text-2xl font-black">{typeof value === "number" ? value.toLocaleString("fa-IR") : value}</p>
          {subtitle && <p className={`mt-1 text-xs ${color === "default" ? "text-stone-500" : "text-white/80"}`}>{subtitle}</p>}
          {trend && <p className="mt-2 text-[11px] bg-white/20 inline-block px-2 py-1 rounded-full">{trend}</p>}
        </div>
        {icon && <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl ${color === "default" ? "bg-stone-100" : "bg-white/20"}`}>{icon}</div>}
      </div>
    </div>
  );
}
