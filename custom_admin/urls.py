from django.urls import path
from .views import (
    AdminPanelView, GeneratePasswordView, ChangePasswordView, LogoutConfirmView,
    UsersView, UserDetailView, AddUserView, EditUserView, DeleteUserView
)

# Устанавливаем пространство имён приложения для уникальной идентификации маршрутов
app_name = 'custom_admin'

urlpatterns = [
    # Главная страница
    path('', AdminPanelView.as_view(), name='admin_panel'),

    # --- Управление паролями ---
    path('generate-password/<int:user_id>/', GeneratePasswordView.as_view(), name='generate-password'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('logout-confirm/', LogoutConfirmView.as_view(), name='logout_confirm'),

    # --- Управление пользователями ---
    path('users/', UsersView.as_view(), name='users'),
    path('user/<int:user_id>/', UserDetailView.as_view(), name='user'),
    path('add/', AddUserView.as_view(), name='add_user'),
    path('edit/<int:user_id>/', EditUserView.as_view(), name='edit_user'),
    path('delete/<int:user_id>/', DeleteUserView.as_view(), name='delete_user'),
]