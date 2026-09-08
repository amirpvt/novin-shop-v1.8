import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, type ApiUser } from "../api/client";

const emptyForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  postal_code: "",
  national_id: "",
};

type ProfileForm = typeof emptyForm;
type SaveStatus = "idle" | "loading" | "success" | "error";

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  dir = "rtl",
  required = false,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  dir?: "rtl" | "ltr";
  required?: boolean;
  multiline?: boolean;
}) {
  const baseClass = "w-full rounded-2xl border border-stone-200 bg-white/90 px-4 py-3 text-sm font-bold text-stone-800 shadow-sm outline-none transition placeholder:text-stone-300 focus:border-paprika-400 focus:bg-white focus:ring-4 focus:ring-paprika-100";

  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black text-stone-600">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          dir={dir}
          rows={4}
          className={`${baseClass} resize-none leading-7`}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          type={type}
          dir={dir}
          className={baseClass}
        />
      )}
    </label>
  );
}

function applyProfileToForm(user: ApiUser): ProfileForm {
  return {
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    email: user.email || "",
    phone: user.phone || user.customer?.phone || "",
    address: user.customer?.address || "",
    city: user.customer?.city || "",
    postal_code: user.customer?.postal_code || "",
    national_id: user.customer?.national_id || "",
  };
}

export default function ProfileEdit() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<SaveStatus>("idle");
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<ApiUser | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);

  useEffect(() => {
    let ignore = false;
    authApi
      .getProfile()
      .then((user) => {
        if (ignore) return;
        setProfile(user);
        setForm(applyProfileToForm(user));
      })
      .catch((err: any) => {
        if (ignore) return;
        setError(err.message || "برای ویرایش پروفایل ابتدا وارد حساب کاربری شوید.");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => { ignore = true; };
  }, []);

  const completion = useMemo(() => {
    const important = [form.first_name, form.last_name, form.phone, form.address, form.city];
    return Math.round((important.filter((value) => value.trim()).length / important.length) * 100);
  }, [form]);

  const updateField = (field: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaving("idle");
    setError("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving("loading");
    setError("");

    try {
      const updated = await authApi.updateProfile(form);
      setProfile(updated);
      setForm(applyProfileToForm(updated));
      window.dispatchEvent(new CustomEvent("novin_profile_updated", { detail: updated }));
      setSaving("success");
    } catch (err: any) {
      setSaving("error");
      setError(err.message || "خطا در ذخیره اطلاعات پروفایل");
    }
  };

  const displayName = profile?.name || [form.first_name, form.last_name].filter(Boolean).join(" ") || profile?.username || "کاربر نوین";
  const initials = displayName.trim().charAt(0) || "ن";

  if (loading) {
    return (
      <main className="min-h-screen bg-cream-50 px-4 py-16" dir="rtl">
        <div className="mx-auto max-w-5xl rounded-[2.5rem] border border-stone-200 bg-white p-8 shadow-xl">
          <div className="h-24 animate-pulse rounded-[2rem] bg-stone-100" />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="h-14 animate-pulse rounded-2xl bg-stone-100" />
            <div className="h-14 animate-pulse rounded-2xl bg-stone-100" />
            <div className="h-14 animate-pulse rounded-2xl bg-stone-100" />
            <div className="h-14 animate-pulse rounded-2xl bg-stone-100" />
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-cream-50 px-4 py-16" dir="rtl">
        <div className="mx-auto max-w-xl rounded-[2.5rem] border border-red-100 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 text-3xl">🔐</div>
          <h1 className="mt-5 text-2xl font-black text-stone-900">ورود لازم است</h1>
          <p className="mt-3 text-sm font-bold leading-7 text-stone-500">{error || "برای ویرایش اطلاعات حساب، ابتدا وارد شوید."}</p>
          <button onClick={() => navigate("/")} className="mt-6 rounded-2xl bg-stone-900 px-8 py-3 text-sm font-black text-white shadow-lg transition hover:bg-paprika-700">
            بازگشت به صفحه اصلی
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-cream-50 px-4 pb-20 pt-8" dir="rtl">
      <section className="relative mx-auto max-w-6xl">
        <div className="absolute -right-20 top-10 h-64 w-64 rounded-full bg-paprika-200/40 blur-3xl" />
        <div className="absolute -left-20 top-40 h-72 w-72 rounded-full bg-gold-200/40 blur-3xl" />

        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/70 bg-gradient-to-br from-stone-950 via-stone-900 to-paprika-950 p-6 text-white shadow-2xl shadow-stone-900/20 sm:p-8">
          <div className="absolute -left-16 -top-16 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/3 h-px w-1/2 bg-gradient-to-l from-transparent via-gold-300/70 to-transparent" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-gold-300 via-amber-400 to-paprika-500 text-3xl font-black text-stone-950 shadow-2xl shadow-gold-500/20">
                {initials}
              </div>
              <div>
                <h1 className="mt-3 text-2xl font-black sm:text-4xl">اطلاعات شخصی شما</h1>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-4 backdrop-blur md:w-64">
              <div className="flex items-center justify-between text-xs font-black text-stone-200">
                <span>تکمیل پروفایل</span>
                <span dir="ltr">{completion}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-gradient-to-l from-gold-300 to-paprika-400 transition-all" style={{ width: `${completion}%` }} />
              </div>
              <div className="mt-3 text-[11px] font-bold text-stone-300">نام کاربری: <span className="font-mono text-white">{profile.username}</span></div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="relative mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="rounded-[2.5rem] border border-stone-200 bg-white/90 p-5 shadow-xl shadow-stone-900/5 backdrop-blur sm:p-7">
            <div className="mb-6 flex items-center justify-between gap-4 border-b border-stone-100 pb-5">
              <div>
                <h2 className="text-xl font-black text-stone-900">فرم ویرایش اطلاعات</h2>
              </div>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-7 text-red-700">
                {error}
              </div>
            )}
            {saving === "success" && (
              <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
                اطلاعات شما با موفقیت ذخیره شد.
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="نام" value={form.first_name} onChange={(value) => updateField("first_name", value)} placeholder="مثلاً علی" />
              <Field label="نام خانوادگی" value={form.last_name} onChange={(value) => updateField("last_name", value)} placeholder="مثلاً رضایی" />
              <Field label="شماره موبایل" value={form.phone} onChange={(value) => updateField("phone", value)} placeholder="09123456789" dir="ltr" required />
              <Field label="ایمیل" value={form.email} onChange={(value) => updateField("email", value)} placeholder="name@example.com" type="email" dir="ltr" />
              <Field label="شهر" value={form.city} onChange={(value) => updateField("city", value)} placeholder="مثلاً تهران" />
              <Field label="کد پستی" value={form.postal_code} onChange={(value) => updateField("postal_code", value)} placeholder="کد پستی" dir="ltr" />
              <Field label="کد ملی" value={form.national_id} onChange={(value) => updateField("national_id", value)} placeholder="کد ملی" dir="ltr" />
              <div className="sm:col-span-2">
                <Field label="آدرس تحویل" value={form.address} onChange={(value) => updateField("address", value)} placeholder="آدرس کامل برای ارسال سفارش" multiline />
              </div>
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 border-t border-stone-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" onClick={() => navigate(-1)} className="rounded-2xl border border-stone-200 bg-white px-6 py-3 text-sm font-black text-stone-700 transition hover:bg-stone-50">
                بازگشت
              </button>
              <button disabled={saving === "loading"} className="rounded-2xl bg-gradient-to-l from-paprika-600 to-red-600 px-8 py-3 text-sm font-black text-white shadow-xl shadow-paprika-600/20 transition hover:-translate-y-0.5 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-60">
                {saving === "loading" ? "در حال ذخیره..." : "ذخیره اطلاعات"}
              </button>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-xl shadow-stone-900/5">
              <h3 className="text-sm font-black text-stone-900">کارت حساب</h3>
              <div className="mt-4 rounded-[1.75rem] bg-gradient-to-br from-stone-900 via-stone-800 to-paprika-900 p-5 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-gold-200">NOVIN MEMBER</span>
                </div>
                <div className="mt-10 text-lg font-black">{displayName}</div>
                <div dir="ltr" className="mt-2 text-right font-mono text-sm font-bold text-stone-300">{form.phone || "شماره ثبت نشده"}</div>
              </div>
            </div>
          </aside>
        </form>
      </section>
    </main>
  );
}
