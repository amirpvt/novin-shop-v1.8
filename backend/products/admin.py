from django.contrib import admin
from .models import Product, Category, Brand, ProductWholesaleOption


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "order")
    list_editable = ("order",)
    search_fields = ("name", "slug")
    ordering = ("order",)


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "slug",
        "is_active",
        "is_featured",
        "order",
    )
    list_filter = (
        "is_active",
        "is_featured",
    )
    list_editable = (
        "is_active",
        "is_featured",
        "order",
    )
    search_fields = (
        "name",
        "slug",
        "description",
    )
    ordering = (
        "order",
        "name",
    )
    fields = (
        "name",
        "slug",
        "logo",
        "description",
        "website",
        "is_active",
        "is_featured",
        "order",
    )


class ProductWholesaleOptionInline(admin.TabularInline):
    model = ProductWholesaleOption
    extra = 0
    fields = ("label", "code", "unit_price", "is_active", "order")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "category",
        "brand",
        "price",
        "available",
        "order",
    )

    list_filter = (
        "category",
        "brand",
        "available",
    )

    list_editable = (
        "available",
        "order",
    )

    search_fields = (
        "name",
        "brand__name",
        "slug",
        "description",
    )

    ordering = (
        "order",
        "-created_at",
    )

    list_per_page = 25
    inlines = (ProductWholesaleOptionInline,)

    fieldsets = (
        ("اطلاعات اصلی", {
            "fields": (
                "name",
                "slug",
                "category",
                "brand",
            )
        }),

        ("مشخصات محصول", {
            "fields": (
                "description",
                "price",
                "unit",
            )
        }),

        ("نمایش در سایت", {
            "fields": (
                "tag",
                "badge",
                "image",
                "available",
                "order",
            )
        }),
    )