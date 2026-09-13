"""
Django settings with dashboard app added (only allowed change)
"""
import os
from pathlib import Path
from datetime import timedelta
import environ
from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DEBUG=(bool, True),
)

env_file = BASE_DIR / ".env"
if env_file.exists():
    environ.Env.read_env(env_file)

DEBUG = env("DEBUG", default=True)
INSECURE_DEFAULT_SECRET_KEY = "django-insecure-change-me-in-production"
SECRET_KEY = env("SECRET_KEY", default=INSECURE_DEFAULT_SECRET_KEY if DEBUG else None)

if not DEBUG:
    if not SECRET_KEY:
        raise ImproperlyConfigured("SECRET_KEY برای محیط Production الزامی است.")
    if SECRET_KEY == INSECURE_DEFAULT_SECRET_KEY:
        raise ImproperlyConfigured("SECRET_KEY پیش‌فرض ناامن است و در Production مجاز نیست.")
    if len(SECRET_KEY) < 50:
        raise ImproperlyConfigured("SECRET_KEY در Production باید حداقل 50 کاراکتر باشد.")
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=["*"] if DEBUG else [])

if not DEBUG:
    if not ALLOWED_HOSTS:
        raise ImproperlyConfigured("ALLOWED_HOSTS برای محیط Production الزامی است.")
    if "*" in ALLOWED_HOSTS:
        raise ImproperlyConfigured("ALLOWED_HOSTS='*' در Production مجاز نیست؛ دامنه واقعی سایت را تنظیم کنید.")

USE_X_FORWARDED_HOST = env.bool("USE_X_FORWARDED_HOST", default=True)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "django_filters",
    "corsheaders",
    # Local apps
    "accounts",
    "products",
    "orders",
    "testimonials",
    "dashboard",  # <-- تنها تغییر مجاز دوم: اضافه شدن اپ داشبورد جدید
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "novinshop.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "novinshop.wsgi.application"

# Database
# Development fallback: SQLite
# Production delivery: set DATABASE_URL in backend/.env, for example:
# DATABASE_URL=postgres://novin_user:STRONG_PASSWORD@127.0.0.1:5432/novin_shop
DATABASE_URL = env("DATABASE_URL", default=None)

if DATABASE_URL:
    DATABASES = {"default": env.db("DATABASE_URL")}
else:
    if not DEBUG:
        raise ImproperlyConfigured("DATABASE_URL برای محیط Production الزامی است و باید به PostgreSQL اشاره کند.")
    DATABASES = {
        "default": env.db(
            "DATABASE_URL",
            default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        )
    }

if not DEBUG and DATABASES["default"].get("ENGINE") != "django.db.backends.postgresql":
    raise ImproperlyConfigured("در Production استفاده از SQLite مجاز نیست؛ DATABASE_URL باید PostgreSQL باشد.")

# Persistent DB connections are useful on PostgreSQL production deployments.
DATABASES["default"]["CONN_MAX_AGE"] = env.int("DB_CONN_MAX_AGE", default=60)

# PostgreSQL-only safety/performance options.
if DATABASES["default"].get("ENGINE") == "django.db.backends.postgresql":
    DATABASES["default"].setdefault("OPTIONS", {})
    DATABASES["default"]["OPTIONS"].setdefault("connect_timeout", env.int("DB_CONNECT_TIMEOUT", default=10))

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "fa-ir"
TIME_ZONE = "Asia/Tehran"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CORS_ALLOW_ALL_ORIGINS = env.bool("CORS_ALLOW_ALL_ORIGINS", default=DEBUG)
CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS",
    default=["http://localhost:5173", "http://localhost:3000"] if DEBUG else []
)
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=CORS_ALLOWED_ORIGINS)

SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=not DEBUG)
SESSION_COOKIE_SECURE = env.bool("SESSION_COOKIE_SECURE", default=not DEBUG)
CSRF_COOKIE_SECURE = env.bool("CSRF_COOKIE_SECURE", default=not DEBUG)
SECURE_HSTS_SECONDS = env.int("SECURE_HSTS_SECONDS", default=0 if DEBUG else 31536000)
SECURE_HSTS_INCLUDE_SUBDOMAINS = env.bool("SECURE_HSTS_INCLUDE_SUBDOMAINS", default=not DEBUG)
SECURE_HSTS_PRELOAD = env.bool("SECURE_HSTS_PRELOAD", default=not DEBUG)
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

if not DEBUG:
    if CORS_ALLOW_ALL_ORIGINS:
        raise ImproperlyConfigured("CORS_ALLOW_ALL_ORIGINS=True در Production مجاز نیست.")
    if not CORS_ALLOWED_ORIGINS:
        raise ImproperlyConfigured("CORS_ALLOWED_ORIGINS برای محیط Production الزامی است.")
    insecure_origins = [origin for origin in CORS_ALLOWED_ORIGINS if origin.startswith("http://") or "localhost" in origin or "127.0.0.1" in origin]
    if insecure_origins:
        raise ImproperlyConfigured("CORS_ALLOWED_ORIGINS در Production باید فقط شامل دامنه‌های HTTPS واقعی باشد.")

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(days=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# Payment / Zarinpal
FRONTEND_URL = env("FRONTEND_URL", default="http://localhost:5173").rstrip("/")
ZARINPAL_MERCHANT_ID = env("ZARINPAL_MERCHANT_ID", default="")
ZARINPAL_SANDBOX = env.bool("ZARINPAL_SANDBOX", default=DEBUG)
ZARINPAL_REQUEST_TIMEOUT = env.int("ZARINPAL_REQUEST_TIMEOUT", default=10)

if not DEBUG:
    if not FRONTEND_URL.startswith("https://") or "localhost" in FRONTEND_URL or "127.0.0.1" in FRONTEND_URL:
        raise ImproperlyConfigured("FRONTEND_URL در Production باید دامنه واقعی HTTPS باشد.")
    if not ZARINPAL_MERCHANT_ID:
        raise ImproperlyConfigured("ZARINPAL_MERCHANT_ID برای Production الزامی است.")
    if ZARINPAL_MERCHANT_ID == "00000000-0000-0000-0000-000000000000":
        raise ImproperlyConfigured("Merchant ID تستی زرین‌پال در Production مجاز نیست.")
    if ZARINPAL_SANDBOX:
        raise ImproperlyConfigured("ZARINPAL_SANDBOX=True در Production مجاز نیست.")

# Dashboard JWT: مسیرهای عمومی تحت تاثیر نیستند، فقط /api/dashboard/* با IsAuthenticated + Role check محافظت می‌شود
# این تنظیم در dashboard/permissions.py اعمال شده است
