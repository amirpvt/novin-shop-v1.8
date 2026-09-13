"""
Views for accounts app - FIXED VERSION v1.1
اصلاح LoginView برای جلوگیری از 500 + لاگ بهتر
"""
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Customer
from .serializers import (
    ChangePasswordSerializer,
    CustomerSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    UserSerializer,
)


class RegisterView(generics.CreateAPIView):
    """
    ثبت‌نام کاربر جدید (POST /api/auth/register/).
    خروجی: access + refresh + user
    """
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class LoginView(TokenObtainPairView):
    """
    ورود با username + password (POST /api/auth/login/).
    خروجی پیش‌فرض simple-jwt به علاوه اطلاعات کاربر.
    FIXED: حذف authenticate مضاعف + مدیریت خطای جدول accounts_customer
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        # اجرای لاگین اصلی simple-jwt
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            try:
                from django.contrib.auth import get_user_model
                User = get_user_model()
                username = request.data.get("username")
                user = User.objects.get(username=username)
                response.data["user"] = UserSerializer(user).data
            except Exception as e:
                # اگر سریالایزر خطا داد، لاگ کن ولی توکن‌ها را برگردان
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error serializing user in LoginView: {e}", exc_info=True)
                # تلاش مجدد بدون customer_profile
                try:
                    response.data["user"] = {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "name": user.get_full_name() or user.username,
                        "phone": "",
                        "role": "superadmin" if user.is_superuser else "admin" if user.is_staff else "customer",
                        "is_staff": user.is_staff,
                        "customer": None,
                    }
                except Exception:
                    pass

        return response


class ProfileView(APIView):
    """
    GET  /api/auth/profile/  → دریافت اطلاعات کاربر جاری
    PATCH /api/auth/profile/ → بروزرسانی پروفایل (Customer)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        request.user.refresh_from_db()
        return Response(UserSerializer(request.user).data)


class ChangePasswordView(APIView):
    """POST /api/auth/change-password/ → تغییر رمز عبور."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save()
        return Response({"detail": "رمز عبور با موفقیت تغییر کرد."}, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    خروج واقعی JWT: refresh token دریافتی در blacklist ثبت می‌شود تا دیگر قابل استفاده نباشد.
    Body: { "refresh": "..." }
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"error": "refresh token الزامی است."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response({"error": "refresh token نامعتبر یا قبلاً باطل شده است."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"detail": "خروج با موفقیت انجام شد و refresh token باطل شد."}, status=status.HTTP_200_OK)
