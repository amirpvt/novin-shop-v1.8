"""
DRF serializers for accounts app - FIXED VERSION v1.1
اصلاح باگ phone field + بهبود create
"""
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Customer

User = get_user_model()


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            "phone",
            "address",
            "city",
            "postal_code",
            "national_id",
            "customer_type",
            "is_wholesale_approved",
        ]
        read_only_fields = ["customer_type", "is_wholesale_approved"]


class ProfileUpdateSerializer(serializers.Serializer):
    """ویرایش امن پروفایل توسط خود کاربر؛ نقش و تایید عمده‌فروشی قابل تغییر نیست."""

    first_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=False, max_length=20)
    address = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(required=False, allow_blank=True, max_length=100)
    postal_code = serializers.CharField(required=False, allow_blank=True, max_length=20)
    national_id = serializers.CharField(required=False, allow_blank=True, max_length=20)

    def validate_email(self, value):
        user = self.context["request"].user
        if value and User.objects.filter(email=value).exclude(id=user.id).exists():
            raise serializers.ValidationError("این ایمیل قبلاً ثبت شده است.")
        return value

    def validate_phone(self, value):
        user = self.context["request"].user
        if Customer.objects.filter(phone=value).exclude(user=user).exists():
            raise serializers.ValidationError("این شماره موبایل قبلاً ثبت شده است.")
        return value

    def update(self, instance, validated_data):
        customer, _ = Customer.objects.get_or_create(
            user=instance,
            defaults={"phone": validated_data.get("phone") or ""},
        )

        for field in ["first_name", "last_name", "email"]:
            if field in validated_data:
                setattr(instance, field, validated_data[field])
        instance.save(update_fields=["first_name", "last_name", "email"])

        for field in ["phone", "address", "city", "postal_code", "national_id"]:
            if field in validated_data:
                setattr(customer, field, validated_data[field])
        customer.save(update_fields=["phone", "address", "city", "postal_code", "national_id", "updated_at"])
        return instance


class UserSerializer(serializers.ModelSerializer):
    """خروجی اطلاعات کاربر برای endpoint های profile/ و login/."""

    customer = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()  # 🐛 FIX: این خط قبلاً جا افتاده بود و باعث 500 می‌شد

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "name",
            "phone",
            "role",
            "is_staff",
            "customer",
        ]

    def get_customer(self, obj):
        try:
            if hasattr(obj, "customer_profile"):
                return CustomerSerializer(obj.customer_profile).data
        except Customer.DoesNotExist:
            return None
        except Exception:
            # اگر جدول accounts_customer هنوز ساخته نشده، خطا نده
            return None
        return None

    def get_name(self, obj):
        full_name = obj.get_full_name()
        return full_name if full_name else obj.username

    def get_role(self, obj):
        if obj.is_superuser:
            return "superadmin"
        try:
            if hasattr(obj, "customer_profile") and obj.customer_profile and obj.customer_profile.role:
                return obj.customer_profile.role
        except Customer.DoesNotExist:
            pass
        except Exception:
            pass
        if obj.is_staff:
            return "admin"
        return "customer"

    def get_phone(self, obj):
        try:
            if hasattr(obj, "customer_profile") and obj.customer_profile:
                return obj.customer_profile.phone
        except Customer.DoesNotExist:
            return ""
        except Exception:
            return ""
        return ""


class RegisterSerializer(serializers.ModelSerializer):
    """
    ثبت‌نام کاربر جدید.
    فیلدها: username, email, password, password2, first_name, last_name, phone, address
    """

    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password], style={"input_type": "password"}
    )
    password2 = serializers.CharField(write_only=True, required=True, style={"input_type": "password"})
    phone = serializers.CharField(required=True, max_length=20, write_only=True)
    address = serializers.CharField(required=True, allow_blank=False, write_only=True)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "password2",
            "first_name",
            "last_name",
            "phone",
            "address",
        ]
        extra_kwargs = {
            "email": {"required": False},
            "first_name": {"required": False},
            "last_name": {"required": False},
        }

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password2": "رمز عبور و تکرار آن یکسان نیست."})

        # بررسی یکتا بودن شماره موبایل
        phone = attrs.get("phone")
        if phone and Customer.objects.filter(phone=phone).exists():
            raise serializers.ValidationError({"phone": "این شماره موبایل قبلاً ثبت شده است."})

        # بررسی یکتا بودن ایمیل
        email = attrs.get("email")
        if email and User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "این ایمیل قبلاً ثبت شده است."})

        # بررسی یکتا بودن username
        if User.objects.filter(username=attrs["username"]).exists():
            raise serializers.ValidationError({"username": "این نام کاربری قبلاً ثبت شده است."})

        return attrs

    def create(self, validated_data):
        # 🐛 FIX: قبلاً password2 را اشتباه استفاده می‌کرد و password در validated_data می‌ماند
        phone = validated_data.pop("phone")
        address = validated_data.pop("address")
        password = validated_data.pop("password")
        validated_data.pop("password2", None)  # حذف فیلد تکراری

        user = User.objects.create(
            username=validated_data.get("username"),
            email=validated_data.get("email", ""),
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
        )
        user.set_password(password)
        user.save()

        # ساخت پروفایل Customer
        try:
            Customer.objects.create(user=user, phone=phone, address=address)
        except Exception as e:
            # اگر به هر دلیلی پروفایل ساخته نشد، کاربر را پاک کن تا دیتابیس کثیف نشود
            user.delete()
            raise serializers.ValidationError({"phone": f"خطا در ساخت پروفایل: {str(e)}"})

        return user

    def to_representation(self, instance):
        """بعد از ثبت‌نام، access + refresh token + اطلاعات کاربر برمی‌گردانیم."""
        refresh = RefreshToken.for_user(instance)
        return {
            "user": UserSerializer(instance).data,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }


class ChangePasswordSerializer(serializers.Serializer):
    """تغییر رمز عبور توسط کاربر لاگین کرده."""

    old_password = serializers.CharField(required=True, write_only=True, style={"input_type": "password"})
    new_password = serializers.CharField(required=True, write_only=True, validators=[validate_password])

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("رمز عبور فعلی اشتباه است.")
        return value
