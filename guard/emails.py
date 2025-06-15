from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings

def send_expiration_notification(to_email, user_name, med_messages=None, edu_messages=None):
    login_url = f"{settings.SITE_URL.rstrip('/')}/login/"
    med_messages = med_messages or []
    edu_messages = edu_messages or []
    context = {
        'user_name': user_name,
        'med_messages': med_messages,
        'edu_messages': edu_messages,
        'login_url': login_url,
    }
    html_content = render_to_string('guard/notification_template.html', context)
    text_content = (
        f"Уважаемый(ая) {user_name},\n\n"
        f"Напоминаем о следующих истекающих сроках:\n"
        f"Медосмотры:\n" + "\n".join([f"- {msg}" for msg in med_messages]) + "\n\n"
        f"Обучения:\n" + "\n".join([f"- {msg}" for msg in edu_messages]) + "\n\n"
        f"Пожалуйста, войдите по ссылке {login_url} для просмотра деталей.\n\n"
        f"С уважением,\nВаша система управления персоналом"
    )
    subject = "Уведомление об истечении сроков медосмотров и обучений"
    from_email = settings.DEFAULT_FROM_EMAIL
    email = EmailMultiAlternatives(subject, text_content, from_email, [to_email])
    email.attach_alternative(html_content, "text/html")
    try:
        email.send(fail_silently=False)
        return True
    except Exception as e:
        print(f"Failed to send notification email: {e}")
        return False