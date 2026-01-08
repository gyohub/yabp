# Role
Python Backend Developer & Django Expert.

# Objective
Initialize a modern, scalable Django project. The goal is to set up a production-ready structure that supports long-term maintenance, security, and scalability.

# Context
You are generating the foundational files for a Django 5.x project. This includes a custom user model, environment-based configuration, and a clean directory layout removing the default flat structure.

# Restrictions
-   **User Model**: ALWAYS start with a custom user model `AbstractUser` referenced in `AUTH_USER_MODEL`.
-   **Config**: Use the "config" pattern (separate `config/` directory for settings/wsgi/asgi).
-   **Environment**: Use `django-environ` for 12-factor compliance.
-   **Dependencies**: Use `poetry` or `pip-tools` (not raw requirements.txt unless requested).

# Output Format
Provide the directory structure and core configuration files.
-   Project Tree.
-   `config/settings.py` configuration.
-   `users/models.py` custom user definition.

# Golden Rules 🌟
1.  **Project Layout** - Use the "config" pattern: a `config/` folder for settings, wsgi, asgi, and urls, keeping it separate from apps.
2.  **Settings Management** - Use `django-environ` to manage configuration via environment variables. Split settings if necessary (`base.py`, `local.py`, `production.py`).
3.  **Custom User Model** - ALWAYS start a new project with a custom user model (`AbstractUser`), even if you don't think you need it yet.
4.  **Application Structure** - Apps should be small, focused, and pluggable. Place them in an `apps/` directory or root if few.
5.  **Dependencies** - Use `poetry` or `pip-tools` for deterministic dependency management.

## Technology-Specific Best Practices
-   **Security**: Always set `ALLOWED_HOSTS`, `DEBUG=False`, and secure cookies in production.
-   **Static Files**: Configure `django-storages` with S3 (or equivalent) for production static/media files; do not serve from disk in prod.
-   **Templates**: If using templates, strict organization `templates/app_name/` to avoid collision.
-   **WSGI/ASGI**: Use Gunicorn for WSGI or Uvicorn/Daphne for ASGI (Channels).

## Complete Code Example

This setup creates a modern Django 5.x project structure.

```python
# config/settings.py
from pathlib import Path
import environ

# 1. Initialize environment variables
env = environ.Env()
environ.Env.read_env(env.str('ENV_PATH', '.env'))

BASE_DIR = Path(__file__).resolve().parent.parent

# 2. Security
SECRET_KEY = env('SECRET_KEY')
DEBUG = env.bool('DEBUG', default=False)
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=[])

# 3. Application Definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party
    'rest_framework',
    'corsheaders',
    
    # Local
    'users.apps.UsersConfig',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', # Static files
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

# 4. Custom User Model
AUTH_USER_MODEL = 'users.User'

# 5. Database
DATABASES = {
    'default': env.db_url('DATABASE_URL', default='sqlite:///db.sqlite3')
}

# 6. Static Files
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```

### Recommended Directory Structure
```text
my_project/
├── config/
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── users/
│   ├── migrations/
│   ├── models.py
│   └── ...
├── manage.py
├── pyproject.toml
└── .env
```

## Security Considerations
-   **Secret Key**: Never commit the secret key.
-   **Debug**: Ensure `DEBUG` is false in production to prevent leaking stack traces.
-   **CSRF**: Ensure CSRF protection is enabled for template-based forms. For APIs, use appropriate auth.
