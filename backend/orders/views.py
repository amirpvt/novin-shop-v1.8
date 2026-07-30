from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings

from .models import Order, WholesaleRequest
from .serializers import (
    OrderCreateSerializer,
    OrderSerializer,
    OrderTrackingSerializer,
    WholesaleRequestCreateSerializer,
    WholesaleRequestSerializer,
    WholesaleRequestStatusUpdateSerializer,
    WholesaleRequestTrackingSerializer,
)
from .services import PaymentService


class OrderCreateView(generics.CreateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderCreateSerializer

    def perform_create(self, serializer):
        # اگر کاربر لاگین کرده، سفارش را به او لینک کن برای داشبورد "سفارشات من"
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)


class OrderTrackingView(generics.RetrieveAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderTrackingSerializer
    lookup_field = "order_number"


class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAdminUser]
    def get_queryset(self):
        qs = Order.objects.all()
        order_status = self.request.query_params.get("order_status")
        if order_status: qs = qs.filter(order_status=order_status)
        return qs


class MyOrdersView(generics.ListAPIView):
    """
    🆕 NEW: سفارشات من - برای داشبورد مشتری لاگین کرده
    GET /api/orders/my-orders/
    """
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # اگر ادمین است همه را ببیند، اگر مشتری است فقط سفارشات خودش
        if user.is_staff:
            return Order.objects.filter(user=user).order_by("-created_at")
        # مشتری: سفارشات بر اساس user یا شماره موبایل پروفایلش
        qs = Order.objects.filter(user=user)
        # اگر سفارشات قدیمی بدون user دارد، بر اساس شماره موبایل هم بیاور
        try:
            phone = user.customer_profile.phone if hasattr(user, 'customer_profile') else None
            if phone:
                qs = qs | Order.objects.filter(phone=phone)
        except: pass
        return qs.distinct().order_by("-created_at")


class MyWholesaleView(generics.ListAPIView):
    """
    🆕 NEW: درخواست‌های عمده من
    GET /api/orders/wholesale/my-requests/
    """
    serializer_class = WholesaleRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return WholesaleRequest.objects.filter(user=user).order_by("-created_at")
        qs = WholesaleRequest.objects.filter(user=user)
        try:
            phone = user.customer_profile.phone if hasattr(user, 'customer_profile') else None
            if phone:
                qs = qs | WholesaleRequest.objects.filter(phone=phone)
        except: pass
        return qs.distinct().order_by("-created_at")


class OrderStatsView(APIView):
    """
    🆕 NEW: آمار برای پنل ادمین حرفه‌ای
    GET /api/orders/stats/
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        from django.db.models import Sum, Count
        from products.models import Product
        from datetime import timedelta
        from django.utils import timezone

        total_orders = Order.objects.count()
        total_revenue = Order.objects.aggregate(s=Sum('total_amount'))['s'] or 0
        pending_orders = Order.objects.filter(order_status="PENDING").count()
        low_stock = Product.objects.filter(stock__lte=20, stock__gt=0).count()
        out_of_stock = Product.objects.filter(stock=0).count()

        # 7 روز اخیر
        last_week = timezone.now() - timedelta(days=7)
        recent_orders = Order.objects.filter(created_at__gte=last_week).count()
        recent_revenue = Order.objects.filter(created_at__gte=last_week).aggregate(s=Sum('total_amount'))['s'] or 0

        # پرفروش‌ترین محصولات (از روی OrderItem)
        from .models import OrderItem
        top_products = (
            OrderItem.objects.values('product_name')
            .annotate(total_qty=Sum('quantity'), total_sales=Sum('price'))
            .order_by('-total_qty')[:5]
        )

        return Response({
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "pending_orders": pending_orders,
            "low_stock": low_stock,
            "out_of_stock": out_of_stock,
            "recent_orders": recent_orders,
            "recent_revenue": recent_revenue,
            "top_products": list(top_products),
        })


class PaymentCreateView(APIView):
    def post(self, request):
        order_id = request.data.get("order_id")
        callback_url = request.data.get("callback_url")
        if not order_id:
            order_number = request.data.get("order_number")
            if order_number:
                try: order = Order.objects.get(order_number=order_number); order_id = order.id
                except Order.DoesNotExist: return Response({"error": "سفارش یافت نشد"}, status=status.HTTP_404_NOT_FOUND)
            else: return Response({"error": "order_id یا order_number الزامی است"}, status=status.HTTP_400_BAD_REQUEST)

        service = PaymentService()
        if not callback_url:
            frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
            try: order_obj = Order.objects.get(id=order_id); callback_url = f"{frontend_url}/payment/verify?order={order_obj.order_number}"
            except: callback_url = f"{frontend_url}/payment/verify"

        payment_url = service.initiate_payment(order_id, callback_url=callback_url)
        if payment_url: return Response({"payment_url": payment_url}, status=status.HTTP_201_CREATED)
        return Response({"error": "خطا در ایجاد درخواست پرداخت"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PaymentVerifyView(APIView):
    def post(self, request):
        payment_number = request.data.get("payment_number")
        authority = request.data.get("authority")
        status_param = request.data.get("status")

        if status_param == "NOK":
            return Response({"status": "CANCELLED", "message": "پرداخت لغو شد توسط کاربر"}, status=status.HTTP_400_BAD_REQUEST)

        if not payment_number or not authority:
            order_number = request.data.get("order_number")
            if order_number:
                try:
                    order = Order.objects.get(order_number=order_number)
                    payment = order.payments.filter(payment_status="PENDING").last() or order.payments.last()
                    if payment: payment_number = payment.payment_number
                except: pass
            if not payment_number or not authority:
                return Response({"error": "payment_number و authority الزامی است"}, status=status.HTTP_400_BAD_REQUEST)

        service = PaymentService()
        is_success = service.process_verification(payment_number, authority)
        if is_success: return Response({"status": "SUCCESS", "payment_number": payment_number}, status=status.HTTP_200_OK)
        return Response({"status": "FAILED", "payment_number": payment_number}, status=status.HTTP_400_BAD_REQUEST)


# Wholesale
class WholesaleRequestCreateView(generics.CreateAPIView):
    queryset = WholesaleRequest.objects.all()
    serializer_class = WholesaleRequestCreateSerializer
    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)

class WholesaleRequestTrackingView(generics.RetrieveAPIView):
    queryset = WholesaleRequest.objects.all()
    serializer_class = WholesaleRequestTrackingSerializer
    lookup_field = "request_number"

class WholesaleRequestListView(generics.ListAPIView):
    serializer_class = WholesaleRequestSerializer
    permission_classes = [permissions.IsAdminUser]
    def get_queryset(self):
        qs = WholesaleRequest.objects.all()
        req_status = self.request.query_params.get("status")
        if req_status: qs = qs.filter(status=req_status)
        return qs

class WholesaleRequestStatusUpdateView(generics.UpdateAPIView):
    queryset = WholesaleRequest.objects.all()
    serializer_class = WholesaleRequestStatusUpdateSerializer
    permission_classes = [permissions.IsAdminUser]
    lookup_field = "request_number"
    http_method_names = ["patch"]
    def get_serializer(self, *args, **kwargs):
        kwargs["partial"] = True
        return super().get_serializer(*args, **kwargs)
