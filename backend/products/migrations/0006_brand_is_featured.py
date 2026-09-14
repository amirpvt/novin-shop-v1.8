from django.db import migrations, models


def keep_existing_home_brands_visible(apps, schema_editor):
    Brand = apps.get_model("products", "Brand")
    Brand.objects.filter(is_active=True).update(is_featured=True)


def reverse_keep_existing_home_brands_visible(apps, schema_editor):
    Brand = apps.get_model("products", "Brand")
    Brand.objects.update(is_featured=False)


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0005_add_new_food_categories"),
    ]

    operations = [
        migrations.AddField(
            model_name="brand",
            name="is_featured",
            field=models.BooleanField(default=False, verbose_name="نمایش در صفحه اصلی"),
        ),
        migrations.AddIndex(
            model_name="brand",
            index=models.Index(fields=["is_featured", "order"], name="brand_featured_order_idx"),
        ),
        migrations.RunPython(keep_existing_home_brands_visible, reverse_keep_existing_home_brands_visible),
    ]
