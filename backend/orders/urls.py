from django.urls import path
from . import views

urlpatterns = [
    # Retail - Create & Track (public)
    path("", views.OrderCreateView.as_view(), name="order-create"),
    path("track/<str:order_number>/", views.OrderTrackingView.as_view(), name="order-track"),

    # Retail - Admin & User (protected)
    path("list/", views.OrderListView.as_view(), name="order-list"),
    path("my-orders/", views.MyOrdersView.as_view(), name="my-orders"),  # سفارشات من
    path("stats/", views.OrderStatsView.as_view(), name="order-stats"),  # آمار ادمین
    path("<int:id>/status/", views.OrderStatusUpdateView.as_view(), name="order-status-update"),  # تغییر وضعیت سفارش تکی
    path("payments/create/", views.PaymentCreateView.as_view(), name="payment-create"),
    path("payments/verify/", views.PaymentVerifyView.as_view(), name="payment-verify"),

    # Wholesale
    path("wholesale/", views.WholesaleRequestCreateView.as_view(), name="wholesale-create"),
    path("wholesale/track/<str:request_number>/", views.WholesaleRequestTrackingView.as_view(), name="wholesale-track"),
    path("wholesale/list/", views.WholesaleRequestListView.as_view(), name="wholesale-list"),
    path("wholesale/my-requests/", views.MyWholesaleView.as_view(), name="my-wholesale"),
    path("wholesale/<str:request_number>/status/", views.WholesaleRequestStatusUpdateView.as_view(), name="wholesale-status-update"),
]
