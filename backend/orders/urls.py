from django.urls import path

from . import views

urlpatterns = [
    # --- Retail (B2C) ---
    path("", views.OrderCreateView.as_view(), name="order-create"),
    path("track/<str:order_number>/", views.OrderTrackingView.as_view(), name="order-track"),
    path("list/", views.OrderListView.as_view(), name="order-list"),
    path("payments/create/", views.PaymentCreateView.as_view(), name="payment-create"),
    path("payments/verify/", views.PaymentVerifyView.as_view(), name="payment-verify"),

    # --- Wholesale (B2B) ---
    path("wholesale/", views.WholesaleRequestCreateView.as_view(), name="wholesale-create"),
    path(
        "wholesale/track/<str:request_number>/",
        views.WholesaleRequestTrackingView.as_view(),
        name="wholesale-track",
    ),
    path("wholesale/list/", views.WholesaleRequestListView.as_view(), name="wholesale-list"),
    path(
        "wholesale/<str:request_number>/status/",
        views.WholesaleRequestStatusUpdateView.as_view(),
        name="wholesale-status-update",
    ),
]