from rest_framework import serializers

from products.models import Product

from .models import Order, OrderItem, Payment, WholesaleRequest, WholesaleRequestItem


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = "__all__"


class OrderItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ["id", "product", "product_name", "price", "quantity", "subtotal"]
        read_only_fields = fields

    def get_subtotal(self, obj):
        return obj.subtotal


class OrderItemInputSerializer(serializers.Serializer):
    """ورودی هر ردیف سبد خرید هنگام ثبت سفارش (فقط شناسه محصول و تعداد)."""

    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "name",
            "phone",
            "address",
            "message",
            "order_status",
            "total_amount",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "order_number", "order_status", "total_amount", "created_at", "updated_at"]


class OrderTrackingSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payment_status = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "order_number",
            "name",
            "phone",
            "address",
            "message",
            "order_status",
            "total_amount",
            "payment_status",
            "items",
            "created_at",
        ]

    def get_payment_status(self, obj):
        latest_payment = obj.payments.order_by("-created_at").first()
        return latest_payment.payment_status if latest_payment else "PENDING"


class OrderCreateSerializer(serializers.ModelSerializer):
    """
    ثبت سفارش به همراه آیتم‌های سبد خرید.
    مبلغ کل هرگز از فرانت‌اند گرفته نمی‌شود؛ سرور آن را از قیمت واقعی محصولات
    در لحظه‌ی ثبت سفارش محاسبه می‌کند (جلوگیری از دستکاری قیمت در کلاینت).
    """

    items = OrderItemInputSerializer(many=True, write_only=True)

    class Meta:
        model = Order
        fields = ["name", "phone", "address", "message", "items"]

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("سبد خرید نمی‌تواند خالی باشد.")
        return items

    def create(self, validated_data):
        items_data = validated_data.pop("items")

        # همه‌ی محصولات درخواستی را یکجا و معتبر می‌خوانیم تا هم سریع باشد هم قابل اعتماد
        product_ids = [item["product_id"] for item in items_data]
        products = Product.objects.filter(id__in=product_ids, available=True)
        products_by_id = {p.id: p for p in products}

        missing = set(product_ids) - set(products_by_id.keys())
        if missing:
            raise serializers.ValidationError(
                {"items": f"محصول(های) با شناسه {sorted(missing)} یافت نشد یا موجود نیست."}
            )

        order = Order.objects.create(**validated_data)

        order_items = []
        total = 0
        for item in items_data:
            product = products_by_id[item["product_id"]]
            quantity = item["quantity"]
            total += product.price * quantity
            order_items.append(
                OrderItem(
                    order=order,
                    product=product,
                    product_name=product.name,
                    price=product.price,
                    quantity=quantity,
                )
            )
        OrderItem.objects.bulk_create(order_items)

        order.total_amount = total
        order.save(update_fields=["total_amount"])
        return order

    def to_representation(self, instance):
        # بعد از ساخت، پاسخ کامل (همراه شماره سفارش و آیتم‌ها) برگردانده می‌شود
        return OrderSerializer(instance, context=self.context).data


# --- Wholesale (B2B) ---
class WholesaleRequestItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = WholesaleRequestItem
        fields = ["id", "product", "product_name", "quantity", "notes"]
        read_only_fields = fields


class WholesaleRequestItemInputSerializer(serializers.Serializer):
    """ورودی هر ردیف کاتالوگ استعلام عمده هنگام ثبت درخواست."""

    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)
    notes = serializers.CharField(required=False, allow_blank=True, default="")


class WholesaleRequestSerializer(serializers.ModelSerializer):
    items = WholesaleRequestItemSerializer(many=True, read_only=True)

    class Meta:
        model = WholesaleRequest
        fields = [
            "id",
            "request_number",
            "company_name",
            "contact_person",
            "phone",
            "address",
            "description",
            "status",
            "items",
            "created_at",
        ]
        read_only_fields = ["id", "request_number", "status", "created_at"]


class WholesaleRequestTrackingSerializer(serializers.ModelSerializer):
    items = WholesaleRequestItemSerializer(many=True, read_only=True)

    class Meta:
        model = WholesaleRequest
        fields = [
            "request_number",
            "company_name",
            "contact_person",
            "phone",
            "address",
            "description",
            "status",
            "items",
            "created_at",
        ]


class WholesaleRequestCreateSerializer(serializers.ModelSerializer):
    """
    ثبت درخواست استعلام عمده به همراه لیست محصولات کاتالوگ.
    برخلاف سفارش تک‌فروشی، اینجا مبلغی محاسبه نمی‌شود — نتیجه‌ی نهایی
    پیش‌فاکتوری است که کارشناس فروش پس از تماس صادر می‌کند.
    """

    items = WholesaleRequestItemInputSerializer(many=True, write_only=True)

    class Meta:
        model = WholesaleRequest
        fields = ["company_name", "contact_person", "phone", "address", "description", "items"]

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("لیست محصولات استعلام نمی‌تواند خالی باشد.")
        return items

    def create(self, validated_data):
        items_data = validated_data.pop("items")

        product_ids = [item["product_id"] for item in items_data]
        products_by_id = {p.id: p for p in Product.objects.filter(id__in=product_ids)}

        missing = set(product_ids) - set(products_by_id.keys())
        if missing:
            raise serializers.ValidationError(
                {"items": f"محصول(های) با شناسه {sorted(missing)} یافت نشد."}
            )

        wholesale_request = WholesaleRequest.objects.create(**validated_data)

        items = [
            WholesaleRequestItem(
                request=wholesale_request,
                product=products_by_id[item["product_id"]],
                product_name=products_by_id[item["product_id"]].name,
                quantity=item["quantity"],
                notes=item.get("notes", ""),
            )
            for item in items_data
        ]
        WholesaleRequestItem.objects.bulk_create(items)
        return wholesale_request

    def to_representation(self, instance):
        return WholesaleRequestSerializer(instance, context=self.context).data


class WholesaleRequestStatusUpdateSerializer(serializers.ModelSerializer):
    """برای پنل ادمین: فقط تغییر وضعیت درخواست (NEW/QUOTED/CONVERTED/REJECTED)."""

    class Meta:
        model = WholesaleRequest
        fields = ["status"]