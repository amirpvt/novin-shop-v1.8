from django.urls import path
from .admin_views import AdminListView, AdminCreateView, AdminDeleteView
from .views import RegisterView, LoginView, LogoutView, ProfileView, ChangePasswordView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # Auth
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),
    # Admin management - فقط مدیر کل
    path("admins/", AdminListView.as_view(), name="admin-list"),
    path("admins/create/", AdminCreateView.as_view(), name="admin-create"),
    path("admins/<int:id>/", AdminDeleteView.as_view(), name="admin-delete"),
]