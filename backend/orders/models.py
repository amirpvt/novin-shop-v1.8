"""
PATCH for orders/models.py - Add user FK for customer tracking
این فایل را باید به مدل‌های موجود اضافه کنی

در orders/models.py در کلاس Order این فیلد را اضافه کن:

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
        verbose_name="کاربر"
    )

و در WholesaleRequest هم:

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="wholesale_requests",
        verbose_name="کاربر"
    )

سپس:
python manage.py makemigrations orders
python manage.py migrate
"""

# این یک نمونه کامل از مدل‌های به‌روز شده است - کپی کن روی orders/models.py فعلی
# فقط بخش user اضافه شده، بقیه همان قبلی است

from django.conf import settings
from django.db import models
import random, string

def generate_order_number(): return "ORD-" + "".join(random.choices(string.digits, k=8))
def generate_request_number(): return "WHS-" + "".join(random.choices(string.digits, k=8))

class Order(models.Model):
    ORDER_STATUS_CHOICES = [
        ("PENDING", "در انتظار بررسی"),
        ("CONFIRMED", "تایید شده"),
        ("PREPARING", "در حال آماده‌سازی"),
        ("SHIPPED", "ارسال شده"),
        ("DELIVERED", "تحویل شده"),
        ("CANCELLED", "لغو شده"),
    ]

    # 🆕 NEW: لینک به کاربر برای داشبورد "سفارشات من"
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
        verbose_name="کاربر"
    )

    order_number = models.CharField("شماره سفارش", max_length=20, unique=True, default=generate_order_number, editable=False)
    name = models.CharField("نام و نام خانوادگی", max_length=150)
    phone = models.CharField("شماره تماس", max_length=20)
    address = models.CharField("آدرس تحویل", max_length=500, blank=True)
    message = models.TextField("توضیحات مشتری", blank=True)
    order_status = models.CharField("وضعیت سفارش", max_length=20, choices=ORDER_STATUS_CHOICES, default="PENDING")
    total_amount = models.DecimalField("مبلغ کل", max_digits=12, decimal_places=0, default=0)
    created_at = models.DateTimeField("تاریخ ثبت", auto_now_add=True)
    updated_at = models.DateTimeField("بروزرسانی", auto_now=True)

    class Meta:
        verbose_name = "سفارش تک‌فروشی"
        verbose_name_plural = "سفارش‌های تک‌فروشی"
        ordering = ["-created_at"]

    def __str__(self): return f"{self.order_number} — {self.name}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey("products.Product", related_name="order_items", on_delete=models.SET_NULL, null=True, blank=True)
    product_name = models.CharField("نام محصول", max_length=150)
    price = models.DecimalField("قیمت واحد (لحظه سفارش)", max_digits=12, decimal_places=0)
    quantity = models.PositiveIntegerField("تعداد")

    class Meta:
        verbose_name = "آیتم سفارش"
        verbose_name_plural = "آیتم‌های سفارش"

    def __str__(self): return f"{self.product_name} × {self.quantity}"
    @property
    def subtotal(self): return self.price * self.quantity

class WholesaleRequest(models.Model):
    REQUEST_STATUS_CHOICES = [
        ("NEW", "درخواست جدید"),
        ("QUOTED", "پیش‌فاکتور صادر شده"),
        ("CONVERTED", "تبدیل به سفارش شده"),
        ("REJECTED", "رد شده"),
    ]

    # 🆕 NEW: لینک به کاربر
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="wholesale_requests",
        verbose_name="کاربر"
    )

    request_number = models.CharField("شماره درخواست", max_length=20, unique=True, default=generate_request_number, editable=False)
    company_name = models.CharField("نام شرکت / فروشگاه", max_length=150)
    contact_person = models.CharField("نام شخص رابط", max_length=150)
    phone = models.CharField("شماره تماس", max_length=20)
    address = models.CharField("آدرس", max_length=500, blank=True)
    description = models.TextField("توضیحات تکمیلی", blank=True)
    status = models.CharField("وضعیت درخواست", max_length=20, choices=REQUEST_STATUS_CHOICES, default="NEW")
    created_at = models.DateTimeField("تاریخ ثبت", auto_now_add=True)

    class Meta:
        verbose_name = "درخواست خرید عمده"
        verbose_name_plural = "درخواست‌های خرید عمده"
        ordering = ["-created_at"]

    def __str__(self): return f"{self.request_number} — {self.company_name}"

class WholesaleRequestItem(models.Model):
    request = models.ForeignKey(WholesaleRequest, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey("products.Product", related_name="wholesale_items", on_delete=models.SET_NULL, null=True, blank=True)
    product_name = models.CharField("نام محصول", max_length=150)
    quantity = models.PositiveIntegerField("تعداد مورد نیاز")
    notes = models.TextField("توضیحات اختصاصی", blank=True)

    class Meta:
        verbose_name = "آیتم درخواست عمده"
        verbose_name_plural = "آیتم‌های درخواست عمده"

class Payment(models.Model):
    PAYMENT_STATUS_CHOICES = [("PENDING", "در انتظار پرداخت"), ("SUCCESS", "موفق"), ("FAILED", "ناموفق"), ("REFUNDED", "مسترد شده")]
    order = models.ForeignKey(Order, related_name="payments", on_delete=models.CASCADE, verbose_name="سفارش")
    payment_number = models.CharField("شناسه پرداخت", max_length=100, unique=True)
    amount = models.DecimalField("مبلغ", max_digits=12, decimal_places=0)
    payment_method = models.CharField("روش پرداخت", max_length=50, default="ONLINE")
    payment_status = models.CharField("وضعیت پرداخت", max_length=20, choices=PAYMENT_STATUS_CHOICES, default="PENDING")
    transaction_id = models.CharField("کد پیگیری تراکنش", max_length=255, blank=True, null=True)
    created_at = models.DateTimeField("تاریخ ایجاد", auto_now_add=True)
    updated_at = models.DateTimeField("تاریخ بروزرسانی", auto_now=True)
