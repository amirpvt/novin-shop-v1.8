"""
models.py کامل با واحدهای جدا - کپی کن روی products/models.py
این فایل فقط 3 فیلد جدید اضافه کرده: retail_unit, wholesale_unit, wholesale_min_quantity
بقیه همان قبلی است
"""
from django.db import models
from django.db.models import Q

class Category(models.Model):
    name = models.CharField("نام دسته", max_length=100, db_index=True,)
    slug = models.SlugField("اسلاگ", unique=True, db_index=True,)
    order = models.PositiveIntegerField("ترتیب نمایش", default=0)
    image = models.ImageField("تصویر", upload_to="categories/", blank=True, null=True)
    description = models.TextField("توضیحات", blank=True)
    is_active = models.BooleanField("فعال", default=True)
    is_featured = models.BooleanField("نمایش در صفحه اصلی", default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        verbose_name = "دسته بندی"
        verbose_name_plural = "دسته بندی ها"
        ordering = ["order", "name"]
        indexes = [
            models.Index(fields=["is_active", "order"], name="category_active_order_idx"),
            models.Index(fields=["is_featured", "order"], name="category_featured_order_idx"),
        ]
    def __str__(self): return self.name

class Brand(models.Model):
    name = models.CharField("نام برند", max_length=100, unique=True, db_index=True)
    slug = models.SlugField("اسلاگ", unique=True)
    logo = models.ImageField("لوگو", upload_to="brands/", blank=True, null=True)
    description = models.TextField("توضیحات", blank=True)
    website = models.URLField("وب‌سایت", blank=True)
    order = models.PositiveIntegerField("ترتیب نمایش", default=0)
    is_active = models.BooleanField("فعال", default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        ordering = ["order", "name"]
        verbose_name = "برند"
        verbose_name_plural = "برندها"
        indexes = [
            models.Index(fields=["is_active", "order"], name="brand_active_order_idx"),
        ]
    def __str__(self): return self.name

UNIT_CHOICES = [
    ("kg", "کیلوگرم"),
    ("pack", "بسته"),
    ("piece", "عدد"),
    ("carton", "کارتن"),
]

TAG_CHOICES = [
    ("", "بدون برچسب"),
    ("new", "جدید"),
    ("best", "پرفروش"),
    ("discount", "تخفیف"),
    ("special", "ویژه"),
]

BADGE_CHOICES = [
    ("", "بدون نشان"),
    ("fresh", "تازه"),
    ("hot", "محبوب"),
    ("premium", "پریمیوم"),
]

STATUS_CHOICES = [
    ("draft", "پیش نویس"),
    ("published", "منتشر شده"),
]

class Product(models.Model):
    category = models.ForeignKey(Category, related_name="products", on_delete=models.PROTECT, verbose_name="دسته بندی")
    brand = models.ForeignKey(Brand, on_delete=models.PROTECT, related_name="products", verbose_name="برند", null=True, blank=True)
    sku = models.CharField("کد محصول", max_length=50, blank=True, default="")
    name = models.CharField("نام محصول", max_length=150, db_index=True)
    slug = models.SlugField("اسلاگ", max_length=160, unique=True, blank=True, db_index=True)
    description = models.TextField("توضیحات", blank=True)
    price = models.DecimalField("قیمت (تومان)", max_digits=12, decimal_places=0)
    discount_price = models.DecimalField("قیمت با تخفیف (تومان)", max_digits=12, decimal_places=0, blank=True, null=True)
    barcode = models.CharField("بارکد", max_length=50, blank=True)
    stock = models.PositiveIntegerField("موجودی انبار", default=0)
    weight = models.PositiveIntegerField("وزن (گرم)", default=1000)

    # ✅ واحدهای جدا برای جزئی و عمده
    unit = models.CharField("واحد (قدیمی - برای سازگاری)", max_length=20, choices=UNIT_CHOICES, default="pack")
    
    retail_unit = models.CharField(
        "واحد خرده‌فروشی",
        max_length=20,
        choices=UNIT_CHOICES,
        default="pack",
        help_text="واحد برای فروش جزئی - مثلاً بسته، عدد"
    )
    
    wholesale_unit = models.CharField(
        "واحد عمده‌فروشی",
        max_length=20,
        choices=UNIT_CHOICES,
        default="kg",
        help_text="واحد برای فروش عمده - مثلاً کیلوگرم، کارتن"
    )

    wholesale_min_quantity = models.PositiveIntegerField(
        "حداقل مقدار عمده",
        default=10,
        help_text="حداقل تعداد/وزن برای سفارش عمده - توسط مدیرکل یا ادمین تعیین می‌شود"
    )

    tag = models.CharField("برچسب ویژه", max_length=20, choices=TAG_CHOICES, blank=True)
    badge = models.CharField("نشان", max_length=20, choices=BADGE_CHOICES, blank=True)
    image = models.ImageField("تصویر", upload_to="products/", blank=True, null=True)
    alt_text = models.CharField("متن جایگزین تصویر", max_length=255, blank=True)
    status = models.CharField("وضعیت", max_length=20, choices=STATUS_CHOICES, default="published")
    is_featured = models.BooleanField("نمایش در صفحه اصلی", default=False)
    available = models.BooleanField("موجود است", default=True)
    order = models.PositiveIntegerField("ترتیب نمایش", default=0)
    created_at = models.DateTimeField("تاریخ ایجاد", auto_now_add=True)
    updated_at = models.DateTimeField("آخرین بروزرسانی", auto_now=True)

    class Meta:
        verbose_name = "محصول"
        verbose_name_plural = "محصولات"
        ordering = ["order", "name"]
        indexes = [
            models.Index(fields=["status", "available", "order"], name="product_public_list_idx"),
            models.Index(fields=["category", "available", "order"], name="product_category_idx"),
            models.Index(fields=["brand", "available", "order"], name="product_brand_idx"),
            models.Index(fields=["is_featured", "available", "order"], name="product_featured_idx"),
            models.Index(fields=["stock"], name="product_stock_idx"),
        ]
        constraints = [
            models.CheckConstraint(condition=Q(price__gte=0), name="product_price_non_negative"),
            models.CheckConstraint(condition=Q(discount_price__isnull=True) | Q(discount_price__gte=0), name="product_discount_non_negative"),
            models.CheckConstraint(condition=Q(discount_price__isnull=True) | Q(discount_price__lt=models.F("price")), name="product_discount_lt_price"),
            models.CheckConstraint(condition=Q(wholesale_min_quantity__gt=0), name="product_wholesale_min_positive"),
        ]

    def __str__(self):
        return self.name

    def get_retail_unit_display(self):
        return dict(UNIT_CHOICES).get(self.retail_unit or self.unit, self.retail_unit or self.unit)

    def get_wholesale_unit_display(self):
        return dict(UNIT_CHOICES).get(self.wholesale_unit, self.wholesale_unit)
