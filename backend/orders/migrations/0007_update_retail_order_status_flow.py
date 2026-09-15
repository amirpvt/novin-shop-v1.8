from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0006_pending_retail_payment'),
    ]

    operations = [
        migrations.AlterField(
            model_name='order',
            name='order_status',
            field=models.CharField(
                choices=[
                    ('PENDING', 'در انتظار پرداخت'),
                    ('PAID_PENDING_REVIEW', 'پرداخت شده / در انتظار بررسی'),
                    ('CONFIRMED', 'تایید شده'),
                    ('PREPARING', 'در حال آماده‌سازی'),
                    ('SHIPPED', 'ارسال شده'),
                    ('DELIVERED', 'تحویل داده شده'),
                    ('CANCELLED', 'لغو شده'),
                ],
                default='PENDING',
                max_length=20,
                verbose_name='وضعیت سفارش',
            ),
        ),
    ]
