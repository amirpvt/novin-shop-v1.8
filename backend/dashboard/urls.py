"""
dashboard/urls.py == dashboard_routes
تمام مسیرها زیر /api/dashboard/ و با JWT محافظت می‌شوند
"""
from django.urls import path
from . import views
from . import views_self_vs_visitor as views_self

app_name = 'dashboard'

urlpatterns = [
    # ─── Owner (Manager) ───────────────────────────────────────────────
    path('owner/stats/', views.OwnerDashboardStats.as_view(), name='owner-stats'),
    path('owner/pricing/', views.OwnerPricingList.as_view(), name='owner-pricing-list'),
    path('owner/pricing/<int:product_id>/', views.OwnerPricingUpdate.as_view(), name='owner-pricing-update'),
    path('owner/users/', views.OwnerUserManagement.as_view(), name='owner-users'),
    path('owner/reports/', views.OwnerVisitorReport.as_view(), name='owner-reports'),
    path('owner/debtors/', views.OwnerVisitorReport.as_view(), name='owner-debtors'),

    # ─── Admin Store ───────────────────────────────────────────────────
    path('admin/orders/create/', views.AdminOrderCreate.as_view(), name='admin-order-create'),
    path('admin/orders/pending/', views.AdminPendingOrders.as_view(), name='admin-pending-orders'),
    path('admin/visitor-orders-only/', views_self.VisitorOrdersOnlyView.as_view(), name='admin-visitor-orders-only'),  # فقط سفارشات ویزیتورها
    path('admin/stock/', views.AdminStockView.as_view(), name='admin-stock'),

    # ─── Visitor ───────────────────────────────────────────────────────
    path('visitor/today/', views.VisitorTodayList.as_view(), name='visitor-today'),
    path('visitor/orders/create/', views.VisitorOrderCreateWithWeight.as_view(), name='visitor-order-create'),
    path('visitor/cash/', views.VisitorCashCollectionView.as_view(), name='visitor-cash'),
    path('visitor/commission/', views.VisitorCommissionView.as_view(), name='visitor-commission'),

    # ─── Customer ──────────────────────────────────────────────────────
    path('customer/prices/', views.CustomerPriceList.as_view(), name='customer-prices'),
    path('customer/my-orders-self/', views_self.CustomerSelfOrdersView.as_view(), name='customer-my-orders-self'),  # فقط خود مشتری
    path('customer/my-wholesale-self/', views_self.CustomerSelfWholesaleView.as_view(), name='customer-my-wholesale-self'),  # فقط خود مشتری
]
