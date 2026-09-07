import { useEffect, useMemo, useState } from "react";
import { dashboardApi } from "../services/dashboardApi";

const nf = (n: any) => new Intl.NumberFormat("en-US").format(Number(n || 0));
const money = (n: any) => `${nf(n)} تومان`;

function dateFa(iso?: string) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("fa-IR"); } catch { return "—"; }
}

function friendlyError(message: string) {
  if (message.includes("OperationalError") || message.includes("no such table") || message.includes("<!DOCTYPE html")) {
    return "خطای دیتابیس: بعد از اضافه شدن سیستم پورسانت باید migration اجرا شود. داخل پوشه backend دستور python manage.py migrate را اجرا کنید.";
  }
  return message;
}

type VisitorCommission = {
  visitor_id: number;
  visitor_username: string;
  visitor_name: string;
  visitor_phone?: string;
  percentage: number | string;
  total_commission: number | string;
  unpaid_commission: number | string;
  paid_commission: number | string;
  commission_count: number;
  unpaid_count: number;
  paid_count: number;
  commissions: any[];
  payments: any[];
};

export default function OwnerCommissions() {
  const [rows, setRows] = useState<VisitorCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<VisitorCommission | null>(null);
  const [percentage, setPercentage] = useState("");
  const [applyToUnpaid, setApplyToUnpaid] = useState(true);
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await dashboardApi.owner.commissions();
      const list = Array.isArray(data) ? data : [];
      setRows(list);
      if (selected) {
        const fresh = list.find((x: VisitorCommission) => x.visitor_id === selected.visitor_id) || null;
        setSelected(fresh);
        if (fresh) setPercentage(String(fresh.percentage ?? ""));
      }
    } catch (e: any) {
      alert("خطا در دریافت پورسانت‌ها: " + friendlyError(e.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totals = useMemo(() => ({
    total: rows.reduce((s, r) => s + Number(r.total_commission || 0), 0),
    unpaid: rows.reduce((s, r) => s + Number(r.unpaid_commission || 0), 0),
    paid: rows.reduce((s, r) => s + Number(r.paid_commission || 0), 0),
    count: rows.reduce((s, r) => s + Number(r.commission_count || 0), 0),
  }), [rows]);

  const openVisitor = (row: VisitorCommission) => {
    setSelected(row);
    setPercentage(String(row.percentage ?? ""));
    setReference("");
    setDescription("");
    setApplyToUnpaid(true);
  };

  const saveRule = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await dashboardApi.owner.commissionRuleUpdate({
        visitor_id: selected.visitor_id,
        percentage: Number(percentage || 0),
        apply_to_unpaid: applyToUnpaid,
      });
      await load();
      alert("✅ درصد پورسانت ذخیره شد");
    } catch (e: any) {
      alert("❌ " + friendlyError(e.message));
    } finally { setSaving(false); }
  };

  const payAll = async () => {
    if (!selected) return;
    if (Number(selected.unpaid_commission || 0) <= 0) return alert("پورسانت پرداخت‌نشده‌ای وجود ندارد");
    if (!confirm(`پرداخت ${money(selected.unpaid_commission)} به ${selected.visitor_name} ثبت شود؟`)) return;
    setSaving(true);
    try {
      await dashboardApi.owner.commissionPay({
        visitor_id: selected.visitor_id,
        reference_number: reference,
        description,
      });
      await load();
      alert("✅ پرداخت پورسانت ثبت شد");
    } catch (e: any) {
      alert("❌ " + friendlyError(e.message));
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-gold-500/10 blur-[100px]" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-xs font-black text-gold-200">سیستم حرفه‌ای پورسانت</p>
            <h1 className="mt-4 text-3xl font-black">تعیین و پرداخت پورسانت ویزیتورها</h1>
            <p className="mt-2 text-sm font-bold text-stone-400">درصد پورسانت هر ویزیتور را تعیین کنید و پرداخت‌های معوق را تسویه کنید.</p>
          </div>
          <button onClick={load} className="rounded-2xl bg-white/10 px-5 py-3 text-xs font-black transition hover:bg-white/20">بروزرسانی</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-3xl border bg-white p-5 shadow-sm"><p className="text-[10px] font-black text-stone-400">کل پورسانت</p><p className="mt-2 text-xl font-black text-stone-900">{money(totals.total)}</p></div>
        <div className="rounded-3xl border border-amber-100 bg-white p-5 shadow-sm"><p className="text-[10px] font-black text-stone-400">در انتظار پرداخت</p><p className="mt-2 text-xl font-black text-amber-700">{money(totals.unpaid)}</p></div>
        <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm"><p className="text-[10px] font-black text-stone-400">پرداخت‌شده</p><p className="mt-2 text-xl font-black text-emerald-700">{money(totals.paid)}</p></div>
        <div className="rounded-3xl border bg-white p-5 shadow-sm"><p className="text-[10px] font-black text-stone-400">تعداد رکوردها</p><p className="mt-2 text-xl font-black text-stone-900">{nf(totals.count)}</p></div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">{[1,2,3,4,5,6].map(i => <div key={i} className="h-44 animate-pulse rounded-3xl bg-stone-100" />)}</div>
      ) : rows.length === 0 ? (
        <div className="rounded-[2rem] border bg-white p-16 text-center text-sm font-bold text-stone-400">ویزیتوری برای نمایش وجود ندارد</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {rows.map((r) => (
            <button key={r.visitor_id} onClick={() => openVisitor(r)} className="rounded-[2rem] border border-stone-200 bg-white p-5 text-right shadow-sm transition hover:-translate-y-1 hover:border-stone-900 hover:shadow-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-900 text-white font-black">{r.visitor_name?.charAt(0) || "؟"}</div>
                <div className="min-w-0"><p className="truncate text-sm font-black text-stone-900">{r.visitor_name}</p><p className="text-[10px] font-bold text-stone-400">@{r.visitor_username}</p></div>
                <span className="mr-auto rounded-full bg-gold-50 px-3 py-1 text-[11px] font-black text-gold-700">{nf(r.percentage)}٪</span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl bg-stone-50 p-3"><p className="text-[9px] text-stone-400">کل</p><p className="text-xs font-black">{nf(r.total_commission)}</p></div>
                <div className="rounded-2xl bg-amber-50 p-3"><p className="text-[9px] text-stone-400">معوق</p><p className="text-xs font-black text-amber-700">{nf(r.unpaid_commission)}</p></div>
                <div className="rounded-2xl bg-emerald-50 p-3"><p className="text-[9px] text-stone-400">پرداختی</p><p className="text-xs font-black text-emerald-700">{nf(r.paid_commission)}</p></div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-stone-900/75 p-4 backdrop-blur-sm lg:items-center" onClick={() => setSelected(null)}>
          <div className="my-auto w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-br from-stone-900 to-amber-950 p-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-[10px] font-black text-stone-400">مدیریت پورسانت ویزیتور</p><h2 className="mt-2 text-2xl font-black">{selected.visitor_name}</h2><p className="mt-1 text-xs text-stone-400">@{selected.visitor_username} {selected.visitor_phone ? `· ${selected.visitor_phone}` : ""}</p></div>
                <button onClick={() => setSelected(null)} className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-black">✕</button>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/10 p-4"><p className="text-[10px] text-stone-400">کل پورسانت</p><p className="text-lg font-black">{money(selected.total_commission)}</p></div>
                <div className="rounded-2xl bg-amber-500/20 p-4"><p className="text-[10px] text-amber-100">در انتظار</p><p className="text-lg font-black text-amber-100">{money(selected.unpaid_commission)}</p></div>
                <div className="rounded-2xl bg-emerald-500/20 p-4"><p className="text-[10px] text-emerald-100">پرداخت‌شده</p><p className="text-lg font-black text-emerald-100">{money(selected.paid_commission)}</p></div>
              </div>
            </div>

            <div className="grid max-h-[70vh] overflow-y-auto lg:grid-cols-3">
              <div className="space-y-5 border-l bg-cream-50 p-6">
                <div className="rounded-3xl border bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-black">تعیین درصد پورسانت</h3>
                  <label className="mt-4 block text-[11px] font-bold text-stone-500">درصد پورسانت</label>
                  <input type="number" step="0.01" min="0" max="100" value={percentage} onChange={(e) => setPercentage(e.target.value)} className="mt-2 w-full rounded-2xl border-2 bg-stone-50 px-4 py-3 font-mono text-sm font-black outline-none focus:border-gold-500" />
                  <label className="mt-4 flex items-center gap-2 text-xs font-bold text-stone-600"><input type="checkbox" checked={applyToUnpaid} onChange={(e) => setApplyToUnpaid(e.target.checked)} /> اعمال روی پورسانت‌های پرداخت‌نشده</label>
                  <button disabled={saving} onClick={saveRule} className="mt-4 w-full rounded-2xl bg-stone-900 py-3 text-sm font-black text-white disabled:opacity-50">ذخیره درصد</button>
                </div>

                <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-black text-emerald-700">ثبت پرداخت</h3>
                  <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="شماره رسید / پیگیری" className="mt-4 w-full rounded-2xl border bg-stone-50 px-4 py-3 text-sm" />
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="توضیحات پرداخت" rows={3} className="mt-3 w-full resize-none rounded-2xl border bg-stone-50 px-4 py-3 text-sm" />
                  <button disabled={saving || Number(selected.unpaid_commission || 0) <= 0} onClick={payAll} className="mt-4 w-full rounded-2xl bg-emerald-600 py-3 text-sm font-black text-white disabled:opacity-50">پرداخت همه معوقات</button>
                </div>
              </div>

              <div className="space-y-3 p-6 lg:col-span-2">
                <h3 className="text-sm font-black">ریز پورسانت سفارش‌ها</h3>
                {selected.commissions.length === 0 ? <p className="py-10 text-center text-xs font-bold text-stone-400">پورسانتی ثبت نشده است</p> : selected.commissions.map((c) => (
                  <div key={c.id} className="rounded-3xl border bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div><p className="font-mono text-xs font-black text-stone-900">{c.order_number}</p><p className="mt-1 text-[10px] font-bold text-stone-400">تاریخ: {dateFa(c.created_at)} · فروش: {money(c.order_total)}</p></div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black ${c.sale_type === "wholesale" ? "bg-violet-100 text-violet-700" : "bg-sky-100 text-sky-700"}`}>{c.sale_type === "wholesale" ? "فروش عمده" : "فروش خرده"}</span>
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black ${c.is_paid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{c.is_paid ? "پرداخت‌شده" : "در انتظار پرداخت"}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold"><span className="rounded-xl bg-gold-50 px-3 py-1.5 text-gold-700">درصد: {nf(c.percentage)}٪</span><span className="rounded-xl bg-stone-50 px-3 py-1.5 text-stone-700">مبلغ پورسانت: {money(c.amount)}</span>{c.paid_at && <span className="rounded-xl bg-emerald-50 px-3 py-1.5 text-emerald-700">پرداخت: {dateFa(c.paid_at)}</span>}</div>
                  </div>
                ))}

                {selected.payments.length > 0 && <h3 className="pt-5 text-sm font-black">سوابق پرداخت</h3>}
                {selected.payments.map((p) => <div key={p.id} className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-xs font-bold"><div className="flex justify-between"><span>{money(p.amount)} · {nf(p.commission_count)} رکورد</span><span>{dateFa(p.paid_at)}</span></div>{p.reference_number && <p className="mt-1 text-stone-500">رسید: {p.reference_number}</p>}</div>)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
