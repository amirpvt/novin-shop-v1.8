"""
orders/serializers.py - MyOrders with product images
عکس محصول در کنار سفارش
"""
from django.db import transaction
from rest_framework import serializers
from products.models import Product, ProductWholesaleOption
from .models import Order, OrderItem, WholesaleRequest, WholesaleRequestItem


def get_effective_retail_price(product):
    """قیمت نهایی خرید خرده: اگر محصول تخفیف معتبر داشته باشد، قیمت تخفیفی حساب می‌شود."""
    discount = getattr(product, "discount_price", None)
    if discount and discount > 0 and discount < product.price:
        return discount
    return product.price


def get_effective_wholesale_price(product, wholesale_option_id=None):
    """قیمت نهایی عمده: اول گزینه انتخابی عمده، بعد قیمت عمده، بعد قیمت تخفیفی، بعد قیمت اصلی."""
    if not product:
        return 0
    if wholesale_option_id:
        try:
            option = ProductWholesaleOption.objects.get(id=wholesale_option_id, product=product, is_active=True)
            if option.unit_price is not None and option.unit_price > 0:
                return option.unit_price
        except ProductWholesaleOption.DoesNotExist:
            pass
    try:
        pricing = product.dashboard_pricing
        if pricing.is_active and pricing.wholesale_price is not None and pricing.wholesale_price > 0:
            return pricing.wholesale_price
    except Exception:
        pass
    discount = getattr(product, "discount_price", None)
    if discount and discount > 0 and discount < product.price:
        return discount
    return product.price


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
    commission = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ["id", "user", "order_number", "name", "phone", "address", "message", "order_status", "total_amount", "items", "commission", "created_at", "updated_at"]
        read_only_fields = ["id", "user", "order_number", "order_status", "total_amount", "commission", "created_at", "updated_at"]

    def get_commission(self, obj):
        try:
            c = obj.commission
            return {
                "id": c.id,
                "visitor": c.visitor_id,
                "visitor_name": c.visitor.get_full_name() or c.visitor.username,
                "percentage": c.percentage,
                "amount": c.amount,
                "is_paid": c.is_paid,
                "paid_at": c.paid_at,
            }
        except Exception:
            return None


class OrderTrackingSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payment_status = serializers.SerializerMethodField()
    class Meta:
        model = Order
        fields = ["order_number", "order_status", "total_amount", "payment_status", "items", "created_at"]
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
            unit_price = get_effective_retail_price(prod)
            total += unit_price * qty
            order_items.append(OrderItem(order=order, product=prod, product_name=prod.name, price=unit_price, quantity=qty))
        OrderItem.objects.bulk_create(order_items)
        order.total_amount = total
        order.save(update_fields=["total_amount"])
        return order
    def to_representation(self, instance):
        return OrderSerializer(instance, context=self.context).data


# --- Wholesale with images ---
class WholesaleRequestItemSerializer(serializers.ModelSerializer):
    product_image = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = WholesaleRequestItem
        fields = ["id", "product", "product_name", "quantity", "notes", "wholesale_option", "wholesale_option_label", "wholesale_unit_price", "price", "subtotal", "product_image"]
        read_only_fields = fields

    def get_price(self, obj):
        return obj.wholesale_unit_price if obj.wholesale_unit_price and obj.wholesale_unit_price > 0 else get_effective_wholesale_price(obj.product)

    def get_subtotal(self, obj):
        return self.get_price(obj) * obj.quantity

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
    wholesale_option_id = serializers.IntegerField(required=False, allow_null=True)
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
            price = item.wholesale_unit_price if item.wholesale_unit_price and item.wholesale_unit_price > 0 else get_effective_wholesale_price(product)
            total += price * item.quantity
        return total

class WholesaleRequestTrackingSerializer(serializers.ModelSerializer):
    items = WholesaleRequestItemSerializer(many=True, read_only=True)
    class Meta:
        model = WholesaleRequest
        fields = ["request_number", "status", "items", "created_at"]

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
            option = None
            unit_price = 0
            if prod:
                option_id = item.get("wholesale_option_id")
                if option_id:
                    option = ProductWholesaleOption.objects.filter(id=option_id, product=prod, is_active=True).first()
                unit_price = get_effective_wholesale_price(prod, option.id if option else None)
                total += unit_price * qty
            bulk.append(WholesaleRequestItem(
                request=req,
                product=prod,
                wholesale_option=option,
                product_name=prod.name if prod else f"Product {item['product_id']}",
                wholesale_option_label=option.label if option else "",
                wholesale_unit_price=unit_price,
                quantity=qty,
                notes=item.get("notes", ""),
            ))
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
