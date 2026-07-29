"""
Product serializers - Phase 3 (CRUD ready)
"""
from rest_framework import serializers
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
    image = serializers.SerializerMethodField()

    # برای نوشتن، category و brand را می‌توان با id یا slug فرستاد
    # اینجا ساده نگه می‌داریم: id

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

    def get_image(self, obj):
        if obj.image and hasattr(obj.image, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        try:
            return f"/images/p{obj.id}.jpg" if obj.id and obj.id <= 8 else "/images/placeholder.jpg"
        except:
            return "/images/placeholder.jpg"

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("قیمت باید بیشتر از صفر باشد")
        return value

    def validate_stock(self, value):
        if value < 0:
            raise serializers.ValidationError("موجودی نمی‌تواند منفی باشد")
        return value

    def create(self, validated_data):
        # available را خودکار بر اساس stock تنظیم کن
        stock = validated_data.get("stock", 0)
        validated_data["available"] = stock > 0
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # اگر stock تغییر کرد، available را آپدیت کن
        if "stock" in validated_data:
            validated_data["available"] = validated_data["stock"] > 0
        return super().update(instance, validated_data)
