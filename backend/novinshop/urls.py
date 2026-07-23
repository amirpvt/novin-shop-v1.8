from django.contrib import admin
from django.urls import include, path
from rest_framework.views import APIView
from rest_framework.response import Response

class ApiRootView(APIView):
    """Simple landing view for /api/."""
    def get(self, request):
        return Response({
            "version": "1.0",
            "endpoints": {
                "products": "/api/products/",
                "testimonials": "/api/testimonials/",
                "orders": "/api/orders/",
            },
        })


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", ApiRootView.as_view()),
    path("api/products/", include("products.urls")),
    path("api/testimonials/", include("testimonials.urls")),
    path("api/orders/", include("orders.urls")),
    path("api-auth/", include("rest_framework.urls")),
]

from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )