from django.db import migrations


CHEESE_CATEGORY = {
    "name": "پنیر ها",
    "slug": "cheese",
    "order": 7,
    "description": "انواع پنیر برای فروش عمده و خرده، مناسب رستوران‌ها، فست‌فودها و مصرف خانگی",
}


def add_cheese_category(apps, schema_editor):
    Category = apps.get_model("products", "Category")
    Category.objects.update_or_create(
        slug=CHEESE_CATEGORY["slug"],
        defaults={
            "name": CHEESE_CATEGORY["name"],
            "order": CHEESE_CATEGORY["order"],
            "is_active": True,
            "is_featured": True,
            "description": CHEESE_CATEGORY["description"],
        },
    )


def remove_cheese_category(apps, schema_editor):
    Category = apps.get_model("products", "Category")
    Category.objects.filter(slug=CHEESE_CATEGORY["slug"]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0007_product_wholesale_option"),
    ]

    operations = [
        migrations.RunPython(add_cheese_category, remove_cheese_category),
    ]
