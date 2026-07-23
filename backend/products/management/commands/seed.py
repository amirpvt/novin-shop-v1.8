from django.core.management.base import BaseCommand
from products.models import Product
from testimonials.models import Testimonial


PRODUCTS = [
    {
        "name": "سوسیس بالایی گوشت",
        "slug": "sosis-balai-gusht",
        "description": "۱۰۰٪ گوشت گوساله تازه با ادویه‌جات طبیعی و دودی ملایم.",
        "price": "89000",
        "unit": "هر بسته ۵۰۰ گرم",
        "tag": "پرفروش‌ترین",
        "badge": "گوشت تازه",
        "image": "https://images.pexels.com/photos/29226607/pexels-photo-29226607.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=700&w=800",
        "order": 1,
    },
    {
        "name": "کالباس گوشت کلاسیک",
        "slug": "kalbas-gusht-classic",
        "description": "بافت نرم و طعم دلچسب برای صبحانه و ساندویچ.",
        "price": "76000",
        "unit": "هر بسته ۴۰۰ گرم",
        "badge": "کم‌چرب",
        "image": "https://images.pexels.com/photos/7175710/pexels-photo-7175710.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=700&w=800",
        "order": 2,
    },
    {
        "name": "فرانکفورتر دودی",
        "slug": "frankfurter-doodi",
        "description": "سوسیس فرانکفورتر اصیل با پوشش طبیعی و طعم دودی.",
        "price": "95000",
        "unit": "هر بسته ۶ عددی",
        "tag": "جدید",
        "badge": "دودی",
        "image": "https://images.pexels.com/photos/4113455/pexels-photo-4113455.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=700&w=800",
        "order": 3,
    },
    {
        "name": "سوسیس مرغ سفید",
        "slug": "sosis-morgh-sefid",
        "description": "سبک و کم‌چرب با سینه مرغ تازه، مناسب رژیمی.",
        "price": "69000",
        "unit": "هر بسته ۵۰۰ گرم",
        "badge": "رژیمی",
        "image": "https://images.pexels.com/photos/8491087/pexels-photo-8491087.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=700&w=800",
        "order": 4,
    },
    {
        "name": "سوسیس کوکتل",
        "slug": "sosis-cocktail",
        "description": "اندازه کوچک و طعم بی‌نظیر برای مهمانی و پیش‌غذا.",
        "price": "82000",
        "unit": "هر بسته ۳۰۰ گرم",
        "badge": "مهمانی",
        "image": "https://images.pexels.com/photos/17216327/pexels-photo-17216327.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=700&w=800",
        "order": 5,
    },
    {
        "name": "کالباس کم‌نمک",
        "slug": "kalbas-kam-namak",
        "description": "ویژه سالمندان و کودکان با سدیم پایین.",
        "price": "88000",
        "unit": "هر بسته ۴۰۰ گرم",
        "badge": "کم‌نمک",
        "image": "https://images.pexels.com/photos/4637532/pexels-photo-4637532.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=700&w=800",
        "order": 6,
    },
]

TESTIMONIALS = [
    {
        "name": "سمانه رضایی",
        "role": "مشتری وفادار — تهران",
        "text": "سوسیس‌طلا از وقتی که شناختم، دیگه برند دیگه‌ای نمی‌خرم. طعمش عالی و گوشتش واقعیه!",
        "avatar": "س",
    },
    {
        "name": "محمد حسینی",
        "role": "صاحب فست‌فود — کرج",
        "text": "برای رستورانم فقط از محصولات سوسیس‌طلا استفاده می‌کنم. کیفیت و ارسال عالیه.",
        "avatar": "م",
    },
    {
        "name": "الهام کریمی",
        "role": "مشتری — اصفهان",
        "text": "سوسیس مرغ‌شون برای بچه‌م عالیه، سبک و بی‌نمک اضافه. ممنون از تیم خوبتون.",
        "avatar": "ا",
    },
]


class Command(BaseCommand):
    help = "Seed products and testimonials with sample data."

    def handle(self, *args, **options):
        for p in PRODUCTS:
            Product.objects.update_or_create(slug=p["slug"], defaults=p)
        self.stdout.write(self.style.SUCCESS(f"{len(PRODUCTS)} products seeded."))

        for t in TESTIMONIALS:
            Testimonial.objects.update_or_create(
                name=t["name"],
                defaults={
                    "role": t["role"],
                    "text": t["text"],
                    "avatar": t["avatar"],
                    "approved": True,
                },
            )
        self.stdout.write(
            self.style.SUCCESS(f"{len(TESTIMONIALS)} testimonials seeded.")
        )
