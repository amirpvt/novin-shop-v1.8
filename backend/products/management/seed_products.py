"""
Seed demo products for Novin Shop - Phase 2
اجرا: python manage.py seed_products
یا: python manage.py seed_products --clear
"""
from django.core.management.base import BaseCommand
from products.models import Category, Brand, Product
from django.utils.text import slugify


class Command(BaseCommand):
    help = "ساخت دسته‌بندی‌ها، برندها و محصولات نمونه برای تست فروشگاه"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="پاک کردن محصولات قبلی قبل از ساخت جدید",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            self.stdout.write(self.style.WARNING("🗑️  پاک کردن داده‌های قبلی..."))
            Product.objects.all().delete()
            Category.objects.all().delete()
            Brand.objects.all().delete()

        # ─── Categories ──────────────────────────────────────────
        self.stdout.write("📦 ساخت دسته‌بندی‌ها...")
        categories_data = [
            {"name": "سوسیس", "slug": "sausage", "order": 1, "is_featured": True},
            {"name": "کالباس", "slug": "kalbas", "order": 2, "is_featured": True},
            {"name": "فرآورده های منجمد", "slug": "frozen", "order": 3, "is_featured": True},
        ]
        categories = {}
        for cat in categories_data:
            obj, created = Category.objects.get_or_create(
                slug=cat["slug"],
                defaults={
                    "name": cat["name"],
                    "order": cat["order"],
                    "is_featured": cat["is_featured"],
                    "is_active": True,
                    "description": f"دسته {cat['name']} - محصولات نوین",
                },
            )
            categories[cat["name"]] = obj
            if created:
                self.stdout.write(self.style.SUCCESS(f"  ✅ دسته: {obj.name}"))
            else:
                self.stdout.write(f"  ↩️  دسته موجود: {obj.name}")

        # ─── Brands ──────────────────────────────────────────────
        self.stdout.write("🏷️  ساخت برندها...")
        brands_data = [
            {"name": "فرآورده های گوشتی گلچین", "slug": "golchin", "order": 1},
            {"name": "202", "slug": "202", "order": 2},
            {"name": "لاله بناب", "slug": "laleh-bonab", "order": 3},
            {"name": "سس 88", "slug": "sauce88", "order": 4},
            {"name": "شام ایرانی", "slug": "shamirani", "order": 5},
        ]
        brands = {}
        for br in brands_data:
            obj, created = Brand.objects.get_or_create(
                slug=br["slug"],
                defaults={"name": br["name"], "order": br["order"], "is_active": True},
            )
            brands[br["name"]] = obj
            if created:
                self.stdout.write(self.style.SUCCESS(f"  ✅ برند: {obj.name}"))

        # ─── Products (8 items matching data.ts mock) ───────────
        self.stdout.write("🛒 ساخت محصولات نمونه...")
        products_data = [
            {
                "name": "سوسیس بلغاری گوشت",
                "description": "۱۰۰٪ گوشت گوساله تازه با ادویه‌جات طبیعی و دودی ملایم. مناسب برای صبحانه و ساندویچ.",
                "price": 89000,
                "stock": 150,
                "unit": "pack",
                "tag": "best",
                "badge": "fresh",
                "category": "سوسیس",
                "brand": "فرآورده های گوشتی گلچین",
                "order": 1,
                "is_featured": True,
            },
            {
                "name": "کالباس گوشت کلاسیک",
                "description": "بافت نرم و طعم دلچسب برای صبحانه و ساندویچ. تهیه شده از بهترین گوشت.",
                "price": 76000,
                "stock": 80,
                "unit": "pack",
                "tag": "",
                "badge": "premium",
                "category": "کالباس",
                "brand": "فرآورده های گوشتی گلچین",
                "order": 2,
                "is_featured": True,
            },
            {
                "name": "فرانکفورتر دودی",
                "description": "سوسیس فرانکفورتر اصیل با پوشش طبیعی و طعم دودی بی‌نظیر.",
                "price": 95000,
                "stock": 45,
                "unit": "pack",
                "tag": "new",
                "badge": "hot",
                "category": "سوسیس",
                "brand": "202",
                "order": 3,
            },
            {
                "name": "سوسیس مرغ سفید",
                "description": "سبک و کم‌چرب با سینه مرغ تازه، مناسب رژیم‌های کم‌چربی.",
                "price": 69000,
                "stock": 120,
                "unit": "pack",
                "tag": "",
                "badge": "fresh",
                "category": "سوسیس",
                "brand": "لاله بناب",
                "order": 4,
            },
            {
                "name": "سوسیس کوکتل",
                "description": "اندازه کوچک و طعم بی‌نظیر برای مهمانی و پیش‌غذا — منجمد و آماده.",
                "price": 82000,
                "stock": 200,
                "unit": "pack",
                "tag": "best",
                "badge": "",
                "category": "فرآورده های منجمد",
                "brand": "سس 88",
                "order": 5,
            },
            {
                "name": "کالباس کم‌نمک",
                "description": "ویژه سالمندان و کودکان با سدیم پایین و طعم طبیعی.",
                "price": 88000,
                "stock": 0,  # ناموجود برای تست
                "unit": "pack",
                "tag": "special",
                "badge": "premium",
                "category": "کالباس",
                "brand": "شام ایرانی",
                "order": 6,
            },
            {
                "name": "ناگت مرغ",
                "description": "ناگت مرغ ترد و آماده طبخ، منجمد و بسته‌بندی بهداشتی با طعم عالی.",
                "price": 79000,
                "stock": 60,
                "unit": "pack",
                "tag": "",
                "badge": "",
                "category": "فرآورده های منجمد",
                "brand": "شام ایرانی",
                "order": 7,
                "is_featured": True,
            },
            {
                "name": "کتلت گوشت",
                "description": "کتلت گوشت خانگی با طعم اصیل، منجمد و آماده سرخ‌کردن.",
                "price": 99000,
                "stock": 35,
                "unit": "pack",
                "tag": "best",
                "badge": "hot",
                "category": "فرآورده های منجمد",
                "brand": "شام ایرانی",
                "order": 8,
            },
        ]

        created_count = 0
        for p in products_data:
            slug = slugify(p["name"], allow_unicode=True)
            # اسلاگ فارسی را به انگلیسی تبدیل کن برای URL تمیزتر
            # اگر اسلاگ تکراری بود، عدد اضافه کن
            base_slug = slug
            counter = 1
            while Product.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1

            cat_obj = categories.get(p["category"])
            brand_obj = brands.get(p["brand"])

            product, created = Product.objects.get_or_create(
                slug=slug,
                defaults={
                    "name": p["name"],
                    "description": p["description"],
                    "price": p["price"],
                    "stock": p["stock"],
                    "unit": p["unit"],
                    "tag": p["tag"],
                    "badge": p["badge"],
                    "category": cat_obj,
                    "brand": brand_obj,
                    "order": p["order"],
                    "available": p["stock"] > 0,
                    "is_featured": p.get("is_featured", False),
                    "status": "published",
                },
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"  ✅ محصول: {product.name} - {product.price} تومان - موجودی: {product.stock}"))
            else:
                # اگر وجود داشت، موجودی را آپدیت کن
                product.stock = p["stock"]
                product.available = p["stock"] > 0
                product.price = p["price"]
                product.save(update_fields=["stock", "available", "price"])
                self.stdout.write(f"  ↩️  آپدیت: {product.name} (موجودی: {product.stock})")

        self.stdout.write(self.style.SUCCESS(f"\n🎉 تمام شد! {created_count} محصول جدید ساخته شد."))
        self.stdout.write(self.style.SUCCESS(f"📊 مجموع محصولات: {Product.objects.count()}"))
        self.stdout.write(self.style.SUCCESS(f"📦 دسته‌بندی: {Category.objects.count()} | برند: {Brand.objects.count()}"))
        self.stdout.write("\n👉 حالا برو http://127.0.0.1:8000/api/products/ و محصولات را ببین!")
