import random
import string

from django.db import models


def generate_order_number() -> str:
    """شماره سفارش کوتاه و یکتا مثل ORD-48213096 (در محدوده max_length هر دو مدل)."""
    return "ORD-" + "".join(random.choices(string.digits, k=8))


def generate_request_number() -> str:
    """شماره درخواست عمده مثل WHS-48213096."""
    return "WHS-" + "".join(random.choices(string.digits, k=8))


# --- Retail Models (B2C) ---
class Order(models.Model):
    ORDER_STATUS_CHOICES = [
        ("PENDING", "در انتظار بررسی"),
        ("CONFIRMED", "تایید شده"),
        ("PREPARING", "در حال آماده‌سازی"),
        ("SHIPPED", "ارسال شده"),
        ("DELIVERED", "تحویل شده"),
        ("CANCELLED", "لغو شده"),
    ]

    order_number = models.CharField(
        "شماره سفارش", max_length=20, unique=True, default=generate_order_number, editable=False
    )
    name = models.CharField("نام و نام خانوادگی", max_length=150)
    phone = models.CharField("شماره تماس", max_length=20)
    address = models.CharField("آدرس تحویل", max_length=500, blank=True)
    message = models.TextField("توضیحات مشتری", blank=True)
    order_status = models.CharField(
        "وضعیت سفارش", max_length=20, choices=ORDER_STATUS_CHOICES, default="PENDING"
    )
    total_amount = models.DecimalField("مبلغ کل", max_digits=12, decimal_places=0, default=0)
    created_at = models.DateTimeField("تاریخ ثبت", auto_now_add=True)
    updated_at = models.DateTimeField("بروزرسانی", auto_now=True)

    class Meta:
        verbose_name = "سفارش تک‌فروشی"
        verbose_name_plural = "سفارش‌های تک‌فروشی"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.order_number} — {self.name}"

    def recalculate_total(self, save: bool = True) -> None:
        total = sum(item.price * item.quantity for item in self.items.all())
        self.total_amount = total
        if save:
            self.save(update_fields=["total_amount"])


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    # لینک به محصول برای گزارش‌گیری؛ در صورت حذف محصول، سفارش قدیمی سالم می‌ماند
    product = models.ForeignKey(
        "products.Product", related_name="order_items", on_delete=models.SET_NULL, null=True, blank=True
    )
    # اسنپ‌شات نام و قیمت لحظه‌ی ثبت سفارش (حتی اگر محصول بعداً تغییر کند/حذف شود)
    product_name = models.CharField("نام محصول", max_length=150)
    price = models.DecimalField("قیمت واحد (لحظه سفارش)", max_digits=12, decimal_places=0)
    quantity = models.PositiveIntegerField("تعداد")

    class Meta:
        verbose_name = "آیتم سفارش"
        verbose_name_plural = "آیتم‌های سفارش"

    def __str__(self):
        return f"{self.product_name} × {self.quantity}"

    @property
    def subtotal(self):
        return self.price * self.quantity


# --- Wholesale Models (B2B) ---
class WholesaleRequest(models.Model):
    REQUEST_STATUS_CHOICES = [
        ("NEW", "درخواست جدید"),
        ("QUOTED", "پیش‌فاکتور صادر شده"),
        ("CONVERTED", "تبدیل به سفارش شده"),
        ("REJECTED", "رد شده"),
    ]

    request_number = models.CharField(
        "شماره درخواست", max_length=20, unique=True, default=generate_request_number, editable=False
    )
    company_name = models.CharField("نام شرکت / فروشگاه", max_length=150)
    contact_person = models.CharField("نام شخص رابط", max_length=150)
    phone = models.CharField("شماره تماس", max_length=20)
    address = models.CharField("آدرس", max_length=500, blank=True)
    description = models.TextField("توضیحات تکمیلی", blank=True)
    status = models.CharField(
        "وضعیت درخواست", max_length=20, choices=REQUEST_STATUS_CHOICES, default="NEW"
    )
    created_at = models.DateTimeField("تاریخ ثبت", auto_now_add=True)

    class Meta:
        verbose_name = "درخواست خرید عمده"
        verbose_name_plural = "درخواست‌های خرید عمده"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.request_number} — {self.company_name}"


class WholesaleRequestItem(models.Model):
    request = models.ForeignKey(WholesaleRequest, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey(
        "products.Product", related_name="wholesale_items", on_delete=models.SET_NULL, null=True, blank=True
    )
    product_name = models.CharField("نام محصول", max_length=150)
    quantity = models.PositiveIntegerField("تعداد مورد نیاز")
    notes = models.TextField("توضیحات اختصاصی", blank=True)

    class Meta:
        verbose_name = "آیتم درخواست عمده"
        verbose_name_plural = "آیتم‌های درخواست عمده"

    def __str__(self):
        return f"{self.product_name} × {self.quantity}"


class Payment(models.Model):
    PAYMENT_STATUS_CHOICES = [
        ("PENDING", "در انتظار پرداخت"),
        ("SUCCESS", "موفق"),
        ("FAILED", "ناموفق"),
        ("REFUNDED", "مسترد شده"),
    ]

    order = models.ForeignKey(Order, related_name="payments", on_delete=models.CASCADE, verbose_name="سفارش")
    payment_number = models.CharField("شناسه پرداخت", max_length=100, unique=True)
    amount = models.DecimalField("مبلغ", max_digits=12, decimal_places=0)
    payment_method = models.CharField("روش پرداخت", max_length=50, default="ONLINE")
    payment_status = models.CharField(
        "وضعیت پرداخت", max_length=20, choices=PAYMENT_STATUS_CHOICES, default="PENDING"
    )
    transaction_id = models.CharField("کد پیگیری تراکنش", max_length=255, blank=True, null=True)
    created_at = models.DateTimeField("تاریخ ایجاد", auto_now_add=True)
    updated_at = models.DateTimeField("تاریخ بروزرسانی", auto_now=True)

    class Meta:
        verbose_name = "پرداخت"
        verbose_name_plural = "پرداخت‌ها"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.payment_number} — {self.payment_status}"
