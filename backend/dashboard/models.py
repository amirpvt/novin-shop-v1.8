"""
مدل‌های جدید داشبورد فروش - بدون تغییر جداول موجود
5 مدل: ProductPricing, VisitSchedule, CashCollection, Commission, CustomerDebt
"""
from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone


class ProductPricing(models.Model):
    """
    قیمت‌گذاری جداگانه برای هر محصول بدون تغییر مدل اصلی Product
    مدیرکل می‌تواند قیمت پایه و عمده را تعیین کند
    """
    product = models.OneToOneField(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='dashboard_pricing',
        verbose_name="محصول"
    )
    base_price = models.DecimalField(
        "قیمت پایه (جزئی)",
        max_digits=12,
        decimal_places=0,
        validators=[MinValueValidator(0)],
        help_text="قیمت برای مشتری عادی"
    )
    wholesale_price = models.DecimalField(
        "قیمت عمده",
        max_digits=12,
        decimal_places=0,
        validators=[MinValueValidator(0)],
        help_text="قیمت برای مشتری تایید شده عمده"
    )
    # قیمت قدیمی Product.price به عنوان fallback می‌ماند
    is_active = models.BooleanField("فعال", default=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pricing_updates',
        verbose_name="آخرین ویرایش توسط"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "قیمت‌گذاری محصول"
        verbose_name_plural = "قیمت‌گذاری محصولات"
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.product.name} - پایه: {self.base_price} / عمده: {self.wholesale_price}"

    @property
    def discount_percent(self):
        if self.base_price and self.wholesale_price and self.base_price > 0:
            return round((1 - self.wholesale_price / self.base_price) * 100)
        return 0


class VisitSchedule(models.Model):
    """
    برنامه بازدید روزانه ویزیتور
    ویزیتور لیست مشتریانی که امروز باید ببیند را اینجا می‌بیند
    """
    STATUS_CHOICES = [
        ('pending', 'در انتظار بازدید'),
        ('visited', 'بازدید شده'),
        ('ordered', 'سفارش ثبت شده'),
        ('no_order', 'سفارش نداشت'),
        ('postponed', 'به تعویق افتاد'),
    ]

    visitor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='visit_schedules',
        verbose_name="ویزیتور",
        limit_choices_to={'customer_profile__role': 'visitor'}
    )
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='visits_received',
        verbose_name="مشتری",
        limit_choices_to={'customer_profile__role': 'customer'}
    )
    date = models.DateField("تاریخ بازدید", default=timezone.now)
    status = models.CharField("وضعیت", max_length=20, choices=STATUS_CHOICES, default='pending')
    priority = models.PositiveIntegerField("اولویت", default=1, help_text="1=بالا, 5=پایین")
    notes = models.TextField("یادداشت ویزیتور", blank=True)
    admin_notes = models.TextField("یادداشت ادمین", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "برنامه بازدید"
        verbose_name_plural = "برنامه‌های بازدید"
        ordering = ["date", "priority"]
        unique_together = ["visitor", "customer", "date"]

    def __str__(self):
        return f"{self.visitor.username} -> {self.customer.username} در {self.date} - {self.get_status_display()}"


class CashCollection(models.Model):
    """
    ثبت دریافت وجه نقد از مشتری توسط ویزیتور یا ادمین
    """
    PAYMENT_TYPE_CHOICES = [
        ('cash', 'نقدی'),
        ('card', 'کارتخوان سیار'),
        ('cheque', 'چک'),
        ('online', 'آنلاین'),
    ]

    visitor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cash_collections',
        verbose_name="دریافت کننده (ویزیتور/ادمین)"
    )
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cash_payments',
        verbose_name="مشتری"
    )
    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cash_collections',
        verbose_name="سفارش مرتبط (اختیاری)"
    )
    amount = models.DecimalField("مبلغ دریافتی", max_digits=12, decimal_places=0, validators=[MinValueValidator(1)])
    payment_type = models.CharField("نوع پرداخت", max_length=20, choices=PAYMENT_TYPE_CHOICES, default='cash')
    receipt_number = models.CharField("شماره رسید", max_length=50, blank=True)
    notes = models.TextField("توضیحات", blank=True)
    collected_at = models.DateTimeField("تاریخ دریافت", default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "دریافت وجه نقد"
        verbose_name_plural = "دریافت‌های وجه نقد"
        ordering = ["-collected_at"]

    def __str__(self):
        return f"{self.customer.username} - {self.amount} - {self.collected_at.date()}"


class Commission(models.Model):
    """
    پورسانت ویزیتور به ازای سفارش خرده یا درخواست عمده
    """
    visitor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='commissions',
        verbose_name="ویزیتور"
    )

    order = models.OneToOneField(
        'orders.Order',
        on_delete=models.CASCADE,
        related_name='commission',
        verbose_name="سفارش خرده",
        null=True,
        blank=True
    )

    wholesale_request = models.OneToOneField(
        'orders.WholesaleRequest',
        on_delete=models.CASCADE,
        related_name='commission',
        verbose_name="درخواست عمده",
        null=True,
        blank=True
    )

    percentage = models.DecimalField(
        "درصد پورسانت",
        max_digits=5,
        decimal_places=2,
        default=5.00,
        validators=[MinValueValidator(0)]
    )
    amount = models.DecimalField(
        "مبلغ پورسانت",
        max_digits=12,
        decimal_places=0,
        validators=[MinValueValidator(0)]
    )
    is_paid = models.BooleanField("پرداخت شده؟", default=False)
    paid_at = models.DateTimeField("تاریخ پرداخت پورسانت", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "پورسانت"
        verbose_name_plural = "پورسانت‌ها"
        ordering = ["-created_at"]

    def __str__(self):
        source_number = self.order.order_number if self.order else (
            self.wholesale_request.request_number if self.wholesale_request else "بدون سند"
        )
        return f"{self.visitor.username} - {self.amount} برای {source_number}"

    def save(self, *args, **kwargs):
        # اگر مبلغ وارد نشده، از درصد و مبلغ سفارش/درخواست عمده محاسبه کن
        if not self.amount and self.percentage:
            if self.order:
                self.amount = (self.order.total_amount * self.percentage / 100)
            elif self.wholesale_request:
                self.amount = (self.wholesale_request.total_amount * self.percentage / 100)
        super().save(*args, **kwargs)


class CommissionRule(models.Model):
    """قانون پورسانت هر ویزیتور برای سفارش‌های جدید و تسویه‌های بعدی"""
    visitor = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='commission_rule',
        verbose_name="ویزیتور",
        limit_choices_to={'customer_profile__role': 'visitor'}
    )
    percentage = models.DecimalField("درصد پورسانت", max_digits=5, decimal_places=2, default=5.00, validators=[MinValueValidator(0)])
    is_active = models.BooleanField("فعال", default=True)
    notes = models.TextField("یادداشت", blank=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='commission_rule_updates',
        verbose_name="آخرین ویرایش توسط"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "قانون پورسانت"
        verbose_name_plural = "قوانین پورسانت"
        ordering = ["visitor__username"]

    def __str__(self):
        return f"{self.visitor.username} - {self.percentage}%"


class CommissionPayment(models.Model):
    """رسید پرداخت گروهی پورسانت به ویزیتور"""
    visitor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='commission_payments',
        verbose_name="ویزیتور"
    )
    commissions = models.ManyToManyField(Commission, related_name='payment_batches', blank=True, verbose_name="پورسانت‌ها")
    amount = models.DecimalField("مبلغ پرداختی", max_digits=12, decimal_places=0, validators=[MinValueValidator(0)])
    commission_count = models.PositiveIntegerField("تعداد پورسانت", default=0)
    reference_number = models.CharField("شماره رسید / پیگیری", max_length=80, blank=True)
    description = models.TextField("توضیحات", blank=True)
    paid_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='commission_payments_done',
        verbose_name="پرداخت کننده"
    )
    paid_at = models.DateTimeField("تاریخ پرداخت", default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "پرداخت پورسانت"
        verbose_name_plural = "پرداخت‌های پورسانت"
        ordering = ["-paid_at"]

    def __str__(self):
        return f"{self.visitor.username} - {self.amount}"


class CustomerDebt(models.Model):
    """
    بدهی مشتریان - گزارش بدهکاران برای مدیرکل
    """
    customer = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='debt_profile',
        verbose_name="مشتری"
    )
    total_debt = models.DecimalField("کل بدهی", max_digits=12, decimal_places=0, default=0, validators=[MinValueValidator(0)])
    total_paid = models.DecimalField("کل پرداختی", max_digits=12, decimal_places=0, default=0)
    last_order_date = models.DateTimeField("آخرین سفارش", null=True, blank=True)
    last_payment_date = models.DateTimeField("آخرین پرداخت", null=True, blank=True)
    is_overdue = models.BooleanField("معوقه؟", default=False)
    notes = models.TextField("یادداشت", blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "بدهی مشتری"
        verbose_name_plural = "بدهی مشتریان"
        ordering = ["-total_debt"]

    def __str__(self):
        return f"{self.customer.username} - بدهی: {self.total_debt}"

    @property
    def remaining_debt(self):
        return self.total_debt - self.total_paid
