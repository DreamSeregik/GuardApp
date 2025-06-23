import re
import secrets
import string
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.db import DatabaseError, IntegrityError
from django.http import JsonResponse, HttpResponseRedirect
from django.shortcuts import redirect, render, get_object_or_404
from django.urls import reverse, reverse_lazy
from django.views import View
from django.views.generic import FormView
from django.contrib import messages
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.views import LogoutView
from .forms import ChangePasswordForm, CustomUserCreationForm, CustomUserChangeForm
from .emails import send_password_reset_email, send_welcome_email

# @section Миксины
class AdminsOnlyMixin:
    """
    Миксин для ограничения доступа только администраторам.
    """
    def dispatch(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return redirect('guard:forbidden')
        return super().dispatch(request, *args, **kwargs)

# @section Вспомогательные функции
def validate_full_name(full_name):
    """
    Валидирует ФИО.
    """
    if not full_name:
        return True, None
    full_name_regex = r'^[А-ЯЁ][а-яё]+\s[А-ЯЁ][а-яё]+(?:\s[А-ЯЁ][а-яё]+)?$'
    if not re.match(full_name_regex, full_name):
        return False, 'Введите корректное ФИО (2-3 слова, каждое с заглавной буквы)'
    return True, None

def validate_email(email, is_required=False):
    """
    Валидирует email.
    """
    if is_required and not email:
        return False, 'Пожалуйста, введите email'
    if email:
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, email):
            return False, 'Введите корректный email (например, example@domain.com)'
    return True, None

def validate_password(password1, password2, is_required=False):
    """
    Валидирует пароли.
    """
    if not is_required:
        return True, None
    errors = {}
    password_regex = r'^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};\'"\\|,.<>\/?]{8,}$'
    
    if not password1:
        errors['password1'] = ['Введите пароль']
    elif len(password1) < 8:
        errors['password1'] = ['Пароль должен содержать минимум 8 символов']
    elif not re.match(password_regex, password1):
        errors['password1'] = ['Пароль должен содержать буквы и цифры']
    
    if not password2:
        errors['password2'] = ['Введите подтверждение пароля']
    elif password1 != password2:
        errors['password2'] = ['Пароли не совпадают']
    
    return len(errors) == 0, errors if errors else None

def generate_random_password():
    """
    Генерирует случайный пароль длиной 12 символов.
    """
    return ''.join(secrets.choice(string.ascii_letters + string.digits + string.punctuation) for _ in range(12))

# @section Представления
class AdminPanelView(LoginRequiredMixin, AdminsOnlyMixin, View):
    """
    Представление для административной панели.
    """
    template_name = 'custom_admin/admin_panel.html'

    def get(self, request):
        search_query = request.GET.get('search', '')
        role_filter = request.GET.get('role', 'a')
        status_filter = request.GET.get('status', 'a')
        sort_type = request.GET.get('sort', 'desc')

        users = User.objects.all().exclude(username='system_notification')
        if search_query:
            users = users.filter(username__icontains=search_query) | users.filter(email__icontains=search_query)
        if role_filter == 'admin':
            users = users.filter(is_staff=True)
        elif role_filter == 'user':
            users = users.filter(is_staff=False)
        if status_filter == 'active':
            users = users.filter(is_active=True)
        elif status_filter == 'inactive':
            users = users.filter(is_active=False)
        users = users.order_by('username' if sort_type == 'asc' else '-username')

        context = {
            'users': users,
            'search_query': search_query,
            'role_filter': role_filter,
            'status_filter': status_filter,
            'sort_type': sort_type,
        }
        return render(request, self.template_name, context)

class GeneratePasswordView(LoginRequiredMixin, AdminsOnlyMixin, View):
    """
    Представление для генерации и отправки нового пароля пользователю.
    """
    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            if user.id == request.user.id:
                return JsonResponse({'error': 'Нельзя сгенерировать пароль для текущего пользователя здесь'}, status=403)
            password = generate_random_password()
            user.set_password(password)
            user.save()
            
            full_name = f"{user.last_name} {user.first_name}".strip()
            email_sent = send_password_reset_email(
                to_email=user.email,
                username=user.username,
                full_name=full_name,
                password=password,
                request=request
            )
            
            if email_sent:
                request.session[f'password_generated_{user_id}'] = True
                return JsonResponse({'success': 'Пароль сгенерирован и отправлен на e-mail'})
            return JsonResponse({'error': 'Ошибка отправки e-mail'}, status=500)
                
        except User.DoesNotExist:
            return JsonResponse({'error': 'Пользователь не найден'}, status=404)

class ChangePasswordView(LoginRequiredMixin, FormView):
    """
    Представление для смены пароля текущего пользователя.
    """
    template_name = 'custom_admin/change_password.html'
    form_class = ChangePasswordForm
    success_url = reverse_lazy('custom_admin:admin_panel')

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user
        return kwargs

    def form_valid(self, form):
        form.save()
        update_session_auth_hash(self.request, form.user)
        return super().form_valid(form)

    def form_invalid(self, form):
        return super().form_invalid(form)

class LogoutConfirmView(LoginRequiredMixin, View):
    """
    Представление для подтверждения выхода из системы.
    """
    template_name = 'custom_admin/logout_confirm.html'

    def get(self, request):
        return render(request, self.template_name)

class UsersView(LoginRequiredMixin, AdminsOnlyMixin, View):
    """
    API-представление для получения списка пользователей.
    """
    def get(self, request, *args, **kwargs):
        users = User.objects.all().exclude(username='system_notification')
        search_query = request.GET.get('search', '')
        role_filter = request.GET.get('role', 'a')
        status_filter = request.GET.get('status', 'a')
        sort_type = request.GET.get('sort', 'asc')

        if search_query:
            users = users.filter(
                username__icontains=search_query
            ) | users.filter(
                email__icontains=search_query
            ) | users.filter(
                last_name__icontains=search_query
            ) | users.filter(
                first_name__icontains=search_query
            )
        if role_filter == 'admin':
            users = users.filter(is_staff=True)
        elif role_filter == 'user':
            users = users.filter(is_staff=False)
        if status_filter == 'active':
            users = users.filter(is_active=True)
        elif status_filter == 'inactive':
            users = users.filter(is_active=False)

        users = users.order_by('username' if sort_type == 'asc' else '-username')

        user_list = [{
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name or '',
            'last_name': user.last_name or ''
        } for user in users]

        return JsonResponse({'users': user_list})

class UserDetailView(LoginRequiredMixin, AdminsOnlyMixin, View):
    """
    Представление для получения информации о пользователе.
    """
    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            return JsonResponse({
                'username': user.username,
                'email': user.email,
                'last_name': user.last_name,
                'first_name': user.first_name,
                'is_active': user.is_active,
                'is_staff': user.is_staff,
                'is_current_user': user.id == request.user.id,
            })
        except User.DoesNotExist:
            return JsonResponse({'error': 'Пользователь не найден'}, status=404)

class AddUserView(LoginRequiredMixin, AdminsOnlyMixin, View):
    """
    Представление для добавления нового пользователя.
    """
    template_name = 'custom_admin/admin_panel.html'
    form_class = CustomUserCreationForm

    def get(self, request):
        return render(request, self.template_name, {'form': self.form_class()})

    def post(self, request):
        username = request.POST.get('username', '').strip()
        if not username:
            return JsonResponse({'error': 'Логин не указан'}, status=400)
        if User.objects.filter(username=username).exists():
            return JsonResponse({'error': f'Пользователь с логином "{username}" уже существует'}, status=400)
        
        form = self.form_class(request.POST)
        full_name = request.POST.get('full_name', '').strip()
        email = request.POST.get('email', '').strip()
        generate_password = request.POST.get('generate_password') == 'on'
        password1 = request.POST.get('password1', '')
        password2 = request.POST.get('password2', '')
        
        errors = {}
        is_valid, full_name_error = validate_full_name(full_name)
        if not is_valid:
            errors['full_name'] = [full_name_error]
        
        is_valid, email_error = validate_email(email, generate_password)
        if not is_valid:
            errors['email'] = [email_error]
        
        is_valid, password_errors = validate_password(password1, password2, not generate_password)
        if not is_valid:
            errors.update(password_errors)
        
        if errors:
            return JsonResponse({'error': 'Ошибка валидации формы', 'details': errors}, status=400)
        
        if form.is_valid():
            user = form.save(commit=False)
            if full_name:
                parts = full_name.split(maxsplit=1)
                user.last_name = parts[0] if parts else ''
                user.first_name = parts[1] if len(parts) > 1 else ''
            else:
                user.first_name = ''
                user.last_name = ''
                
            try:
                if form.cleaned_data['generate_password']:
                    password = generate_random_password()
                    user.set_password(password)
                    user.save()
                    success = send_welcome_email(
                        to_email=user.email,
                        username=user.username,
                        full_name=full_name,
                        password=password
                    )
                    if success:
                        return JsonResponse({'success': f'Пользователь "{username}" создан, пароль отправлен на {user.email}'})
                    return JsonResponse({'error': f'Не удалось отправить пароль на email "{user.email}"'}, status=500)
                user.set_password(form.cleaned_data['password1'])
                user.save()
                return JsonResponse({'success': f'Пользователь "{username}" успешно создан'})
            except Exception as e:
                return JsonResponse({'error': f'Не удалось сохранить пользователя "{username}": {str(e)}'}, status=500)
        
        form_errors = {field: errors for field, errors in form.errors.items()}
        if '__all__' in form_errors:
            form_errors['general'] = form_errors.pop('__all__')
        return JsonResponse({'error': 'Ошибка валидации формы', 'details': form_errors}, status=400)

class EditUserView(LoginRequiredMixin, AdminsOnlyMixin, View):
    """
    Представление для редактирования пользователя.
    """
    template_name = 'custom_admin/admin_panel.html'
    form_class = CustomUserChangeForm

    def get(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        initial_data = {
            'username': user.username,
            'email': user.email,
            'full_name': f"{user.last_name} {user.first_name}".strip(),
            'is_staff': user.is_staff,
            'is_active': user.is_active,
        }
        form = self.form_class(instance=user, initial=initial_data)
        return render(request, self.template_name, {'form': form, 'edit_user': user})

    def post(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        is_current_user = user.id == request.user.id
        form = self.form_class(request.POST, instance=user)
        
        full_name = request.POST.get('full_name', '').strip()
        email = request.POST.get('email', '').strip()
        generate_password = request.POST.get('generate_password') == 'on'
        change_password = request.POST.get('change_password') == 'on'
        password1 = request.POST.get('password1', '')
        password2 = request.POST.get('password2', '')
        
        errors = {}
        is_valid, full_name_error = validate_full_name(full_name)
        if not is_valid:
            errors['full_name'] = [full_name_error]
        
        is_valid, email_error = validate_email(email, generate_password)
        if not is_valid:
            errors['email'] = [email_error]
        
        is_valid, password_errors = validate_password(password1, password2, change_password and not generate_password)
        if not is_valid:
            errors.update(password_errors)
        
        if is_current_user:
            if request.POST.get('is_active') != 'on':
                errors['is_active'] = ['Нельзя деактивировать собственную учетную запись']
            if request.POST.get('is_staff') != 'on':
                errors['is_staff'] = ['Нельзя снять собственные права администратора']
            if generate_password or change_password:
                errors['password'] = ['Для смены пароля используйте настройки профиля']

        if errors:
            return JsonResponse({'error': 'Ошибка валидации формы', 'details': errors}, status=400)
        
        if form.is_valid():
            user = form.save(commit=False)
            if full_name:
                parts = full_name.split(maxsplit=1)
                user.last_name = parts[0] if parts else ''
                user.first_name = parts[1] if len(parts) > 1 else ''
            else:
                user.first_name = ''
                user.last_name = ''

            try:
                if not is_current_user:
                    if form.cleaned_data['generate_password']:
                        password = generate_random_password()
                        user.set_password(password)
                        request.session.pop(f'password_generated_{user_id}', None)
                        user.save()
                        send_password_reset_email(
                            to_email=user.email,
                            username=user.username,
                            full_name=full_name,
                            password=password,
                            request=request
                        )
                    elif form.cleaned_data['change_password']:
                        user.set_password(form.cleaned_data['password1'])
                user.save()
                
                if is_current_user:
                    update_session_auth_hash(request, user)
                
                return JsonResponse({
                    'success': f'Пользователь "{user.username}" успешно обновлен',
                    'is_current_user': is_current_user
                })
            except Exception as e:
                return JsonResponse({'error': f'Не удалось обновить пользователя "{user.username}": {str(e)}'}, status=500)
        
        form_errors = {field: errors for field, errors in form.errors.items()}
        if '__all__' in form_errors:
            form_errors['general'] = form_errors.pop('__all__')
        return JsonResponse({'error': 'Ошибка валидации формы', 'details': form_errors}, status=400)

class DeleteUserView(LoginRequiredMixin, AdminsOnlyMixin, View):
    """
    Представление для удаления пользователя.
    """
    template_name = 'custom_admin/admin_panel.html'

    def get(self, request, user_id):
        try:
            user = get_object_or_404(User, id=user_id)
            return render(request, self.template_name, {'delete_user': user})
        except Exception as e:
            return JsonResponse({'error': 'Ошибка при загрузке данных пользователя', 'details': {'exception': str(e)}}, status=500)

    def post(self, request, user_id):
        try:
            user = get_object_or_404(User, id=user_id)
            if user.id == request.user.id:
                return JsonResponse({'error': 'Нельзя удалить пользователя, под которым выполнен вход'}, status=400)
            if user.is_staff and User.objects.filter(is_staff=True).exclude(username='system_notification').count() == 1:
                return JsonResponse({
                    'error': 'Нельзя удалить единственного администратора',
                    'details': {
                        'reason': 'Попытка удаления последнего администратора',
                        'user_id': user_id,
                        'username': user.username
                    }
                }, status=400)

            username = user.username
            user.delete()
            return JsonResponse({
                'success': f'Пользователь "{username}" успешно удален',
                'details': {'user_id': user_id, 'username': username}
            })

        except User.DoesNotExist:
            return JsonResponse({
                'error': 'Пользователь не найден',
                'details': {'reason': 'Пользователь с указанным ID не существует', 'user_id': user_id}
            }, status=404)
        except IntegrityError as e:
            return JsonResponse({
                'error': 'Ошибка целостности базы данных',
                'details': {'reason': 'Удаление пользователя запрещено из-за связей в базе данных', 'exception': str(e), 'user_id': user_id}
            }, status=500)
        except DatabaseError as e:
            return JsonResponse({
                'error': 'Ошибка базы данных',
                'details': {'reason': 'Ошибка при взаимодействии с базой данных', 'exception': str(e), 'user_id': user_id}
            }, status=500)
        except Exception as e:
            return JsonResponse({
                'error': 'Неизвестная ошибка при удалении пользователя',
                'details': {'reason': 'Произошла непредвиденная ошибка', 'exception': str(e), 'user_id': user_id}
            }, status=500)