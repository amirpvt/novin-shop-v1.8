from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0004_alter_payment_options_order_order_user_created_idx_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='PendingWholesalePayment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('payment_number', models.CharField(max_length=100, unique=True, verbose_name='شناسه پرداخت')),
                ('amount', models.DecimalField(decimal_places=0, max_digits=12, verbose_name='مبلغ')),
                ('payload', models.JSONField(verbose_name='اطلاعات درخواست عمده')),
                ('payment_status', models.CharField(choices=[('PENDING', 'در انتظار پرداخت'), ('SUCCESS', 'موفق'), ('FAILED', 'ناموفق')], default='PENDING', max_length=20, verbose_name='وضعیت پرداخت')),
                ('authority', models.CharField(blank=True, max_length=255, null=True, verbose_name='Authority زرین‌پال')),
                ('transaction_id', models.CharField(blank=True, max_length=255, null=True, verbose_name='کد پیگیری تراکنش')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='تاریخ بروزرسانی')),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='pending_wholesale_payments', to=settings.AUTH_USER_MODEL, verbose_name='کاربر')),
                ('wholesale_request', models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='payment_intent', to='orders.wholesalerequest', verbose_name='درخواست عمده ثبت‌شده')),
            ],
            options={
                'verbose_name': 'پرداخت در انتظار درخواست عمده',
                'verbose_name_plural': 'پرداخت‌های در انتظار درخواست عمده',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='pendingwholesalepayment',
            index=models.Index(fields=['payment_status', '-created_at'], name='pending_wh_status_idx'),
        ),
        migrations.AddIndex(
            model_name='pendingwholesalepayment',
            index=models.Index(fields=['user', '-created_at'], name='pending_wh_user_idx'),
        ),
        migrations.AddConstraint(
            model_name='pendingwholesalepayment',
            constraint=models.CheckConstraint(condition=models.Q(('amount__gte', 0)), name='pending_wh_amount_non_negative'),
        ),
    ]
