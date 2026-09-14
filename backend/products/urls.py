from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"categories", views.CategoryViewSet, basename="category")
router.register(r"", views.ProductViewSet, basename="product")

brand_list = views.BrandViewSet.as_view({
    "get": "list",
    "post": "create",
})
brand_detail = views.BrandViewSet.as_view({
    "get": "retrieve",
    "put": "update",
    "patch": "partial_update",
    "delete": "destroy",
})

urlpatterns = [
    path("brands/", brand_list, name="brand-list"),
    path("brands/<slug:slug>/", brand_detail, name="brand-detail"),
    path("", include(router.urls)),
]
