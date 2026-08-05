"""
Customer Profile - Extension to Django's built-in User.
RBAC: role field added for dashboard system (manager, admin, visitor, customer)
این تنها فایل موجودی است که طبق قانون شما ویرایش شده است.
"""
from django.conf import settings
from django.db import models


class Customer(models.Model):
    """
    پروفایل مشتری - یک به یک با کاربر Django.
    فیلد role برای سیستم RBAC داشبورد جدید اضافه شده است.
    """

    CUSTOMER_TYPE_CHOICES = [
        ("retail", "خرده‌فروشی"),
        ("wholesale", "عمده‌فروشی"),
        ("both", "هردو"),
    ]

    # --- RBAC Roles ---
    ROLE_CHOICES = [
        ('manager', 'مدیر کل'),
        ('admin', 'ادمین فروشگاه'),
        ('visitor', 'ویزیتور'),
        ('customer', 'مشتری'),
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

    # --- فیلدهای جدید برای سیستم RBAC داشبورد ---
    role = models.CharField(
        "نقش کاربر",
        max_length=20,
        choices=ROLE_CHOICES,
        default='customer',
        db_index=True,
        help_text="manager=مدیرکل, admin=ادمین فروشگاه, visitor=ویزیتور, customer=مشتری"
    )

    is_active = models.BooleanField(
        "فعال",
        default=True,
        help_text="اگر غیرفعال باشد کاربر نمی‌تواند وارد داشبورد شود - توسط مدیرکل کنترل می‌شود"
    )

    is_wholesale_approved = models.BooleanField(
        "تأیید عمده‌فروشی",
        default=False,
        help_text="فقط در صورت تأیید مدیر، امکان ثبت سفارش عمده دارد و قیمت عمده می‌بیند.",
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
        return f"{self.user.get_full_name() or self.user.username} — {self.get_role_display()}"

    @property
    def is_manager(self):
        return self.role == 'manager'

    @property
    def is_store_admin(self):
        return self.role == 'admin'

    @property
    def is_visitor(self):
        return self.role == 'visitor'

    @property
    def is_customer_role(self):
        return self.role == 'customer'
