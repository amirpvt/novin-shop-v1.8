"""
dashboard/urls.py == dashboard_routes
تمام مسیرها زیر /api/dashboard/ و با JWT محافظت می‌شوند
"""
from django.urls import path
from . import views

app_name = 'dashboard'

urlpatterns = [
    # ─── Owner (Manager) ───────────────────────────────────────────────
    path('owner/stats/', views.OwnerDashboardStats.as_view(), name='owner-stats'),
    path('owner/pricing/', views.OwnerPricingList.as_view(), name='owner-pricing-list'),
    path('owner/pricing/<int:product_id>/', views.OwnerPricingUpdate.as_view(), name='owner-pricing-update'),
    path('owner/users/', views.OwnerUserManagement.as_view(), name='owner-users'),
    path('owner/reports/', views.OwnerVisitorReport.as_view(), name='owner-reports'),  # ?type=visitors یا ?type=debtors
    path('owner/debtors/', views.OwnerVisitorReport.as_view(), name='owner-debtors'),  # Alias

    # ─── Admin Store ───────────────────────────────────────────────────
    path('admin/orders/create/', views.AdminOrderCreate.as_view(), name='admin-order-create'),
    path('admin/orders/pending/', views.AdminPendingOrders.as_view(), name='admin-pending-orders'),
    path('admin/stock/', views.AdminStockView.as_view(), name='admin-stock'),

    # ─── Visitor ───────────────────────────────────────────────────────
    path('visitor/today/', views.VisitorTodayList.as_view(), name='visitor-today'),
    path('visitor/orders/create/', views.VisitorOrderCreateWithWeight.as_view(), name='visitor-order-create'),
    path('visitor/cash/', views.VisitorCashCollectionView.as_view(), name='visitor-cash'),
    path('visitor/commission/', views.VisitorCommissionView.as_view(), name='visitor-commission'),

    # ─── Customer ──────────────────────────────────────────────────────
    path('customer/prices/', views.CustomerPriceList.as_view(), name='customer-prices'),
]
