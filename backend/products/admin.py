from django.contrib import admin
from .models import Product, Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "order")
    list_editable = ("order",)
    search_fields = ("name", "slug")
    ordering = ("order",)


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
        "brand",
        "slug",
        "description",
    )

    ordering = (
        "order",
        "-created_at",
    )

    list_per_page = 25

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