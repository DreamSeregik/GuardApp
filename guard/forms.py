from django import forms
from django.contrib.auth.forms import AuthenticationForm

class LoginForm(AuthenticationForm):
    username = forms.CharField(label='Имя пользователя')
    username.widget.attrs['name'] = 'username'
    password = forms.CharField(label='Пароль', widget=forms.PasswordInput)
    password.widget.attrs['name'] = 'password'

    def __init__(self, *args, **kwargs):
        super(LoginForm, self).__init__(*args, **kwargs)

        for f in self.visible_fields():
            f.field.widget.attrs['class'] = 'form-control'
