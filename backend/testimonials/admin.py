from django.contrib import admin
from .models import Testimonial


@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ("name", "role", "approved", "created_at")
    list_filter = ("approved",)
    list_editable = ("approved",)
    search_fields = ("name", "text")
