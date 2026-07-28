"""
URL Configuration - Phase 1 (with JWT auth + accounts)
"""
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path
from rest_framework.views import APIView
from rest_framework.response import Response


class ApiRootView(APIView):
    """نقطه ورود اصلی API - لیست endpoint های موجود."""

    def get(self, request):
        return Response({
            "version": "1.1",
            "endpoints": {
                # ─── Authentication ─────────────────────────────────────
                "register": "/api/auth/register/",
                "login": "/api/auth/login/",
                "refresh_token": "/api/auth/token/refresh/",
                "profile": "/api/auth/profile/",
                "change_password": "/api/auth/change-password/",
                "logout": "/api/auth/logout/",
                # ─── Shop ────────────────────────────────────────────────
                "products": "/api/products/",
                "categories": "/api/products/categories/",
                "testimonials": "/api/testimonials/",
                # ─── Orders ──────────────────────────────────────────────
                "create_order": "/api/orders/",
                "track_order": "/api/orders/track/<order_number>/",
                "list_orders_admin": "/api/orders/list/",
                "wholesale_create": "/api/orders/wholesale/",
                "wholesale_track": "/api/orders/wholesale/track/<request_number>/",
                "wholesale_list_admin": "/api/orders/wholesale/list/",
                # ─── Payment ─────────────────────────────────────────────
                "payment_create": "/api/orders/payments/create/",
                "payment_verify": "/api/orders/payments/verify/",
                # ─── Admin Panel ─────────────────────────────────────────
                "admin": "/admin/",
            }
        })


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", ApiRootView.as_view()),

    # 🆕 Authentication & Profile
    path("api/auth/", include("accounts.urls")),

    # Shop
    path("api/products/", include("products.urls")),
    path("api/testimonials/", include("testimonials.urls")),

    # Orders
    path("api/orders/", include("orders.urls")),

    # DRF browsable API
    path("api-auth/", include("rest_framework.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
