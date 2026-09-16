"""
Product views - Phase 3
Admin CRUD + ReadOnly for public
"""
from decimal import Decimal, InvalidOperation
from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Product, Category, Brand
from .serializers import ProductSerializer, CategorySerializer, BrandSerializer
from .permissions import IsAdminOrReadOnly

class CategoryViewSet(viewsets.ModelViewSet):
    """
    دسته‌بندی: خواندن برای همه، نوشتن برای ادمین
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = "slug"

class BrandViewSet(viewsets.ModelViewSet):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = "slug"

class ProductViewSet(viewsets.ModelViewSet):
    """
    محصول: 
    - GET /api/products/ : همه می‌بینند (فقط available)
    - POST /api/products/ : فقط ادمین
    - PUT/PATCH/DELETE : فقط ادمین
    - فهرست ادمین همه محصولات را می‌بیند (حتی ناموجود)
    """
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["category", "brand", "available", "is_featured"]
    search_fields = ["name", "description", "slug"]
    ordering_fields = ["price", "order", "created_at", "stock"]
    ordering = ["order", "name"]

    def get_queryset(self):
        # ادمین همه محصولات را ببیند، کاربران عادی فقط موجودها
        user = self.request.user
        if user and user.is_staff:
            return Product.objects.prefetch_related("wholesale_options").all()
        # برای لیست عمومی فقط published و available
        return Product.objects.prefetch_related("wholesale_options").filter(status="published", available=True)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    def _save_dashboard_pricing(self, product):
        wholesale_price = self.request.data.get("wholesale_price")
        if wholesale_price in (None, ""):
            return
        try:
            base_price = Decimal(str(self.request.data.get("price", product.price) or product.price))
            wholesale = Decimal(str(wholesale_price))
        except (InvalidOperation, TypeError, ValueError):
            return
        try:
            from dashboard.models import ProductPricing
            ProductPricing.objects.update_or_create(
                product=product,
                defaults={
                    "base_price": base_price,
                    "wholesale_price": wholesale,
                    "is_active": True,
                    "updated_by": self.request.user if self.request.user.is_authenticated else None,
                },
            )
        except Exception:
            pass

    def perform_create(self, serializer):
        product = serializer.save()
        self._save_dashboard_pricing(product)

    def perform_update(self, serializer):
        product = serializer.save()
        self._save_dashboard_pricing(product)
