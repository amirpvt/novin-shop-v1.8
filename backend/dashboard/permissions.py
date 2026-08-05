"""
RBAC Permissions for dashboard
هر نقش فقط به بخش خودش دسترسی دارد
JWT فقط برای /api/dashboard/* اعمال می‌شود (در urls.py با permission_classes)
"""
from rest_framework import permissions


def get_user_role(user):
    """گرفتن نقش کاربر از پروفایل Customer"""
    if not user or not user.is_authenticated:
        return None
    try:
        # اگر superuser باشد، مدیرکل حساب می‌شود
        if user.is_superuser:
            return 'manager'
        if hasattr(user, 'customer_profile') and user.customer_profile:
            # اگر پروفایل is_active=False باشد، هیچ دسترسی ندارد
            if not user.customer_profile.is_active:
                return 'inactive'
            return user.customer_profile.role
    except Exception:
        pass
    # fallback: اگر is_staff باشد ادمین، وگرنه مشتری
    if user.is_staff:
        return 'admin'
    return 'customer'


class BaseRolePermission(permissions.BasePermission):
    """کلاس پایه که JWT را چک می‌کند"""
    allowed_roles = []

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        role = get_user_role(request.user)
        if role == 'inactive':
            return False
        return role in self.allowed_roles


class IsManager(BaseRolePermission):
    """فقط مدیرکل (manager) - مالک فروشگاه"""
    allowed_roles = ['manager']

    def has_permission(self, request, view):
        # superuser هم مدیرکل حساب می‌شود
        if request.user and request.user.is_superuser:
            return True
        return super().has_permission(request, view)


class IsAdminOrManager(BaseRolePermission):
    """ادمین فروشگاه و مدیرکل"""
    allowed_roles = ['admin', 'manager']


class IsAdmin(BaseRolePermission):
    """فقط ادمین فروشگاه"""
    allowed_roles = ['admin']


class IsVisitor(BaseRolePermission):
    """فقط ویزیتور"""
    allowed_roles = ['visitor']


class IsCustomer(BaseRolePermission):
    """فقط مشتری"""
    allowed_roles = ['customer']


class IsWholesaleApproved(permissions.BasePermission):
    """
    برای نمایش قیمت عمده: مشتری باید تایید شده باشد
    این کلاس ترکیبی است - باید با IsCustomer یا IsAuthenticated ترکیب شود
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        try:
            profile = request.user.customer_profile
            return profile.is_wholesale_approved and profile.is_active
        except Exception:
            return False


class IsOwnerOrAdminForPricing(permissions.BasePermission):
    """
    برای تعیین قیمت: فقط مدیرکل می‌تواند قیمت پایه و عمده را تعیین کند
    (بدون تغییر مدل اصلی Product - از ProductPricing استفاده می‌شود)
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        role = get_user_role(request.user)
        return role == 'manager' or request.user.is_superuser


class IsVisitorOwnerOrAdmin(permissions.BasePermission):
    """
    ویزیتور فقط به داده‌های خودش دسترسی دارد، ادمین و مدیرکل به همه
    برای استفاده در get_queryset
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        role = get_user_role(request.user)
        return role in ['visitor', 'admin', 'manager'] or request.user.is_superuser
