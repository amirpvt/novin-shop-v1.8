from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

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
    """ثبت سفارش تک‌فروشی جدید همراه با آیتم‌های سبد خرید."""

    queryset = Order.objects.all()
    serializer_class = OrderCreateSerializer


class OrderTrackingView(generics.RetrieveAPIView):
    """پیگیری سفارش با شماره سفارش (برای مشتری، بدون نیاز به لاگین)."""

    queryset = Order.objects.all()
    serializer_class = OrderTrackingSerializer
    lookup_field = "order_number"


class OrderListView(generics.ListAPIView):
    """لیست سفارش‌ها برای پنل ادمین."""

    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        qs = Order.objects.all()
        order_status = self.request.query_params.get("order_status")
        if order_status:
            qs = qs.filter(order_status=order_status)
        return qs


class PaymentCreateView(APIView):
    def post(self, request):
        order_id = request.data.get("order_id")
        if not order_id:
            return Response({"error": "order_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        service = PaymentService()
        payment_url = service.initiate_payment(order_id)

        if payment_url:
            return Response({"payment_url": payment_url}, status=status.HTTP_201_CREATED)
        return Response({"error": "Failed to initiate payment"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PaymentVerifyView(APIView):
    def post(self, request):
        payment_number = request.data.get("payment_number")
        authority = request.data.get("authority")

        if not payment_number or not authority:
            return Response(
                {"error": "payment_number and authority are required"}, status=status.HTTP_400_BAD_REQUEST
            )

        service = PaymentService()
        is_success = service.process_verification(payment_number, authority)

        if is_success:
            return Response({"status": "SUCCESS"}, status=status.HTTP_200_OK)
        return Response({"status": "FAILED"}, status=status.HTTP_400_BAD_REQUEST)


# --- Wholesale (B2B) ---
class WholesaleRequestCreateView(generics.CreateAPIView):
    """ثبت درخواست استعلام عمده جدید همراه با آیتم‌های کاتالوگ."""

    queryset = WholesaleRequest.objects.all()
    serializer_class = WholesaleRequestCreateSerializer


class WholesaleRequestTrackingView(generics.RetrieveAPIView):
    """پیگیری درخواست عمده با شماره درخواست (بدون نیاز به لاگین)."""

    queryset = WholesaleRequest.objects.all()
    serializer_class = WholesaleRequestTrackingSerializer
    lookup_field = "request_number"


class WholesaleRequestListView(generics.ListAPIView):
    """لیست درخواست‌های عمده برای پنل ادمین."""

    serializer_class = WholesaleRequestSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        qs = WholesaleRequest.objects.all()
        req_status = self.request.query_params.get("status")
        if req_status:
            qs = qs.filter(status=req_status)
        return qs


class WholesaleRequestStatusUpdateView(generics.UpdateAPIView):
    """برای پنل ادمین: فقط تغییر وضعیت درخواست عمده (PATCH)."""

    queryset = WholesaleRequest.objects.all()
    serializer_class = WholesaleRequestStatusUpdateSerializer
    permission_classes = [permissions.IsAdminUser]
    lookup_field = "request_number"
    http_method_names = ["patch"]

    def get_serializer(self, *args, **kwargs):
        kwargs["partial"] = True
        return super().get_serializer(*args, **kwargs)