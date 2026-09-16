import json
from decimal import Decimal, InvalidOperation
from rest_framework import serializers
from django.utils.text import slugify
from .models import Product, Category, Brand, ProductWholesaleOption

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
        fields = ["id", "name", "slug", "order", "is_active", "is_featured", "description", "logo", "website"]
        read_only_fields = ["id"]

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        if instance.logo and hasattr(instance.logo, 'url'):
            request = self.context.get('request')
            rep['logo'] = request.build_absolute_uri(instance.logo.url) if request else instance.logo.url
        return rep

class ProductWholesaleOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductWholesaleOption
        fields = ["id", "code", "label", "unit_price", "is_active", "order"]
        read_only_fields = ["id"]


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    brand_name = serializers.CharField(source="brand.name", read_only=True, default="")
    image = serializers.ImageField(required=False, allow_null=True)
    brand_logo = serializers.ImageField(write_only=True, required=False, allow_null=True)
    retail_unit_display = serializers.CharField(source="get_retail_unit_display", read_only=True)
    wholesale_unit_display = serializers.CharField(source="get_wholesale_unit_display", read_only=True)
    base_price = serializers.SerializerMethodField()
    wholesale_price = serializers.SerializerMethodField()
    wholesale_options = ProductWholesaleOptionSerializer(many=True, required=False)

    class Meta:
        model = Product
        fields = [
            "id", "category", "category_name", "brand", "brand_name", "brand_logo",
            "name", "slug", "description", "price", "discount_price",
            "base_price", "wholesale_price",
            "unit", "retail_unit", "retail_unit_display",
            "wholesale_unit", "wholesale_unit_display",
            "wholesale_min_quantity", "wholesale_options",
            "tag", "badge", "image", "stock", "weight", "available", "order", "is_featured", "status", "sku", "barcode",
        ]
        read_only_fields = ["id", "slug", "retail_unit_display", "wholesale_unit_display", "base_price", "wholesale_price"]

    def _get_dashboard_pricing(self, obj):
        try:
            pricing = obj.dashboard_pricing
            return pricing if pricing.is_active else None
        except Exception:
            return None

    def _to_decimal(self, value, default=0):
        try:
            if value in (None, ""):
                return Decimal(default)
            return Decimal(str(value))
        except (InvalidOperation, TypeError, ValueError):
            return Decimal(default)

    def get_base_price(self, obj):
        pricing = self._get_dashboard_pricing(obj)
        return self._to_decimal(pricing.base_price) if pricing else obj.price

    def get_wholesale_price(self, obj):
        pricing = self._get_dashboard_pricing(obj)
        wholesale_price = self._to_decimal(pricing.wholesale_price) if pricing and pricing.wholesale_price is not None else Decimal("0")
        if wholesale_price > 0:
            return wholesale_price
        discount = getattr(obj, "discount_price", None)
        discount_price = self._to_decimal(discount) if discount is not None else Decimal("0")
        product_price = self._to_decimal(obj.price)
        if discount_price > 0 and discount_price < product_price:
            return discount_price
        return obj.price

    def to_internal_value(self, data):
        if "wholesale_options" in data and isinstance(data.get("wholesale_options"), str):
            if hasattr(data, "copy"):
                data = data.copy()
            try:
                data["wholesale_options"] = json.loads(data.get("wholesale_options") or "[]")
            except json.JSONDecodeError:
                raise serializers.ValidationError({"wholesale_options": "فرمت گزینه‌های عمده معتبر نیست"})
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

    def _save_brand_logo(self, product, brand_logo):
        if brand_logo and product.brand:
            product.brand.logo = brand_logo
            product.brand.save(update_fields=["logo", "updated_at"])

    def _initial_wholesale_options_data(self):
        if not hasattr(self, "initial_data"):
            return None
        raw = self.initial_data.get("wholesale_options")
        if raw in (None, ""):
            return None
        if isinstance(raw, str):
            try:
                return json.loads(raw)
            except json.JSONDecodeError:
                return None
        return raw

    def _sync_wholesale_options(self, product, options_data):
        if options_data is None:
            return
        ProductWholesaleOption.objects.filter(product=product).delete()
        bulk = []
        used_codes = set()
        for idx, option in enumerate(options_data):
            label = str(option.get("label") or "").strip()
            code = str(option.get("code") or label or f"option-{idx + 1}").strip()
            unit_price = option.get("unit_price")
            if not label or unit_price in (None, ""):
                continue
            code = code[:30]
            base_code = code
            counter = 2
            while code in used_codes:
                code = f"{base_code[:24]}-{counter}"
                counter += 1
            used_codes.add(code)
            bulk.append(ProductWholesaleOption(
                product=product,
                code=code,
                label=label[:60],
                unit_price=unit_price,
                is_active=bool(option.get("is_active", True)),
                order=option.get("order", idx),
            ))
        if bulk:
            ProductWholesaleOption.objects.bulk_create(bulk)

    def create(self, validated_data):
        from django.utils.text import slugify
        from django.db import IntegrityError
        import time

        brand_logo = validated_data.pop("brand_logo", None)
        wholesale_options_data = validated_data.pop("wholesale_options", None)
        if wholesale_options_data is None:
            wholesale_options_data = self._initial_wholesale_options_data()
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
            product = super().create(validated_data)
        except IntegrityError:
            # جلوگیری از خطای نام/اسلاگ تکراری وقتی درخواست ایجاد محصول دوبار پشت سر هم ارسال شود
            validated_data["slug"] = f"{base_slug}-{int(time.time() * 1000)}"
            product = super().create(validated_data)
        self._save_brand_logo(product, brand_logo)
        self._sync_wholesale_options(product, wholesale_options_data)
        return product

    def update(self, instance, validated_data):
        brand_logo = validated_data.pop("brand_logo", None)
        wholesale_options_data = validated_data.pop("wholesale_options", None)
        if wholesale_options_data is None:
            wholesale_options_data = self._initial_wholesale_options_data()
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
        product = super().update(instance, validated_data)
        self._save_brand_logo(product, brand_logo)
        self._sync_wholesale_options(product, wholesale_options_data)
        return product
