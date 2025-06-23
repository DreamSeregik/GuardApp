/**
 * Модуль для обработки формы смены пароля
 */
const PasswordChangeForm = {
    // === Инициализация ===
    /**
     * Инициализирует обработчики событий для формы смены пароля
     */
    init: function () {
        this.bindEvents();
        this.showNonFieldErrors();
    },

    // === Показ общих ошибок ===
    /**
     * Отображает общие ошибки формы через уведомления
     */
    showNonFieldErrors: function () {
        const $nonFieldErrors = $('#nonFieldErrors');
        if ($nonFieldErrors.length && $nonFieldErrors.text().trim()) {
            showNotification($nonFieldErrors.text().trim(), 'error');
        }
    },

    // === Привязка событий ===
    /**
     * Привязывает обработчики событий к элементам формы
     */
    bindEvents: function () {
        const $form = $('#passwordChangeForm');
        if ($form.length) {
            // Обработчики для чекбоксов "Показать пароль"
            $('#showOldPassword').on('change', this.togglePasswordVisibility.bind(this, 'id_old_password'));
            $('#showNewPassword1').on('change', this.togglePasswordVisibility.bind(this, 'id_new_password1'));
            $('#showNewPassword2').on('change', this.togglePasswordVisibility.bind(this, 'id_new_password2'));

            // Валидация формы перед отправкой
            $form.on('submit', this.validateForm.bind(this));

            // Сброс состояния кнопки при возврате на страницу
            $(window).on('pageshow', this.resetButtonState.bind(this));
        }
    },

    // === Обработчики событий ===
    /**
     * Переключает видимость пароля для указанного поля
     * @param {string} fieldId - ID поля пароля
     * @param {Event} e - Событие изменения чекбокса
     */
    togglePasswordVisibility: function (fieldId, e) {
        const $passwordField = $(`#${fieldId}`);
        $passwordField.attr('type', e.target.checked ? 'text' : 'password');
    },

    /**
     * Валидирует форму перед отправкой
     * @param {Event} e - Событие отправки формы
     */
    validateForm: function (e) {
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

        // Если форма не валидна, предотвращаем отправку
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
    },

    /**
     * Сбрасывает состояние кнопки и спиннера при возврате на страницу
     */
    resetButtonState: function () {
        $('#submitButton').prop('disabled', false);
        $('#loadingSpinner').addClass('d-none');
    }
};

// === Инициализация модуля ===
$(document).ready(function () {
    PasswordChangeForm.init();
});