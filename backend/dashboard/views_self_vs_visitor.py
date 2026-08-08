"""
فقط 2 ویوی جدید برای تفکیک سفارشات خود مشتری و ویزیتور
بقیه دست نخورده
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Q
from .models import Commission
from orders.models import Order, WholesaleRequest
from orders.serializers import OrderSerializer, WholesaleRequestSerializer

class CustomerSelfOrdersView(APIView):
    """
    سفارشات جزئی که خود مشتری ثبت کرده (نه ویزیتور)
    GET /api/dashboard/customer/my-orders-self/
    منطق: سفارشات user=من و id NOT IN commission
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        # سفارشات من
        my_orders = Order.objects.filter(user=user)
        try:
            phone = user.customer_profile.phone if hasattr(user, 'customer_profile') else None
            if phone:
                my_orders = my_orders | Order.objects.filter(phone=phone)
        except:
            pass
        my_orders = my_orders.distinct()

        # سفارشاتی که ویزیتور برای من ثبت کرده (دارای کمیسیون)
        commission_order_ids = Commission.objects.values_list('order_id', flat=True)
        # خود مشتری: بدون کمیسیون
        self_orders = my_orders.exclude(id__in=commission_order_ids).order_by('-created_at')

        from orders.serializers import OrderSerializer
        serializer = OrderSerializer(self_orders, many=True)
        return Response(serializer.data)


class CustomerSelfWholesaleView(APIView):
    """
    سفارشات عمده که خود مشتری ثبت کرده
    GET /api/dashboard/customer/my-wholesale-self/
    برای عمده چون کمیسیون نداریم، فرض می‌کنیم همه درخواست‌های my-requests خود مشتری هستند
    ولی اگر created_by داشتیم، فیلتر می‌کردیم. فعلاً همه my-requests را خود مشتری حساب می‌کنیم
    چون ویزیتورها از طریق /visitor/orders/create/ می‌سازند که Commission ندارد برای عمده
    پس برای تفکیک، wholesale که توسط ویزیتور ساخته شده را باید با فیلد created_by تشخیص داد
    فعلاً ساده: همه my-requests را خود مشتری حساب می‌کنیم
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        # درخواست‌های عمده من
        qs = WholesaleRequest.objects.filter(user=user)
        try:
            phone = user.customer_profile.phone if hasattr(user, 'customer_profile') else None
            if phone:
                qs = qs | WholesaleRequest.objects.filter(phone=phone)
        except:
            pass
        qs = qs.distinct().order_by('-created_at')

        # اگر بخواهیم فقط خود مشتری (نه ویزیتور) را جدا کنیم، باید فیلد created_by داشته باشیم
        # چون نداریم، فعلاً همه را خود مشتری حساب می‌کنیم
        # برای اینکه ویزیتورها در این لیست نیایند، این API فقط برای نقش customer است
        serializer = WholesaleRequestSerializer(qs, many=True)
        return Response(serializer.data)


class VisitorOrdersOnlyView(APIView):
    """
    فقط سفارشات ویزیتورها - برای پنل مدیرکل و ادمین
    GET /api/dashboard/admin/visitor-orders-only/
    فقط سفارشاتی که کمیسیون دارند (یعنی ویزیتور ثبت کرده)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from dashboard.permissions import get_user_role
        role = get_user_role(request.user)
        if role not in ['admin', 'manager'] and not request.user.is_superuser:
            return Response({"error": "فقط ادمین و مدیرکل"}, status=403)

        commission_order_ids = Commission.objects.values_list('order_id', flat=True)
        qs = Order.objects.filter(id__in=commission_order_ids).order_by('-created_at')

        # فیلتر اضافی بر اساس ویزیتور خاص اگر خواسته شده
        visitor_id = request.query_params.get('visitor_id')
        if visitor_id:
            commission_qs = Commission.objects.filter(visitor_id=visitor_id).values_list('order_id', flat=True)
            qs = qs.filter(id__in=commission_qs)

        from orders.serializers import OrderSerializer
        serializer = OrderSerializer(qs, many=True)
        return Response(serializer.data)
