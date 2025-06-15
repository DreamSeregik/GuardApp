from django.db import migrations

def create_admin_user(apps, schema_editor):
    UserModel = apps.get_model('auth', 'User')
    if not UserModel.objects.filter(username='admin').exists():
        user = UserModel.objects.create_user(
            username='admin',
            email='admin@corp.ru',
            password='123'
        )
        user.is_staff = True
        user.is_superuser = True
        user.save()

def remove_admin_user(apps, schema_editor):
    UserModel = apps.get_model('auth', 'User')
    UserModel.objects.filter(username='admin').delete()

class Migration(migrations.Migration):
    dependencies = [
        ('guard', '0001_add_system_user'),
    ]

    operations = [
        migrations.RunPython(create_admin_user, remove_admin_user),
    ]