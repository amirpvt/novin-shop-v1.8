"""
ساخت کاربران نمونه برای تست.
اجرا: python manage.py create_demo_users
"""
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from accounts.models import Customer

User = get_user_model()


class Command(BaseCommand):
    help = "ساخت کاربران نمونه (ادمین + مشتری تست)"

    def handle(self, *args, **options):
        # 1. سوپر ادمین (اگر وجود ندارد)
        if not User.objects.filter(username="admin").exists():
            admin = User.objects.create_superuser(
                username="admin",
                email="admin@novin-shop.ir",
                password="admin123456",
                first_name="مدیر",
                last_name="کل",
            )
            Customer.objects.create(
                user=admin,
                phone="09120000000",
                customer_type="both",
                is_wholesale_approved=True,
            )
            self.stdout.write(self.style.SUCCESS("✅ ادمین ساخته شد: admin / admin123456"))
        else:
            self.stdout.write(self.style.WARNING("⚠️  ادمین قبلاً وجود دارد."))

        # 2. مشتری تست عمده
        if not User.objects.filter(username="customer_test").exists():
            user = User.objects.create_user(
                username="customer_test",
                email="customer@test.ir",
                password="customer123",
                first_name="مشتری",
                last_name="تست",
            )
            Customer.objects.create(
                user=user,
                phone="09123456789",
                customer_type="wholesale",
                is_wholesale_approved=True,
                city="تهران",
                address="خیابان آزادی، پلاک ۱۰۰",
            )
            self.stdout.write(self.style.SUCCESS("✅ مشتری تست ساخته شد: customer_test / customer123"))
        else:
            self.stdout.write(self.style.WARNING("⚠️  مشتری تست قبلاً وجود دارد."))

        self.stdout.write(self.style.SUCCESS("\n🎉 همه کاربران آماده هستند."))
