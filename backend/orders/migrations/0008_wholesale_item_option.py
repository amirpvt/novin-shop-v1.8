from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0007_product_wholesale_option'),
        ('orders', '0007_update_retail_order_status_flow'),
    ]

    operations = [
        migrations.AddField(
            model_name='wholesalerequestitem',
            name='wholesale_option',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='wholesale_items', to='products.productwholesaleoption', verbose_name='نوع فروش عمده'),
        ),
        migrations.AddField(
            model_name='wholesalerequestitem',
            name='wholesale_option_label',
            field=models.CharField(blank=True, max_length=60, verbose_name='عنوان نوع عمده'),
        ),
        migrations.AddField(
            model_name='wholesalerequestitem',
            name='wholesale_unit_price',
            field=models.DecimalField(decimal_places=0, default=0, max_digits=12, verbose_name='قیمت نوع عمده در زمان سفارش'),
        ),
    ]
