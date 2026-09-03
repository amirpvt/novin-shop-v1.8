"""
orders/serializers.py - MyOrders with product images
عکس محصول در کنار سفارش
"""
from django.db import transaction
from rest_framework import serializers
from products.models import Product
from .models import Order, OrderItem, WholesaleRequest, WholesaleRequestItem


class OrderItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.SerializerMethodField()
    product_image = serializers.SerializerMethodField()
    product_slug = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ["id", "product", "product_name", "price", "quantity", "subtotal", "product_image", "product_slug"]
        read_only_fields = fields

    def get_subtotal(self, obj):
        return obj.subtotal

    def get_product_image(self, obj):
        # اگر محصول هنوز وجود دارد، تصویر واقعی را بده
        if obj.product and obj.product.image and hasattr(obj.product.image, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.product.image.url)
            return obj.product.image.url
        # اگر محصول حذف شده یا تصویر ندارد، از placeholder هوشمند استفاده کن
        # بر اساس id محصول یا نام
        if obj.product and obj.product.id:
            pid = obj.product.id
            return f"/images/p{pid}.jpg" if pid <= 8 else "/images/placeholder.jpg"
        return "/images/placeholder.jpg"

    def get_product_slug(self, obj):
        if obj.product:
            return obj.product.slug
        return ""


class OrderItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    class Meta:
        model = Order
        fields = ["id", "order_number", "name", "phone", "address", "message", "order_status", "total_amount", "items", "created_at", "updated_at"]
        read_only_fields = ["id", "order_number", "order_status", "total_amount", "created_at", "updated_at"]


class OrderTrackingSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payment_status = serializers.SerializerMethodField()
    class Meta:
        model = Order
        fields = ["order_number", "name", "phone", "address", "message", "order_status", "total_amount", "payment_status", "items", "created_at"]
    def get_payment_status(self, obj):
        latest = obj.payments.order_by("-created_at").first()
        return latest.payment_status if latest else "PENDING"


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemInputSerializer(many=True, write_only=True)
    class Meta:
        model = Order
        fields = ["name", "phone", "address", "message", "items"]
    def validate_items(self, items):
        if not items: raise serializers.ValidationError("سبد خرید نمی‌تواند خالی باشد.")
        return items
    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items")
        product_ids = [i["product_id"] for i in items_data]
        products = Product.objects.select_for_update().filter(id__in=product_ids, available=True)
        products_by_id = {p.id: p for p in products}
        missing = set(product_ids) - set(products_by_id.keys())
        if missing:
            raise serializers.ValidationError({"items": f"محصول {sorted(missing)} یافت نشد."})
        for item in items_data:
            prod = products_by_id[item["product_id"]]
            if prod.stock < item["quantity"]:
                raise serializers.ValidationError({"items": f"موجودی {prod.name} کافی نیست. موجود: {prod.stock}"})
        order = Order.objects.create(**validated_data)
        order_items = []
        total = 0
        for item in items_data:
            prod = products_by_id[item["product_id"]]
            qty = item["quantity"]
            total += prod.price * qty
            order_items.append(OrderItem(order=order, product=prod, product_name=prod.name, price=prod.price, quantity=qty))
        OrderItem.objects.bulk_create(order_items)
        order.total_amount = total
        order.save(update_fields=["total_amount"])
        return order
    def to_representation(self, instance):
        return OrderSerializer(instance, context=self.context).data


# --- Wholesale with images ---
class WholesaleRequestItemSerializer(serializers.ModelSerializer):
    product_image = serializers.SerializerMethodField()
    class Meta:
        model = WholesaleRequestItem
        fields = ["id", "product", "product_name", "quantity", "notes", "product_image"]
        read_only_fields = fields
    def get_product_image(self, obj):
        if obj.product and obj.product.image and hasattr(obj.product.image, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.product.image.url)
            return obj.product.image.url
        if obj.product and obj.product.id:
            pid = obj.product.id
            return f"/images/p{pid}.jpg" if pid <= 8 else "/images/placeholder.jpg"
        return "/images/placeholder.jpg"


class WholesaleRequestItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)
    notes = serializers.CharField(required=False, allow_blank=True, default="")

class WholesaleRequestSerializer(serializers.ModelSerializer):
    items = WholesaleRequestItemSerializer(many=True, read_only=True)
    total_amount = serializers.SerializerMethodField()

    class Meta:
        model = WholesaleRequest
        # user اضافه شد تا مدیرکل بتواند درخواست‌های عمده‌ی هر ویزیتور را تفکیک کند
        # total_amount اضافه شد تا مبلغ واقعی درخواست عمده در گزارش فروش لحاظ شود
        fields = ["id", "request_number", "company_name", "contact_person", "phone", "address", "description", "status", "total_amount", "items", "created_at", "user"]
        read_only_fields = ["id", "request_number", "status", "created_at", "user", "total_amount"]

    def get_total_amount(self, obj):
        stored_total = obj.__dict__.get("total_amount", None)
        if stored_total and stored_total > 0:
            return stored_total
        total = 0
        for item in obj.items.select_related("product"):
            product = item.product
            if not product:
                continue
            try:
                pricing = product.dashboard_pricing
                price = pricing.wholesale_price if pricing.is_active else product.price
            except Exception:
                price = product.price
            total += price * item.quantity
        return total

class WholesaleRequestTrackingSerializer(serializers.ModelSerializer):
    items = WholesaleRequestItemSerializer(many=True, read_only=True)
    class Meta:
        model = WholesaleRequest
        fields = ["request_number", "company_name", "contact_person", "phone", "address", "description", "status", "items", "created_at"]

class WholesaleRequestCreateSerializer(serializers.ModelSerializer):
    items = WholesaleRequestItemInputSerializer(many=True, write_only=True)
    class Meta:
        model = WholesaleRequest
        fields = ["company_name", "contact_person", "phone", "address", "description", "items"]
    def validate_items(self, items):
        if not items: raise serializers.ValidationError("لیست خالی است.")
        return items
    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items")
        product_ids = [i["product_id"] for i in items_data]
        products = Product.objects.filter(id__in=product_ids)
        products_by_id = {p.id: p for p in products}
        req = WholesaleRequest.objects.create(**validated_data)
        bulk = []
        total = 0
        for item in items_data:
            prod = products_by_id.get(item["product_id"])
            qty = item["quantity"]
            if prod:
                try:
                    pricing = prod.dashboard_pricing
                    unit_price = pricing.wholesale_price if pricing.is_active else prod.price
                except Exception:
                    unit_price = prod.price
                total += unit_price * qty
            bulk.append(WholesaleRequestItem(request=req, product=prod, product_name=prod.name if prod else f"Product {item['product_id']}", quantity=qty, notes=item.get("notes","")))
        WholesaleRequestItem.objects.bulk_create(bulk)
        try:
            req.total_amount = total
            req.save(update_fields=["total_amount"])
        except Exception:
            pass
        return req
    def to_representation(self, instance):
        return WholesaleRequestSerializer(instance, context=self.context).data

class WholesaleRequestStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = WholesaleRequest
        fields = ["status"]
