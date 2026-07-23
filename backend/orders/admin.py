from django.contrib import admin

from .models import Order, OrderItem, Payment, WholesaleRequest, WholesaleRequestItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product", "product_name", "price", "quantity")
    can_delete = False


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    readonly_fields = (
        "payment_number",
        "amount",
        "payment_method",
        "payment_status",
        "transaction_id",
        "created_at",
    )
    can_delete = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("order_number", "name", "phone", "order_status", "get_payment_status", "total_amount", "created_at")
    list_filter = ("order_status", "created_at")
    list_editable = ("order_status",)
    search_fields = ("order_number", "name", "phone")
    readonly_fields = ("order_number", "total_amount", "created_at", "updated_at")
    inlines = [OrderItemInline, PaymentInline]

    def get_payment_status(self, obj):
        latest_payment = obj.payments.order_by("-created_at").first()
        return latest_payment.payment_status if latest_payment else "بدون پرداخت"

    get_payment_status.short_description = "وضعیت پرداخت"


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("payment_number", "order", "amount", "payment_status", "transaction_id", "created_at")
    list_filter = ("payment_status", "created_at", "payment_method")
    search_fields = ("payment_number", "transaction_id", "order__order_number")
    readonly_fields = ("created_at", "updated_at")


class WholesaleRequestItemInline(admin.TabularInline):
    model = WholesaleRequestItem
    extra = 0
    readonly_fields = ("product", "product_name", "quantity", "notes")
    can_delete = False


@admin.register(WholesaleRequest)
class WholesaleRequestAdmin(admin.ModelAdmin):
    list_display = ("request_number", "company_name", "contact_person", "phone", "status", "created_at")
    list_filter = ("status", "created_at")
    list_editable = ("status",)
    search_fields = ("request_number", "company_name", "contact_person", "phone")
    readonly_fields = ("request_number", "created_at")
    inlines = [WholesaleRequestItemInline]
