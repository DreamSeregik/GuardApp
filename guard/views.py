import os
import json
import re
import tempfile
from datetime import date, datetime, timedelta
from urllib.parse import quote
from django.conf import settings
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.models import User
from django.contrib.auth.views import LoginView, LogoutView, PasswordChangeView
from django.db import transaction
from django.db.models import Q
from django.forms import ValidationError
from django.http.response import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse_lazy
from django.views import View
from django.views.generic import TemplateView
from django.views.generic.list import ListView
from docxtpl import DocxTemplate

from .forms import ChangePasswordForm, LoginForm
from .models import Employee, Education, FileAttachment, Med, Notification
from .tasks import check_expirations


# === Вспомогательные классы ===
class UsersOnlyMixin:
    """Миксин для ограничения доступа только обычным пользователям (не админам)."""
    def dispatch(self, request, *args, **kwargs):
        if request.user.is_staff:
            return redirect('guard:forbidden')
        return super().dispatch(request, *args, **kwargs)


# === Представления для аутентификации ===
class CustomLoginView(LoginView):
    """Кастомное представление для входа в систему."""
    form_class = LoginForm
    fields = '__all__'
    template_name = 'guard/auth_page.html'
    redirect_authenticated_user = True

    def get_success_url(self):
        if not self.request.user.is_staff:
            return reverse_lazy('guard:index')
        return reverse_lazy('custom_admin:admin_panel')


class CustomLogoutView(LoginRequiredMixin, LogoutView):
    """Кастомное представление для выхода из системы."""
    next_page = 'guard:login'


class CustomPasswordChangeView(LoginRequiredMixin, PasswordChangeView):
    """Кастомное представление для смены пароля."""
    form_class = ChangePasswordForm
    template_name = 'guard/change_pass_page.html'
    success_url = reverse_lazy('guard:login')

    def form_valid(self, form):
        update_session_auth_hash(self.request, form.user)
        return super().form_valid(form)


@login_required
def logout_confirmation_view(request):
    """Представление для подтверждения выхода из системы."""
    return render(request, 'guard/logout_confirm_page.html')


# === Представления для доступа и уведомлений ===
class ForbiddenView(LoginRequiredMixin, TemplateView):
    """Представление для страницы отказа в доступе."""
    template_name = 'guard/access_denied.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['user'] = self.request.user
        context['is_staff'] = self.request.user.is_staff
        return context


class NotificationListView(LoginRequiredMixin, View):
    """Представление для получения списка уведомлений."""
    def get(self, request):
        if request.user.is_staff:
            return JsonResponse({
                'status': 'SUCCESS',
                'notifications': [],
                'count': 0
            })
        try:
            system_user = User.objects.get(username='system_notification')
        except User.DoesNotExist:
            return JsonResponse({
                'status': 'ERROR',
                'description': 'Системный пользователь не найден',
                'notifications': [],
                'count': 0
            })
        unread_notifications = Notification.objects.filter(
            Q(user=request.user) | Q(user=system_user),
            is_read=False
        ).order_by('-created_at')
        notifications_data = [{
            'message': notification.message,
            'created_at': notification.created_at.strftime('%d.%m.%Y %H:%M')
        } for notification in unread_notifications]
        return JsonResponse({
            'status': 'SUCCESS',
            'notifications': notifications_data,
            'count': len(notifications_data)
        })


# === Представления для главной страницы ===
class IndexView(LoginRequiredMixin, UsersOnlyMixin, ListView):
    """Представление главной страницы со списком сотрудников."""
    model = Employee
    template_name = 'guard/main_page.html'
    context_object_name = 'employees'


# === Представления для работы с сотрудниками ===
class GetCurentUserDetails(LoginRequiredMixin, UsersOnlyMixin, View):
    """Представление для получения данных текущего пользователя."""
    def get(self, request):
        return JsonResponse({
            'FIO': f'{request.user.last_name} {request.user.first_name}'
        })


@login_required
def get_worker_FIO(request, worker_id):
    """Получение ФИО сотрудника по ID."""
    emp = get_object_or_404(Employee, pk=worker_id)
    return JsonResponse({'FIO': emp.FIO})


class EmployeeSearch(LoginRequiredMixin, UsersOnlyMixin, View):
    """Представление для поиска сотрудников по ФИО."""
    def post(self, request):
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({
                'status': 'ERROR',
                'description': 'Неверный формат JSON'
            }, status=400)

        if 'query' not in data:
            return JsonResponse({
                'status': 'ERROR',
                'description': 'Отсутствует обязательное поле: query'
            }, status=400)

        results = Employee.objects.filter(Q(FIO__icontains=data["query"]))
        employees_data = [{
            'id': emp.id,
            'FIO': f"{emp.FIO}",
            'gender': emp.get_gender_display(),
            'birthday': emp.birthday.strftime('%d.%m.%Y'),
            'age': emp.get_age(),
            'position': emp.position
        } for emp in results]

        return JsonResponse({
            "status": "SUCCESS",
            "employees": employees_data
        }, status=200)


class EmployeeFilterView(LoginRequiredMixin, UsersOnlyMixin, View):
    """Представление для фильтрации сотрудников."""
    def get(self, request):
        id = request.GET.get('id')
        gender = request.GET.get('gender')
        min_age = request.GET.get('min_age')
        max_age = request.GET.get('max_age')
        is_edu = request.GET.get('is_edu')
        order = request.GET.get('order')
        today = date.today()

        if id:
            employee = get_object_or_404(Employee, pk=id)
            employee_data = {
                'id': employee.id,
                'FIO': employee.FIO,
                'gender': employee.get_gender_display(),
                'birthday': employee.birthday.strftime('%d.%m.%Y'),
                'age': employee.get_age(),
                'position': employee.position,
                'department': employee.department,
                'oms_number': employee.oms_number,
                'dms_number': employee.dms_number,
                'is_edu': employee.is_edu,
                'status': employee.get_status_display(),
                'status_code': employee.status
            }
            return JsonResponse({
                "status": "SUCCESS",
                "employees": employee_data
            }, status=200)

        employees = Employee.objects.all()

        if order:
            if order == 'desc':
                employees = employees.order_by('-FIO')
            else:
                employees = employees.order_by('FIO')

        if is_edu:
            if is_edu == 'a':
                pass
            elif is_edu == 'e':
                employees = employees.filter(is_edu=True)
            else:
                employees = employees.filter(is_edu=False)

        if gender:
            employees = employees.filter(gender=gender)

        if min_age or max_age:
            if min_age:
                max_birth_year = today.year - int(min_age)
                employees = employees.filter(birthday__year__lte=max_birth_year)
            if max_age:
                min_birth_year = today.year - int(max_age)
                employees = employees.filter(birthday__year__gte=min_birth_year)

        employees_data = [{
            'id': emp.id,
            'FIO': emp.FIO,
            'gender': emp.get_gender_display(),
            'birthday': emp.birthday.strftime('%d.%m.%Y'),
            'age': emp.get_age(),
            'position': emp.position,
            'department': emp.department,
            'oms_number': emp.oms_number,
            'dms_number': emp.dms_number,
            'status': emp.get_status_display(),
            'is_edu': emp.is_edu
        } for emp in employees]

        return JsonResponse({
            "status": "SUCCESS",
            "employees": employees_data
        }, status=200)


class EmployeeAddView(LoginRequiredMixin, UsersOnlyMixin, View):
    """Представление для добавления нового сотрудника."""
    def post(self, request):
        try:
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({
                    'status': 'ERROR',
                    'description': 'Неверный формат JSON'
                }, status=400)

            required_fields = ['FIO', 'gender', 'birthday', 'position', 'status', 'is_edu']
            for field in required_fields:
                if field not in data:
                    return JsonResponse({
                        'status': 'ERROR',
                        'description': f'Отсутствует обязательное поле: {field}'
                    }, status=400)

            try:
                if not isinstance(data['FIO'], str) or len(data['FIO'].strip()) == 0:
                    raise ValidationError('ФИО должно быть непустой строкой')

                full_name = data['FIO'].strip()
                if not re.fullmatch(r'^[А-ЯЁ][а-яё]+(?:\s[А-ЯЁ][а-яё]+){1,2}$', full_name):
                    raise ValidationError('ФИО должно содержать 2-3 слова на кириллице, каждое начинается с заглавной буквы')

                if data['gender'] not in ['M', 'F']:
                    raise ValidationError("Пол должен быть одним из: 'M', 'F'")

                try:
                    birthday = datetime.strptime(data['birthday'], '%Y-%m-%d').date()
                    today = date.today()
                    min_age_date = date(today.year - 100, today.month, today.day)
                    max_age_date = date(today.year - 14, today.month, today.day)

                    if birthday > today:
                        raise ValidationError('Дата рождения не может быть в будущем')
                    if birthday < min_age_date:
                        raise ValidationError('Возраст не может быть больше 100 лет')
                    if birthday > max_age_date:
                        raise ValidationError('Возраст должен быть не менее 14 лет')
                except (ValueError, TypeError):
                    raise ValidationError('Дата рождения должна быть в формате YYYY-MM-DD')

                if not isinstance(data['position'], str) or len(data['position'].strip()) < 3:
                    raise ValidationError('Должность должна быть строкой длиной не менее 3 символов')

                if data['status'] not in ['W', 'V', 'BT', 'S']:
                    raise ValidationError("Статус должен быть одним из: 'W', 'V', 'BT', 'S'")

                if not isinstance(data['is_edu'], bool):
                    raise ValidationError('is_edu должно быть булевым значением')

                department = data.get('department')
                if department and not isinstance(department, str):
                    raise ValidationError('Отдел должен быть строкой, если указан')

                oms_number = data.get('oms_number')
                if oms_number:
                    if not isinstance(oms_number, str):
                        raise ValidationError('Номер ОМС должен быть строкой, если указан')
                    if len(oms_number) != 16 or not oms_number.isdigit():
                        raise ValidationError('Номер ОМС должен содержать ровно 16 цифр')

                dms_number = data.get('dms_number')
                if dms_number:
                    if not isinstance(dms_number, str):
                        raise ValidationError('Номер ДМС должен быть строкой, если указан')
                    if len(dms_number) < 10:
                        raise ValidationError('Номер ДМС должен содержать не менее 10 символов')

            except ValidationError as e:
                return JsonResponse({
                    'status': 'ERROR',
                    'description': str(e)
                }, status=400)

            try:
                with transaction.atomic():
                    employee = Employee(
                        FIO=data['FIO'].strip(),
                        gender=data['gender'],
                        birthday=birthday,
                        position=data['position'].strip(),
                        department=data.get('department', '').strip(),
                        oms_number=data.get('oms_number', '').strip(),
                        dms_number=data.get('dms_number', '').strip(),
                        status=data['status'],
                        is_edu=data['is_edu']
                    )
                    employee.full_clean()
                    employee.save()

                return JsonResponse({
                    'status': 'SUCCESS',
                    'id': employee.id
                })

            except Exception as e:
                return JsonResponse({
                    'status': 'ERROR',
                    'description': f'Ошибка сохранения сотрудника: {str(e)}'
                }, status=500)

        except Exception as e:
            return JsonResponse({
                'status': 'ERROR',
                'description': f'Непредвиденная ошибка: {str(e)}'
            }, status=500)


class EmployeeUpdateView(LoginRequiredMixin, UsersOnlyMixin, View):
    """Представление для обновления данных сотрудника."""
    def patch(self, request, worker_id):
        try:
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({
                    'status': 'ERROR',
                    'description': 'Неверный формат JSON'
                }, status=400)

            employee = get_object_or_404(Employee, pk=worker_id)
            errors = {}

            if 'FIO' in data:
                if not isinstance(data['FIO'], str) or len(data['FIO'].strip()) == 0:
                    errors['FIO'] = 'ФИО должно быть непустой строкой'
                elif not re.fullmatch(r'^[А-ЯЁ][а-яё]+(?:\s[А-ЯЁ][а-яё]+){1,2}$', data['FIO'].strip()):
                    errors['FIO'] = 'ФИО должно содержать 2-3 слова на кириллице, каждое начинается с заглавной буквы'

            if 'birthday' in data:
                try:
                    if isinstance(data['birthday'], str):
                        if '.' in data['birthday']:
                            day, month, year = map(int, data['birthday'].split('.'))
                            data['birthday'] = f"{year}-{month:02d}-{day:02d}"
                        datetime.strptime(data['birthday'], '%Y-%m-%d')

                        input_date = datetime.strptime(data['birthday'], '%Y-%m-%d').date()
                        today = date.today()
                        min_age_date = date(today.year - 14, today.month, today.day)
                        max_age_date = date(today.year - 100, today.month, today.day)

                        if input_date > today:
                            errors['birthday'] = 'Дата рождения не может быть в будущем'
                        elif input_date > min_age_date:
                            errors['birthday'] = 'Возраст должен быть не менее 14 лет'
                        elif input_date < max_age_date:
                            errors['birthday'] = 'Возраст не может быть больше 100 лет'
                except (ValueError, TypeError):
                    errors['birthday'] = "Неверный формат даты. Используйте DD.MM.YYYY или YYYY-MM-DD"

            if 'gender' in data and data['gender'] not in dict(Employee.GENDER_CHOICES):
                errors['gender'] = f"Допустимые значения пола: {list(dict(Employee.GENDER_CHOICES).keys())}"

            if 'status' in data and data['status'] not in dict(Employee.STATUS_CHOICES):
                errors['status'] = f"Допустимые значения статуса: {list(dict(Employee.STATUS_CHOICES).keys())}"

            if 'position' in data:
                if not isinstance(data['position'], str) or len(data['position'].strip()) < 3:
                    errors['position'] = 'Должность должна быть строкой длиной не менее 3 символов'

            if 'oms_number' in data and data['oms_number']:
                if not isinstance(data['oms_number'], str):
                    errors['oms_number'] = "Номер ОМС должен быть строкой"
                elif len(data['oms_number']) != 16 or not data['oms_number'].isdigit():
                    errors['oms_number'] = "Номер ОМС должен содержать ровно 16 цифр"

            if 'dms_number' in data and data['dms_number']:
                if not isinstance(data['dms_number'], str):
                    errors['dms_number'] = "Номер ДМС должен быть строкой"
                elif len(data['dms_number']) < 10:
                    errors['dms_number'] = "Номер ДМС должен содержать не менее 10 символов"

            if 'is_edu' in data and not isinstance(data['is_edu'], bool):
                errors['is_edu'] = "is_edu должно быть булевым значением"

            if 'department' in data and data['department'] and not isinstance(data['department'], str):
                errors['department'] = "Отдел должен быть строкой"

            if errors:
                return JsonResponse({
                    'status': 'ERROR',
                    'description': 'Ошибка валидации',
                    'errors': errors
                }, status=400)

            update_fields = []
            for field in ['FIO', 'gender', 'birthday', 'position', 'is_edu', 'status', 'department', 'oms_number', 'dms_number']:
                if field in data:
                    setattr(employee, field, data[field])
                    update_fields.append(field)

            try:
                employee.full_clean()
                employee.save(update_fields=update_fields)
                return JsonResponse({
                    'status': 'SUCCESS',
                    'message': 'Данные сотрудника успешно обновлены',
                    'employee_id': employee.id,
                    'updated_fields': update_fields
                })
            except ValidationError as e:
                return JsonResponse({
                    'status': 'ERROR',
                    'description': 'Ошибка валидации модели',
                    'errors': e.message_dict
                }, status=400)
            except Exception as e:
                return JsonResponse({
                    'status': 'ERROR',
                    'description': f'Внутренняя ошибка сервера: {str(e)}'
                }, status=500)

        except Exception as e:
            return JsonResponse({
                'status': 'ERROR',
                'description': f'Непредвиденная ошибка: {str(e)}'
                }, status=500)


class EmployeeDeleteView(LoginRequiredMixin, UsersOnlyMixin, View):
    """Представление для удаления сотрудника."""
    def post(self, request):
        try:
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({
                    'status': 'ERROR',
                    'description': 'Неверный формат JSON'
                }, status=400)

            if 'employee_id' not in data:
                return JsonResponse({
                    'status': 'ERROR',
                    'description': 'Отсутствует обязательное поле: employee_id'
                }, status=400)

            try:
                employee_id = int(data['employee_id'])
            except Exception:
                raise ValidationError('ID сотрудника должен быть целым числом')

            try:
                employee = get_object_or_404(Employee, pk=employee_id)
                employee.delete()
                check_expirations()
                return JsonResponse({
                    'status': 'SUCCESS',
                    'description': f'Сотрудник с ID {employee_id} удален'
                })
            except Exception as e:
                return JsonResponse({
                    'status': 'ERROR',
                    'description': f'Ошибка: {str(e)}'
                }, status=500)

        except Exception as e:
            return JsonResponse({
                'status': 'ERROR',
                'description': f'Непредвиденная ошибка: {str(e)}'
            }, status=500)


# === Представления для медицинских осмотров ===
class AllMedicalExamView(LoginRequiredMixin, UsersOnlyMixin, View):
    """Представление для получения всех медицинских осмотров."""
    def get(self, request):
        try:
            med_data = Med.objects.all().select_related('owner').prefetch_related('attachments')
            data = [{
                'id': med.id,
                'owner': med.owner.FIO,
                'type': med.get_type_display(),
                'type_code': med.type,
                'date_from': med.date_from.strftime('%d.%m.%Y'),
                'date_to': med.date_to.strftime('%d.%m.%Y'),
                'attachments': [{
                    'id': att.id,
                    'name': att.file.name.split('/')[-1] if att.file else '',
                    'url': att.file.url if att.file else '',
                    'size': att.get_file_size() if att.file else 0,
                    'uploaded_at': att.uploaded_at.strftime('%d.%m.%Y %H:%M') if att.uploaded_at else ''
                } for att in med.attachments.all()]
            } for med in med_data]
            return JsonResponse({
                'status': 'SUCCESS',
                'data': data
            }, safe=False)
        except Exception as e:
            return JsonResponse({
                'status': 'ERROR',
                'description': str(e)
            }, status=500)


class GetMedicalExamView(LoginRequiredMixin, UsersOnlyMixin, View):
    """Представление для получения данных конкретного медосмотра."""
    def get(self, request, med_id):
        try:
            med_data = get_object_or_404(Med, pk=med_id)
            attachments = FileAttachment.objects.filter(med=med_data)
            files_data = [{
                'id': att.id,
                'name': att.file.name.split('/')[-1],
                'url': att.file.url,
                'uploaded_at': att.uploaded_at.strftime('%d.%m.%Y %H:%M'),
                'size': att.get_file_size()
            } for att in attachments]
            data = [{
                'id': med_data.id,
                'owner': med_data.owner.FIO,
                'type': med_data.get_type_display(),
                'type_code': med_data.type,
                'date_from': med_data.date_from.strftime('%Y-%m-%d'),
                'date_to': med_data.date_to.strftime('%Y-%m-%d'),
                'attachments': files_data
            }]
            return JsonResponse({
                'status': 'SUCCESS',
                'data': data
            }, safe=False)
        except Exception as e:
            return JsonResponse({
                'status': 'ERROR',
                'description': str(e)
            }, status=500)


@login_required
def get_worker_med(request, worker_id):
    """Получение медицинских осмотров сотрудника по ID."""
    data = []
    emp = get_object_or_404(Employee, pk=worker_id)
    med_queryset = Med.objects.filter(owner=emp).prefetch_related('attachments')
    med_list = list(med_queryset)
    attachments = FileAttachment.objects.filter(med__in=med_list)
    attachments_dict = {}
    for att in attachments:
        if att.med_id not in attachments_dict:
            attachments_dict[att.med_id] = []
        attachments_dict[att.med_id].append({
            'id': att.id,
            'name': att.file.name.split('/')[-1],
            'uploaded_at': att.uploaded_at.strftime('%d.%m.%Y %H:%M')
        })

    for data_med in med_list:
        files_data = attachments_dict.get(data_med.id, [])
        data.append({
            'id': data_med.id,
            'type': data_med.get_type_display(),
            'date_from': data_med.date_from.strftime("%d.%m.%Y") if data_med.date_from else None,
            'date_to': data_med.date_to.strftime("%d.%m.%Y") if data_med.date_to else None,
            'attachments': files_data
        })

    return JsonResponse({'data': data})


class MedicalExamAddView(LoginRequiredMixin, UsersOnlyMixin, View):
    """Представление для добавления нового медосмотра."""
    def post(self, request):
        try:
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({
                    'status': 'ERROR',
                    'description': 'Неверный формат JSON'
                }, status=400)

            required_fields = ['employee_id', 'exam_type', 'exam_date', 'expiry_date']
            for field in required_fields:
                if field not in data:
                    return JsonResponse({
                        'status': 'ERROR',
                        'description': f'Отсутствует обязательное поле: {field}'
                    }, status=400)

            try:
                try:
                    employee_id = int(data['employee_id'])
                except (ValueError, TypeError):
                    raise ValidationError('ID сотрудника должен быть целым числом')

                if not Employee.objects.filter(id=employee_id).exists():
                    raise ValidationError('Сотрудник с таким ID не существует')

                valid_exam_types = ['periodic', 'preliminary', 'fluorography', 'psych_examination']
                if data['exam_type'] not in valid_exam_types:
                    raise ValidationError(f"Тип осмотра должен быть одним из: {', '.join(valid_exam_types)}")

                try:
                    exam_date = datetime.strptime(data['exam_date'], '%Y-%m-%d').date()
                    if exam_date > date.today():
                        raise ValidationError('Дата осмотра не может быть в будущем')
                except (ValueError, TypeError):
                    raise ValidationError('Дата осмотра должна быть в формате YYYY-MM-DD')

                try:
                    expiry_date = datetime.strptime(data['expiry_date'], '%Y-%m-%d').date()
                except (ValueError, TypeError):
                    raise ValidationError('Дата окончания должна быть в формате YYYY-MM-DD')

                if expiry_date < exam_date:
                    raise ValidationError('Дата окончания не может быть раньше даты осмотра')

            except ValidationError as e:
                return JsonResponse({
                    'status': 'ERROR',
                    'description': str(e)
                }, status=400)

            try:
                with transaction.atomic():
                    medical_exam = Med(
                        owner=Employee.objects.get(pk=employee_id),
                        type=data['exam_type'],
                        date_from=exam_date,
                        date_to=expiry_date
                    )
                    medical_exam.full_clean()
                    medical_exam.save()
                    check_expirations()
                return JsonResponse({
                    'status': 'SUCCESS',
                    'id': medical_exam.id
                })
            except Exception as e:
                return JsonResponse({
                    'status': 'ERROR',
                    'description': f'Ошибка сохранения медицинского осмотра: {str(e)}'
                }, status=500)

        except Exception as e:
            return JsonResponse({
                'status': 'ERROR',
                'description': f'Непредвиденная ошибка: {str(e)}'
            }, status=500)


class MedicalExamUpdateView(LoginRequiredMixin, UsersOnlyMixin, View):
    """Представление для обновления данных медосмотра."""
    def patch(self, request, med_id):
        try:
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({
                    'status': 'ERROR',
                    'description': 'Неверный формат JSON'
                }, status=400)

            medical_exam = get_object_or_404(Med, id=med_id)
            old_date_from = medical_exam.date_from
            old_date_to = medical_exam.date_to

            required_fields = ['exam_type', 'exam_date', 'expiry_date']
            for field in required_fields:
                if field not in data:
                    return JsonResponse({
                        'status': 'ERROR',
                        'description': f'Отсутствует обязательное поле: {field}'
                    }, status=400)

            try:
                valid_exam_types = ['periodic', 'preliminary', 'fluorography', 'psych_examination']
                if data['exam_type'] not in valid_exam_types:
                    raise ValidationError(f"Тип осмотра должен быть одним из: {', '.join(valid_exam_types)}")

                try:
                    exam_date = datetime.strptime(data['exam_date'], '%Y-%m-%d').date()
                    if exam_date > date.today():
                        raise ValidationError('Дата осмотра не может быть в будущем')
                except (ValueError, TypeError):
                    raise ValidationError('Дата осмотра должна быть в формате YYYY-MM-DD')

                try:
                    expiry_date = datetime.strptime(data['expiry_date'], '%Y-%m-%d').date()
                except (ValueError, TypeError):
                    raise ValidationError('Дата окончания должна быть в формате YYYY-MM-DD')

                if expiry_date < exam_date:
                    raise ValidationError('Дата окончания не может быть раньше даты осмотра')

            except ValidationError as e:
                return JsonResponse({
                    'status': 'ERROR',
                    'description': str(e)
                }, status=400)

            try:
                with transaction.atomic():
                    medical_exam.type = data['exam_type']
                    medical_exam.date_from = exam_date
                    medical_exam.date_to = expiry_date
                    medical_exam.full_clean()
                    medical_exam.save()
                    dates_changed = (old_date_from != exam_date) or (old_date_to != expiry_date)
                    if dates_changed:
                        check_expirations()
                return JsonResponse({
                    'status': 'SUCCESS',
                    'id': medical_exam.id
                })
            except Exception as e:
                return JsonResponse({
                    'status': 'ERROR',
                    'description': f'Ошибка обновления медицинского осмотра: {str(e)}'
                }, status=500)

        except Exception as e:
            return JsonResponse({
                'status': 'ERROR',
                'description': f'Непредвиденная ошибка: {str(e)}'
            }, status=500)


class MedDeleteView(LoginRequiredMixin, UsersOnlyMixin, View):
    """Представление для удаления медицинского осмотра."""
    def post(self, request):
        try:
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({
                    'status': 'ERROR',
                    'description': 'Неверный формат JSON'
                }, status=400)

            if 'med_id' not in data:
                return JsonResponse({
                    'status': 'ERROR',
                    'description': f'Отсутствует обязательное поле: med_id'
                }, status=400)

            try:
                med_id = int(data['med_id'])
            except (ValueError, TypeError):
                raise ValidationError('ID медосмотра должен быть целым числом')

            try:
                med = get_object_or_404(Med, pk=med_id)
                med.delete()
                check_expirations()
                return JsonResponse({
                    'status': 'SUCCESS',
                    'description': f'Медосмотр с ID {med_id} удален'
                })
            except Exception as e:
                return JsonResponse({
                    'status': 'ERROR',
                    'description': f'Ошибка: {str(e)}'
                }, status=500)

        except Exception as e:
            return JsonResponse({
                'status': 'ERROR',
                'description': f'Непредвиденная ошибка: {str(e)}'
            }, status=500)


class MedicalDirectionView(LoginRequiredMixin, UsersOnlyMixin, View):
    """Представление для генерации направления на медицинский осмотр."""
    TEMPLATES_DIR = os.path.join(settings.STATIC_ROOT, 'guard', 'templates')

    def post(self, request, *args, **kwargs):
        try:
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({
                    'status': 'ERROR',
                    'message': 'Неверный формат JSON'
                }, status=400)

            validation_result = self.validate_data(data)
            if not validation_result['is_valid']:
                return JsonResponse({
                    'status': 'ERROR',
                    'message': validation_result['message']
                }, status=400)

            template_name = self.get_template_name(data['examinationType'])
            template_path = os.path.join(self.TEMPLATES_DIR, template_name)

            if not os.path.exists(template_path):
                return JsonResponse({
                    'status': 'ERROR',
                    'message': 'Шаблон не найден'
                }, status=500)

            context = self.prepare_context(data)
            response = self.generate_document(template_path, context, data)
            return response

        except Exception as e:
            return JsonResponse({
                'status': 'ERROR',
                'message': str(e)
            }, status=500)

    def validate_data(self, data):
        """Валидация входных данных для направления."""
        result = {'is_valid': True, 'message': ''}

        exam_type = data.get('examinationType')
        if exam_type not in ['preliminary', 'periodic', 'psychiatric']:
            return {
                'is_valid': False,
                'message': 'Неверный тип медосмотра. Допустимые значения: preliminary, periodic, psychiatric'
            }

        full_name = data.get('FIO', '').strip()
        if not full_name:
            return {
                'is_valid': False,
                'message': 'ФИО обязательно для заполнения'
            }

        name_parts = full_name.split()
        if len(name_parts) < 2 or len(name_parts) > 3:
            return {
                'is_valid': False,
                'message': 'ФИО должно содержать 2 или 3 слова'
            }

        if any(not re.match('^[А-ЯЁа-яё-]+$', part) for part in name_parts):
            return {
                'is_valid': False,
                'message': 'ФИО должно содержать только кириллические символы и дефисы'
            }

        birth_date = data.get('birthDate')
        if not birth_date:
            return {
                'is_valid': False,
                'message': 'Дата рождения обязательна для заполнения'
            }

        try:
            birth_date_obj = datetime.strptime(birth_date, '%Y-%m-%d').date()
            today = datetime.now().date()
            min_age_date = today - timedelta(days=365*14)
            max_age_date = today - timedelta(days=365*100)

            if birth_date_obj > today:
                return {
                    'is_valid': False,
                    'message': 'Дата рождения не может быть в будущем'
                }
            if birth_date_obj > min_age_date:
                return {
                    'is_valid': False,
                    'message': 'Возраст должен быть не менее 14 лет'
                }
            if birth_date_obj < max_age_date:
                return {
                    'is_valid': False,
                    'message': 'Возраст должен быть не более 100 лет'
                }
        except ValueError:
            return {
                'is_valid': False,
                'message': 'Неверный формат даты рождения. Используйте формат YYYY-MM-DD'
            }

        gender = data.get('gender')
        if gender not in ['M', 'F']:
            return {
                'is_valid': False,
                'message': 'Не указан пол сотрудника'
            }

        if exam_type in ['preliminary', 'periodic']:
            return self.validate_regular_exam(data)
        return self.validate_psychiatric_exam(data)

    def validate_regular_exam(self, data):
        """Валидация данных для предварительных/периодических осмотров."""
        has_oms = data.get('hasOMS', False)
        has_dms = data.get('hasDMS', False)

        if not has_oms and not has_dms:
            return {
                'is_valid': False,
                'message': 'Необходимо указать хотя бы один тип страхового полиса (ОМС или ДМС)'
            }

        if has_oms:
            oms_number = data.get('OMSNumber', '').strip()
            if not oms_number:
                return {
                    'is_valid': False,
                    'message': 'Необходимо указать номер полиса ОМС'
                }
            if len(oms_number) != 16 or not oms_number.isdigit():
                return {
                    'is_valid': False,
                    'message': 'Номер полиса ОМС должен содержать 16 цифр'
                }

        if has_dms:
            dms_number = data.get('DMSNumber', '').strip()
            if not dms_number:
                return {
                    'is_valid': False,
                    'message': 'Необходимо указать номер полиса ДМС'
                }
            if len(dms_number) < 10 or len(dms_number) > 16:
                return {
                    'is_valid': False,
                    'message': 'Номер полиса ДМС должен содержать от 10 до 16 символов'
                }

        direction_number = data.get('directionNumber', '').strip()
        if not direction_number:
            return {
                'is_valid': False,
                'message': 'Необходимо указать номер направления'
            }
        if len(direction_number) > 20:
            return {
                'is_valid': False,
                'message': 'Номер направления не должен превышать 20 символов'
            }

        direction_date = data.get('directionDate')
        if not direction_date:
            return {
                'is_valid': False,
                'message': 'Необходимо указать дату направления'
            }

        try:
            direction_date_obj = datetime.strptime(direction_date, '%Y-%m-%d').date()
            today = datetime.now().date()
            if direction_date_obj > today:
                return {
                    'is_valid': False,
                    'message': 'Дата направления не может быть в будущем'
                }
        except ValueError:
            return {
                'is_valid': False,
                'message': 'Неверный формат даты направления. Используйте формат YYYY-MM-DD'
            }

        medical_org = data.get('medicalOrganization', '').strip()
        if not medical_org:
            return {
                'is_valid': False,
                'message': 'Необходимо указать название медицинской организации'
            }
        if len(medical_org) < 3 or len(medical_org) > 500:
            return {
                'is_valid': False,
                'message': 'Название медицинской организации должно быть от 3 до 500 символов'
            }

        medical_address = data.get('medicalAddress', '').strip()
        if not medical_address:
            return {
                'is_valid': False,
                'message': 'Необходимо указать адрес медицинской организации'
            }

        ogrn_code = data.get('ogrnCode', '').strip()
        if not ogrn_code:
            return {
                'is_valid': False,
                'message': 'Необходимо указать ОГРН медицинской организации'
            }
        if len(ogrn_code) != 13 or not ogrn_code.isdigit():
            return {
                'is_valid': False,
                'message': 'ОГРН должен содержать ровно 13 цифр'
            }

        position = data.get('position', '').strip()
        if not position:
            return {
                'is_valid': False,
                'message': 'Необходимо указать должность сотрудника'
            }
        if len(position) < 3 or len(position) > 100:
            return {
                'is_valid': False,
                'message': 'Должность должна быть от 3 до 100 символов'
            }
        if not re.match('^[А-ЯЁа-яё\\s-]+$', position):
            return {
                'is_valid': False,
                'message': 'Должность должна содержать только кириллические символы, пробелы и дефисы'
            }

        rep_name = data.get('employerRepresentativeName', '').strip()
        if not rep_name:
            return {
                'is_valid': False,
                'message': 'Необходимо указать ФИО представителя работодателя'
            }

        rep_position = data.get('employerRepresentativePosition', '').strip()
        if not rep_position:
            return {
                'is_valid': False,
                'message': 'Необходимо указать должность представителя работодателя'
            }
        if len(rep_position) < 3 or len(rep_position) > 50:
            return {
                'is_valid': False,
                'message': 'Должность представителя должна быть от 3 до 50 символов'
            }

        hazard_factors = data.get('hazardFactors', '').strip()
        if hazard_factors and len(hazard_factors) > 1000:
            return {
                'is_valid': False,
                'message': 'Описание вредных факторов не должно превышать 1000 символов'
            }

        medical_email = data.get('medicalEmail', '').strip()
        if medical_email and not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', medical_email):
            return {
                'is_valid': False,
                'message': 'Неверный формат email медицинской организации'
            }

        medical_phone = data.get('medicalPhone', '').strip()
        if medical_phone:
            main_number = re.sub(r'[^0-9]', '', medical_phone.split('доб.')[0])
            if len(main_number) < 5:
                return {
                    'is_valid': False,
                    'message': 'Основной номер телефона должен содержать минимум 5 цифр'
                }

        return {'is_valid': True, 'message': ''}

    def validate_psychiatric_exam(self, data):
        """Валидация данных для психиатрического освидетельствования."""
        direction_date = data.get('directionDatePsych')
        if not direction_date:
            return {
                'is_valid': False,
                'message': 'Необходимо указать дату направления'
            }

        try:
            direction_date_obj = datetime.strptime(direction_date, '%Y-%m-%d').date()
            today = datetime.now().date()
            if direction_date_obj > today:
                return {
                    'is_valid': False,
                    'message': 'Дата направления не может быть в будущем'
                }
        except ValueError:
            return {
                'is_valid': False,
                'message': 'Неверный формат даты направления. Используйте формат YYYY-MM-DD'
            }

        employer_name = data.get('employerName', '').strip()
        if not employer_name:
            return {
                'is_valid': False,
                'message': 'Необходимо указать название работодателя'
            }
        if len(employer_name) < 3 or len(employer_name) > 255:
            return {
                'is_valid': False,
                'message': 'Название работодателя должно быть от 3 до 255 символов'
            }

        medical_org = data.get('medicalOrgPsych', '').strip()
        if not medical_org:
            return {
                'is_valid': False,
                'message': 'Необходимо указать название медицинской организации'
            }
        if len(medical_org) < 3 or len(medical_org) > 500:
            return {
                'is_valid': False,
                'message': 'Название медицинской организации должно быть от 3 до 500 символов'
            }

        medical_address = data.get('medicalAddressPsych', '').strip()
        if not medical_address:
            return {
                'is_valid': False,
                'message': 'Необходимо указать адрес медицинской организации'
            }

        ogrn_psych = data.get('ogrnPsych', '').strip()
        if not ogrn_psych:
            return {
                'is_valid': False,
                'message': 'Необходимо указать ОГРН медицинской организации'
            }
        if len(ogrn_psych) != 13 or not ogrn_psych.isdigit():
            return {
                'is_valid': False,
                'message': 'ОГРН должен содержать ровно 13 цифр'
            }

        position = data.get('positionPsych', '').strip()
        if not position:
            return {
                'is_valid': False,
                'message': 'Необходимо указать должность сотрудника'
            }
        if len(position) < 3 or len(position) > 100:
            return {
                'is_valid': False,
                'message': 'Должность должна быть от 3 до 100 символов'
            }

        medical_email = data.get('medicalEmailPsych', '').strip()
        if medical_email and not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', medical_email):
            return {
                'is_valid': False,
                'message': 'Неверный формат email медицинской организации'
            }

        medical_phone = data.get('medicalPhonePsych', '').strip()
        if medical_phone:
            main_number = re.sub(r'[^0-9]', '', medical_phone.split('доб.')[0])
            if len(main_number) < 5:
                return {
                    'is_valid': False,
                    'message': 'Основной номер телефона должен содержать минимум 5 цифр'
                }

        okved_code = data.get('okvedCode', '').strip()
        if okved_code:
            if len(okved_code) < 2 or len(okved_code) > 10:
                return {
                    'is_valid': False,
                    'message': 'Код ОКВЭД должен быть от 2 до 10 символов'
                }
            if not re.match(r'^[\d.]+$', okved_code):
                return {
                    'is_valid': False,
                    'message': 'Код ОКВЭД должен содержать только цифры и точки'
                }

        activity_types = data.get('activityTypes', '').strip()
        if activity_types and len(activity_types) > 1000:
            return {
                'is_valid': False,
                'message': 'Виды деятельности не должны превышать 1000 символов'
            }

        previous_conclusions = data.get('previousConclusions', '').strip()
        if previous_conclusions and len(previous_conclusions) > 2000:
            return {
                'is_valid': False,
                'message': 'Предыдущие заключения не должны превышать 2000 символов'
            }

        return {'is_valid': True, 'message': ''}

    def get_template_name(self, exam_type):
        """Возвращает имя шаблона для направления."""
        return {
            'preliminary': 'regular_examination.docx',
            'periodic': 'regular_examination.docx',
            'psychiatric': 'psychiatric_examination.docx'
        }.get(exam_type)

    def prepare_context(self, data):
        """Подготавливает контекст для шаблона направления."""
        full_name = data.get('FIO', '')
        context = {
            'employee': {
                'FIO': full_name,
                'birth_date': self.format_date(data.get('birthDate')),
                'gender': 'Мужской' if data.get('gender') == 'M' else 'Женский',
                'position': data.get('position', data.get('positionPsych', ''))
            },
            'insurance': {
                'has_oms': data.get('hasOMS', False),
                'oms_number': data.get('OMSNumber', ''),
                'has_dms': data.get('hasDMS', False),
                'dms_number': data.get('DMSNumber', '')
            }
        }

        if data.get('examinationType') in ['preliminary', 'periodic']:
            context.update(self.get_regular_exam_context(data))
        else:
            context.update(self.get_psychiatric_exam_context(data))

        return context

    def get_regular_exam_context(self, data):
        """Контекст для предварительных/периодических осмотров."""
        return {
            'exam_type': 'предварительный' if data.get('examinationType') == 'preliminary' else 'периодический',
            'direction_number': data.get('directionNumber', ''),
            'direction_date': self.format_date(data.get('directionDate')),
            'medical_org': {
                'name': data.get('medicalOrganization', ''),
                'address': data.get('medicalAddress', ''),
                'ogrn': data.get('ogrnCode', ''),
                'email': data.get('medicalEmail', ''),
                'phone': data.get('medicalPhone', '')
            },
            'representative': {
                'FIO': data.get('employerRepresentativeName', ''),
                'position': data.get('employerRepresentativePosition', '')
            },
            'department': data.get('departmentName', ''),
            'hazard_factors': data.get('hazardFactors', '')
        }

    def get_psychiatric_exam_context(self, data):
        """Контекст для психиатрического освидетельствования."""
        return {
            'direction_date': self.format_date(data.get('directionDatePsych')),
            'employer': {
                'name': data.get('employerName', ''),
                'email': data.get('employerEmail', ''),
                'phone': data.get('employerPhone', '')
            },
            'okved': data.get('okvedCode', ''),
            'medical_org': {
                'name': data.get('medicalOrgPsych', ''),
                'address': data.get('medicalAddressPsych', ''),
                'ogrn': data.get('ogrnPsych', ''),
                'email': data.get('medicalEmailPsych', ''),
                'phone': data.get('medicalPhonePsych', '')
            },
            'activity_types': data.get('activityTypes', ''),
            'previous_conclusions': data.get('previousConclusions', ''),
            'issue_date': self.format_date(data.get('directionIssueDate'))
        }

    def generate_document(self, template_path, context, data):
        """Генерирует документ направления."""
        doc = DocxTemplate(template_path)
        doc.render(context)
        full_name = data.get('FIO', '')
        exam_type = data.get('examinationType')
        translit_name = self.transliterate_name(full_name)
        exam_type_mapping = {
            'preliminary': 'predvar',
            'periodic': 'period',
            'psychiatric': 'psych'
        }
        exam_suffix = exam_type_mapping.get(exam_type, '')
        filename = f"{translit_name}_{exam_suffix}.docx"
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, filename)
        doc.save(temp_path)

        with open(temp_path, 'rb') as f:
            response = HttpResponse(
                f.read(),
                content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            )
            response['Content-Disposition'] = f'attachment; filename={filename}'

        os.unlink(temp_path)
        return response

    @staticmethod
    def transliterate_name(name):
        """Транслитерирует ФИО на латиницу."""
        translit_dict = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
            'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
            'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
            'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
            'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
            'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
            'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
            'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
            'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
            'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
        }
        result = []
        for char in name:
            if char == ' ':
                result.append('_')
            else:
                result.append(translit_dict.get(char, char))
        return ''.join(result)

    @staticmethod
    def split_full_name(full_name):
        """Разбивает ФИО на фамилию, имя и отчество."""
        parts = full_name.split()
        return (
            parts[0] if len(parts) > 0 else '',
            parts[1] if len(parts) > 1 else '',
            ' '.join(parts[2:]) if len(parts) > 2 else ''
        )

    @staticmethod
    def format_date(date_str):
        """Форматирует дату из YYYY-MM-DD в DD.MM.YYYY."""
        if not date_str:
            return ''
        try:
            return datetime.strptime(date_str, '%Y-%m-%d').strftime('%d.%m.%Y')
        except:
            return date_str


# === Представления для работы с обучением ===
class AllEducationsView(LoginRequiredMixin, UsersOnlyMixin, View):
    """Представление для получения всех записей об обучении."""
    def get(self, request):
        try:
            edu_data = Education.objects.all().select_related('owner').prefetch_related('attachments')
            data = [{
                'id': edu.id,
                'owner': edu.owner.FIO,
                'program': edu.get_program_display(),
                'protocol_num': edu.protocol_num,
                'udostoverenie_num': edu.udostoverenie_num,
                'hours': edu.hours,
                'date_from': edu.date_from.strftime('%d.%m.%Y'),
                'date_to': edu.date_to.strftime('%d.%m.%Y'),
                'attachments': [{
                    'id': att.id,
                    'name': att.file.name.split('/')[-1] if att.file else '',
                    'url': att.file.url if att.file else '',
                    'size': att.get_file_size() if att.file else 0,
                    'uploaded_at': att.uploaded_at.strftime('%d.%m.%Y %H:%M') if att.uploaded_at else ''
                } for att in edu.attachments.all()]
            } for edu in edu_data]
            return JsonResponse({
                'status': 'SUCCESS',
                'data': data
            }, safe=False)
        except Exception as e:
            return JsonResponse({
                'status': 'ERROR',
                'description': str(e)
            }, status=500)


class GetEducationView(LoginRequiredMixin, UsersOnlyMixin, View):
    """Представление для получения данных конкретного обучения."""
    def get(self, request, edu_id):
        try:
            edu_data = get_object_or_404(Education, pk=edu_id)
            attachments = FileAttachment.objects.filter(education=edu_data)
            files_data = [{
                'id': att.id,
                'name': att.file.name.split('/')[-1],
                'url': att.file.url,
                'uploaded_at': att.uploaded_at.strftime('%d.%m.%Y %H:%M'),
                'size': att.get_file_size()
            } for att in attachments]
            data = [{
                'id': edu_data.id,
                'owner': edu_data.owner.FIO,
                'program': edu_data.get_program_display(),
                'program_type': edu_data.program,
                'protocol_num': edu_data.protocol_num,
                'udostoverenie_num': edu_data.udostoverenie_num,
                'hours': edu_data.hours,
                'date_from': edu_data.date_from.strftime('%Y-%m-%d'),
                'date_to': edu_data.date_to.strftime('%Y-%m-%d'),
                'attachments': files_data
            }]
            return JsonResponse({
                'status': 'SUCCESS',
                'data': data
            }, safe=False)
        except Exception as e:
            return JsonResponse({
                'status': 'ERROR',
                'description': str(e)
            }, status=500)


@login_required
def get_worker_education(request, worker_id):
    """Получение записей об обучении сотрудника по ID."""
    data = []
    emp = get_object_or_404(Employee, pk=worker_id)
    education_queryset = Education.objects.filter(owner=emp).prefetch_related('attachments')
    education_list = list(education_queryset)
    attachments = FileAttachment.objects.filter(education__in=education_list)
    attachments_dict = {}
    for att in attachments:
        if att.education_id not in attachments_dict:
            attachments_dict[att.education_id] = []
        attachments_dict[att.education_id].append({
            'id': att.id,
            'name': att.file.name.split('/')[-1] if att.file.name else f'file_{att.id}',
            'uploaded_at': att.uploaded_at.strftime('%d.%m.%Y %H:%M') if att.uploaded_at else '',
            'url': f'/files/preview/{att.id}/' if att else '',
            'size': att.get_file_size() if att.file else 0
        })

    for data_education in education_list:
        files_data = attachments_dict.get(data_education.id, [])
        data.append({
            'id': data_education.id,
            'program': data_education.get_program_display(),
            'protocol_num': data_education.protocol_num,
            'udostoverenie_num': data_education.udostoverenie_num,
            'hours': data_education.hours,
            'date_from': data_education.date_from.strftime("%d.%m.%Y") if data_education.date_from else None,
            'date_to': data_education.date_to.strftime("%d.%m.%Y") if data_education.date_to else None,
            'attachments': files_data
        })

    return JsonResponse({'data': data})


class EduAddView(LoginRequiredMixin, UsersOnlyMixin, View):
    """Представление для добавления новой записи об обучении."""
    def post(self, request):
        try:
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({
                    'status': 'ERROR',
                    'description': 'Неверный формат JSON'
                }, status=400)

            required_fields = ['employee_id', 'program', 'protocol_num', 'udostoverenie_num', 'hours', 'date_from', 'date_to']
            for field in required_fields:
                if field not in data:
                    return JsonResponse({
                        'status': 'ERROR',
                        'description': f'Отсутствует обязательное поле: {field}'
                    }, status=400)

            try:
                try:
                    employee_id = int(data['employee_id'])
                except (ValueError, TypeError):
                    raise ValidationError('ID сотрудника должен быть целым числом')

                if not Employee.objects.filter(id=employee_id).exists():
                    raise ValidationError('Сотрудник с таким ID не существует')

                valid_programs = ['ot_managers', 'ot_teachers', 'first_aid', 'fire_safety', 'electrical_safety', 'sanitary_minimum', 'civil_defense', 'anti_terror']
                if data['program'] not in valid_programs:
                    raise ValidationError(f"Программа должна быть одной из: {', '.join(valid_programs)}")

                if not data['protocol_num'].strip():
                    raise ValidationError('Номер протокола не может быть пустым')

                if not data['udostoverenie_num'].strip():
                    raise ValidationError('Номер удостоверения не может быть пустым')

                try:
                    hours = float(data['hours'])
                    if hours <= 0 or hours > 1000:
                        raise ValidationError('Часы должны быть от 1 до 1000')
                except (ValueError, TypeError):
                    raise ValidationError('Часы должны быть положительным числом')

                try:
                    date_from = datetime.strptime(data['date_from'], '%Y-%m-%d').date()
                except (ValueError, TypeError):
                    raise ValidationError('Дата начала должна быть в формате YYYY-MM-DD')

                try:
                    date_to = datetime.strptime(data['date_to'], '%Y-%m-%d').date()
                except (ValueError, TypeError):
                    raise ValidationError('Дата окончания должна быть в формате YYYY-MM-DD')

                if date_to < date_from:
                    raise ValidationError('Дата окончания не может быть раньше даты начала')

            except ValidationError as e:
                return JsonResponse({
                    'status': 'ERROR',
                    'description': str(e)
                }, status=400)

            try:
                with transaction.atomic():
                    education = Education(
                        owner=Employee.objects.get(pk=employee_id),
                        program=data['program'],
                        protocol_num=data['protocol_num'],
                        udostoverenie_num=data['udostoverenie_num'],
                        hours=hours,
                        date_from=date_from,
                        date_to=date_to
                    )
                    education.full_clean()
                    education.save()
                    check_expirations()
                return JsonResponse({
                    'status': 'SUCCESS',
                    'id': education.id
                })
            except Exception as e:
                return JsonResponse({
                    'status': 'ERROR',
                    'description': f'Ошибка сохранения записи об обучении: {str(e)}'
                }, status=500)

        except Exception as e:
            return JsonResponse({
                'status': 'ERROR',
                'description': f'Непредвиденная ошибка: {str(e)}'
            }, status=500)


class EduUpdateView(LoginRequiredMixin, UsersOnlyMixin, View):
    """Представление для обновления записи об обучении."""
    def patch(self, request, education_id):
        try:
            education = get_object_or_404(Education, pk=education_id)
            old_date_from = education.date_from
            old_date_to = education.date_to

            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({
                    'status': 'ERROR',
                    'description': 'Неверный формат JSON'
                }, status=400)

            try:
                with transaction.atomic():
                    if 'program' in data:
                        valid_programs = ['ot_managers', 'ot_teachers', 'first_aid', 'fire_safety', 'electrical_safety', 'sanitary_minimum', 'civil_defense', 'anti_terror']
                        if data['program'] not in valid_programs:
                            raise ValidationError(f"Программа должна быть одной из: {', '.join(valid_programs)}")
                        education.program = data['program']

                    if 'protocol_num' in data:
                        if not data['protocol_num'].strip():
                            raise ValidationError('Номер протокола не может быть пустым')
                        education.protocol_num = data['protocol_num']

                    if 'udostoverenie_num' in data:
                        if not data['udostoverenie_num'].strip():
                            raise ValidationError('Номер удостоверения не может быть пустым')
                        education.udostoverenie_num = data['udostoverenie_num']

                    if 'hours' in data:
                        try:
                            hours = float(data['hours'])
                            if hours <= 0 or hours > 1000:
                                raise ValidationError('Часы должны быть от 1 до 1000')
                            education.hours = hours
                        except (ValueError, TypeError):
                            raise ValidationError('Часы должны быть положительным числом')

                    date_from = education.date_from
                    date_to = education.date_to

                    if 'date_from' in data:
                        try:
                            date_from = datetime.strptime(data['date_from'], '%Y-%m-%d').date()
                        except (ValueError, TypeError):
                            raise ValidationError('Дата начала должна быть в формате YYYY-MM-DD')
                        education.date_from = date_from

                    if 'date_to' in data:
                        try:
                            date_to = datetime.strptime(data['date_to'], '%Y-%m-%d').date()
                        except (ValueError, TypeError):
                            raise ValidationError('Дата окончания должна быть в формате YYYY-MM-DD')
                        education.date_to = date_to

                    if date_to < date_from:
                        raise ValidationError('Дата окончания не может быть раньше даты начала')

                    education.full_clean()
                    education.save()
                    dates_changed = (old_date_from != date_from) or (old_date_to != date_to)
                    if dates_changed:
                        check_expirations()

                return JsonResponse({
                    'status': 'SUCCESS',
                    'id': education.id
                })

            except ValidationError as e:
                return JsonResponse({
                    'status': 'ERROR',
                    'description': str(e)
                }, status=400)

            except Exception as e:
                return JsonResponse({
                    'status': 'ERROR',
                    'description': f'Ошибка обновления записи об обучении: {str(e)}'
                }, status=500)

        except Exception as e:
            return JsonResponse({
                'status': 'ERROR',
                'description': f'Непредвиденная ошибка: {str(e)}'
            }, status=500)


class EduDeleteView(LoginRequiredMixin, UsersOnlyMixin, View):
    """Представление для удаления записи об обучении."""
    def post(self, request):
        try:
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({
                    'status': 'ERROR',
                    'description': 'Неверный формат JSON'
                }, status=400)

            if 'edu_id' not in data:
                return JsonResponse({
                    'status': 'ERROR',
                    'description': f'Отсутствует обязательное поле: edu_id'
                }, status=400)

            try:
                edu_id = int(data['edu_id'])
            except (ValueError, TypeError):
                raise ValidationError('ID обучения должен быть целым числом')

            try:
                education = get_object_or_404(Education, pk=edu_id)
                education.delete()
                check_expirations()
                return JsonResponse({
                    'status': 'SUCCESS',
                    'description': f'Обучение с ID {edu_id} удалено'
                })
            except Exception as e:
                return JsonResponse({
                    'status': 'ERROR',
                    'description': f'Ошибка: {str(e)}'
                }, status=500)

        except Exception as e:
            return JsonResponse({
                'status': 'ERROR',
                'description': f'Непредвиденная ошибка: {str(e)}'
            }, status=500)


# === Представления для работы с файлами ===
class FileUploadView(LoginRequiredMixin, UsersOnlyMixin, View):
    """Представление для загрузки файлов."""
    def post(self, request):
        try:
            file_type = request.POST.get('file_type')
            object_id = request.POST.get('object_id')
            uploaded_file = request.FILES.get('file')

            if not all([file_type, object_id, uploaded_file]):
                return JsonResponse({
                    'status': 'ERROR',
                    'description': 'Отсутствуют обязательные поля'
                }, status=400)

            if file_type not in ['med', 'education']:
                return JsonResponse({
                    'status': 'ERROR',
                    'description': 'Неверный тип файла'
                }, status=400)

            try:
                object_id = int(object_id)
            except ValueError:
                return JsonResponse({
                    'status': 'ERROR',
                    'description': 'Неверный ID объекта'
                }, status=400)

            if file_type == 'med':
                parent_object = get_object_or_404(Med, id=object_id)
            else:
                parent_object = get_object_or_404(Education, id=object_id)

            try:
                with transaction.atomic():
                    attachment = FileAttachment(
                        file=uploaded_file,
                        file_type=file_type,
                        **{file_type: parent_object}
                    )
                    attachment.full_clean()
                    attachment.save()
                return JsonResponse({
                    'status': 'SUCCESS',
                    'id': attachment.id,
                    'file_name': attachment.file.name,
                    'uploaded_at': attachment.uploaded_at.strftime('%d.%m.%Y %H:%M')
                })
            except ValidationError as e:
                return JsonResponse({
                    'status': 'ERROR',
                    'description': str(e)
                }, status=400)

        except Exception as e:
            return JsonResponse({
                'status': 'ERROR',
                'description': str(e)
            }, status=500)


class FileDeleteView(LoginRequiredMixin, UsersOnlyMixin, View):
    """Представление для удаления файлов."""
    def post(self, request):
        try:
            data = json.loads(request.body)
            file_id = data.get('file_id')
            if not file_id:
                return JsonResponse({
                    'status': 'ERROR',
                    'description': 'ID файла обязателен'
                }, status=400)

            attachment = get_object_or_404(FileAttachment, id=file_id)
            if attachment.file:
                attachment.file.close()
            if attachment.file and os.path.exists(attachment.file.path):
                os.remove(attachment.file.path)
            attachment.file.delete(save=False)
            attachment.delete()
            return JsonResponse({
                'status': 'SUCCESS',
                'description': 'Файл успешно удален'
            })

        except json.JSONDecodeError:
            return JsonResponse({
                'status': 'ERROR',
                'description': 'Неверный формат JSON'
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'status': 'ERROR',
                'description': str(e)
            }, status=500)


class FilePreviewView(LoginRequiredMixin, UsersOnlyMixin, View):
    """Представление для предпросмотра файлов."""
    def get(self, request, file_id):
        try:
            attachment = get_object_or_404(FileAttachment, id=file_id)
            file_name = os.path.basename(attachment.file.name) if attachment.file.name else f"file_{file_id}"
            if not file_name or file_name.strip() == "":
                file_name = f"file_{file_id}"

            file_ext = os.path.splitext(file_name)[1].lower() if file_name else ""
            previewable_types = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.txt']
            mime_types = {
                '.pdf': 'application/pdf',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.txt': 'text/plain',
                '.doc': 'application/msword',
                '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            }

            try:
                with attachment.file.open('rb') as file:
                    file_content = file.read()
                    if not file_content:
                        return JsonResponse({
                            'status': 'ERROR',
                            'description': 'Файл пуст'
                        }, status=500)
            except Exception as e:
                return JsonResponse({
                    'status': 'ERROR',
                    'description': f'Невозможно прочитать файл: {str(e)}'
                }, status=500)

            content_type = mime_types.get(file_ext, 'application/octet-stream')
            encoded_file_name = quote(file_name)
            disposition = (
                f'inline; filename="{quote(file_name)}"'
                if file_ext in previewable_types
                else f'attachment; filename="{encoded_file_name}"'
            )

            response = HttpResponse(file_content, content_type=content_type)
            response['Content-Disposition'] = disposition
            response['Content-Length'] = len(file_content)
            return response

        except FileAttachment.DoesNotExist:
            return JsonResponse({
                'status': 'ERROR',
                'description': 'Файл не найден'
            }, status=404)
        except Exception as e:
            return JsonResponse({
                'status': 'ERROR',
                'description': f'Ошибка: {str(e)}'
            }, status=500)


class FileListView(LoginRequiredMixin, UsersOnlyMixin, View):
    """Представление для получения списка файлов."""
    def get(self, request, file_type, object_id):
        try:
            if file_type not in ['med', 'education']:
                return JsonResponse({
                    'status': 'ERROR',
                    'description': 'Неверный тип файла'
                }, status=400)

            attachments = FileAttachment.objects.filter(
                **{f'{file_type}__id': object_id}
            ).order_by('-uploaded_at')
            files_data = [{
                'id': att.id,
                'name': att.file.name.split('/')[-1],
                'url': att.file.url,
                'uploaded_at': att.uploaded_at.strftime('%d.%m.%Y %H:%M'),
                'size': att.get_file_size()
            } for att in attachments]
            return JsonResponse({
                'status': 'SUCCESS',
                'files': files_data
            })

        except Exception as e:
            return JsonResponse({
                'status': 'ERROR',
                'description': str(e)
            }, status=500)