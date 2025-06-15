from django.contrib.admin import AdminSite
from django.contrib.auth.models import User
from django.urls import path
from .views import GeneratePasswordView

class CustomAdminSite(AdminSite):
    site_header = 'Админ-панель'
    site_title = 'Админ-панель'
    index_title = 'Управление пользователями'

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('generate-password/<int:user_id>/', GeneratePasswordView.as_view(), name='generate-password'),
        ]
        return custom_urls + urls

# Создаем экземпляр админ-сайта
custom_admin_site = CustomAdminSite(name='custom_admin')

# Регистрируем модель User (без групп)
custom_admin_site.register(User)