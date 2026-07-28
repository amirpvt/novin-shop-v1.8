from rest_framework import permissions

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    اجازه خواندن برای همه، نوشتن فقط برای ادمین‌ها.
    برای پنل مدیریت محصولات حرفه‌ای.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        # نوشتن فقط برای کاربر لاگین و staff
        return request.user and request.user.is_authenticated and request.user.is_staff

class IsSuperAdmin(permissions.BasePermission):
    """فقط superuser"""
    def has_permission(self, request, view):
        return request.user and request.user.is_superuser
