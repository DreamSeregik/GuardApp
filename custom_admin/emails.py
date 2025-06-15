from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings

def send_welcome_email(to_email, username, full_name, password):
      # Генерируем login_url на основе настроек
      login_url = f"{settings.SITE_URL.rstrip('/')}/login/"
      
      # Контекст для шаблона
      context = {
          'user_name': full_name or username,
          'username': username,
          'email': to_email,
          'password': password,
          'login_url': login_url,
      }
      
      # Рендерим HTML-шаблон
      html_content = render_to_string('custom_admin/email_template.html', context)
      
      # Текстовый вариант письма (для клиентов, не поддерживающих HTML)
      text_content = (
          f"Здравствуйте, {full_name or username}!\n\n"
          f"Добро пожаловать на нашу платформу! Ваш аккаунт успешно создан.\n"
          f"Логин: {username}\n"
          f"Email: {to_email}\n"
          f"Пароль: {password}\n\n"
          f"Пожалуйста, войдите по ссылке {login_url} и смените пароль.\n\n"
          f"Если у вас есть вопросы, свяжитесь с нами: support@yourcompany.com."
      )
      
      # Настраиваем письмо
      subject = 'Ваш новый аккаунт'
      from_email = settings.DEFAULT_FROM_EMAIL
      email = EmailMultiAlternatives(subject, text_content, from_email, [to_email])
      email.attach_alternative(html_content, "text/html")
      
      # Отправляем
      try:
          email.send()
          return True
      except Exception as e:
          print(f"Failed to send email: {e}")
          return False
      
def send_password_reset_email(to_email, username, full_name, password, request):
    """
    Отправляет email с новым паролем пользователю
    :param to_email: Email получателя
    :param username: Логин пользователя
    :param full_name: Полное имя пользователя
    :param password: Новый пароль
    :param request: Объект запроса для построения абсолютных URL
    :return: True если отправка успешна, False в случае ошибки
    """
    # Генерируем login_url
    login_url = request.build_absolute_uri('/')
    
    # Контекст для шаблона
    context = {
        'user_name': full_name or username,
        'username': username,
        'email': to_email,
        'password': password,
        'login_url': login_url,
   }
    
    # Рендерим HTML-шаблон
    html_content = render_to_string('custom_admin/password_reset_email.html', context)
    
    # Текстовый вариант письма
    text_content = (
        f"Здравствуйте, {full_name or username}!\n\n"
        f"Вам был сгенерирован новый пароль для доступа к системе:\n\n"
        f"Логин: {username}\n"
        f"Email: {to_email}\n"
        f"Пароль: {password}\n\n"
        f"Для входа перейдите по ссылке: {login_url}\n\n"
        f"Пожалуйста, сохраните эту информацию в надежном месте и смените пароль при первом входе.\n\n"
        f"Внимание: Не передавайте этот пароль третьим лицам. "
        f"Если у вас есть вопросы, свяжитесь с нами: support@yourcompany.com."
    )
    
    # Настраиваем письмо
    subject = "Ваш новый пароль"
    from_email = settings.DEFAULT_FROM_EMAIL
    email = EmailMultiAlternatives(subject, text_content, from_email, [to_email])
    email.attach_alternative(html_content, "text/html")

    # Отправляем
    try:
        email.send()
        return True
    except Exception as e:
        print(f"Failed to send password reset email: {e}")
        return False