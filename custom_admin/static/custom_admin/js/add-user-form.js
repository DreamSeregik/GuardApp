/**
 * Модуль для работы с формой добавления пользователя
 * @file add-user-form.js
 */

/**
 * @section Основной объект
 * Объект для управления формой добавления пользователя
 */
const UserForm = {
    /**
     * @section Инициализация
     * Инициализация формы и модального окна
     */

    /**
     * Инициализирует модуль формы добавления пользователя
     * @returns {void}
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.modal = new bootstrap.Modal(this.$modal[0], { focus: false });
    },

    /**
     * @section Кэширование элементов
     * Сохранение ссылок на DOM-элементы
     */

    /**
     * Кэширует DOM-элементы формы и модального окна
     * @returns {void}
     */
    cacheElements() {
        this.$modal = $('#addUserModal');
        this.$form = $('#addUserForm');
        this.$modalContent = $('.modal-content', this.$modal);
        this.$closeBtn = $('.btn-close', this.$modal);
        this.$cancelBtn = $('.btn-secondary', this.$modal);
        this.$submitBtn = $('button[type="submit"]', this.$form);
        this.$usernameInput = $('#username');
        this.$emailInput = $('#email');
        this.$emailCounter = $('#emailCounter');
        this.$fullNameInput = $('#full_name');
        this.$fullNameCounter = $('#fullNameCounter');
        this.$generateCheckbox = $('#generate_password');
        this.$password1Input = $('#password1');
        this.$password2Input = $('#password2');
        this.$spinner = $('#addUserSpinner');
        this.$showPassword1 = $('#showPassword1');
        this.$showPassword2 = $('#showPassword2');
        this.$usernameCounter = $('#usernameCounter');
        this.$password1Counter = $('#password1Counter');
        this.$password2Counter = $('#password2Counter');
        this.$workerInfoFio = $('#worker-info-fio'); // Добавлено для консистентности
    },

    /**
     * @section Обработка событий
     * Привязка обработчиков событий к элементам формы
     */

    /**
     * Привязывает обработчики событий к элементам формы и модального окна
     * @returns {void}
     */
    bindEvents() {
        this.$generateCheckbox.on('change', this.updatePasswordFields.bind(this));
        this.$submitBtn.on('click', this.submitForm.bind(this));
        this.$emailInput.on('input', this.handleEmailInput.bind(this));
        this.$usernameInput.on('input', this.handleUsernameInput.bind(this));
        this.$password1Input.on('input', this.handlePassword1Input.bind(this));
        this.$password2Input.on('input', this.handlePassword2Input.bind(this));
        this.$showPassword1.on('change', this.togglePasswordVisibility.bind(this, 'password1'));
        this.$showPassword2.on('change', this.togglePasswordVisibility.bind(this, 'password2'));
        this.$fullNameInput.on('input', this.handleFullNameInput.bind(this));
        this.$fullNameInput.on('blur', this.validateFullNameInput.bind(this));
        this.$modal.on('show.bs.modal', this.handleModalShow.bind(this));
        this.$modal.on('shown.bs.modal', this.handleModalShown.bind(this));
        this.$modal.on('hide.bs.modal', this.handleModalHide.bind(this));
        this.$modal.on('hidden.bs.modal', this.handleModalHidden.bind(this));
        this.$closeBtn.on('click', this.handleCloseClick.bind(this));
        this.$cancelBtn.on('click', this.handleCancelClick.bind(this));
    },

    /**
     * Обрабатывает событие показа модального окна
     * @returns {void}
     */
    handleModalShow() {
        this.resetForm();
        this.updatePasswordFields();
        this.$modal.removeAttr('aria-hidden');
    },

    /**
     * Обрабатывает событие после показа модального окна
     * @returns {void}
     */
    handleModalShown() {
        this.$usernameInput.trigger('focus');
    },

    /**
     * Обрабатывает событие скрытия модального окна
     * @returns {void}
     */
    handleModalHide() {
        if (document.activeElement) {
            document.activeElement.blur();
        }
        this.hideSpinner();
    },

    /**
     * Обрабатывает событие после скрытия модального окна
     * @returns {void}
     */
    handleModalHidden() {
        setTimeout(() => {
            this.$modal.attr('aria-hidden', 'true');
        }, 100);
    },

    /**
     * Обрабатывает клик по кнопке закрытия
     * @param {Event} e - Событие клика
     * @returns {void}
     */
    handleCloseClick(e) {
        e.preventDefault();
        this.modal.hide();
    },

    /**
     * Обрабатывает клик по кнопке отмены
     * @param {Event} e - Событие клика
     * @returns {void}
     */
    handleCancelClick(e) {
        e.preventDefault();
        this.modal.hide();
    },

    /**
     * Обрабатывает ввод в поле email
     * @returns {void}
     */
    handleEmailInput() {
        this.validateEmailInput();
        this.updateEmailCounter();
    },

    /**
     * Обрабатывает ввод в поле логина
     * @returns {void}
     */
    handleUsernameInput() {
        this.validateUsernameInput();
        this.updateUsernameCounter();
    },

    /**
     * Обрабатывает ввод в поле пароля 1
     * @param {Event} e - Событие ввода
     * @returns {void}
     */
    handlePassword1Input(e) {
        this.validatePasswordInputs();
        this.updatePassword1Counter();
        this.restrictToLatin(e.target);
    },

    /**
     * Обрабатывает ввод в поле пароля 2
     * @param {Event} e - Событие ввода
     * @returns {void}
     */
    handlePassword2Input(e) {
        this.validatePasswordInputs();
        this.updatePassword2Counter();
        this.restrictToLatin(e.target);
    },

    /**
     * Обрабатывает ввод в поле ФИО
     * @returns {void}
     */
    handleFullNameInput() {
        this.validateFullNameInput();
        this.updateFullNameCounter();
    },

    /**
     * @section Валидация
     * Методы для валидации полей формы
     */

    /**
     * Валидирует поле ФИО
     * @returns {boolean} Результат валидации
     */
    validateFullNameInput() {
        const fullName = this.$fullNameInput.val().trim();
        const fullNameRegex = /^[А-ЯЁ][а-яё]+\s[А-ЯЁ][а-яё]+(?:\s[А-ЯЁ][а-яё]+)?$/;

        if (!fullName) {
            this.$fullNameInput.removeClass('is-invalid');
            $('#fullNameFeedback').hide();
            return true;
        }
        if (!fullNameRegex.test(fullName)) {
            this.$fullNameInput.addClass('is-invalid');
            $('#fullNameFeedback').text('Введите корректное ФИО (2-3 слова, каждое с заглавной буквы)').show();
            return false;
        }
        this.$fullNameInput.removeClass('is-invalid');
        $('#fullNameFeedback').hide();
        return true;
    },

    /**
     * Валидирует поле email
     * @returns {boolean} Результат валидации
     */
    validateEmailInput() {
        const email = this.$emailInput.val().trim();
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const isEmailRequired = this.$generateCheckbox.prop('checked');

        if (!isEmailRequired && !email) {
            this.$emailInput.removeClass('is-invalid');
            $('#emailFeedback').hide();
            return true;
        }
        if (isEmailRequired && !email) {
            this.$emailInput.addClass('is-invalid');
            $('#emailFeedback').text('Пожалуйста, введите email').show();
            return false;
        }
        if (email && !emailRegex.test(email)) {
            this.$emailInput.addClass('is-invalid');
            $('#emailFeedback').text('Введите корректный email (например, example@domain.com)').show();
            return false;
        }
        this.$emailInput.removeClass('is-invalid');
        $('#emailFeedback').hide();
        return true;
    },

    /**
     * Валидирует поле логина
     * @returns {boolean} Результат валидации
     */
    validateUsernameInput() {
        const username = this.$usernameInput.val().trim();
        if (!username) {
            this.$usernameInput.addClass('is-invalid');
            $('#usernameFeedback').text('Пожалуйста, введите логин').show();
            return false;
        }
        this.$usernameInput.removeClass('is-invalid');
        $('#usernameFeedback').hide();
        return true;
    },

    /**
     * Валидирует поля паролей
     * @returns {void}
     */
    validatePasswordInputs() {
        if (this.$generateCheckbox.prop('checked')) {
            this.$password1Input.removeClass('is-invalid');
            this.$password2Input.removeClass('is-invalid');
            $('#password1Feedback').hide();
            $('#password2Feedback').hide();
            return;
        }

        const password1 = this.$password1Input.val();
        const password2 = this.$password2Input.val();
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/;

        if (!password1) {
            this.$password1Input.addClass('is-invalid');
            $('#password1Feedback').text('Введите пароль').show();
        } else if (password1.length < 8) {
            this.$password1Input.addClass('is-invalid');
            $('#password1Feedback').text('Пароль должен содержать минимум 8 символов').show();
        } else if (!passwordRegex.test(password1)) {
            this.$password1Input.addClass('is-invalid');
            $('#password1Feedback').text('Пароль должен содержать буквы и цифры').show();
        } else {
            this.$password1Input.removeClass('is-invalid');
            $('#password1Feedback').hide();
        }

        if (!password2) {
            this.$password2Input.addClass('is-invalid');
            $('#password2Feedback').text('Введите подтверждение пароля').show();
        } else if (password1 !== password2) {
            this.$password2Input.addClass('is-invalid');
            $('#password2Feedback').text('Пароли не совпадают').show();
        } else {
            this.$password2Input.removeClass('is-invalid');
            $('#password2Feedback').hide();
        }
    },

    /**
     * Валидирует всю форму перед отправкой
     * @returns {boolean} Результат валидации
     */
    validateForm() {
        let isValid = true;
        if (!this.validateUsernameInput()) isValid = false;
        if (!this.validateFullNameInput()) isValid = false;
        if (this.$generateCheckbox.prop('checked') && !this.validateEmailInput()) {
            isValid = false;
        } else if (!this.$generateCheckbox.prop('checked') && this.$emailInput.val().trim() && !this.validateEmailInput()) {
            isValid = false;
        }
        if (!this.$generateCheckbox.prop('checked')) {
            this.validatePasswordInputs();
            if (this.$password1Input.hasClass('is-invalid') || this.$password2Input.hasClass('is-invalid')) {
                isValid = false;
            }
        }
        return isValid;
    },

    /**
     * @section Управление формой
     * Методы для управления состоянием формы
     */

    /**
     * Сбрасывает форму в начальное состояние
     * @returns {void}
     */
    resetForm() {
        this.$form.trigger('reset');
        this.$form.find('.is-invalid').removeClass('is-invalid');
        $('#usernameFeedback').hide();
        $('#emailFeedback').hide();
        $('#password1Feedback').hide();
        $('#password2Feedback').hide();
        $('#fullNameFeedback').hide();
        this.$generateCheckbox.prop('checked', true);
        this.$showPassword1.prop('checked', false);
        this.$showPassword2.prop('checked', false);
        this.updatePasswordFields();
        this.updateUsernameCounter();
        this.updatePassword1Counter();
        this.updatePassword2Counter();
        this.updateFullNameCounter();
        this.hideSpinner();
    },

    /**
     * Обновляет состояние полей паролей
     * @returns {void}
     */
    updatePasswordFields() {
        const showPasswordFields = !this.$generateCheckbox.prop('checked');
        $('.password-field').toggleClass('password-fields-hidden', !showPasswordFields);
        const isEmailRequired = this.$generateCheckbox.prop('checked');
        $('label[for="email"]').toggleClass('required-field', isEmailRequired);

        if (!isEmailRequired) {
            this.$emailInput.removeClass('is-invalid');
            $('#emailFeedback').hide();
        }
        if (!showPasswordFields) {
            this.$password1Input.val('').removeClass('is-invalid');
            this.$password2Input.val('').removeClass('is-invalid');
            this.$showPassword1.prop('checked', false);
            this.$showPassword2.prop('checked', false);
            this.$password1Input.attr('type', 'password');
            this.$password2Input.attr('type', 'password');
            $('#password1Feedback').hide();
            $('#password2Feedback').hide();
            this.updatePassword1Counter();
            this.updatePassword2Counter();
        }
    },

    /**
     * Переключает видимость пароля
     * @param {string} fieldId - ID поля пароля
     * @returns {void}
     */
    togglePasswordVisibility(fieldId) {
        const $field = $(`#${fieldId}`);
        const $checkbox = $(`#show${fieldId.charAt(0).toUpperCase() + fieldId.slice(1)}`);
        $field.attr('type', $checkbox.prop('checked') ? 'text' : 'password');
    },

    /**
     * Получает данные формы
     * @returns {FormData} Данные формы
     */
    getFormData() {
        return new FormData(this.$form[0]);
    },

    /**
     * Показывает индикатор загрузки
     * @returns {void}
     */
    showSpinner() {
        this.$submitBtn.prop('disabled', true);
        this.$spinner.removeClass('d-none');
    },

    /**
     * Скрывает индикатор загрузки
     * @returns {void}
     */
    hideSpinner() {
        this.$submitBtn.prop('disabled', false);
        this.$spinner.addClass('d-none');
    },

    /**
     * Отправляет форму на сервер
     * @param {Event} e - Событие отправки формы
     * @returns {Promise<void>}
     */
    submitForm: async function (e) {
        e.preventDefault();
        if (!this.validateForm()) {
            showNotification('Пожалуйста, исправьте ошибки в форме', 'error');
            return;
        }

        this.showSpinner();
        const formData = this.getFormData();
        const actionUrl = this.$form.attr('action');

        try {
            const response = await fetch(actionUrl, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest' // Mimic AJAX header for Django to recognize
                }
            });
            const data = await response.json();

            if (data.success) {
                showNotification(data.success, 'success');
                this.modal.hide();
                await UserManager.fetchUsers({
                    search: $('#search-input').val(),
                    role: $('input[name="roleCheck"]:checked').val(),
                    status: $('input[name="statusCheck"]:checked').val(),
                    sort: $('.form-check-inline img.active').attr('id') === 'asc-sort' ? 'asc' : 'desc'
                });
            } else {
                let errorMessage = 'Ошибка добавления пользователя';
                if (data.error) {
                    errorMessage = data.error;
                    if (data.details) {
                        let detailedErrors = [];
                        if (data.details.general) {
                            detailedErrors.push(...(Array.isArray(data.details.general) ? data.details.general : [data.details.general]));
                        }
                        for (const [field, errors] of Object.entries(data.details)) {
                            if (field !== 'general') {
                                detailedErrors.push(...(Array.isArray(errors) ? errors : [errors]));
                            }
                        }
                        if (detailedErrors.length > 0) {
                            errorMessage = detailedErrors.join('; ');
                        }
                    }
                }
                showNotification(errorMessage, 'error');
                await UserManager.fetchUsers({
                    search: $('#search-input').val(),
                    role: $('input[name="roleCheck"]:checked').val(),
                    status: $('input[name="statusCheck"]:checked').val(),
                    sort: $('.form-check-inline img.active').attr('id') === 'asc-sort' ? 'asc' : 'desc'
                });
            }
        } catch (error) {
            const errorMessage = `Не удалось выполнить запрос: ${error.message || 'Неизвестная ошибка'}`;
            showNotification(errorMessage, 'error');
            await UserManager.fetchUsers({
                search: $('#search-input').val(),
                role: $('input[name="roleCheck"]:checked').val(),
                status: $('input[name="statusCheck"]:checked').val(),
                sort: $('.form-check-inline img.active').attr('id') === 'asc-sort' ? 'asc' : 'desc'
            });
        } finally {
            this.hideSpinner();
        }
    },

    /**
     * @section Вспомогательные методы
     * Методы для обновления счетчиков и ограничения ввода
     */

    /**
     * Обновляет счетчик символов в поле ФИО
     * @returns {void}
     */
    updateFullNameCounter() {
        const length = this.$fullNameInput.val().length;
        this.$fullNameCounter.text(length);
    },

    /**
     * Обновляет счетчик символов в поле email
     * @returns {void}
     */
    updateEmailCounter() {
        const length = this.$emailInput.val().length;
        this.$emailCounter.text(length);
    },

    /**
     * Обновляет счетчик символов в поле логина
     * @returns {void}
     */
    updateUsernameCounter() {
        const length = this.$usernameInput.val().length;
        this.$usernameCounter.text(length);
    },

    /**
     * Обновляет счетчик символов в поле пароля 1
     * @returns {void}
     */
    updatePassword1Counter() {
        const length = this.$password1Input.val().length;
        this.$password1Counter.text(length);
    },

    /**
     * Обновляет счетчик символов в поле пароля 2
     * @returns {void}
     */
    updatePassword2Counter() {
        const length = this.$password2Input.val().length;
        this.$password2Counter.text(length);
    },

    /**
     * Ограничивает ввод только латинскими символами
     * @param {HTMLInputElement} inputElement - Поле ввода
     * @returns {void}
     */
    restrictToLatin(inputElement) {
        const value = inputElement.value;
        const cursorPos = inputElement.selectionStart;
        const newValue = value.replace(/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g, '');

        if (value !== newValue) {
            inputElement.value = newValue;
            inputElement.setSelectionRange(cursorPos - 1, cursorPos - 1);
            inputElement.name === 'password1' ? this.updatePassword1Counter() : this.updatePassword2Counter();
            showNotification('Пароль должен содержать только латинские буквы, цифры и специальные символы', 'warning');
        }
    },
};

// Инициализация при загрузке документа
$(document).ready(() => {
    if ($('#addUserModal').length) {
        UserForm.init();
    }
});