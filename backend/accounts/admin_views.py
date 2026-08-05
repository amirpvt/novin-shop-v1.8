"""
accounts/admin_views.py - مدیریت ادمین‌ها فقط برای مدیر کل (superadmin)
"""
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import UserSerializer
from products.permissions import IsSuperAdmin
from rest_framework import serializers
from .models import Customer

User = get_user_model()

class AdminCreateSerializer(serializers.ModelSerializer):
    """ساخت ادمین جدید توسط مدیر کل"""
    password = serializers.CharField(write_only=True, min_length=8)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=20)
    role = serializers.ChoiceField(choices=[("admin", "ادمین"), ("superadmin", "مدیر کل")], default="admin")

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "password", "phone", "role", "is_staff", "is_superuser"]
        read_only_fields = ["id", "is_staff", "is_superuser"]

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("این نام کاربری قبلاً گرفته شده")
        return value

    def create(self, validated_data):
        phone = validated_data.pop("phone", "")
        role = validated_data.pop("role", "admin")
        password = validated_data.pop("password")

        is_staff = True
        is_superuser = (role == "superadmin")

        user = User.objects.create(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            is_staff=is_staff,
            is_superuser=is_superuser,
        )
        user.set_password(password)
        user.save()

        # پروفایل Customer برای ادمین هم بساز (برای نمایش شماره)
        Customer.objects.get_or_create(user=user, defaults={"phone": phone, "customer_type": "both", "is_wholesale_approved": True})

        return user

    def to_representation(self, instance):
        return UserSerializer(instance).data


class AdminListView(generics.ListAPIView):
    """
    لیست ادمین‌ها - فقط مدیر کل
    GET /api/auth/admins/
    """
    serializer_class = UserSerializer
    permission_classes = [IsSuperAdmin]

    def get_queryset(self):
        return User.objects.filter(is_staff=True).order_by("-date_joined")


class AdminCreateView(generics.CreateAPIView):
    """
    ساخت ادمین جدید - فقط مدیر کل
    POST /api/auth/admins/  body: {username, password, role: admin/superadmin, phone, first_name, last_name}
    """
    serializer_class = AdminCreateSerializer
    permission_classes = [IsSuperAdmin]


class AdminDeleteView(APIView):
    """
    حذف ادمین - فقط مدیر کل، نمی‌تواند خودش را حذف کند
    DELETE /api/auth/admins/<id>/
    """
    permission_classes = [IsSuperAdmin]

    def delete(self, request, id):
        try:
            target = User.objects.get(id=id, is_staff=True)
        except User.DoesNotExist:
            return Response({"detail": "ادمین یافت نشد"}, status=status.HTTP_404_NOT_FOUND)

        if target.id == request.user.id:
            return Response({"detail": "نمی‌توانید خودتان را حذف کنید"}, status=status.HTTP_400_BAD_REQUEST)

        if target.is_superuser and not request.user.is_superuser:
            return Response({"detail": "فقط مدیر کل می‌تواند مدیر کل را حذف کند"}, status=status.HTTP_403_FORBIDDEN)

        target.delete()
        return Response({"detail": "ادمین حذف شد"}, status=status.HTTP_200_OK)
