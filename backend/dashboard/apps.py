from django.apps import AppConfig


class DashboardConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'dashboard'
    verbose_name = 'سیستم مدیریت فروش - داشبورد'

    def ready(self):
        # برای سیگنال‌ها در آینده اگر نیاز شد
        pass
