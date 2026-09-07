"""
FINAL FIX - همیشه سفارش برمی‌گرداند تا پنل خالی نماند
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from .models import Commission
from orders.models import Order, WholesaleRequest
from orders.serializers import OrderSerializer, WholesaleRequestSerializer

class CustomerSelfOrdersView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        user = request.user
        # فقط سفارش‌های متصل به user جاری؛ فیلتر موبایل حذف شد تا سفارش کاربر دیگر قابل مشاهده نباشد.
        my_orders = Order.objects.filter(user=user)
        commission_order_ids = Commission.objects.values_list('order_id', flat=True)
        self_orders = my_orders.exclude(id__in=commission_order_ids).order_by('-created_at')
        serializer = OrderSerializer(self_orders, many=True)
        return Response(serializer.data)

class CustomerSelfWholesaleView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        user = request.user
        # فقط درخواست‌های عمده متصل به user جاری؛ فیلتر موبایل برای جلوگیری از نشت اطلاعات حذف شد.
        qs = WholesaleRequest.objects.filter(user=user).order_by('-created_at')
        serializer = WholesaleRequestSerializer(qs, many=True)
        return Response(serializer.data)

class VisitorOrdersOnlyView(APIView):
    """
    فقط سفارش‌های واقعی ثبت‌شده توسط ویزیتورها؛ بدون fallback دمو.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from dashboard.permissions import get_user_role
        role = get_user_role(request.user)
        if role not in ['admin', 'manager'] and not request.user.is_superuser:
            return Response({"error": "فقط ادمین و مدیرکل"}, status=403)

        visitor_id = request.query_params.get('visitor_id')

        qs = Order.objects.none()
        try:
            if visitor_id:
                commission_order_ids = Commission.objects.filter(visitor_id=visitor_id, order__isnull=False).values_list('order_id', flat=True)
                qs = Order.objects.filter(id__in=commission_order_ids).order_by('-created_at')
            else:
                commission_order_ids = Commission.objects.filter(order__isnull=False).values_list('order_id', flat=True)
                qs = Order.objects.filter(id__in=commission_order_ids).order_by('-created_at')
        except Exception:
            qs = Order.objects.none()

        serializer = OrderSerializer(qs, many=True)
        data = serializer.data

        # نام ویزیتور را به هر سفارش اضافه کن تا در فرانت نمایش داده شود
        # اگر visitor_id داده شده، نام همان ویزیتور را بگذار
        if visitor_id:
            try:
                from django.contrib.auth.models import User
                visitor_user = User.objects.get(id=visitor_id)
                visitor_name = visitor_user.get_full_name() or visitor_user.username
                visitor_username = visitor_user.username
                for item in data:
                    item['visitor_name'] = visitor_name
                    item['visitor_username'] = visitor_username
                    item['visitor_id'] = visitor_id
            except:
                pass

        return Response(data)
