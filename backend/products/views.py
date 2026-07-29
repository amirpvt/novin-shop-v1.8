"""
Product views - Phase 3
Admin CRUD + ReadOnly for public
"""
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
            return Product.objects.all()
        # برای لیست عمومی فقط published و available
        return Product.objects.filter(status="published", available=True)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx
