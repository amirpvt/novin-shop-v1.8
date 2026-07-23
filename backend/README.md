# بک‌اند سایت سوسیس‌طلا (Django + DRF)

بک‌اند RESTful برای سایت فروشگاهی سوسیس و کالباس. داده‌های محصولات، نظرات و
سفارش‌ها را از طریق API در اختیار فرانت‌اند (React) قرار می‌دهد.

## ساختار
- `products` — مدل و API محصولات
- `testimonials` — مدل و API نظرات مشتریان
- `orders` — ثبت سفارش / فرم تماس
- `sosistala` — تنظیمات پروژه (settings, urls, wsgi, asgi)

## نصب و اجرا

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

python manage.py makemigrations
python manage.py migrate
python manage.py seed            # داده‌های نمونه محصولات و نظرات
python manage.py runserver       # http://127.0.0.1:8000
```

پنل ادمین: `/admin/` (ابتدا با `python manage.py createsuperuser` بسازید).
مستندات API قابل مرور: `/api/`.

## اندپوینت‌ها

| متد | مسیر | توضیح |
|------|------|-------|
| GET | `/api/products/` | لیست محصولات (پارامتر `q` برای جستجو) |
| GET | `/api/products/<id>/` | جزئیات محصول |
| GET | `/api/testimonials/` | نظرات تایید شده |
| POST | `/api/orders/` | ثبت سفارش (name, phone, product, message) |
| GET | `/api/orders/list/` | لیست سفارش‌ها (فقط ادمین) |

## اتصال به فرانت‌اند (React)
در تنظیمات (`sosistala/settings.py`) CORS برای سرور توسعه Vite
(`localhost:5173`) باز است. فرانت‌اند می‌تواند درخواست‌ها را به
`http://127.0.0.1:8000/api/...` بزند.
