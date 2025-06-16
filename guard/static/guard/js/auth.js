$(document).ready(function () {
    // Показываем общие ошибки через уведомления
    const $nonFieldErrors = $('#nonFieldErrors');
    if ($nonFieldErrors.length && $nonFieldErrors.text().trim()) {
        showNotification($nonFieldErrors.text().trim(), 'error');
    }

    // Обработчик для чекбокса "Показать пароль"
    $('#showPassword').change(function () {
        $('#id_password').attr('type', this.checked ? 'text' : 'password');
    });

    // Валидация формы перед отправкой
    $('#loginForm').on('submit', function (e) {
        let isValid = true;
        const $username = $('#id_username');
        const $password = $('#id_password');

        // Сбрасываем стили ошибок
        $username.removeClass('is-invalid');
        $password.removeClass('is-invalid');

        // Проверка логина
        if (!$username.val().trim()) {
            $username.addClass('is-invalid');
            let $feedback = $username.next('.invalid-feedback');
            if (!$feedback.length) {
                $feedback = $('<div class="invalid-feedback">Пожалуйста, введите логин</div>');
                $username.after($feedback);
            }
            isValid = false;
        }

        // Проверка пароля
        if (!$password.val().trim()) {
            $password.addClass('is-invalid');
            let $feedback = $password.next('.invalid-feedback');
            if (!$feedback.length) {
                $feedback = $('<div class="invalid-feedback">Пожалуйста, введите пароль</div>');
                $password.after($feedback);
            }
            isValid = false;
        }

        if (!isValid) {
            e.preventDefault();
            // Прокручиваем к первой ошибке
            const $firstInvalid = $('.is-invalid').first();
            if ($firstInvalid.length) {
                $('html, body').animate({
                    scrollTop: $firstInvalid.offset().top - 100
                }, 500);
            }
        }
    });
});