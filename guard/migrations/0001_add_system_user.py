from django.db import migrations
from django.contrib.auth.models import User

def create_system_user(apps, schema_editor):
    UserModel = apps.get_model('auth', 'User')
    if not UserModel.objects.filter(username='system_notification').exists():
        UserModel.objects.create_user(
            username='system_notification',
            email='system@corp.ru',
            password='somth!ngP@ssW0RD',
            is_staff=False,
            is_active=False
        )

def remove_system_user(apps, schema_editor):
    UserModel = apps.get_model('auth', 'User')
    UserModel.objects.filter(username='system_notification').delete()

class Migration(migrations.Migration):

    operations = [
        migrations.RunPython(create_system_user, remove_system_user)
    ]