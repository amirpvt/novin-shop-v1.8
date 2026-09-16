"""
orders/views.py - FINAL COMPLETE VERSION
پنل ادمین حرفه‌ای + سفارشات من + آمار + زرین‌پال
"""
from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta
from types import SimpleNamespace
from urllib.parse import urlencode, urlparse, urlunparse, parse_qsl

from .models import Order, WholesaleRequest, OrderItem, Payment, PendingRetailPayment, PendingWholesalePayment
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
from .serializers import get_effective_retail_price, get_effective_wholesale_price
from products.models import Product, ProductWholesaleOption


# ─── Retail Orders ───────────────────────────────────────────────────

class OrderCreateView(generics.CreateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        return Response({"error": "برای ثبت سفارش جزئی ابتدا باید پرداخت انجام شود"}, status=status.HTTP_400_BAD_REQUEST)

    def perform_create(self, serializer):
        # این مسیر دیگر برای ثبت مستقیم سفارش استفاده نمی‌شود؛ سفارش جزئی بعد از تایید پرداخت ساخته می‌شود.
        serializer.save(user=self.request.user)


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
        pending_orders = Order.objects.filter(order_status__in=["PENDING", "PAID_PENDING_REVIEW"]).count()
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

class RetailPaymentCreateView(APIView):
    """ایجاد لینک پرداخت برای سفارش جزئی؛ خود سفارش فقط بعد از پرداخت موفق ثبت می‌شود."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        payload = request.data or {}
        items = payload.get("items") or []
        if not items:
            return Response({"error": "سبد خرید خالی است"}, status=status.HTTP_400_BAD_REQUEST)

        product_ids = [item.get("product_id") for item in items if item.get("product_id")]
        products = Product.objects.filter(id__in=product_ids, available=True)
        products_by_id = {product.id: product for product in products}

        amount = 0
        normalized_items = []
        for item in items:
            product_id = item.get("product_id")
            product = products_by_id.get(product_id)
            if not product:
                return Response({"error": f"محصول {product_id} یافت نشد یا ناموجود است"}, status=status.HTTP_400_BAD_REQUEST)
            try:
                quantity = int(item.get("quantity") or 1)
            except (TypeError, ValueError):
                quantity = 1
            if quantity < 1:
                return Response({"error": f"تعداد محصول {product.name} معتبر نیست"}, status=status.HTTP_400_BAD_REQUEST)
            if product.stock < quantity:
                return Response({"error": f"موجودی {product.name} کافی نیست. موجود: {product.stock}"}, status=status.HTTP_400_BAD_REQUEST)
            amount += get_effective_retail_price(product) * quantity
            normalized_items.append({"product_id": product.id, "quantity": quantity})

        if amount <= 0:
            return Response({"error": "مبلغ پرداخت معتبر نیست"}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        profile = getattr(user, "customer_profile", None)
        retail_payload = {
            "name": payload.get("name") or user.get_full_name() or user.username,
            "phone": payload.get("phone") or getattr(profile, "phone", ""),
            "address": payload.get("address") or getattr(profile, "address", ""),
            "message": payload.get("message") or "",
            "items": normalized_items,
        }
        if not retail_payload["name"] or not retail_payload["phone"]:
            return Response({"error": "نام و شماره تماس برای پرداخت الزامی است"}, status=status.HTTP_400_BAD_REQUEST)

        pending = PendingRetailPayment.objects.create(
            user=user,
            payment_number=f"RTP-{timezone.now().strftime('%Y%m%d%H%M%S%f')}",
            amount=amount,
            payload=retail_payload,
            payment_status="PENDING",
        )

        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
        callback_url = payload.get("callback_url") or f"{frontend_url}/payment/verify"
        frontend_host = urlparse(frontend_url).netloc
        callback_host = urlparse(callback_url).netloc
        if callback_host and callback_host != frontend_host:
            pending.payment_status = "FAILED"
            pending.save(update_fields=["payment_status"])
            return Response({"error": "callback_url نامعتبر است"}, status=status.HTTP_400_BAD_REQUEST)

        parsed = urlparse(callback_url)
        query = dict(parse_qsl(parsed.query, keep_blank_values=True))
        query.setdefault("type", "retail")
        query.setdefault("payment_number", pending.payment_number)
        callback_url = urlunparse(parsed._replace(query=urlencode(query)))

        fake_order = SimpleNamespace(order_number=pending.payment_number, phone=retail_payload["phone"])
        fake_payment = SimpleNamespace(amount=pending.amount, payment_number=pending.payment_number, order=fake_order)
        gateway_res = PaymentService().gateway.create_payment(fake_payment, callback_url=callback_url, description=f"نوین شاپ - پرداخت سفارش جزئی {pending.payment_number}")

        if gateway_res.get("status") != "success":
            pending.payment_status = "FAILED"
            pending.save(update_fields=["payment_status"])
            return Response({"error": gateway_res.get("message") or "خطا در ایجاد پرداخت سفارش جزئی"}, status=status.HTTP_502_BAD_GATEWAY)

        pending.authority = gateway_res["authority"]
        pending.save(update_fields=["authority"])
        return Response({"payment_url": gateway_res["url"], "payment_number": pending.payment_number, "amount": pending.amount}, status=status.HTTP_201_CREATED)


class RetailPaymentVerifyView(APIView):
    """تایید پرداخت جزئی؛ بعد از موفقیت، سفارش جزئی ساخته می‌شود."""
    permission_classes = [permissions.AllowAny]

    @transaction.atomic
    def post(self, request):
        payment_number = request.data.get("payment_number")
        authority = request.data.get("authority")
        status_param = request.data.get("status")
        if not payment_number:
            return Response({"error": "payment_number الزامی است"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            pending = PendingRetailPayment.objects.select_for_update().get(payment_number=payment_number)
        except PendingRetailPayment.DoesNotExist:
            return Response({"error": "پرداخت سفارش جزئی یافت نشد"}, status=status.HTTP_404_NOT_FOUND)

        if status_param == "NOK":
            pending.payment_status = "FAILED"
            pending.save(update_fields=["payment_status"])
            return Response({"status": "CANCELLED", "message": "پرداخت لغو شد توسط کاربر"}, status=status.HTTP_400_BAD_REQUEST)

        if not authority:
            return Response({"error": "Authority الزامی است"}, status=status.HTTP_400_BAD_REQUEST)
        if pending.authority and pending.authority != authority:
            return Response({"error": "Authority پرداخت با سفارش جزئی همخوانی ندارد"}, status=status.HTTP_400_BAD_REQUEST)

        if pending.payment_status == "SUCCESS" and pending.order_id:
            return Response({"status": "SUCCESS", "payment_number": pending.payment_number, "transaction_id": pending.transaction_id, "order_number": pending.order.order_number})

        fake_order = SimpleNamespace(order_number=pending.payment_number, phone=pending.payload.get("phone", ""))
        fake_payment = SimpleNamespace(amount=pending.amount, payment_number=pending.payment_number, order=fake_order)
        verify_res = PaymentService().gateway.verify_payment(fake_payment, authority)
        if verify_res.get("status") != "success":
            pending.payment_status = "FAILED"
            pending.save(update_fields=["payment_status"])
            return Response({"status": "FAILED", "message": verify_res.get("message") or "تایید پرداخت ناموفق بود"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = OrderCreateSerializer(data=pending.payload, context={"request": request})
        serializer.is_valid(raise_exception=True)
        order = serializer.save(user=pending.user, order_status="PAID_PENDING_REVIEW")
        transaction_id = verify_res.get("ref_id") or authority
        Payment.objects.create(order=order, payment_number=pending.payment_number, amount=pending.amount, payment_status="SUCCESS", transaction_id=transaction_id)
        pending.payment_status = "SUCCESS"
        pending.transaction_id = transaction_id
        pending.order = order
        pending.save(update_fields=["payment_status", "transaction_id", "order"])

        return Response({"status": "SUCCESS", "payment_number": pending.payment_number, "transaction_id": transaction_id, "order_number": order.order_number})


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

class WholesalePaymentCreateView(APIView):
    """ایجاد لینک پرداخت برای درخواست عمده؛ خود درخواست عمده فقط بعد از پرداخت موفق ثبت می‌شود."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        payload = request.data or {}
        items = payload.get("items") or []
        if not items:
            return Response({"error": "لیست محصولات عمده خالی است"}, status=status.HTTP_400_BAD_REQUEST)

        product_ids = [item.get("product_id") for item in items if item.get("product_id")]
        products = Product.objects.filter(id__in=product_ids, available=True)
        products_by_id = {product.id: product for product in products}

        amount = 0
        normalized_items = []
        for item in items:
            product_id = item.get("product_id")
            product = products_by_id.get(product_id)
            if not product:
                return Response({"error": f"محصول {product_id} یافت نشد یا ناموجود است"}, status=status.HTTP_400_BAD_REQUEST)
            try:
                quantity = int(item.get("quantity") or 1)
            except (TypeError, ValueError):
                quantity = 1
            if quantity < 1:
                return Response({"error": f"تعداد محصول {product.name} معتبر نیست"}, status=status.HTTP_400_BAD_REQUEST)
            option_id = item.get("wholesale_option_id")
            option = None
            if option_id:
                option = ProductWholesaleOption.objects.filter(id=option_id, product=product, is_active=True).first()
                if not option:
                    return Response({"error": f"نوع عمده انتخاب‌شده برای {product.name} معتبر نیست"}, status=status.HTTP_400_BAD_REQUEST)
            amount += get_effective_wholesale_price(product, option.id if option else None) * quantity
            normalized_items.append({"product_id": product.id, "quantity": quantity, "wholesale_option_id": option.id if option else None, "notes": item.get("notes", "")})

        if amount <= 0:
            return Response({"error": "مبلغ پرداخت معتبر نیست"}, status=status.HTTP_400_BAD_REQUEST)

        wholesale_payload = {
            "company_name": payload.get("company_name") or payload.get("companyName") or "",
            "contact_person": payload.get("contact_person") or payload.get("contactPerson") or "",
            "phone": payload.get("phone") or "",
            "address": payload.get("address") or "",
            "description": payload.get("description") or "",
            "items": normalized_items,
        }
        if not wholesale_payload["company_name"] or not wholesale_payload["contact_person"] or not wholesale_payload["phone"]:
            return Response({"error": "نام شرکت، نام رابط و شماره تماس الزامی است"}, status=status.HTTP_400_BAD_REQUEST)

        pending = PendingWholesalePayment.objects.create(
            user=request.user,
            payment_number=f"WHP-{timezone.now().strftime('%Y%m%d%H%M%S%f')}",
            amount=amount,
            payload=wholesale_payload,
            payment_status="PENDING",
        )

        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
        callback_url = payload.get("callback_url") or f"{frontend_url}/payment/verify"
        frontend_host = urlparse(frontend_url).netloc
        callback_host = urlparse(callback_url).netloc
        if callback_host and callback_host != frontend_host:
            pending.payment_status = "FAILED"
            pending.save(update_fields=["payment_status"])
            return Response({"error": "callback_url نامعتبر است"}, status=status.HTTP_400_BAD_REQUEST)

        parsed = urlparse(callback_url)
        query = dict(parse_qsl(parsed.query, keep_blank_values=True))
        query.setdefault("type", "wholesale")
        query.setdefault("payment_number", pending.payment_number)
        callback_url = urlunparse(parsed._replace(query=urlencode(query)))

        fake_order = SimpleNamespace(order_number=pending.payment_number, phone=wholesale_payload["phone"])
        fake_payment = SimpleNamespace(amount=pending.amount, payment_number=pending.payment_number, order=fake_order)
        gateway_res = PaymentService().gateway.create_payment(fake_payment, callback_url=callback_url, description=f"نوین شاپ - پرداخت درخواست عمده {pending.payment_number}")

        if gateway_res.get("status") != "success":
            pending.payment_status = "FAILED"
            pending.save(update_fields=["payment_status"])
            return Response({"error": gateway_res.get("message") or "خطا در ایجاد پرداخت عمده"}, status=status.HTTP_502_BAD_GATEWAY)

        pending.authority = gateway_res["authority"]
        pending.save(update_fields=["authority"])
        return Response({
            "payment_url": gateway_res["url"],
            "payment_number": pending.payment_number,
            "amount": pending.amount,
        }, status=status.HTTP_201_CREATED)


class WholesalePaymentVerifyView(APIView):
    """تایید پرداخت عمده؛ بعد از موفقیت، درخواست عمده ساخته می‌شود."""
    permission_classes = [permissions.AllowAny]

    @transaction.atomic
    def post(self, request):
        payment_number = request.data.get("payment_number")
        authority = request.data.get("authority")
        status_param = request.data.get("status")
        if not payment_number:
            return Response({"error": "payment_number الزامی است"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            pending = PendingWholesalePayment.objects.select_for_update().get(payment_number=payment_number)
        except PendingWholesalePayment.DoesNotExist:
            return Response({"error": "پرداخت عمده یافت نشد"}, status=status.HTTP_404_NOT_FOUND)

        if status_param == "NOK":
            pending.payment_status = "FAILED"
            pending.save(update_fields=["payment_status"])
            return Response({"status": "CANCELLED", "message": "پرداخت لغو شد توسط کاربر"}, status=status.HTTP_400_BAD_REQUEST)

        if not authority:
            return Response({"error": "Authority الزامی است"}, status=status.HTTP_400_BAD_REQUEST)
        if pending.authority and pending.authority != authority:
            return Response({"error": "Authority پرداخت با درخواست عمده همخوانی ندارد"}, status=status.HTTP_400_BAD_REQUEST)

        if pending.payment_status == "SUCCESS" and pending.wholesale_request_id:
            return Response({
                "status": "SUCCESS",
                "payment_number": pending.payment_number,
                "transaction_id": pending.transaction_id,
                "wholesale_request_number": pending.wholesale_request.request_number,
            })

        fake_order = SimpleNamespace(order_number=pending.payment_number, phone=pending.payload.get("phone", ""))
        fake_payment = SimpleNamespace(amount=pending.amount, payment_number=pending.payment_number, order=fake_order)
        verify_res = PaymentService().gateway.verify_payment(fake_payment, authority)
        if verify_res.get("status") != "success":
            pending.payment_status = "FAILED"
            pending.save(update_fields=["payment_status"])
            return Response({"status": "FAILED", "message": verify_res.get("message") or "تایید پرداخت ناموفق بود"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = WholesaleRequestCreateSerializer(data=pending.payload, context={"request": request})
        serializer.is_valid(raise_exception=True)
        wholesale_request = serializer.save(user=pending.user)
        pending.payment_status = "SUCCESS"
        pending.transaction_id = verify_res.get("ref_id") or authority
        pending.wholesale_request = wholesale_request
        pending.save(update_fields=["payment_status", "transaction_id", "wholesale_request"])

        return Response({
            "status": "SUCCESS",
            "payment_number": pending.payment_number,
            "transaction_id": pending.transaction_id,
            "wholesale_request_number": wholesale_request.request_number,
        })


class WholesaleRequestCreateView(generics.CreateAPIView):
    queryset = WholesaleRequest.objects.all()
    serializer_class = WholesaleRequestCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        return Response({"error": "برای ثبت درخواست عمده ابتدا باید پرداخت انجام شود"}, status=status.HTTP_400_BAD_REQUEST)

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
