from django.db import migrations


NEW_CATEGORIES = [
    {
        "name": "سس",
        "slug": "sauce",
        "order": 4,
        "description": "انواع سس‌های غذایی برای فروش عمده و خرده",
    },
    {
        "name": "ترشی، خیارشور و زیتون",
        "slug": "pickles-olives",
        "order": 5,
        "description": "انواع ترشی، خیارشور و زیتون برای رستوران‌ها، فست‌فودها و مصرف خانگی",
    },
    {
        "name": "نوشیدنی ها",
        "slug": "drinks",
        "order": 6,
        "description": "انواع نوشیدنی‌های سرد و مکمل سفارش‌های غذایی",
    },
]


def add_categories(apps, schema_editor):
    Category = apps.get_model("products", "Category")
    for item in NEW_CATEGORIES:
        Category.objects.update_or_create(
            slug=item["slug"],
            defaults={
                "name": item["name"],
                "order": item["order"],
                "is_active": True,
                "is_featured": True,
                "description": item["description"],
            },
        )


def remove_categories(apps, schema_editor):
    Category = apps.get_model("products", "Category")
    Category.objects.filter(slug__in=[item["slug"] for item in NEW_CATEGORIES]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0004_brand_brand_active_order_idx_and_more"),
    ]

    operations = [
        migrations.RunPython(add_categories, remove_categories),
    ]
