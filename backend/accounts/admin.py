from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User

from .models import Customer


class CustomerInline(admin.StackedInline):
    """نمایش پروفایل Customer به صورت inline در صفحه ویرایش User."""
    model = Customer
    can_delete = False
    verbose_name_plural = "پروفایل مشتری"
    fk_name = "user"


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "phone",
        "city",
        "customer_type",
        "is_wholesale_approved",
        "created_at",
    )
    list_filter = ("customer_type", "is_wholesale_approved", "city")
    search_fields = ("user__username", "user__email", "user__first_name", "phone")
    raw_id_fields = ("user",)
    list_editable = ("is_wholesale_approved",)
    readonly_fields = ("created_at", "updated_at")


# ثبت مجدد User با Customer inline
admin.site.unregister(User)


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    inlines = (CustomerInline,)
    list_display = UserAdmin.list_display + ("get_phone", "get_customer_type")

    def get_phone(self, obj):
        return obj.customer_profile.phone if hasattr(obj, "customer_profile") else "—"

    get_phone.short_description = "موبایل"

    def get_customer_type(self, obj):
        if hasattr(obj, "customer_profile"):
            return obj.customer_profile.get_customer_type_display()
        return "—"

    get_customer_type.short_description = "نوع مشتری"
