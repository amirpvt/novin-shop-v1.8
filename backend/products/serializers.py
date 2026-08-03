"""
products/serializers.py - FIXED for image upload + brand typing
1. عکس از لوکال ذخیره می‌شود و همه جا نمایش داده می‌شود
2. اگر ادمین برند جدید تایپ کند، برند ساخته می‌شود و در فیلتر فروشگاه می‌آید
"""
from rest_framework import serializers
from django.utils.text import slugify
from .models import Product, Category, Brand


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "order", "is_active", "is_featured", "product_count", "description", "image"]
        read_only_fields = ["id"]

    def get_product_count(self, obj):
        return obj.products.filter(available=True).count()


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ["id", "name", "slug", "order", "is_active", "description"]
        read_only_fields = ["id"]


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    brand_name = serializers.CharField(source="brand.name", read_only=True, default="")

    # ✅ FIX 1: عکس قابل آپلود - هم خواندنی هم نوشتنی
    # برای آپلود، از ImageField معمولی استفاده می‌کنیم، نه SerializerMethodField
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "category",
            "category_name",
            "brand",
            "brand_name",
            "name",
            "slug",
            "description",
            "price",
            "discount_price",
            "unit",
            "tag",
            "badge",
            "image",
            "stock",
            "weight",
            "available",
            "order",
            "is_featured",
            "status",
            "sku",
            "barcode",
        ]
        read_only_fields = ["id", "slug"]

    def to_internal_value(self, data):
        """
        ✅ FIX 2: اگر ادمین برند را به صورت نام تایپ کرد (نه id)، برند جدید بساز
        """
        # اول بگذار DRF مقادیر عادی را parse کند
        # برای brand که ممکن است رشته باشد، آن را جدا هندل می‌کنیم
        brand_input = data.get("brand")

        # اگر brand خالی یا None است، مشکلی نیست
        if brand_input is not None and brand_input != "" and brand_input != "null":
            # سعی کن به عنوان id عددی بخوانی
            try:
                # اگر عدد باشد (مثل "1" یا 1)
                brand_id = int(brand_input)
                # چک کن چنین برندی وجود دارد
                if not Brand.objects.filter(id=brand_id).exists():
                    raise Brand.DoesNotExist()
            except (ValueError, TypeError, Brand.DoesNotExist):
                # اگر عدد نبود یا وجود نداشت، به عنوان نام برند جدید بساز
                brand_name = str(brand_input).strip()
                if brand_name:
                    # اسلاگ بساز
                    base_slug = slugify(brand_name, allow_unicode=True)
                    if not base_slug:
                        base_slug = f"brand-{Brand.objects.count()+1}"
                    # اگر اسلاگ تکراری بود، عدد اضافه کن
                    slug = base_slug
                    counter = 1
                    while Brand.objects.filter(slug=slug).exists():
                        slug = f"{base_slug}-{counter}"
                        counter += 1

                    brand_obj, created = Brand.objects.get_or_create(
                        name=brand_name,
                        defaults={"slug": slug, "is_active": True}
                    )
                    # جایگزین کن با id جدید
                    # data ممکن است QueryDict باشد (از FormData)، پس mutable کن
                    if hasattr(data, "_mutable"):
                        data._mutable = True
                    data["brand"] = brand_obj.id
                    if hasattr(data, "_mutable"):
                        data._mutable = False

        return super().to_internal_value(data)

    def to_representation(self, instance):
        """
        ✅ خروجی عکس به صورت URL کامل
        """
        rep = super().to_representation(instance)

        # تصویر را به URL کامل تبدیل کن
        if instance.image and hasattr(instance.image, 'url'):
            request = self.context.get('request')
            if request:
                rep['image'] = request.build_absolute_uri(instance.image.url)
            else:
                rep['image'] = instance.image.url
        else:
            # اگر عکس ندارد، از placeholder لوکال
            try:
                rep['image'] = f"/images/p{instance.id}.jpg" if instance.id and instance.id <= 8 else "/images/placeholder.jpg"
            except:
                rep['image'] = "/images/placeholder.jpg"

        return rep

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("قیمت باید بیشتر از صفر باشد")
        return value

    def validate_stock(self, value):
        if value < 0:
            raise serializers.ValidationError("موجودی نمی‌تواند منفی باشد")
        return value

    def create(self, validated_data):
        # ✅ FIX: تولید slug یکتا از نام محصول برای جلوگیری از UNIQUE constraint failed
        from django.utils.text import slugify
        name = validated_data.get("name", "")
        base_slug = slugify(name, allow_unicode=True) or f"product-{Product.objects.count()+1}"
        slug = base_slug
        counter = 1
        while Product.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        validated_data["slug"] = slug

        stock = validated_data.get("stock", 0)
        validated_data["available"] = stock > 0
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # اگر نام عوض شد، slug را هم آپدیت کن (اختیاری)
        if "name" in validated_data and validated_data["name"] != instance.name:
            from django.utils.text import slugify
            base_slug = slugify(validated_data["name"], allow_unicode=True) or instance.slug
            slug = base_slug
            counter = 1
            while Product.objects.filter(slug=slug).exclude(id=instance.id).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            validated_data["slug"] = slug

        if "stock" in validated_data:
            validated_data["available"] = validated_data["stock"] > 0
        return super().update(instance, validated_data)
