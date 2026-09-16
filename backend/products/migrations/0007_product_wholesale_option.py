from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0006_brand_is_featured'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProductWholesaleOption',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(max_length=30, verbose_name='کد نوع عمده')),
                ('label', models.CharField(max_length=60, verbose_name='عنوان نوع عمده')),
                ('unit_price', models.DecimalField(decimal_places=0, max_digits=12, verbose_name='قیمت این نوع عمده (تومان)')),
                ('is_active', models.BooleanField(default=True, verbose_name='فعال')),
                ('order', models.PositiveIntegerField(default=0, verbose_name='ترتیب نمایش')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='آخرین بروزرسانی')),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='wholesale_options', to='products.product', verbose_name='محصول')),
            ],
            options={
                'verbose_name': 'گزینه فروش عمده محصول',
                'verbose_name_plural': 'گزینه‌های فروش عمده محصول',
                'ordering': ['order', 'id'],
                'unique_together': {('product', 'code')},
            },
        ),
        migrations.AddIndex(
            model_name='productwholesaleoption',
            index=models.Index(fields=['product', 'is_active', 'order'], name='whopt_product_active_idx'),
        ),
        migrations.AddConstraint(
            model_name='productwholesaleoption',
            constraint=models.CheckConstraint(condition=models.Q(('unit_price__gte', 0)), name='whopt_price_non_negative'),
        ),
    ]
