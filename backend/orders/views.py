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
        if order_status:
            qs = qs.filter(order_status=order_status)
        return qs


class PaymentCreateView(APIView):
    """
    Phase 4: زرین‌پال واقعی
    body: { order_id: 1, callback_url: "http://localhost:5173/payment/verify?order=ORD-..." (optional) }
    """
    def post(self, request):
        order_id = request.data.get("order_id")
        callback_url = request.data.get("callback_url")
        
        if not order_id:
            # پشتیبانی از order_number هم
            order_number = request.data.get("order_number")
            if order_number:
                try:
                    order = Order.objects.get(order_number=order_number)
                    order_id = order.id
                except Order.DoesNotExist:
                    return Response({"error": "سفارش یافت نشد"}, status=status.HTTP_404_NOT_FOUND)
            else:
                return Response({"error": "order_id یا order_number الزامی است"}, status=status.HTTP_400_BAD_REQUEST)

        service = PaymentService()
        # اگر callback_url نفرستاد، از تنظیمات یا پیش‌فرض استفاده کن
        if not callback_url:
            frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
            # order_number را برای verify نیاز داریم
            try:
                order_obj = Order.objects.get(id=order_id)
                callback_url = f"{frontend_url}/payment/verify?order={order_obj.order_number}"
            except:
                callback_url = f"{frontend_url}/payment/verify"

        payment_url = service.initiate_payment(order_id, callback_url=callback_url)

        if payment_url:
            return Response({"payment_url": payment_url}, status=status.HTTP_201_CREATED)
        return Response({"error": "خطا در ایجاد درخواست پرداخت - موجودی یا تنظیمات زرین‌پال را چک کنید"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PaymentVerifyView(APIView):
    """
    تایید پرداخت:
    body: { payment_number: "PAY-ORD-...", authority: "0000...", status: "OK"/"NOK" }
    اگر از زرین‌پال برگشته، status=OK یعنی کاربر پرداخت کرده
    """
    def post(self, request):
        payment_number = request.data.get("payment_number")
        authority = request.data.get("authority")
        status_param = request.data.get("status")

        # زرین‌پال در بازگشت status می‌فرستد، اگر NOK باشد یعنی کاربر انصراف داده
        if status_param == "NOK":
            return Response({"status": "CANCELLED", "message": "پرداخت لغو شد توسط کاربر"}, status=status.HTTP_400_BAD_REQUEST)

        if not payment_number or not authority:
            # تلاش برای پیدا کردن با order_number
            order_number = request.data.get("order_number")
            if order_number:
                try:
                    order = Order.objects.get(order_number=order_number)
                    # آخرین پرداخت pending را بگیر
                    payment = order.payments.filter(payment_status="PENDING").last() or order.payments.last()
                    if payment:
                        payment_number = payment.payment_number
                except:
                    pass

            if not payment_number or not authority:
                return Response(
                    {"error": "payment_number و authority الزامی است"}, status=status.HTTP_400_BAD_REQUEST
                )

        service = PaymentService()
        is_success = service.process_verification(payment_number, authority)

        if is_success:
            return Response({"status": "SUCCESS", "payment_number": payment_number}, status=status.HTTP_200_OK)
        return Response({"status": "FAILED", "payment_number": payment_number}, status=status.HTTP_400_BAD_REQUEST)


# --- Wholesale ---
class WholesaleRequestCreateView(generics.CreateAPIView):
    queryset = WholesaleRequest.objects.all()
    serializer_class = WholesaleRequestCreateSerializer


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
