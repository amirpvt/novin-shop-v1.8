"""
orders/views.py - FINAL COMPLETE VERSION
پنل ادمین حرفه‌ای + سفارشات من + آمار + زرین‌پال
"""
from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta
from urllib.parse import urlparse

from .models import Order, WholesaleRequest, OrderItem
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


# ─── Retail Orders ───────────────────────────────────────────────────

class OrderCreateView(generics.CreateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderCreateSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        # اگر کاربر لاگین کرده، سفارش را به او لینک کن برای داشبورد "سفارشات من"
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)


class OrderTrackingView(generics.RetrieveAPIView):
    """پیگیری عمومی با شماره سفارش - بدون نیاز به لاگین"""
    queryset = Order.objects.all()
    serializer_class = OrderTrackingSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "order_number"


class OrderListView(generics.ListAPIView):
    """لیست همه سفارشات برای ادمین"""
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        qs = Order.objects.all().order_by("-created_at")
        order_status = self.request.query_params.get("order_status")
        if order_status:
            qs = qs.filter(order_status=order_status)
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(order_number__icontains=search) | qs.filter(name__icontains=search) | qs.filter(phone__icontains=search)
        return qs


class MyOrdersView(generics.ListAPIView):
    """
    🆕 سفارشات من - برای داشبورد مشتری لاگین کرده
    GET /api/orders/my-orders/
    """
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # امنیت تحویل: هر مشتری فقط سفارش‌هایی را می‌بیند که مستقیماً به user خودش وصل شده‌اند.
        # فیلتر بر اساس شماره موبایل حذف شد چون می‌تواند باعث نمایش سفارش کاربر دیگر با شماره مشابه/اشتباه شود.
        return Order.objects.filter(user=user).order_by("-created_at")


class MyWholesaleView(generics.ListAPIView):
    """
    🆕 درخواست‌های عمده من
    GET /api/orders/wholesale/my-requests/
    """
    serializer_class = WholesaleRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # امنیت تحویل: هر مشتری فقط درخواست‌های عمده‌ای را می‌بیند که به user خودش وصل شده‌اند.
        return WholesaleRequest.objects.filter(user=user).defer("total_amount").prefetch_related("items__product").order_by("-created_at")


class OrderStatusSerializer(serializers.ModelSerializer):
    """برای آپدیت وضعیت سفارش تکی توسط ادمین"""
    class Meta:
        model = Order
        fields = ["order_status"]

    def validate_order_status(self, value):
        valid = [c[0] for c in Order.ORDER_STATUS_CHOICES]
        if value not in valid:
            raise serializers.ValidationError(f"وضعیت نامعتبر. مجاز: {', '.join(valid)}")
        return value


class OrderStatusUpdateView(generics.UpdateAPIView):
    """
    🆕 تغییر وضعیت سفارش تکی توسط ادمین
    PATCH /api/orders/<id>/status/  body: {"order_status": "SHIPPED"}
    """
    queryset = Order.objects.all()
    serializer_class = OrderStatusSerializer
    permission_classes = [permissions.IsAdminUser]
    lookup_field = "id"
    http_method_names = ["patch", "put"]

    def get_serializer(self, *args, **kwargs):
        kwargs["partial"] = True
        return super().get_serializer(*args, **kwargs)


class OrderStatsView(APIView):
    """
    🆕 آمار برای پنل ادمین حرفه‌ای
    GET /api/orders/stats/
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        from products.models import Product

        total_orders = Order.objects.count()
        total_revenue = Order.objects.aggregate(s=Sum('total_amount'))['s'] or 0
        pending_orders = Order.objects.filter(order_status="PENDING").count()
        low_stock = Product.objects.filter(stock__lte=20, stock__gt=0).count()
        out_of_stock = Product.objects.filter(stock=0).count()

        # 7 روز اخیر
        last_week = timezone.now() - timedelta(days=7)
        recent_orders = Order.objects.filter(created_at__gte=last_week).count()
        recent_revenue = Order.objects.filter(created_at__gte=last_week).aggregate(s=Sum('total_amount'))['s'] or 0

        # پرفروش‌ترین محصولات
        top_products = (
            OrderItem.objects.values('product_name')
            .annotate(total_qty=Sum('quantity'))
            .order_by('-total_qty')[:5]
        )

        # درآمد روزانه 7 روز اخیر برای نمودار
        daily_revenue = []
        for i in range(6, -1, -1):
            day = timezone.now().date() - timedelta(days=i)
            day_total = Order.objects.filter(created_at__date=day).aggregate(s=Sum('total_amount'))['s'] or 0
            daily_revenue.append({"date": day.isoformat(), "total": int(day_total)})

        return Response({
            "total_orders": total_orders,
            "total_revenue": total_revenue,
            "pending_orders": pending_orders,
            "low_stock": low_stock,
            "out_of_stock": out_of_stock,
            "recent_orders": recent_orders,
            "recent_revenue": recent_revenue,
            "top_products": list(top_products),
            "daily_revenue": daily_revenue,
        })


# ─── Payments ────────────────────────────────────────────────────────

class PaymentCreateView(APIView):
    """
    ایجاد لینک پرداخت زرین‌پال
    POST /api/orders/payments/create/  body: {order_id, callback_url?}
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        order_id = request.data.get("order_id")
        callback_url = request.data.get("callback_url")

        if not order_id:
            order_number = request.data.get("order_number")
            if order_number:
                try:
                    order = Order.objects.get(order_number=order_number)
                    order_id = order.id
                except Order.DoesNotExist:
                    return Response({"error": "سفارش یافت نشد"}, status=status.HTTP_404_NOT_FOUND)
            else:
                return Response({"error": "order_id یا order_number الزامی است"}, status=status.HTTP_400_BAD_REQUEST)

        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
        if callback_url:
            frontend_host = urlparse(frontend_url).netloc
            callback_host = urlparse(callback_url).netloc
            if callback_host != frontend_host:
                return Response({"error": "callback_url نامعتبر است"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            callback_url = f"{frontend_url}/payment/verify"

        service = PaymentService()
        payment_result = service.initiate_payment_detail(order_id, callback_url=callback_url)

        if payment_result.get("status") == "success":
            return Response({
                "payment_url": payment_result.get("payment_url"),
                "payment_number": payment_result.get("payment_number"),
                "order_number": payment_result.get("order_number"),
                "amount": payment_result.get("amount"),
            }, status=status.HTTP_201_CREATED)
        if payment_result.get("status") == "already_paid":
            return Response(payment_result, status=status.HTTP_409_CONFLICT)
        return Response({"error": payment_result.get("message") or "خطا در ایجاد درخواست پرداخت زرین‌پال"}, status=status.HTTP_502_BAD_GATEWAY)


class PaymentVerifyView(APIView):
    """
    تایید پرداخت بعد از بازگشت از زرین‌پال
    POST /api/orders/payments/verify/  body: {payment_number, authority, status?, order_number?}
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        payment_number = request.data.get("payment_number")
        authority = request.data.get("authority")
        status_param = request.data.get("status")

        if status_param == "NOK":
            if not payment_number:
                order_number = request.data.get("order_number")
                if order_number:
                    try:
                        order = Order.objects.get(order_number=order_number)
                        payment = order.payments.filter(payment_status="PENDING").last() or order.payments.last()
                        if payment:
                            payment_number = payment.payment_number
                    except Order.DoesNotExist:
                        pass
            if payment_number:
                service = PaymentService()
                service.mark_cancelled(payment_number)
            return Response({"status": "CANCELLED", "message": "پرداخت لغو شد توسط کاربر"}, status=status.HTTP_400_BAD_REQUEST)

        if not payment_number or not authority:
            order_number = request.data.get("order_number")
            if order_number:
                try:
                    order = Order.objects.get(order_number=order_number)
                    payment = order.payments.filter(payment_status="PENDING").last() or order.payments.last()
                    if payment:
                        payment_number = payment.payment_number
                except:
                    pass

            if not payment_number or not authority:
                return Response({"error": "payment_number و authority الزامی است"}, status=status.HTTP_400_BAD_REQUEST)

        service = PaymentService()
        result = service.process_verification(payment_number, authority)

        if result.get("status") == "success":
            return Response({
                "status": "SUCCESS",
                "payment_number": result.get("payment_number", payment_number),
                "transaction_id": result.get("transaction_id"),
                "order_number": result.get("order_number"),
            }, status=status.HTTP_200_OK)
        return Response({
            "status": "FAILED",
            "payment_number": payment_number,
            "message": result.get("message") or "تایید پرداخت ناموفق بود",
        }, status=status.HTTP_400_BAD_REQUEST)


# ─── Wholesale ───────────────────────────────────────────────────────

class WholesaleRequestCreateView(generics.CreateAPIView):
    queryset = WholesaleRequest.objects.all()
    serializer_class = WholesaleRequestCreateSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        req = serializer.save(user=user)

        # اگر درخواست عمده توسط ویزیتور ثبت شود، برای فروش عمده هم پورسانت بساز
        try:
            from dashboard.permissions import get_user_role
            from dashboard.models import Commission, CommissionRule
            from dashboard.views import calculate_wholesale_request_total
            if user and user.is_authenticated and get_user_role(user) == 'visitor':
                rule, _ = CommissionRule.objects.get_or_create(visitor=user, defaults={'percentage': 5})
                percentage = rule.percentage if rule.is_active else 0
                total = calculate_wholesale_request_total(req)
                Commission.objects.get_or_create(
                    visitor=user,
                    wholesale_request=req,
                    defaults={
                        'percentage': percentage,
                        'amount': total * percentage / 100,
                    }
                )
        except Exception:
            # ثبت سفارش عمده نباید به خاطر خطای فرعی پورسانت متوقف شود
            pass


class WholesaleRequestTrackingView(generics.RetrieveAPIView):
    queryset = WholesaleRequest.objects.all().defer("total_amount").prefetch_related("items__product")
    serializer_class = WholesaleRequestTrackingSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "request_number"


class WholesaleRequestListView(generics.ListAPIView):
    serializer_class = WholesaleRequestSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        qs = WholesaleRequest.objects.all().defer("total_amount").prefetch_related("items__product").order_by("-created_at")
        req_status = self.request.query_params.get("status")
        if req_status:
            qs = qs.filter(status=req_status)
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
