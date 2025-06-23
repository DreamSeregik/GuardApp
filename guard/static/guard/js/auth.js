/**
 * Модуль для обработки формы авторизации
 */
const AuthForm = {
    // === Инициализация ===
    /**
     * Инициализирует обработчики событий для формы авторизации
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
        // Обработчик для чекбокса "Показать пароль"
        $('#showPassword').on('change', this.togglePasswordVisibility.bind(this));

        // Валидация формы перед отправкой
        $('#loginForm').on('submit', this.validateForm.bind(this));
    },

    // === Обработчики событий ===
    /**
     * Переключает видимость пароля
     * @param {Event} e - Событие изменения чекбокса
     */
    togglePasswordVisibility: function (e) {
        $('#id_password').attr('type', e.target.checked ? 'text' : 'password');
    },

    /**
     * Валидирует форму перед отправкой
     * @param {Event} e - Событие отправки формы
     */
    validateForm: function (e) {
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
        }
    }
};

// === Инициализация модуля ===
$(document).ready(function () {
    AuthForm.init();
});