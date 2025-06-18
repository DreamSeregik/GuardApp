$(document).ready(function () {
    // Показываем общие ошибки через уведомления
    const $nonFieldErrors = $('#nonFieldErrors');
    if ($nonFieldErrors.length && $nonFieldErrors.text().trim()) {
        showNotification($nonFieldErrors.text().trim(), 'error');
    }

    // Обработчики для чекбоксов "Показать пароль"
    $('#showOldPassword').change(function () {
        const $passwordField = $('#id_old_password');
        $passwordField.attr('type', this.checked ? 'text' : 'password');
    });

    $('#showNewPassword1').change(function () {
        const $passwordField = $('#id_new_password1');
        $passwordField.attr('type', this.checked ? 'text' : 'password');
    });

    $('#showNewPassword2').change(function () {
        const $passwordField = $('#id_new_password2');
        $passwordField.attr('type', this.checked ? 'text' : 'password');
    });

    // Валидация формы перед отправкой
    const $form = $('#passwordChangeForm');
    if ($form.length) {
        $form.on('submit', function (e) {
            let isValid = true;
            const fields = [
                { id: 'id_old_password', message: 'Введите текущий пароль' },
                { id: 'id_new_password1', message: 'Введите новый пароль' },
                { id: 'id_new_password2', message: 'Подтвердите новый пароль' }
            ];

            // Сбрасываем предыдущие ошибки
            $('.is-invalid').removeClass('is-invalid');
            $('.invalid-feedback').remove();

            // Проверяем каждое поле
            $.each(fields, function (_, field) {
                const $field = $(`#${field.id}`);
                if (!$field.val().trim()) {
                    $field.addClass('is-invalid');
                    $(`<div class="invalid-feedback"><ul><li>${field.message}</li></ul></div>`).insertAfter($field);
                    isValid = false;
                }
            });

            // Проверка совпадения паролей
            const $newPass1 = $('#id_new_password1');
            const $newPass2 = $('#id_new_password2');

            if ($newPass1.val() && $newPass2.val() && $newPass1.val() !== $newPass2.val()) {
                $newPass2.addClass('is-invalid');
                $(`<div class="invalid-feedback"><ul><li>Пароли не совпадают</li></ul></div>`).insertAfter($newPass2);
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
            } else {
                // Показываем индикатор загрузки и блокируем кнопку
                $('#submitButton').prop('disabled', true);
                $('#loadingSpinner').removeClass('d-none');
            }
        });

        // Сброс состояния кнопки при возврате на страницу
        $(window).on('pageshow', function () {
            $('#submitButton').prop('disabled', false);
            $('#loadingSpinner').addClass('d-none');
        });
    }
});