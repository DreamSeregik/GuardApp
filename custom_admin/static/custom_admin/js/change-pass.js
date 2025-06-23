/**
 * Модуль для работы с формой смены пароля
 * @file change-pass.js
 */
const PasswordChangeForm = {
    /**
     * @section Инициализация
     * Инициализация формы смены пароля
     */

    /**
     * Инициализирует форму смены пароля
     * @returns {void}
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.showNonFieldErrors();
    },

    /**
     * @section Кэширование элементов
     * Сохранение ссылок на DOM-элементы формы
     */

    /**
     * Кэширует DOM-элементы формы
     * @returns {void}
     */
    cacheElements() {
        this.$form = $('#passwordChangeForm');
        this.$nonFieldErrors = $('#nonFieldErrors');
        this.$oldPasswordInput = $('#id_old_password');
        this.$newPassword1Input = $('#id_new_password1');
        this.$newPassword2Input = $('#id_new_password2');
        this.$showOldPassword = $('#showOldPassword');
        this.$showNewPassword1 = $('#showNewPassword1');
        this.$showNewPassword2 = $('#showNewPassword2');
        this.$submitButton = $('#submitButton');
        this.$loadingSpinner = $('#loadingSpinner');
    },

    /**
     * @section Обработка событий
     * Привязка обработчиков событий к элементам формы
     */

    /**
     * Привязывает обработчики событий к элементам формы
     * @returns {void}
     */
    bindEvents() {
        this.$showOldPassword.on('change', this.togglePasswordVisibility.bind(this, 'id_old_password'));
        this.$showNewPassword1.on('change', this.togglePasswordVisibility.bind(this, 'id_new_password1'));
        this.$showNewPassword2.on('change', this.togglePasswordVisibility.bind(this, 'id_new_password2'));
        this.$form.on('submit', this.submitForm.bind(this));
        $(window).on('pageshow', this.handlePageShow.bind(this));
    },

    /**
     * Переключает видимость пароля
     * @param {string} fieldId - ID поля пароля
     * @returns {void}
     */
    togglePasswordVisibility: function (fieldId, e) {
        const $passwordField = $(`#${fieldId}`);
        $passwordField.attr('type', e.target.checked ? 'text' : 'password');
    },

    /**
     * Обрабатывает событие pageshow для сброса состояния формы
     * @returns {void}
     */
    handlePageShow() {
        this.hideSpinner();
    },

    /**
     * @section Валидация
     * Методы для проверки корректности введенных данных
     */

    /**
     * Проверяет форму перед отправкой
     * @returns {boolean} Результат валидации
     */
    validateForm() {
        let isValid = true;
        const fields = [
            { input: this.$oldPasswordInput, id: 'id_old_password', message: 'Введите текущий пароль' },
            { input: this.$newPassword1Input, id: 'id_new_password1', message: 'Введите новый пароль' },
            { input: this.$newPassword2Input, id: 'id_new_password2', message: 'Подтвердите новый пароль' },
        ];

        // Проверяем заполненность полей
        fields.forEach((field) => {
            if (!field.input.val().trim()) {
                field.input.addClass('is-invalid');
                let $feedback = field.input.next('.invalid-feedback');
                if (!$feedback.length) {
                    $feedback = $(`<div class="invalid-feedback"><ul><li>${field.message}</li></ul></div>`);
                    field.input.after($feedback);
                } else {
                    $feedback.html(`<ul><li>${field.message}</li></ul>`);
                }
                isValid = false;
            } else {
                field.input.removeClass('is-invalid');
                field.input.next('.invalid-feedback').remove();
            }
        });

        // Проверка совпадения паролей
        const newPass1 = this.$newPassword1Input.val();
        const newPass2 = this.$newPassword2Input.val();
        if (newPass1 && newPass2 && newPass1 !== newPass2) {
            this.$newPassword2Input.addClass('is-invalid');
            let $feedback = this.$newPassword2Input.next('.invalid-feedback');
            if (!$feedback.length) {
                $feedback = $('<div class="invalid-feedback"><ul><li>Пароли не совпадают</li></ul></div>');
                this.$newPassword2Input.after($feedback);
            } else {
                $feedback.html('<ul><li>Пароли не совпадают</li></ul>');
            }
            isValid = false;
        } else if (newPass1 && newPass2) {
            this.$newPassword2Input.removeClass('is-invalid');
            this.$newPassword2Input.next('.invalid-feedback').remove();
        }

        return isValid;
    },

    /**
     * @section Вспомогательные методы
     * Методы для управления состоянием формы
     */

    /**
     * Показывает общие ошибки формы
     * @returns {void}
     */
    showNonFieldErrors() {
        if (this.$nonFieldErrors.length && this.$nonFieldErrors.text().trim()) {
            showNotification(this.$nonFieldErrors.text().trim(), 'error');
        }
    },

    /**
     * Показывает индикатор загрузки
     * @returns {void}
     */
    showSpinner() {
        this.$submitButton.prop('disabled', true);
        this.$loadingSpinner.removeClass('d-none');
    },

    /**
     * Скрывает индикатор загрузки
     * @returns {void}
     */
    hideSpinner() {
        this.$submitButton.prop('disabled', false);
        this.$loadingSpinner.addClass('d-none');
    },

    /**
     * @section Отправка формы
     * Методы для обработки и отправки данных формы
     */

    /**
     * Получает данные формы
     * @returns {FormData} Данные формы
     */
    getFormData() {
        return new FormData(this.$form[0]);
    },

    /**
     * Отправляет форму на сервер
     * @param {Event} e - Событие отправки формы
     * @returns {Promise<void>}
     */
    async submitForm(e) {
        e.preventDefault();
        if (!this.validateForm()) {
            const $firstInvalid = this.$form.find('.is-invalid').first();
            if ($firstInvalid.length) {
                $('html, body').animate({ scrollTop: $firstInvalid.offset().top - 100 }, 500);
            }
            showNotification('Пожалуйста, исправьте ошибки в форме', 'error');
            return;
        }

        this.showSpinner();
        const formData = this.getFormData();
        const actionUrl = this.$form.attr('action');

        const response = await sendPostRequest(actionUrl, formData);

        if (response && response.success) {
            showNotification(response.success, 'success');
            this.$form.trigger('reset');
            this.$form.find('.is-invalid').removeClass('is-invalid');
            this.$form.find('.invalid-feedback').remove();
            this.$showOldPassword.prop('checked', false);
            this.$showNewPassword1.prop('checked', false);
            this.$showNewPassword2.prop('checked', false);
            this.$oldPasswordInput.attr('type', 'password');
            this.$newPassword1Input.attr('type', 'password');
            this.$newPassword2Input.attr('type', 'password');
        } else {
            let errorMessage = response?.error || 'Ошибка смены пароля';
            if (response?.details) {
                const detailedErrors = [];
                if (response.details.general) {
                    detailedErrors.push(...(Array.isArray(response.details.general) ? response.details.general : [response.details.general]));
                }
                for (const [field, errors] of Object.entries(response.details)) {
                    if (field !== 'general') {
                        detailedErrors.push(...(Array.isArray(errors) ? errors : [errors]));
                    }
                }
                if (detailedErrors.length > 0) {
                    errorMessage += ': ' + detailedErrors.join('; ');
                }
            }
            showNotification(errorMessage, 'error');
        }
        this.hideSpinner();
    },
};

// Инициализация при загрузке документа
$(document).ready(() => {
    if ($('#passwordChangeForm').length) {
        PasswordChangeForm.init();
    }
});