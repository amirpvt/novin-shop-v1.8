"""
Customer Profile - Extension to Django's built-in User.
هر کاربر (auth.User) می‌تواند پروفایل Customer با اطلاعات تکمیلی داشته باشد.
"""
from django.conf import settings
from django.db import models


class Customer(models.Model):
    """
    پروفایل مشتری - یک به یک با کاربر Django.
    اطلاعات تکمیلی مثل آدرس، کد ملی، نوع مشتری (عمده/تکی) اینجا ذخیره می‌شود.
    """

    CUSTOMER_TYPE_CHOICES = [
        ("retail", "خرده‌فروشی"),
        ("wholesale", "عمده‌فروشی"),
        ("both", "هردو"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="customer_profile",
        verbose_name="کاربر",
    )
    phone = models.CharField(
        "شماره تماس",
        max_length=20,
        db_index=True,
    )
    address = models.TextField(
        "آدرس",
        blank=True,
    )
    city = models.CharField(
        "شهر",
        max_length=100,
        blank=True,
    )
    postal_code = models.CharField(
        "کد پستی",
        max_length=20,
        blank=True,
    )
    national_id = models.CharField(
        "کد ملی",
        max_length=20,
        blank=True,
    )
    customer_type = models.CharField(
        "نوع مشتری",
        max_length=20,
        choices=CUSTOMER_TYPE_CHOICES,
        default="retail",
    )
    is_wholesale_approved = models.BooleanField(
        "تأیید عمده‌فروشی",
        default=False,
        help_text="فقط در صورت تأیید مدیر، امکان ثبت سفارش عمده دارد.",
    )
    notes = models.TextField(
        "یادداشت",
        blank=True,
        help_text="یادداشت‌های داخلی مدیر درباره این مشتری.",
    )
    created_at = models.DateTimeField("تاریخ ثبت", auto_now_add=True)
    updated_at = models.DateTimeField("بروزرسانی", auto_now=True)

    class Meta:
        verbose_name = "پروفایل مشتری"
        verbose_name_plural = "پروفایل مشتری‌ها"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} — {self.get_customer_type_display()}"
