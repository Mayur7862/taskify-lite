from pathlib import Path
from corsheaders.defaults import default_headers  # <-- ADD

# --- Paths ---
BASE_DIR = Path(__file__).resolve().parent.parent

# --- Core flags ---
SECRET_KEY = "dev-only-secret-key"  # replace in prod
DEBUG = True
ALLOWED_HOSTS = []

# --- Apps ---
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "graphene_django",
    "corsheaders",

    "core",
]

# --- Middleware ---
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # must be first
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",

    "core.middleware.OrgContextMiddleware",
]

# --- URL & WSGI/ASGI ---
ROOT_URLCONF = "server.urls"
WSGI_APPLICATION = "server.wsgi.application"

# --- Templates ---
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

# --- Database (SQLite for first boot) ---
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# --- i18n/time ---
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# --- Static files ---
STATIC_URL = "/static/"
STATICFILES_DIRS = []
STATIC_ROOT = BASE_DIR / "staticfiles"

# --- Graphene (GraphQL) ---
GRAPHENE = {
    "SCHEMA": "core.schema.schema",
}

# --- CORS (dev) ---
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_HEADERS = list(default_headers) + ["X-Org-Slug"]  # <-- ALLOW CUSTOM HEADER

# --- Misc ---
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
