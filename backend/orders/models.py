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
from django.db.models import Q
import random, string

def generate_order_number(): return "ORD-" + "".join(random.choices(string.digits, k=8))
def generate_request_number(): return "WHS-" + "".join(random.choices(string.digits, k=8))

class Order(models.Model):
    ORDER_STATUS_CHOICES = [
        ("PENDING", "در انتظار پرداخت"),
        ("PAID_PENDING_REVIEW", "پرداخت شده / در انتظار بررسی"),
        ("CONFIRMED", "تایید شده"),
        ("PREPARING", "در حال آماده‌سازی"),
        ("SHIPPED", "ارسال شده"),
        ("DELIVERED", "تحویل داده شده"),
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
        indexes = [
            models.Index(fields=["user", "-created_at"], name="order_user_created_idx"),
            models.Index(fields=["order_status", "-created_at"], name="order_status_created_idx"),
            models.Index(fields=["phone"], name="order_phone_idx"),
        ]
        constraints = [
            models.CheckConstraint(condition=Q(total_amount__gte=0), name="order_total_non_negative"),
        ]

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
        indexes = [
            models.Index(fields=["order"], name="orderitem_order_idx"),
            models.Index(fields=["product"], name="orderitem_product_idx"),
        ]
        constraints = [
            models.CheckConstraint(condition=Q(quantity__gt=0), name="orderitem_qty_positive"),
            models.CheckConstraint(condition=Q(price__gte=0), name="orderitem_price_non_negative"),
        ]

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
    # مبلغ واقعی درخواست عمده - به صورت خودکار از مجموع اقلام محاسبه می‌شود
    total_amount = models.DecimalField(
        "مبلغ کل (تومان)",
        max_digits=12,
        decimal_places=0,
        default=0,
        help_text="به صورت خودکار از مجموع اقلام (تعداد × قیمت عمده محصول) محاسبه می‌شود",
    )
    created_at = models.DateTimeField("تاریخ ثبت", auto_now_add=True)

    class Meta:
        verbose_name = "درخواست خرید عمده"
        verbose_name_plural = "درخواست‌های خرید عمده"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"], name="wholesale_user_created_idx"),
            models.Index(fields=["status", "-created_at"], name="wholesale_status_created_idx"),
            models.Index(fields=["phone"], name="wholesale_phone_idx"),
        ]
        constraints = [
            models.CheckConstraint(condition=Q(total_amount__gte=0), name="wholesale_total_non_negative"),
        ]

    def __str__(self): return f"{self.request_number} — {self.company_name}"

class WholesaleRequestItem(models.Model):
    request = models.ForeignKey(WholesaleRequest, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey("products.Product", related_name="wholesale_items", on_delete=models.SET_NULL, null=True, blank=True)
    wholesale_option = models.ForeignKey("products.ProductWholesaleOption", related_name="wholesale_items", on_delete=models.SET_NULL, null=True, blank=True, verbose_name="نوع فروش عمده")
    product_name = models.CharField("نام محصول", max_length=150)
    wholesale_option_label = models.CharField("عنوان نوع عمده", max_length=60, blank=True)
    wholesale_unit_price = models.DecimalField("قیمت نوع عمده در زمان سفارش", max_digits=12, decimal_places=0, default=0)
    quantity = models.PositiveIntegerField("تعداد مورد نیاز")
    notes = models.TextField("توضیحات اختصاصی", blank=True)

    class Meta:
        verbose_name = "آیتم درخواست عمده"
        verbose_name_plural = "آیتم‌های درخواست عمده"
        indexes = [
            models.Index(fields=["request"], name="whitem_request_idx"),
            models.Index(fields=["product"], name="whitem_product_idx"),
        ]
        constraints = [
            models.CheckConstraint(condition=Q(quantity__gt=0), name="wholesaleitem_qty_positive"),
        ]

class PendingRetailPayment(models.Model):
    PAYMENT_STATUS_CHOICES = [("PENDING", "در انتظار پرداخت"), ("SUCCESS", "موفق"), ("FAILED", "ناموفق")]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="pending_retail_payments", verbose_name="کاربر")
    payment_number = models.CharField("شناسه پرداخت", max_length=100, unique=True)
    amount = models.DecimalField("مبلغ", max_digits=12, decimal_places=0)
    payload = models.JSONField("اطلاعات سفارش جزئی")
    payment_status = models.CharField("وضعیت پرداخت", max_length=20, choices=PAYMENT_STATUS_CHOICES, default="PENDING")
    authority = models.CharField("Authority زرین‌پال", max_length=255, blank=True, null=True)
    transaction_id = models.CharField("کد پیگیری تراکنش", max_length=255, blank=True, null=True)
    order = models.OneToOneField(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name="payment_intent", verbose_name="سفارش ثبت‌شده")
    created_at = models.DateTimeField("تاریخ ایجاد", auto_now_add=True)
    updated_at = models.DateTimeField("تاریخ بروزرسانی", auto_now=True)

    class Meta:
        verbose_name = "پرداخت در انتظار سفارش جزئی"
        verbose_name_plural = "پرداخت‌های در انتظار سفارش جزئی"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["payment_status", "-created_at"], name="pending_rt_status_idx"),
            models.Index(fields=["user", "-created_at"], name="pending_rt_user_idx"),
        ]
        constraints = [
            models.CheckConstraint(condition=Q(amount__gte=0), name="pending_rt_amount_non_negative"),
        ]

    def __str__(self):
        return self.payment_number


class PendingWholesalePayment(models.Model):
    PAYMENT_STATUS_CHOICES = [("PENDING", "در انتظار پرداخت"), ("SUCCESS", "موفق"), ("FAILED", "ناموفق")]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="pending_wholesale_payments", verbose_name="کاربر")
    payment_number = models.CharField("شناسه پرداخت", max_length=100, unique=True)
    amount = models.DecimalField("مبلغ", max_digits=12, decimal_places=0)
    payload = models.JSONField("اطلاعات درخواست عمده")
    payment_status = models.CharField("وضعیت پرداخت", max_length=20, choices=PAYMENT_STATUS_CHOICES, default="PENDING")
    authority = models.CharField("Authority زرین‌پال", max_length=255, blank=True, null=True)
    transaction_id = models.CharField("کد پیگیری تراکنش", max_length=255, blank=True, null=True)
    wholesale_request = models.OneToOneField(WholesaleRequest, on_delete=models.SET_NULL, null=True, blank=True, related_name="payment_intent", verbose_name="درخواست عمده ثبت‌شده")
    created_at = models.DateTimeField("تاریخ ایجاد", auto_now_add=True)
    updated_at = models.DateTimeField("تاریخ بروزرسانی", auto_now=True)

    class Meta:
        verbose_name = "پرداخت در انتظار درخواست عمده"
        verbose_name_plural = "پرداخت‌های در انتظار درخواست عمده"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["payment_status", "-created_at"], name="pending_wh_status_idx"),
            models.Index(fields=["user", "-created_at"], name="pending_wh_user_idx"),
        ]
        constraints = [
            models.CheckConstraint(condition=Q(amount__gte=0), name="pending_wh_amount_non_negative"),
        ]

    def __str__(self):
        return self.payment_number


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

    class Meta:
        verbose_name = "پرداخت"
        verbose_name_plural = "پرداخت‌ها"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["order", "-created_at"], name="payment_order_created_idx"),
            models.Index(fields=["payment_status", "-created_at"], name="payment_status_created_idx"),
        ]
        constraints = [
            models.CheckConstraint(condition=Q(amount__gte=0), name="payment_amount_non_negative"),
        ]
