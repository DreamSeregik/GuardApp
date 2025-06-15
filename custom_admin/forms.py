import secrets
import string
from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

class CustomUserCreationForm(forms.ModelForm):
    generate_password = forms.BooleanField(
        label='Сгенерировать новый пароль и отправить по e-mail',
        initial=True,
        required=False
    )
    password1 = forms.CharField(
        label='Пароль',
        widget=forms.PasswordInput,
        required=False
    )
    password2 = forms.CharField(
        label='Подтверждение пароля',
        widget=forms.PasswordInput,
        required=False
    )
    full_name = forms.CharField(
        label='ФИО',
        max_length=150,
        required=False
    )

    class Meta:
        model = User
        fields = ('username', 'email', 'full_name', 'is_staff', 'is_active')

    def clean(self):
        cleaned_data = super().clean()
        generate_password = cleaned_data.get('generate_password')
        password1 = cleaned_data.get('password1')
        password2 = cleaned_data.get('password2')

        if not generate_password:
            if not password1 or not password2:
                raise ValidationError('Введите пароль и подтверждение пароля, если генерация пароля отключена.')
            if password1 != password2:
                raise ValidationError('Пароли не совпадают.')
            # Валидация нового пароля
            try:
                validate_password(password1)
            except ValidationError as e:
                raise ValidationError({'password1': e.messages})

        # Если выбрана генерация пароля, поля пароля должны быть пустыми
        if generate_password and (password1 or password2):
            raise ValidationError('При генерации пароля поля пароля должны быть пустыми.')

        return cleaned_data

    def save(self, commit=True):
        user = super().save(commit=False)
        # Handle full name
        full_name = self.cleaned_data['full_name'].strip()
        if full_name:
            parts = full_name.split(maxsplit=1)
            user.last_name = parts[0] if parts else ''
            user.first_name = parts[1] if len(parts) > 1 else ''
        else:
            user.first_name = ''
            user.last_name = ''
        if self.cleaned_data['generate_password']:
            password = ''.join(secrets.choice(string.ascii_letters + string.digits + string.punctuation) for _ in range(12))
            user.set_password(password)
        else:
            user.set_password(self.cleaned_data['password1'])
        if commit:
            user.save()
        return user

class CustomUserChangeForm(forms.ModelForm):
    generate_password = forms.BooleanField(
        label='Сгенерировать новый пароль и отправить по e-mail',
        initial=False,
        required=False
    )
    change_password = forms.BooleanField(
        label='Изменить пароль вручную',
        initial=False,
        required=False
    )
    password1 = forms.CharField(
        label='Пароль',
        widget=forms.PasswordInput,
        required=False
    )
    password2 = forms.CharField(
        label='Подтверждение пароля',
        widget=forms.PasswordInput,
        required=False
    )
    full_name = forms.CharField(
        label='ФИО',
        max_length=150,
        required=False
    )

    class Meta:
        model = User
        fields = ('username', 'email', 'full_name', 'is_staff', 'is_active')

    def clean(self):
        cleaned_data = super().clean()
        generate_password = cleaned_data.get('generate_password')
        change_password = cleaned_data.get('change_password')
        password1 = cleaned_data.get('password1')
        password2 = cleaned_data.get('password2')

        # Проверка: нельзя одновременно генерировать пароль и менять вручную
        if generate_password and change_password:
            raise ValidationError('Выберите только один способ изменения пароля: сгенерировать или ввести вручную.')

        # Если выбрано изменение пароля вручную
        if change_password:
            if not password1 or not password2:
                raise ValidationError('Введите пароль и подтверждение пароля, если выбрано изменение пароля.')
            if password1 != password2:
                raise ValidationError('Пароли не совпадают.')
            # Валидация нового пароля
            try:
                validate_password(password1, self.instance)
            except ValidationError as e:
                raise ValidationError({'password1': e.messages})

        # Если выбрана генерация пароля, поля пароля должны быть пустыми
        if generate_password and (password1 or password2):
            raise ValidationError('При генерации пароля поля пароля должны быть пустыми.')

        return cleaned_data

    def save(self, commit=True):
        user = super().save(commit=False)
        if self.cleaned_data['change_password'] and self.cleaned_data['password1']:
            user.set_password(self.cleaned_data['password1'])
        # Генерация пароля обрабатывается во View для редактирования
        if commit:
            user.save()
        return user

class ChangePasswordForm(forms.Form):
    old_password = forms.CharField(
        label="Текущий пароль",
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'id': 'id_old_password'}),
        required=True,
    )
    new_password1 = forms.CharField(
        label="Новый пароль",
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'id': 'id_new_password1'}),
        required=True,
    )
    new_password2 = forms.CharField(
        label="Подтверждение пароля",
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'id': 'id_new_password2'}),
        required=True,
    )

    def __init__(self, user, *args, **kwargs):
        self.user = user
        super().__init__(*args, **kwargs)

    def clean_old_password(self):
        old_password = self.cleaned_data.get('old_password')
        if not self.user.check_password(old_password):
            raise ValidationError("Неверный текущий пароль.")
        return old_password

    def clean_new_password1(self):
        new_password1 = self.cleaned_data.get('new_password1')
        try:
            validate_password(new_password1, self.user)
        except ValidationError as e:
            raise ValidationError(e.messages)
        return new_password1

    def clean(self):
        cleaned_data = super().clean()
        new_password1 = cleaned_data.get('new_password1')
        new_password2 = cleaned_data.get('new_password2')
        if new_password1 and new_password2 and new_password1 != new_password2:
            raise ValidationError("Новый пароль и подтверждение не совпадают.")
        return cleaned_data

    def save(self):
        new_password = self.cleaned_data['new_password1']
        self.user.set_password(new_password)
        self.user.save()
        return self.user