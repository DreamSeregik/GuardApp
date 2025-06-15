from celery import shared_task
from celery.utils.log import get_task_logger
from datetime import datetime, timedelta
from django.db.models import Q
from .models import Med, Education, Notification
from django.contrib.auth.models import User
from .emails import send_expiration_notification
import re

logger = get_task_logger(__name__)

def is_valid_email(email):
    """Проверяет, является ли email-адрес валидным."""
    if not email or not isinstance(email, str):
        return False
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(email_regex, email) is not None

@shared_task
def check_expirations():
    logger.info("Starting check_expirations task")
    
    notification_days = 30
    current_date = datetime.now().date()
    threshold_date = current_date + timedelta(days=notification_days)

    # Получить актуальные записи Med и Education
    upcoming_meds = Med.objects.filter(date_to__gte=current_date, date_to__lte=threshold_date)
    upcoming_educations = Education.objects.filter(date_to__gte=current_date, date_to__lte=threshold_date)
    # Получить всех не-администраторов
    non_admin_users = User.objects.filter(is_staff=False).exclude(username='system_notification')

    if not non_admin_users.exists():
        logger.warning("No non-admin users found in the system (excluding system_notification)")
        return

    logger.info(f"Found {non_admin_users.count()} non-admin users")

    # Получить системного пользователя
    try:
        system_user = User.objects.get(username='system_notification')
    except User.DoesNotExist:
        logger.error("System user 'system_notification' not found. Aborting task.")
        return

    # Собираем сообщения для email
    med_messages = [
        f"{med.get_type_display()} медосмотр для {med.owner.FIO} истекает {med.date_to.strftime('%d.%m.%Y')}."
        for med in upcoming_meds
    ]
    edu_messages = [
        f"Обучение {education.get_programm_display()} для {education.owner.FIO} истекает {education.date_to.strftime('%d.%m.%Y')}."
        for education in upcoming_educations
    ]

    if not (med_messages or edu_messages):
        logger.info("No upcoming expirations found")
        return

    # Шаг 1: Удаление старых уведомлений для system_notification
    Notification.objects.filter(user=system_user, is_read=False).delete()
    logger.debug("Deleted old general notifications for system_notification")

    # Шаг 2: Создание отдельных уведомлений
    for med in upcoming_meds:
        message = f"{med.get_type_display()} медосмотр для {med.owner.FIO} истекает {med.date_to.strftime('%d.%m.%Y')}."
        Notification.objects.create(
            user=system_user,
            message=message,
            med=med,
            created_at=datetime.now()
        )
        logger.debug(f"Created notification for med ID {med.id}")

    for education in upcoming_educations:
        message = f"Обучение {education.get_programm_display()} для {education.owner.FIO} истекает {education.date_to.strftime('%d.%m.%Y')}."
        Notification.objects.create(
            user=system_user,
            message=message,
            education=education,
            created_at=datetime.now()
        )
        logger.debug(f"Created notification for education ID {education.id}")

    # Шаг 3: Очистка неактуальных уведомлений
    Notification.objects.filter(
        Q(med__isnull=False) & ~Q(med__in=Med.objects.all())
    ).delete()
    Notification.objects.filter(
        Q(education__isnull=False) & ~Q(education__in=Education.objects.all())
    ).delete()
    Notification.objects.filter(
        Q(med__date_to__lt=current_date) | Q(med__date_to__gt=threshold_date)
    ).delete()
    Notification.objects.filter(
        Q(education__date_to__lt=current_date) | Q(education__date_to__gt=threshold_date)
    ).delete()

    # Шаг 4: Отправка персонализированных email
    for user in non_admin_users:
        if not is_valid_email(user.email):
            logger.warning(f"Skipping email for user {user.username} (ID: {user.id}): invalid or missing email")
            continue
        try:
            send_expiration_notification(
                to_email=user.email,
                user_name=user.first_name or user.username,
                med_messages=med_messages,
                edu_messages=edu_messages
            )
            logger.info(f"Sent personalized email to {user.email}")
        except Exception as e:
            logger.error(f"Failed to send email to {user.email}: {str(e)}")

    logger.info(f"Processed {upcoming_meds.count()} meds, {upcoming_educations.count()} educations")
    logger.info("Finished check_expirations task")