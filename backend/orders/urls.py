from django.urls import path
from . import views

urlpatterns = [
    # Retail
    path("", views.OrderCreateView.as_view(), name="order-create"),
    path("track/<str:order_number>/", views.OrderTrackingView.as_view(), name="order-track"),
    path("list/", views.OrderListView.as_view(), name="order-list"),
    path("my-orders/", views.MyOrdersView.as_view(), name="my-orders"),  # NEW: سفارشات من
    path("stats/", views.OrderStatsView.as_view(), name="order-stats"),  # NEW: آمار
    path("payments/create/", views.PaymentCreateView.as_view(), name="payment-create"),
    path("payments/verify/", views.PaymentVerifyView.as_view(), name="payment-verify"),

    # Wholesale
    path("wholesale/", views.WholesaleRequestCreateView.as_view(), name="wholesale-create"),
    path("wholesale/track/<str:request_number>/", views.WholesaleRequestTrackingView.as_view(), name="wholesale-track"),
    path("wholesale/list/", views.WholesaleRequestListView.as_view(), name="wholesale-list"),
    path("wholesale/my-requests/", views.MyWholesaleView.as_view(), name="my-wholesale"),  # NEW
    path("wholesale/<str:request_number>/status/", views.WholesaleRequestStatusUpdateView.as_view(), name="wholesale-status-update"),
]
