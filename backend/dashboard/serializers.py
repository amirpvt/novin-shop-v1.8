"""
سریالایزرها برای مدل‌های داشبورد
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import ProductPricing, VisitSchedule, CashCollection, Commission, CustomerDebt
from products.models import Product

User = get_user_model()


class UserBriefSerializer(serializers.ModelSerializer):
    """نمایش خلاصه کاربر برای لیست‌ها"""
    role = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name', 'role', 'phone', 'is_active', 'date_joined']
        read_only_fields = ['id', 'date_joined']

    def get_role(self, obj):
        try:
            return obj.customer_profile.role
        except:
            if obj.is_superuser:
                return 'manager'
            if obj.is_staff:
                return 'admin'
            return 'customer'

    def get_phone(self, obj):
        try:
            return obj.customer_profile.phone
        except:
            return ""

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


# --- ProductPricing ---

class ProductPricingSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.SerializerMethodField()
    discount_percent = serializers.ReadOnlyField()

    class Meta:
        model = ProductPricing
        fields = ['id', 'product', 'product_name', 'product_image', 'base_price', 'wholesale_price', 'discount_percent', 'is_active', 'updated_by', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'updated_by']

    def get_product_image(self, obj):
        if obj.product.image and hasattr(obj.product.image, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.product.image.url)
            return obj.product.image.url
        return f"/images/p{obj.product.id}.jpg" if obj.product.id <= 8 else "/images/placeholder.jpg"


class ProductPricingUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductPricing
        fields = ['base_price', 'wholesale_price', 'is_active']

    def validate(self, attrs):
        base = attrs.get('base_price') or getattr(self.instance, 'base_price', None)
        wholesale = attrs.get('wholesale_price') or getattr(self.instance, 'wholesale_price', None)
        if base and wholesale and wholesale >= base:
            raise serializers.ValidationError("قیمت عمده باید کمتر از قیمت پایه باشد")
        return attrs


# --- VisitSchedule ---

class VisitScheduleSerializer(serializers.ModelSerializer):
    visitor_name = serializers.CharField(source='visitor.username', read_only=True)
    customer_name = serializers.CharField(source='customer.username', read_only=True)
    customer_phone = serializers.SerializerMethodField()

    class Meta:
        model = VisitSchedule
        fields = ['id', 'visitor', 'visitor_name', 'customer', 'customer_name', 'customer_phone', 'date', 'status', 'priority', 'notes', 'admin_notes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_customer_phone(self, obj):
        try:
            return obj.customer.customer_profile.phone
        except:
            return ""


class VisitScheduleCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisitSchedule
        fields = ['visitor', 'customer', 'date', 'priority', 'notes']


# --- CashCollection ---

class CashCollectionSerializer(serializers.ModelSerializer):
    visitor_name = serializers.CharField(source='visitor.username', read_only=True, default="")
    customer_name = serializers.CharField(source='customer.username', read_only=True)

    class Meta:
        model = CashCollection
        fields = ['id', 'visitor', 'visitor_name', 'customer', 'customer_name', 'order', 'amount', 'payment_type', 'receipt_number', 'notes', 'collected_at', 'created_at']
        read_only_fields = ['id', 'created_at']


# --- Commission ---

class CommissionSerializer(serializers.ModelSerializer):
    visitor_name = serializers.CharField(source='visitor.username', read_only=True)
    order_number = serializers.SerializerMethodField()
    order_total = serializers.SerializerMethodField()
    sale_type = serializers.SerializerMethodField()
    items = serializers.SerializerMethodField()

    class Meta:
        model = Commission
        fields = ['id', 'visitor', 'visitor_name', 'order', 'wholesale_request', 'order_number', 'order_total', 'sale_type', 'items', 'percentage', 'amount', 'is_paid', 'paid_at', 'created_at']
        read_only_fields = ['id', 'created_at', 'amount']

    def get_order_number(self, obj):
        if obj.order_id and obj.order:
            return obj.order.order_number
        if obj.wholesale_request_id and obj.wholesale_request:
            return obj.wholesale_request.request_number
        return ""

    def get_order_total(self, obj):
        if obj.order_id and obj.order:
            return obj.order.total_amount
        if obj.wholesale_request_id and obj.wholesale_request:
            return obj.wholesale_request.total_amount
        return 0

    def get_sale_type(self, obj):
        return 'wholesale' if obj.wholesale_request_id else 'retail'

    def get_items(self, obj):
        request = self.context.get('request')
        if obj.order_id and obj.order:
            return [
                {
                    'id': item.id,
                    'product': item.product_id,
                    'product_name': item.product_name,
                    'price': item.price,
                    'quantity': item.quantity,
                    'subtotal': item.subtotal,
                    'product_image': request.build_absolute_uri(item.product.image.url) if request and item.product and item.product.image else (item.product.image.url if item.product and item.product.image else '/images/placeholder.jpg'),
                }
                for item in obj.order.items.select_related('product').all()
            ]
        if obj.wholesale_request_id and obj.wholesale_request:
            return [
                {
                    'id': item.id,
                    'product': item.product_id,
                    'product_name': item.product_name,
                    'quantity': item.quantity,
                    'notes': item.notes,
                    'product_image': request.build_absolute_uri(item.product.image.url) if request and item.product and item.product.image else (item.product.image.url if item.product and item.product.image else '/images/placeholder.jpg'),
                }
                for item in obj.wholesale_request.items.select_related('product').all()
            ]
        return []


# --- CustomerDebt ---

class CustomerDebtSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.username', read_only=True)
    customer_phone = serializers.SerializerMethodField()
    remaining_debt = serializers.ReadOnlyField()

    class Meta:
        model = CustomerDebt
        fields = ['id', 'customer', 'customer_name', 'customer_phone', 'total_debt', 'total_paid', 'remaining_debt', 'last_order_date', 'last_payment_date', 'is_overdue', 'notes', 'updated_at']
        read_only_fields = ['id', 'updated_at']

    def get_customer_phone(self, obj):
        try:
            return obj.customer.customer_profile.phone
        except:
            return ""


# --- User Management for Owner ---

class OwnerUserCreateSerializer(serializers.ModelSerializer):
    """ساخت کاربر جدید توسط مدیرکل"""
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=[('admin', 'ادمین'), ('visitor', 'ویزیتور'), ('customer', 'مشتری')], default='visitor')
    phone = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'password', 'role', 'phone']

    def create(self, validated_data):
        from accounts.models import Customer
        role = validated_data.pop('role', 'visitor')
        phone = validated_data.pop('phone', '')
        password = validated_data.pop('password')

        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            is_active=True
        )
        user.set_password(password)
        # اگر نقش ادمین یا مدیر باشد is_staff True
        if role in ['admin', 'manager']:
            user.is_staff = True
        user.save()

        # ساخت پروفایل با نقش
        Customer.objects.update_or_create(
            user=user,
            defaults={
                'phone': phone,
                'role': role,
                'is_active': True,
                'customer_type': 'both' if role in ['admin', 'manager'] else 'retail'
            }
        )
        return user

    def to_representation(self, instance):
        return UserBriefSerializer(instance, context=self.context).data
