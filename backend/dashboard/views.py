"""
ویوهای داشبورد برای 4 نقش - همه زیر /api/dashboard/ با JWT
"""
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model

from .models import ProductPricing, VisitSchedule, CashCollection, Commission, CustomerDebt
from .serializers import (
    ProductPricingSerializer, ProductPricingUpdateSerializer,
    VisitScheduleSerializer, VisitScheduleCreateSerializer,
    CashCollectionSerializer, CommissionSerializer, CustomerDebtSerializer,
    UserBriefSerializer, OwnerUserCreateSerializer
)
from .permissions import IsManager, IsAdminOrManager, IsVisitor, IsCustomer, IsWholesaleApproved, get_user_role
from products.models import Product
from orders.models import Order
from accounts.models import Customer

User = get_user_model()

# ─── Owner (Manager) ───────────────────────────────────────────────────

class OwnerDashboardStats(APIView):
    """
    داشبورد مدیرکل: فروش امروز، تعداد سفارشات، ویزیتورهای فعال، بدهکاران
    GET /api/dashboard/owner/stats/
    """
    permission_classes = [IsManager]

    def get(self, request):
        today = timezone.now().date()
        # فروش امروز
        today_sales = Order.objects.filter(created_at__date=today).aggregate(s=Sum('total_amount'))['s'] or 0
        today_orders = Order.objects.filter(created_at__date=today).count()
        # ویزیتورهای فعال (کسانی که امروز برنامه بازدید دارند)
        active_visitors = VisitSchedule.objects.filter(date=today).values('visitor').distinct().count()
        # هشدار موجودی
        low_stock = Product.objects.filter(stock__lte=20, stock__gt=0).count()
        out_of_stock = Product.objects.filter(stock=0).count()
        # بدهکاران
        debtors_count = CustomerDebt.objects.filter(total_debt__gt=0).count()
        total_debt = CustomerDebt.objects.aggregate(s=Sum('total_debt'))['s'] or 0

        # وضعیت ویزیتورها امروز
        today_visits = VisitSchedule.objects.filter(date=today)
        visits_status = {
            'pending': today_visits.filter(status='pending').count(),
            'visited': today_visits.filter(status='visited').count(),
            'ordered': today_visits.filter(status='ordered').count(),
        }

        return Response({
            'today_sales': today_sales,
            'today_orders': today_orders,
            'active_visitors': active_visitors,
            'low_stock': low_stock,
            'out_of_stock': out_of_stock,
            'debtors_count': debtors_count,
            'total_debt': total_debt,
            'visits_status': visits_status,
        })


class OwnerPricingUpdate(generics.RetrieveUpdateAPIView):
    """
    تعیین قیمت پایه و عمده برای هر محصول - بدون تغییر مدل Product اصلی
    GET /api/dashboard/owner/pricing/<product_id>/
    PATCH /api/dashboard/owner/pricing/<product_id>/  {base_price, wholesale_price}
    """
    permission_classes = [IsManager]
    serializer_class = ProductPricingUpdateSerializer
    queryset = ProductPricing.objects.all()
    lookup_field = 'product_id'

    def get_object(self):
        product_id = self.kwargs.get('product_id')
        obj, created = ProductPricing.objects.get_or_create(
            product_id=product_id,
            defaults={
                'base_price': Product.objects.get(id=product_id).price,
                'wholesale_price': Product.objects.get(id=product_id).price * 0.9,
                'updated_by': self.request.user
            }
        )
        return obj

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class OwnerPricingList(APIView):
    """لیست همه قیمت‌گذاری‌ها"""
    permission_classes = [IsManager]

    def get(self, request):
        pricings = ProductPricing.objects.select_related('product').all()
        serializer = ProductPricingSerializer(pricings, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        """ایجاد قیمت‌گذاری برای محصولی که هنوز ندارد"""
        product_id = request.data.get('product')
        if not product_id:
            return Response({"error": "product الزامی است"}, status=400)
        if ProductPricing.objects.filter(product_id=product_id).exists():
            return Response({"error": "برای این محصول قبلا قیمت تعیین شده"}, status=400)
        serializer = ProductPricingSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        return Response(serializer.data, status=201)


class OwnerUserManagement(APIView):
    """
    مدیریت کاربران: افزودن، حذف، غیرفعال کردن ویزیتور و ادمین
    """
    permission_classes = [IsManager]

    def get(self, request):
        """لیست همه کاربران - شامل مشتریان هم می‌شود"""
        role = request.query_params.get('role')
        # ✅ FIX: قبلاً فقط admin و visitor را برمی‌گرداند، مشتری‌ها نمایش داده نمی‌شدند
        # الان همه نقش‌ها را برمی‌گرداند، اگر role مشخص شده باشد فیلتر می‌کند
        qs = User.objects.filter(customer_profile__isnull=False).select_related('customer_profile').order_by('-date_joined')
        if role:
            qs = qs.filter(customer_profile__role=role)
        else:
            # اگر role مشخص نشده، همه به جز شاید مشتریان عادی؟ نه، همه را برگردان
            # برای سازگاری با درخواست قبلی، اگر role نگرفته، همه نقش‌ها را برگردان
            pass
        serializer = UserBriefSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        """افزودن کاربر جدید"""
        serializer = OwnerUserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserBriefSerializer(user).data, status=201)

    def patch(self, request):
        """غیرفعال/فعال کردن کاربر"""
        user_id = request.data.get('user_id')
        is_active = request.data.get('is_active')
        if user_id is None or is_active is None:
            return Response({"error": "user_id و is_active الزامی"}, status=400)
        try:
            user = User.objects.get(id=user_id)
            profile = user.customer_profile
            profile.is_active = bool(is_active)
            profile.save()
            return Response({"detail": "وضعیت تغییر کرد", "is_active": profile.is_active})
        except User.DoesNotExist:
            return Response({"error": "کاربر یافت نشد"}, status=404)

    def delete(self, request):
        """حذف کاربر"""
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({"error": "user_id الزامی"}, status=400)
        try:
            user = User.objects.get(id=user_id)
            # مدیرکل نمی‌تواند خودش را حذف کند
            if user.id == request.user.id:
                return Response({"error": "نمی‌توانید خودتان را حذف کنید"}, status=400)
            user.delete()
            return Response({"detail": "حذف شد"})
        except User.DoesNotExist:
            return Response({"error": "کاربر یافت نشد"}, status=404)


class OwnerVisitorReport(APIView):
    """
    گزارش عملکرد هر ویزیتور و گزارش بدهکاران
    GET /api/dashboard/owner/visitors-report/
    GET /api/dashboard/owner/debtors/
    """
    permission_classes = [IsManager]

    def get(self, request):
        report_type = request.query_params.get('type', 'visitors')

        if report_type == 'debtors':
            debts = CustomerDebt.objects.select_related('customer').filter(total_debt__gt=0).order_by('-total_debt')[:50]
            serializer = CustomerDebtSerializer(debts, many=True)
            return Response(serializer.data)

        # گزارش ویزیتورها
        visitors = User.objects.filter(customer_profile__role='visitor')
        report = []
        for visitor in visitors:
            orders = Order.objects.filter(user=visitor) if hasattr(Order, 'user') else Order.objects.none()
            # اگر Order.user ندارید، از VisitSchedule استفاده کنید
            visits = VisitSchedule.objects.filter(visitor=visitor)
            total_sales = orders.aggregate(s=Sum('total_amount'))['s'] or 0
            commissions = Commission.objects.filter(visitor=visitor).aggregate(s=Sum('amount'))['s'] or 0

            report.append({
                'visitor_id': visitor.id,
                'visitor_username': visitor.username,
                'visitor_name': visitor.get_full_name() or visitor.username,
                'total_visits': visits.count(),
                'completed_visits': visits.filter(status__in=['visited', 'ordered']).count(),
                'total_orders': orders.count(),
                'total_sales': total_sales,
                'total_commission': commissions,
                'pending_visits': visits.filter(status='pending').count(),
            })

        return Response(sorted(report, key=lambda x: x['total_sales'], reverse=True))


# ─── Admin Store ───────────────────────────────────────────────────────

class AdminOrderCreate(APIView):
    """
    ثبت سفارش جدید توسط ادمین برای مشتری - با انتخاب جزئی/عمده
    POST /api/dashboard/admin/orders/create/
    body: {customer_id, items: [{product_id, quantity, weight?}], sale_type: retail/wholesale}
    """
    permission_classes = [IsAdminOrManager]

    def post(self, request):
        from orders.models import Order, OrderItem
        customer_id = request.data.get('customer_id')
        items = request.data.get('items', [])
        sale_type = request.data.get('sale_type', 'retail')  # retail/wholesale
        address = request.data.get('address', '')
        message = request.data.get('message', '')

        if not customer_id or not items:
            return Response({"error": "customer_id و items الزامی"}, status=400)

        try:
            customer_user = User.objects.get(id=customer_id)
        except User.DoesNotExist:
            return Response({"error": "مشتری یافت نشد"}, status=404)

        # تعیین قیمت بر اساس نوع فروش
        total = 0
        order_items_data = []
        for item in items:
            try:
                product = Product.objects.get(id=item['product_id'])
            except Product.DoesNotExist:
                return Response({"error": f"محصول {item['product_id']} یافت نشد"}, status=400)

            # اگر عمده و مشتری تایید شده، قیمت عمده
            if sale_type == 'wholesale':
                try:
                    pricing = product.dashboard_pricing
                    price = pricing.wholesale_price if pricing.is_active else product.price
                except ProductPricing.DoesNotExist:
                    price = product.price
                # چک تایید عمده
                try:
                    if not customer_user.customer_profile.is_wholesale_approved:
                        return Response({"error": "مشتری برای خرید عمده تایید نشده"}, status=400)
                except:
                    pass
            else:
                try:
                    pricing = product.dashboard_pricing
                    price = pricing.base_price if pricing.is_active else product.price
                except ProductPricing.DoesNotExist:
                    price = product.price

            qty = item.get('quantity', 1)
            total += price * qty
            order_items_data.append((product, price, qty, item.get('weight')))

        # ایجاد سفارش
        customer_profile = getattr(customer_user, 'customer_profile', None)
        order = Order.objects.create(
            user=customer_user if hasattr(Order, 'user') else None,
            name=customer_user.get_full_name() or customer_user.username,
            phone=customer_profile.phone if customer_profile else "",
            address=address or (customer_profile.address if customer_profile else ""),
            message=message,
            total_amount=total,
            order_status='CONFIRMED'  # ادمین مستقیم تایید می‌کند
        )

        for product, price, qty, weight in order_items_data:
            OrderItem.objects.create(
                order=order,
                product=product,
                product_name=product.name,
                price=price,
                quantity=qty
            )
            # اگر وزن دقیق وارد شده، در notes ذخیره کنیم (یا فیلد weight اگر اضافه کردید)
        
        from orders.serializers import OrderSerializer
        return Response(OrderSerializer(order).data, status=201)


class AdminPendingOrders(APIView):
    """سفارشات ثبت شده توسط ویزیتورها که نیاز به تایید نهایی دارد"""
    permission_classes = [IsAdminOrManager]

    def get(self, request):
        # سفارشاتی که توسط ویزیتور ثبت شده و PENDING هستند
        qs = Order.objects.filter(order_status='PENDING').order_by('-created_at')
        # فقط سفارشاتی که user آنها ویزیتور است
        visitor_user_ids = User.objects.filter(customer_profile__role='visitor').values_list('id', flat=True)
        qs = qs.filter(user_id__in=visitor_user_ids)
        from orders.serializers import OrderSerializer
        serializer = OrderSerializer(qs, many=True)
        return Response(serializer.data)

    def patch(self, request):
        """تایید نهایی سفارش ویزیتور"""
        order_id = request.data.get('order_id')
        action = request.data.get('action')  # confirm / reject
        if not order_id or not action:
            return Response({"error": "order_id و action الزامی"}, status=400)
        try:
            order = Order.objects.get(id=order_id)
            if action == 'confirm':
                order.order_status = 'CONFIRMED'
            elif action == 'reject':
                order.order_status = 'CANCELLED'
            else:
                return Response({"error": "action باید confirm یا reject باشد"}, status=400)
            order.save()
            from orders.serializers import OrderSerializer
            return Response(OrderSerializer(order).data)
        except Order.DoesNotExist:
            return Response({"error": "سفارش یافت نشد"}, status=404)


class AdminStockView(APIView):
    """مشاهده موجودی انبار"""
    permission_classes = [IsAdminOrManager]

    def get(self, request):
        low_stock_threshold = int(request.query_params.get('low_threshold', 20))
        products = Product.objects.all().order_by('stock')
        low_stock = products.filter(stock__lte=low_stock_threshold, stock__gt=0)
        out_of_stock = products.filter(stock=0)
        # سریالایز ساده
        data = [
            {
                'id': p.id,
                'name': p.name,
                'stock': p.stock,
                'available': p.available,
                'price': str(p.price),
                'category': p.category.name if p.category else "",
                'status': 'out' if p.stock == 0 else 'low' if p.stock <= low_stock_threshold else 'ok'
            }
            for p in products
        ]
        return Response({
            'all': data,
            'low_stock_count': low_stock.count(),
            'out_of_stock_count': out_of_stock.count(),
            'low_stock_items': [{'id': p.id, 'name': p.name, 'stock': p.stock} for p in low_stock[:20]]
        })


# ─── Visitor ───────────────────────────────────────────────────────────

class VisitorTodayList(APIView):
    """لیست مشتریانی که امروز باید بازدید کند"""
    permission_classes = [permissions.IsAuthenticated]  # + IsVisitor در get_queryset

    def get(self, request):
        role = __import__('dashboard.permissions', fromlist=['get_user_role']).get_user_role(request.user)
        if role != 'visitor' and not request.user.is_superuser:
            return Response({"error": "فقط ویزیتور"}, status=403)

        today = timezone.now().date()
        qs = VisitSchedule.objects.filter(visitor=request.user, date=today).select_related('customer').order_by('priority')
        
        # اگر برنامه‌ای برای امروز ندارد، مشتریان نزدیک یا تصادفی را برگردان (برای دمو)
        if not qs.exists():
            # 5 مشتری تصادفی
            customers = User.objects.filter(customer_profile__role='customer').order_by('?')[:5]
            data = [
                {
                    'id': None,
                    'customer_id': c.id,
                    'customer_name': c.get_full_name() or c.username,
                    'customer_phone': getattr(c.customer_profile, 'phone', '') if hasattr(c, 'customer_profile') else '',
                    'customer_address': getattr(c.customer_profile, 'address', '') if hasattr(c, 'customer_profile') else '',
                    'date': str(today),
                    'status': 'pending',
                    'priority': 1,
                }
                for c in customers
            ]
            return Response(data)

        serializer = VisitScheduleSerializer(qs, many=True)
        return Response(serializer.data)


class VisitorOrderCreateWithWeight(APIView):
    """ثبت سفارش در محل با وزن دقیق"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from dashboard.permissions import get_user_role
        if get_user_role(request.user) != 'visitor' and not request.user.is_superuser:
            return Response({"error": "فقط ویزیتور"}, status=403)

        customer_id = request.data.get('customer_id')
        items = request.data.get('items', [])  # [{product_id, quantity, weight}]
        address = request.data.get('address', '')

        if not customer_id or not items:
            return Response({"error": "customer_id و items الزامی"}, status=400)

        try:
            customer_user = User.objects.get(id=customer_id)
        except User.DoesNotExist:
            return Response({"error": "مشتری یافت نشد"}, status=404)

        # ایجاد سفارش با وزن دقیق
        total = 0
        order_items_data = []
        for item in items:
            try:
                product = Product.objects.get(id=item['product_id'])
            except:
                return Response({"error": f"محصول {item['product_id']} یافت نشد"}, status=400)
            
            # اگر وزن دقیق وارد شده، قیمت بر اساس وزن محاسبه می‌شود
            # فرض: price بر حسب کیلوگرم است و weight به گرم یا کیلوگرم وارد می‌شود
            qty = item.get('quantity', 1)
            weight = item.get('weight')  # وزن دقیق به کیلوگرم
            if weight:
                # اگر وزن دارد، مقدار را بر اساس وزن حساب کن (مثلا 0.5 کیلو)
                price = product.price  # قیمت هر کیلو
                total += price * float(weight)
            else:
                total += product.price * qty

            order_items_data.append((product, product.price, qty, weight))

        from orders.models import Order, OrderItem
        order = Order.objects.create(
            user=customer_user,
            name=customer_user.get_full_name() or customer_user.username,
            phone=getattr(customer_user.customer_profile, 'phone', '') if hasattr(customer_user, 'customer_profile') else "",
            address=address,
            total_amount=total,
            order_status='PENDING'  # نیاز به تایید ادمین
        )

        for product, price, qty, weight in order_items_data:
            OrderItem.objects.create(
                order=order,
                product=product,
                product_name=f"{product.name} - وزن: {weight}kg" if weight else product.name,
                price=price,
                quantity=qty
            )

        # ایجاد کمیسیون خودکار 5%
        Commission.objects.create(
            visitor=request.user,
            order=order,
            percentage=5.00,
            amount=total * 0.05
        )

        # آپدیت برنامه بازدید به ordered
        VisitSchedule.objects.filter(visitor=request.user, customer=customer_user, date=timezone.now().date()).update(status='ordered')

        from orders.serializers import OrderSerializer
        return Response(OrderSerializer(order).data, status=201)


class VisitorCashCollectionView(APIView):
    """ثبت دریافت وجه نقد از مشتری"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # لیست دریافت‌های امروز این ویزیتور
        qs = CashCollection.objects.filter(visitor=request.user).order_by('-collected_at')[:20]
        from .serializers import CashCollectionSerializer
        serializer = CashCollectionSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        from dashboard.permissions import get_user_role
        if get_user_role(request.user) != 'visitor' and not request.user.is_superuser:
            return Response({"error": "فقط ویزیتور"}, status=403)

        serializer = CashCollectionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(visitor=request.user)
        
        # آپدیت بدهی مشتری
        customer_id = request.data.get('customer')
        amount = request.data.get('amount')
        if customer_id and amount:
            debt, created = CustomerDebt.objects.get_or_create(customer_id=customer_id)
            debt.total_paid = (debt.total_paid or 0) + int(amount)
            debt.last_payment_date = timezone.now()
            debt.save()

        return Response(serializer.data, status=201)


class VisitorCommissionView(APIView):
    """مشاهده پورسانت ویزیتور"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from dashboard.permissions import get_user_role
        role = get_user_role(request.user)
        if role not in ['visitor', 'manager'] and not request.user.is_superuser:
            return Response({"error": "فقط ویزیتور و مدیرکل"}, status=403)

        visitor_id = request.query_params.get('visitor_id')
        if visitor_id and (role == 'manager' or request.user.is_superuser):
            # مدیرکل می‌تواند پورسانت هر ویزیتور را ببیند
            qs = Commission.objects.filter(visitor_id=visitor_id)
        else:
            qs = Commission.objects.filter(visitor=request.user)

        total = qs.aggregate(s=Sum('amount'))['s'] or 0
        unpaid = qs.filter(is_paid=False).aggregate(s=Sum('amount'))['s'] or 0
        paid = qs.filter(is_paid=True).aggregate(s=Sum('amount'))['s'] or 0

        serializer = CommissionSerializer(qs.order_by('-created_at')[:50], many=True)
        return Response({
            'total_commission': total,
            'unpaid_commission': unpaid,
            'paid_commission': paid,
            'commissions': serializer.data
        })


# ─── Customer ──────────────────────────────────────────────────────────

class CustomerPriceList(APIView):
    """
    نمایش قیمت جزئی برای عادی و قیمت عمده برای تایید شده
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from dashboard.permissions import get_user_role
        role = get_user_role(request.user)
        if role != 'customer' and not request.user.is_superuser:
            # اگر ویزیتور یا ادمین هم بخواهد قیمت ببیند، قیمت جزئی بده
            pass

        is_wholesale_approved = False
        try:
            is_wholesale_approved = request.user.customer_profile.is_wholesale_approved
        except:
            pass

        products = Product.objects.filter(available=True).select_related('category')[:100]
        result = []
        for p in products:
            try:
                pricing = p.dashboard_pricing
                base = pricing.base_price if pricing.is_active else p.price
                wholesale = pricing.wholesale_price if pricing.is_active else p.price
            except ProductPricing.DoesNotExist:
                base = p.price
                wholesale = p.price * 0.9  # 10% تخفیف فرضی برای عمده

            result.append({
                'id': p.id,
                'name': p.name,
                'slug': p.slug,
                'category': p.category.name if p.category else "",
                'image': p.image.url if p.image and hasattr(p.image, 'url') else f"/images/p{p.id}.jpg",
                'stock': p.stock,
                'price': str(base) if not is_wholesale_approved else str(wholesale),
                'base_price': str(base),
                'wholesale_price': str(wholesale),
                'is_wholesale_price': is_wholesale_approved,
                'available': p.available,
            })

        return Response(result)
