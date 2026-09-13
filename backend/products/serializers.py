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
        fields = ["id", "name", "slug", "order", "is_active", "description", "logo", "website"]
        read_only_fields = ["id"]

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        if instance.logo and hasattr(instance.logo, 'url'):
            request = self.context.get('request')
            rep['logo'] = request.build_absolute_uri(instance.logo.url) if request else instance.logo.url
        return rep

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    brand_name = serializers.CharField(source="brand.name", read_only=True, default="")
    image = serializers.ImageField(required=False, allow_null=True)
    retail_unit_display = serializers.CharField(source="get_retail_unit_display", read_only=True)
    wholesale_unit_display = serializers.CharField(source="get_wholesale_unit_display", read_only=True)
    base_price = serializers.SerializerMethodField()
    wholesale_price = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id", "category", "category_name", "brand", "brand_name",
            "name", "slug", "description", "price", "discount_price",
            "base_price", "wholesale_price",
            "unit", "retail_unit", "retail_unit_display",
            "wholesale_unit", "wholesale_unit_display",
            "wholesale_min_quantity",
            "tag", "badge", "image", "stock", "weight", "available", "order", "is_featured", "status", "sku", "barcode",
        ]
        read_only_fields = ["id", "slug", "retail_unit_display", "wholesale_unit_display", "base_price", "wholesale_price"]

    def _get_dashboard_pricing(self, obj):
        try:
            pricing = obj.dashboard_pricing
            return pricing if pricing.is_active else None
        except Exception:
            return None

    def get_base_price(self, obj):
        pricing = self._get_dashboard_pricing(obj)
        return pricing.base_price if pricing else obj.price

    def get_wholesale_price(self, obj):
        pricing = self._get_dashboard_pricing(obj)
        return pricing.wholesale_price if pricing else obj.price

    def to_internal_value(self, data):
        brand_input = data.get("brand")
        if brand_input is not None and brand_input != "" and brand_input != "null":
            try:
                brand_id = int(brand_input)
                if not Brand.objects.filter(id=brand_id).exists():
                    raise Brand.DoesNotExist()
            except (ValueError, TypeError, Brand.DoesNotExist):
                brand_name = str(brand_input).strip()
                if brand_name:
                    base_slug = slugify(brand_name, allow_unicode=True) or f"brand-{Brand.objects.count()+1}"
                    slug = base_slug
                    counter = 1
                    while Brand.objects.filter(slug=slug).exists():
                        slug = f"{base_slug}-{counter}"
                        counter += 1
                    brand_obj, created = Brand.objects.get_or_create(name=brand_name, defaults={"slug": slug, "is_active": True})
                    if hasattr(data, "_mutable"): data._mutable = True
                    data["brand"] = brand_obj.id
                    if hasattr(data, "_mutable"): data._mutable = False
        return super().to_internal_value(data)

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        if instance.image and hasattr(instance.image, 'url'):
            request = self.context.get('request')
            if request:
                rep['image'] = request.build_absolute_uri(instance.image.url)
            else:
                rep['image'] = instance.image.url
        else:
            rep['image'] = "/images/placeholder.jpg"
        return rep

    def validate_price(self, value):
        if value <= 0: raise serializers.ValidationError("قیمت باید بیشتر از صفر باشد")
        return value

    def create(self, validated_data):
        from django.utils.text import slugify
        from django.db import IntegrityError
        import time

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
        # اگر retail_unit خالی بود، از unit قدیمی بگیر
        if not validated_data.get("retail_unit"):
            validated_data["retail_unit"] = validated_data.get("unit", "pack")
        try:
            return super().create(validated_data)
        except IntegrityError:
            # جلوگیری از خطای نام/اسلاگ تکراری وقتی درخواست ایجاد محصول دوبار پشت سر هم ارسال شود
            validated_data["slug"] = f"{base_slug}-{int(time.time() * 1000)}"
            return super().create(validated_data)

    def update(self, instance, validated_data):
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
