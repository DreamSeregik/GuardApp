from django.urls import path
from . import views

app_name = 'custom_admin'

urlpatterns = [
    path('', views.AdminPanelView.as_view(), name='admin_panel'),
    path('api/users/', views.ApiUsersView.as_view(), name='api_users'),
    path('api/user/<int:user_id>/', views.UserDetailView.as_view(), name='api_user'),
    path('add/', views.AddUserView.as_view(), name='add_user'),
    path('edit/<int:user_id>/', views.EditUserView.as_view(), name='edit_user'),
    path('delete/<int:user_id>/', views.DeleteUserView.as_view(), name='delete_user'),
    path('generate-password/<int:user_id>/', views.GeneratePasswordView.as_view(), name='generate-password'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change_password'),
    path('logout-confirm/', views.LogoutConfirmView.as_view(), name='logout_confirm'),
]