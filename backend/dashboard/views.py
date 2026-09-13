"""
ویوهای داشبورد برای 4 نقش - همه زیر /api/dashboard/ با JWT
"""
from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Count, Q, Max
from django.db.utils import OperationalError
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model

from .models import ProductPricing, VisitSchedule, CashCollection, Commission, CustomerDebt, CommissionRule, CommissionPayment
from .serializers import (
    ProductPricingSerializer, ProductPricingUpdateSerializer,
    VisitScheduleSerializer, VisitScheduleCreateSerializer,
    CashCollectionSerializer, CommissionSerializer, CustomerDebtSerializer,
    UserBriefSerializer, OwnerUserCreateSerializer,
    VisitorCustomerSerializer, VisitorCustomerCreateSerializer
)
from .permissions import IsManager, IsAdminOrManager, IsVisitor, IsCustomer, IsWholesaleApproved, get_user_role
from products.models import Product
from orders.models import Order, WholesaleRequest
from accounts.models import Customer

User = get_user_model()


def calculate_wholesale_request_total(req):
    """محاسبه مبلغ واقعی درخواست عمده از روی اقلام و قیمت عمده محصول"""
    stored_total = getattr(req, 'total_amount', 0) or 0
    if stored_total and stored_total > 0:
        return stored_total

    total = 0
    items_qs = req.items.select_related('product')
    for item in items_qs:
        product = item.product
        if not product:
            continue
        try:
            pricing = product.dashboard_pricing
            price = pricing.wholesale_price if pricing.is_active else product.price
        except Exception:
            price = product.price
        total += price * item.quantity

    if total and not stored_total:
        try:
            req.total_amount = total
            req.save(update_fields=['total_amount'])
        except Exception:
            pass
    return total


def ensure_wholesale_commissions_for_visitor(visitor):
    """برای درخواست‌های عمده قدیمی/جدید ویزیتور که پورسانت ندارند، پورسانت بساز"""
    role = get_user_role(visitor)
    if role != 'visitor':
        return 0

    rule, _ = CommissionRule.objects.get_or_create(visitor=visitor, defaults={'percentage': 5})
    percentage = rule.percentage if rule.is_active else 0
    requests = (
        WholesaleRequest.objects
        .filter(user=visitor)
        .exclude(status='REJECTED')
        .filter(commission__isnull=True)
        .prefetch_related('items__product')
    )

    created_count = 0
    for req in requests:
        total = calculate_wholesale_request_total(req)
        Commission.objects.create(
            visitor=visitor,
            wholesale_request=req,
            percentage=percentage,
            amount=total * percentage / 100,
        )
        created_count += 1
    return created_count


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
        # ویزیتورهای فعال: فقط برنامه بازدید نیست؛ سفارش‌های خرده/عمده امروز ویزیتورها هم فعالیت محسوب می‌شود
        scheduled_visitor_ids = set(
            VisitSchedule.objects.filter(date=today).values_list('visitor_id', flat=True)
        )
        retail_commission_visitor_ids = set(
            Commission.objects.filter(order__created_at__date=today, order__isnull=False)
            .values_list('visitor_id', flat=True)
        )
        retail_user_visitor_ids = set(
            Order.objects.filter(created_at__date=today, user__customer_profile__role='visitor')
            .values_list('user_id', flat=True)
        )
        wholesale_order_visitor_ids = set(
            WholesaleRequest.objects.filter(created_at__date=today, user__customer_profile__role='visitor')
            .values_list('user_id', flat=True)
        )
        active_visitors = len(scheduled_visitor_ids | retail_commission_visitor_ids | retail_user_visitor_ids | wholesale_order_visitor_ids)
        # هشدار موجودی
        low_stock = Product.objects.filter(stock__lte=20, stock__gt=0).count()
        out_of_stock = Product.objects.filter(stock=0).count()
        # بدهکاران
        debtors_count = CustomerDebt.objects.filter(total_debt__gt=0).count()
        total_debt = CustomerDebt.objects.aggregate(s=Sum('total_debt'))['s'] or 0

        # وضعیت بازدیدهای امروز
        # اگر برای ویزیتور برنامه بازدید ثبت نشده باشد ولی همان روز سفارش خرده/عمده ثبت کرده باشد، در بخش «سفارش ثبت شد» دیده می‌شود.
        today_visits = VisitSchedule.objects.filter(date=today)
        scheduled_ordered = today_visits.filter(status='ordered').count()
        retail_orders_by_visitors = (
            Order.objects
            .filter(created_at__date=today)
            .filter(Q(commission__visitor__customer_profile__role='visitor') | Q(user__customer_profile__role='visitor'))
            .distinct()
            .count()
        )
        wholesale_orders_by_visitors = WholesaleRequest.objects.filter(created_at__date=today, user__customer_profile__role='visitor').count()
        visits_status = {
            'pending': today_visits.filter(status='pending').count(),
            'visited': today_visits.filter(status__in=['visited', 'no_order', 'postponed']).count(),
            'ordered': max(scheduled_ordered, retail_orders_by_visitors + wholesale_orders_by_visitors),
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



class OwnerTodayScheduleManagement(APIView):
    """مدیریت برنامه امروز ویزیتورها توسط مدیرکل"""
    permission_classes = [IsManager]

    def get(self, request):
        date_param = request.query_params.get('date')
        target_date = timezone.now().date()
        if date_param:
            try:
                from datetime import datetime
                target_date = datetime.strptime(date_param, '%Y-%m-%d').date()
            except ValueError:
                return Response({"error": "فرمت تاریخ باید YYYY-MM-DD باشد"}, status=400)

        visitor_id = request.query_params.get('visitor_id')
        qs = VisitSchedule.objects.filter(date=target_date).select_related('visitor', 'customer', 'customer__customer_profile').order_by('visitor__first_name', 'visitor__last_name', 'priority')
        if visitor_id:
            qs = qs.filter(visitor_id=visitor_id)

        serializer = VisitScheduleSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        visitor_id = request.data.get('visitor_id')
        customer_id = request.data.get('customer_id')
        date_value = request.data.get('date')
        priority = request.data.get('priority') or 1
        notes = request.data.get('notes') or ''
        admin_notes = request.data.get('admin_notes') or ''

        if not visitor_id or not customer_id:
            return Response({"error": "visitor_id و customer_id الزامی است"}, status=400)

        try:
            visitor = User.objects.get(id=visitor_id, customer_profile__role='visitor')
        except User.DoesNotExist:
            return Response({"error": "ویزیتور یافت نشد"}, status=404)

        try:
            customer = User.objects.get(id=customer_id, customer_profile__role='customer')
        except User.DoesNotExist:
            return Response({"error": "مشتری یافت نشد"}, status=404)

        target_date = timezone.now().date()
        if date_value:
            try:
                from datetime import datetime
                target_date = datetime.strptime(date_value, '%Y-%m-%d').date()
            except ValueError:
                return Response({"error": "فرمت تاریخ باید YYYY-MM-DD باشد"}, status=400)

        try:
            priority = int(priority)
        except (TypeError, ValueError):
            priority = 1
        priority = max(1, min(priority, 5))

        schedule, created = VisitSchedule.objects.get_or_create(
            visitor=visitor,
            customer=customer,
            date=target_date,
            defaults={
                'priority': priority,
                'status': 'pending',
                'notes': notes,
                'admin_notes': admin_notes,
            },
        )
        if not created:
            return Response({"error": "این مشتری برای این ویزیتور در این تاریخ قبلاً ثبت شده است"}, status=400)

        return Response(VisitScheduleSerializer(schedule).data, status=201)

    def patch(self, request):
        schedule_id = request.data.get('schedule_id')
        if not schedule_id:
            return Response({"error": "schedule_id الزامی است"}, status=400)

        try:
            schedule = VisitSchedule.objects.select_related('visitor', 'customer').get(id=schedule_id)
        except VisitSchedule.DoesNotExist:
            return Response({"error": "برنامه یافت نشد"}, status=404)

        allowed_statuses = {choice[0] for choice in VisitSchedule.STATUS_CHOICES}
        if 'status' in request.data:
            new_status = request.data.get('status')
            if new_status not in allowed_statuses:
                return Response({"error": "وضعیت انتخاب‌شده معتبر نیست"}, status=400)
            schedule.status = new_status

        if 'priority' in request.data:
            try:
                schedule.priority = max(1, min(int(request.data.get('priority')), 5))
            except (TypeError, ValueError):
                return Response({"error": "اولویت معتبر نیست"}, status=400)
        if 'notes' in request.data:
            schedule.notes = request.data.get('notes') or ''
        if 'admin_notes' in request.data:
            schedule.admin_notes = request.data.get('admin_notes') or ''

        schedule.save(update_fields=['status', 'priority', 'notes', 'admin_notes', 'updated_at'])
        return Response(VisitScheduleSerializer(schedule).data)

    def delete(self, request):
        schedule_id = request.data.get('schedule_id')
        if not schedule_id:
            return Response({"error": "schedule_id الزامی است"}, status=400)
        deleted, _ = VisitSchedule.objects.filter(id=schedule_id).delete()
        if not deleted:
            return Response({"error": "برنامه یافت نشد"}, status=404)
        return Response({"detail": "برنامه حذف شد"})


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
            # فقط بدهکاران مربوط به مشتری‌های ویزیتورها نمایش داده می‌شوند.
            # معیار: مشتری باید سفارش/پرداخت/برنامه‌ای داشته باشد که به ویزیتور وصل است، نه سفارش‌های عمومی سایت.
            visitor_ids = User.objects.filter(customer_profile__role='visitor').values_list('id', flat=True)
            scheduled_customer_ids = VisitSchedule.objects.filter(visitor_id__in=visitor_ids).values_list('customer_id', flat=True)
            retail_customer_ids = Order.objects.filter(commission__visitor_id__in=visitor_ids).exclude(order_status='CANCELLED').values_list('user_id', flat=True)
            wholesale_customer_ids = Commission.objects.filter(visitor_id__in=visitor_ids, wholesale_request__isnull=False).values_list('wholesale_request__user_id', flat=True)
            paid_customer_ids = CashCollection.objects.filter(visitor_id__in=visitor_ids).values_list('customer_id', flat=True)
            customer_ids = {
                customer_id
                for customer_id in list(scheduled_customer_ids) + list(retail_customer_ids) + list(wholesale_customer_ids) + list(paid_customer_ids)
                if customer_id
            }

            customers = User.objects.filter(id__in=customer_ids, customer_profile__role='customer').select_related('customer_profile')
            report = []
            for customer in customers:
                retail_orders = Order.objects.filter(user=customer, commission__visitor_id__in=visitor_ids).exclude(order_status='CANCELLED').distinct()
                wholesale_request_ids = Commission.objects.filter(visitor_id__in=visitor_ids, wholesale_request__user=customer).values_list('wholesale_request_id', flat=True)
                wholesale_requests = WholesaleRequest.objects.filter(id__in=wholesale_request_ids).exclude(status='REJECTED').distinct()
                visitor_payments = CashCollection.objects.filter(customer=customer, visitor_id__in=visitor_ids)

                retail_total = retail_orders.aggregate(s=Sum('total_amount'))['s'] or 0
                wholesale_total = wholesale_requests.aggregate(s=Sum('total_amount'))['s'] or 0
                cash_paid = visitor_payments.aggregate(s=Sum('amount'))['s'] or 0
                last_order = retail_orders.aggregate(d=Max('created_at'))['d']
                last_wholesale = wholesale_requests.aggregate(d=Max('created_at'))['d']
                last_payment = visitor_payments.aggregate(d=Max('collected_at'))['d']
                debt = CustomerDebt.objects.filter(customer=customer).first()

                total_debt = retail_total + wholesale_total
                total_paid = cash_paid
                remaining_debt = total_debt - total_paid
                if remaining_debt <= 0:
                    continue

                if last_order and last_wholesale:
                    last_order_date = max(last_order, last_wholesale)
                else:
                    last_order_date = last_order or last_wholesale

                profile = getattr(customer, 'customer_profile', None)
                report.append({
                    'id': debt.id if debt else customer.id,
                    'customer': customer.id,
                    'customer_name': customer.get_full_name() or customer.username,
                    'customer_phone': getattr(profile, 'phone', '') if profile else '',
                    'total_debt': total_debt,
                    'total_paid': total_paid,
                    'remaining_debt': remaining_debt,
                    'last_order_date': last_order_date,
                    'last_payment_date': debt.last_payment_date if debt and debt.last_payment_date else last_payment,
                    'is_overdue': debt.is_overdue if debt else False,
                    'notes': debt.notes if debt else '',
                    'updated_at': debt.updated_at if debt else last_order_date,
                })

            return Response(sorted(report, key=lambda x: x['remaining_debt'], reverse=True)[:50])

        # گزارش ویزیتورها
        visitors = User.objects.filter(customer_profile__role='visitor')
        report = []
        for visitor in visitors:
            # سفارش‌های ثبت‌شده توسط ویزیتور از روی کمیسیون تشخیص داده می‌شوند؛ چون user سفارش، مشتری است.
            retail_orders = Order.objects.filter(Q(commission__visitor=visitor) | Q(user=visitor)).distinct()
            wholesale_request_ids = Commission.objects.filter(visitor=visitor, wholesale_request__isnull=False).values_list('wholesale_request_id', flat=True)
            wholesale_requests = WholesaleRequest.objects.filter(Q(id__in=wholesale_request_ids) | Q(user=visitor)).distinct().defer('total_amount').prefetch_related('items__product')
            visits = VisitSchedule.objects.filter(visitor=visitor)

            retail_sales = retail_orders.exclude(order_status='CANCELLED').aggregate(s=Sum('total_amount'))['s'] or 0
            wholesale_sales = 0
            valid_wholesale_count = 0
            for req in wholesale_requests.exclude(status='REJECTED'):
                valid_wholesale_count += 1
                stored_total = req.__dict__.get('total_amount', None)
                if stored_total and stored_total > 0:
                    wholesale_sales += stored_total
                    continue
                for item in req.items.all():
                    product = item.product
                    if not product:
                        continue
                    try:
                        pricing = product.dashboard_pricing
                        price = pricing.wholesale_price if pricing.is_active else product.price
                    except Exception:
                        price = product.price
                    wholesale_sales += price * item.quantity

            total_sales = retail_sales + wholesale_sales
            commissions = Commission.objects.filter(visitor=visitor).aggregate(s=Sum('amount'))['s'] or 0

            report.append({
                'visitor_id': visitor.id,
                'visitor_username': visitor.username,
                'visitor_name': visitor.get_full_name() or visitor.username,
                'total_visits': visits.count(),
                'completed_visits': visits.filter(status__in=['visited', 'ordered']).count(),
                'total_orders': retail_orders.exclude(order_status='CANCELLED').count() + valid_wholesale_count,
                'total_sales': total_sales,
                'total_commission': commissions,
                'pending_visits': visits.filter(status='pending').count(),
                'retail_orders': retail_orders.exclude(order_status='CANCELLED').count(),
                'retail_sales': retail_sales,
                'wholesale_orders': valid_wholesale_count,
                'wholesale_sales': wholesale_sales,
            })

        return Response(sorted(report, key=lambda x: x['total_sales'], reverse=True))


# ─── Admin Store ───────────────────────────────────────────────────────



class OwnerCommissionManagement(APIView):
    """سیستم تعیین و پرداخت پورسانت ویزیتورها برای مدیرکل"""
    permission_classes = [IsManager]

    def _serialize_commission(self, c):
        is_wholesale = bool(c.wholesale_request_id)
        source = c.wholesale_request if is_wholesale else c.order
        return {
            'id': c.id,
            'visitor': c.visitor_id,
            'visitor_name': c.visitor.get_full_name() or c.visitor.username,
            'order': c.order_id,
            'wholesale_request': c.wholesale_request_id,
            'sale_type': 'wholesale' if is_wholesale else 'retail',
            'order_number': source.request_number if is_wholesale and source else (source.order_number if source else ''),
            'order_total': source.total_amount if source else 0,
            'percentage': c.percentage,
            'amount': c.amount,
            'is_paid': c.is_paid,
            'paid_at': c.paid_at,
            'created_at': c.created_at,
        }

    def get(self, request):
        visitor_id = request.query_params.get('visitor_id')
        visitors = User.objects.filter(customer_profile__role='visitor').select_related('customer_profile').order_by('first_name', 'last_name', 'username')
        if visitor_id:
            visitors = visitors.filter(id=visitor_id)

        result = []
        for visitor in visitors:
            # بک‌فیل خودکار: اگر درخواست عمده‌ای قبلاً برای ویزیتور ثبت شده ولی پورسانت نداشته باشد، همین‌جا ساخته می‌شود
            ensure_wholesale_commissions_for_visitor(visitor)
            rule, _ = CommissionRule.objects.get_or_create(visitor=visitor, defaults={'percentage': 5})
            qs = Commission.objects.filter(visitor=visitor).select_related('order', 'wholesale_request', 'visitor').order_by('-created_at')
            total = qs.aggregate(s=Sum('amount'))['s'] or 0
            unpaid = qs.filter(is_paid=False).aggregate(s=Sum('amount'))['s'] or 0
            paid = qs.filter(is_paid=True).aggregate(s=Sum('amount'))['s'] or 0
            payments = CommissionPayment.objects.filter(visitor=visitor).order_by('-paid_at')[:10]
            result.append({
                'visitor_id': visitor.id,
                'visitor_username': visitor.username,
                'visitor_name': visitor.get_full_name() or visitor.username,
                'visitor_phone': getattr(getattr(visitor, 'customer_profile', None), 'phone', ''),
                'percentage': rule.percentage,
                'rule_active': rule.is_active,
                'total_commission': total,
                'unpaid_commission': unpaid,
                'paid_commission': paid,
                'commission_count': qs.count(),
                'unpaid_count': qs.filter(is_paid=False).count(),
                'paid_count': qs.filter(is_paid=True).count(),
                'commissions': [self._serialize_commission(c) for c in qs[:100]],
                'payments': [{
                    'id': p.id,
                    'amount': p.amount,
                    'commission_count': p.commission_count,
                    'reference_number': p.reference_number,
                    'description': p.description,
                    'paid_at': p.paid_at,
                } for p in payments],
            })

        return Response(result[0] if visitor_id and result else result)

    def patch(self, request):
        from decimal import Decimal
        visitor_id = request.data.get('visitor_id')
        percentage = request.data.get('percentage')
        apply_to_unpaid = request.data.get('apply_to_unpaid', True)
        notes = request.data.get('notes', '')

        if not visitor_id or percentage in (None, ''):
            return Response({'error': 'visitor_id و percentage الزامی است'}, status=400)
        try:
            visitor = User.objects.get(id=visitor_id, customer_profile__role='visitor')
        except User.DoesNotExist:
            return Response({'error': 'ویزیتور یافت نشد'}, status=404)

        pct = Decimal(str(percentage))
        if pct < 0 or pct > 100:
            return Response({'error': 'درصد پورسانت باید بین 0 تا 100 باشد'}, status=400)

        rule, _ = CommissionRule.objects.update_or_create(
            visitor=visitor,
            defaults={'percentage': pct, 'is_active': True, 'notes': notes, 'updated_by': request.user}
        )

        updated_count = 0
        if apply_to_unpaid:
            unpaid = Commission.objects.filter(visitor=visitor, is_paid=False).select_related('order', 'wholesale_request')
            for c in unpaid:
                c.percentage = pct
                source_total = 0
                if c.order_id and c.order:
                    source_total = c.order.total_amount
                elif c.wholesale_request_id and c.wholesale_request:
                    source_total = c.wholesale_request.total_amount
                c.amount = source_total * pct / 100
                c.save(update_fields=['percentage', 'amount'])
                updated_count += 1

        return Response({'detail': 'درصد پورسانت ذخیره شد', 'percentage': rule.percentage, 'updated_unpaid_count': updated_count})

    def post(self, request):
        visitor_id = request.data.get('visitor_id')
        commission_ids = request.data.get('commission_ids') or []
        reference_number = request.data.get('reference_number', '')
        description = request.data.get('description', '')

        if not visitor_id:
            return Response({'error': 'visitor_id الزامی است'}, status=400)
        try:
            visitor = User.objects.get(id=visitor_id, customer_profile__role='visitor')
        except User.DoesNotExist:
            return Response({'error': 'ویزیتور یافت نشد'}, status=404)

        qs = Commission.objects.filter(visitor=visitor, is_paid=False)
        if commission_ids:
            qs = qs.filter(id__in=commission_ids)
        qs = qs.select_related('order')

        commissions = list(qs)
        if not commissions:
            return Response({'error': 'پورسانت پرداخت‌نشده‌ای برای تسویه وجود ندارد'}, status=400)

        total = sum((c.amount for c in commissions), 0)
        now = timezone.now()
        payment = CommissionPayment.objects.create(
            visitor=visitor,
            amount=total,
            commission_count=len(commissions),
            reference_number=reference_number,
            description=description,
            paid_by=request.user,
            paid_at=now,
        )
        payment.commissions.set(commissions)

        Commission.objects.filter(id__in=[c.id for c in commissions]).update(is_paid=True, paid_at=now)

        return Response({
            'detail': 'پرداخت پورسانت ثبت شد',
            'payment_id': payment.id,
            'amount': total,
            'commission_count': len(commissions),
            'paid_at': now,
        })


class OwnerWholesaleList(APIView):
    """لیست فروش/درخواست‌های عمده برای پنل مدیرکل"""
    permission_classes = [IsManager]

    def get(self, request):
        from orders.serializers import WholesaleRequestSerializer
        qs = WholesaleRequest.objects.all().defer('total_amount').order_by('-created_at').prefetch_related('items__product')
        serializer = WholesaleRequestSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)


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
                discount = getattr(product, 'discount_price', None)
                if discount and discount > 0 and discount < price:
                    price = discount

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
        # ✅ FIX: سفارشات ویزیتورها از طریق جدول Commission پیدا می‌شوند
        # چون وقتی ویزیتور سفارش ثبت می‌کند، user سفارش مشتری است، نه ویزیتور
        # پس باید از طریق Commission فیلتر کنیم
        from .models import Commission

        # همه سفارشات PENDING
        qs = Order.objects.filter(order_status='PENDING').order_by('-created_at')

        # سفارشاتی که کمیسیون دارند (یعنی توسط ویزیتور ثبت شده)
        commission_order_ids = Commission.objects.values_list('order_id', flat=True)
        
        # همچنین سفارشاتی که user آنها ویزیتور است (برای سازگاری با حالت قدیمی)
        visitor_user_ids = User.objects.filter(customer_profile__role='visitor').values_list('id', flat=True)

        if commission_order_ids:
            # سفارشات ویزیتوری = آنهایی که کمیسیون دارند یا user ویزیتور است
            qs = qs.filter(Q(id__in=commission_order_ids) | Q(user_id__in=visitor_user_ids))
        else:
            # امنیت تحویل: fallback دمو حذف شد؛ فقط سفارش‌های واقعاً مرتبط با ویزیتورها برگردانده می‌شود.
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

class VisitorCustomerListCreate(APIView):
    """لیست/افزودن مشتری‌های قابل استفاده برای ویزیتور."""
    permission_classes = [permissions.IsAuthenticated]

    def _ensure_visitor(self, request):
        role = get_user_role(request.user)
        return role == 'visitor' or request.user.is_superuser

    def get(self, request):
        if not self._ensure_visitor(request):
            return Response({"error": "فقط ویزیتور"}, status=403)

        q = request.query_params.get('q', '').strip()
        today_only = request.query_params.get('today') == '1'

        if today_only:
            customer_ids = VisitSchedule.objects.filter(visitor=request.user, date=timezone.now().date()).values_list('customer_id', flat=True)
        else:
            scheduled_ids = VisitSchedule.objects.filter(visitor=request.user).values_list('customer_id', flat=True)
            ordered_ids = Order.objects.filter(commission__visitor=request.user).values_list('user_id', flat=True)
            wholesale_ordered_ids = Commission.objects.filter(visitor=request.user, wholesale_request__isnull=False).values_list('wholesale_request__user_id', flat=True)
            customer_ids = set(scheduled_ids) | set(ordered_ids) | set(wholesale_ordered_ids)

        qs = User.objects.filter(id__in=customer_ids, customer_profile__role='customer').select_related('customer_profile').order_by('first_name', 'last_name', 'username')
        if q:
            qs = qs.filter(
                Q(first_name__icontains=q) |
                Q(last_name__icontains=q) |
                Q(username__icontains=q) |
                Q(customer_profile__phone__icontains=q) |
                Q(customer_profile__city__icontains=q)
            )
        return Response(VisitorCustomerSerializer(qs, many=True).data)

    def post(self, request):
        if not self._ensure_visitor(request):
            return Response({"error": "فقط ویزیتور"}, status=403)
        serializer = VisitorCustomerCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(VisitorCustomerSerializer(user).data, status=201)


class VisitorTodayList(APIView):
    """لیست مشتریانی که امروز باید بازدید کند"""
    permission_classes = [permissions.IsAuthenticated]  # + IsVisitor در get_queryset

    def get(self, request):
        role = __import__('dashboard.permissions', fromlist=['get_user_role']).get_user_role(request.user)
        if role != 'visitor' and not request.user.is_superuser:
            return Response({"error": "فقط ویزیتور"}, status=403)

        today = timezone.now().date()
        qs = VisitSchedule.objects.filter(visitor=request.user, date=today).select_related('customer').order_by('priority')
        
        # امنیت تحویل: اگر برنامه‌ای برای امروز ندارد، هیچ مشتری تصادفی/دمویی نمایش داده نمی‌شود.
        if not qs.exists():
            return Response([])

        serializer = VisitScheduleSerializer(qs, many=True)
        return Response(serializer.data)

    def patch(self, request):
        role = get_user_role(request.user)
        if role != 'visitor' and not request.user.is_superuser:
            return Response({"error": "فقط ویزیتور"}, status=403)

        schedule_id = request.data.get('schedule_id')
        if not schedule_id:
            return Response({"error": "schedule_id الزامی است"}, status=400)

        try:
            schedule = VisitSchedule.objects.select_related('customer').get(
                id=schedule_id,
                visitor=request.user,
                date=timezone.now().date(),
            )
        except VisitSchedule.DoesNotExist:
            return Response({"error": "برنامه امروز یافت نشد"}, status=404)

        allowed_statuses = {choice[0] for choice in VisitSchedule.STATUS_CHOICES}
        new_status = request.data.get('status')
        if new_status is not None:
            if new_status not in allowed_statuses:
                return Response({"error": "وضعیت انتخاب‌شده معتبر نیست"}, status=400)
            schedule.status = new_status

        if 'notes' in request.data:
            schedule.notes = request.data.get('notes') or ''

        schedule.save(update_fields=['status', 'notes', 'updated_at'])
        return Response(VisitScheduleSerializer(schedule).data)


class VisitorOrderCreateWithWeight(APIView):
    """ثبت سفارش حضوری ویزیتور - فقط سفارش عمده"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from decimal import Decimal, InvalidOperation
        from dashboard.permissions import get_user_role
        from orders.models import Order, OrderItem, WholesaleRequest, WholesaleRequestItem
        from orders.serializers import OrderSerializer, WholesaleRequestSerializer

        if get_user_role(request.user) != 'visitor' and not request.user.is_superuser:
            return Response({"error": "فقط ویزیتور"}, status=403)

        customer_id = request.data.get('customer_id')
        sale_type = request.data.get('sale_type', 'wholesale')
        items = request.data.get('items', [])  # [{product_id, quantity, weight}]
        address = request.data.get('address', '')

        if sale_type != 'wholesale':
            return Response({"error": "ثبت سفارش ویزیتور فقط برای سفارش عمده فعال است"}, status=400)

        if not customer_id or not items:
            return Response({"error": "customer_id و items الزامی"}, status=400)

        try:
            customer_user = User.objects.select_related('customer_profile').get(id=customer_id)
        except User.DoesNotExist:
            return Response({"error": "مشتری یافت نشد"}, status=404)

        def to_decimal(value, default='0'):
            try:
                return Decimal(str(value if value not in [None, ''] else default))
            except (InvalidOperation, ValueError, TypeError):
                return Decimal(default)

        total = Decimal('0')
        order_items_data = []
        wholesale_items_data = []

        for item in items:
            try:
                product = Product.objects.get(id=item['product_id'])
            except Exception:
                return Response({"error": f"محصول {item.get('product_id')} یافت نشد"}, status=400)

            qty = int(item.get('quantity') or 1)
            if qty < 1:
                return Response({"error": f"تعداد محصول {product.name} معتبر نیست"}, status=400)

            weight = to_decimal(item.get('weight'), '0')

            if sale_type == 'wholesale':
                try:
                    pricing = product.dashboard_pricing
                    price = pricing.wholesale_price if pricing.is_active else product.price
                except Exception:
                    price = product.price
                total += price * qty
                wholesale_items_data.append((product, qty))
            else:
                discount = getattr(product, 'discount_price', None)
                price = discount if discount and discount > 0 and discount < product.price else product.price
                total += price * weight if weight > 0 else price * qty
                order_items_data.append((product, price, qty, weight))

        customer_profile = getattr(customer_user, 'customer_profile', None)
        customer_name = customer_user.get_full_name() or customer_user.username
        customer_phone = getattr(customer_profile, 'phone', '') if customer_profile else ''

        rule, _ = CommissionRule.objects.get_or_create(visitor=request.user, defaults={'percentage': 5})
        percentage = rule.percentage if rule.is_active else 0

        if sale_type == 'wholesale':
            wholesale_request = WholesaleRequest.objects.create(
                user=customer_user,
                company_name=customer_name,
                contact_person=customer_name,
                phone=customer_phone,
                address=address,
                description=f"ثبت سفارش عمده توسط ویزیتور: {request.user.get_full_name() or request.user.username}",
                total_amount=total,
                status='NEW',
            )
            WholesaleRequestItem.objects.bulk_create([
                WholesaleRequestItem(
                    request=wholesale_request,
                    product=product,
                    product_name=product.name,
                    quantity=qty,
                    notes='ثبت شده توسط ویزیتور',
                )
                for product, qty in wholesale_items_data
            ])
            Commission.objects.create(
                visitor=request.user,
                wholesale_request=wholesale_request,
                percentage=percentage,
                amount=total * percentage / 100,
            )
            VisitSchedule.objects.filter(visitor=request.user, customer=customer_user, date=timezone.now().date()).update(status='ordered')
            return Response(WholesaleRequestSerializer(wholesale_request, context={'request': request}).data, status=201)

        order = Order.objects.create(
            user=customer_user,
            name=customer_name,
            phone=customer_phone,
            address=address,
            total_amount=total,
            order_status='PENDING',  # نیاز به تایید ادمین
        )

        for product, price, qty, weight in order_items_data:
            OrderItem.objects.create(
                order=order,
                product=product,
                product_name=f"{product.name} - وزن: {weight}kg" if weight > 0 else product.name,
                price=price,
                quantity=qty,
            )

        Commission.objects.create(
            visitor=request.user,
            order=order,
            percentage=percentage,
            amount=total * percentage / 100,
        )

        VisitSchedule.objects.filter(visitor=request.user, customer=customer_user, date=timezone.now().date()).update(status='ordered')
        return Response(OrderSerializer(order, context={'request': request}).data, status=201)


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
            try:
                visitor = User.objects.get(id=visitor_id)
                ensure_wholesale_commissions_for_visitor(visitor)
            except User.DoesNotExist:
                pass
            qs = Commission.objects.filter(visitor_id=visitor_id)
        else:
            ensure_wholesale_commissions_for_visitor(request.user)
            qs = Commission.objects.filter(visitor=request.user)

        total = qs.aggregate(s=Sum('amount'))['s'] or 0
        unpaid = qs.filter(is_paid=False).aggregate(s=Sum('amount'))['s'] or 0
        paid = qs.filter(is_paid=True).aggregate(s=Sum('amount'))['s'] or 0

        serializer = CommissionSerializer(
            qs.select_related('order', 'wholesale_request', 'visitor')
              .prefetch_related('order__items__product', 'wholesale_request__items__product')
              .order_by('-created_at')[:50],
            many=True,
            context={'request': request}
        )
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

            retail_price = base
            discount = getattr(p, 'discount_price', None)
            if discount and discount > 0 and discount < base:
                retail_price = discount

            result.append({
                'id': p.id,
                'name': p.name,
                'slug': p.slug,
                'category': p.category.name if p.category else "",
                'image': p.image.url if p.image and hasattr(p.image, 'url') else f"/images/p{p.id}.jpg",
                'stock': p.stock,
                'price': str(retail_price) if not is_wholesale_approved else str(wholesale),
                'base_price': str(base),
                'wholesale_price': str(wholesale),
                'is_wholesale_price': is_wholesale_approved,
                'available': p.available,
            })

        return Response(result)
