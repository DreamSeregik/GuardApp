/**
 * UserEditForm - модуль для работы с формой редактирования пользователя
 */
const UserEditForm = {
    // === Инициализация ===
    /**
     * Инициализирует модуль, кэширует элементы и привязывает события
     */
    init: function () {
        this.cacheElements();
        this.bindEvents();
        this.modal = new bootstrap.Modal(this.$modal[0], { focus: false });
    },

    // === Кэширование DOM-элементов ===
    /**
     * Сохраняет ссылки на DOM-элементы формы
     */
    cacheElements: function () {
        this.$modal = $('#editUserModal');
        this.$form = $('#editUserForm');
        this.$modalContent = $('.modal-content', this.$modal);
        this.$closeBtn = $('.btn-close', this.$modal);
        this.$cancelBtn = $('.btn-secondary', this.$modal);
        this.$submitBtn = $('button[type="submit"]', this.$form);
        this.$usernameInput = $('#edit_username');
        this.$emailInput = $('#edit_email');
        this.$emailCounter = $('#editEmailCounter');
        this.$fullNameInput = $('#edit_full_name');
        this.$fullNameCounter = $('#editFullNameCounter');
        this.$isStaffCheckbox = $('#edit_is_staff');
        this.$isActiveCheckbox = $('#edit_is_active');
        this.$generateCheckbox = $('#edit_generate_password');
        this.$changePasswordCheckbox = $('#edit_change_password');
        this.$password1Input = $('#edit_password1');
        this.$password2Input = $('#edit_password2');
        this.$showPassword1 = $('#edit_showPassword1');
        this.$showPassword2 = $('#edit_showPassword2');
        this.$passwordFields = $('.password-field');
        this.$spinner = $('#editUserSpinner');
        this.$loadingSpinner = $('#editUserLoadingSpinner');
        this.$password1Counter = $('#editPassword1Counter');
        this.$password2Counter = $('#editPassword2Counter');
    },


    // === Привязка событий ===
    /**
     * Привязывает обработчики событий к элементам формы
    */
    bindEvents: function () {
        this.$emailInput.on('input', () => {
            this.validateEmailInput();
            this.updateEmailCounter();
        });
        this.$usernameInput.on('input', () => {
            this.validateUsernameInput();
            this.updateUsernameCounter();
        });
        this.$password1Input.on('input', (e) => {
            this.validatePassword();
            this.updatePassword1Counter();
            this.restrictToLatin(e.target);
        });
        this.$password2Input.on('input', (e) => {
            this.validatePassword();
            this.updatePassword2Counter();
            this.restrictToLatin(e.target);
        });
        this.$generateCheckbox.on('change', this.updatePasswordFields.bind(this));
        this.$changePasswordCheckbox.on('change', this.updatePasswordFields.bind(this));
        this.$submitBtn.on('click', this.submitForm.bind(this));
        this.$showPassword1.on('change', this.togglePasswordVisibility.bind(this, 'edit_password1'));
        this.$showPassword2.on('change', this.togglePasswordVisibility.bind(this, 'edit_password2'));
        this.$modal.on('show.bs.modal', this.handleModalShow.bind(this));
        this.$modal.on('shown.bs.modal', this.handleModalShown.bind(this));
        this.$modal.on('hide.bs.modal', this.handleModalHide.bind(this));
        this.$modal.on('hidden.bs.modal', this.handleModalHidden.bind(this));
        this.$closeBtn.on('click', this.handleCloseClick.bind(this));
        this.$fullNameInput.on('input', () => {
            this.validateFullNameInput();
            this.updateFullNameCounter();
        });
        this.$fullNameInput.on('blur', this.validateFullNameInput.bind(this));

        // Взаимоисключающие чекбоксы
        this.$generateCheckbox.on('change', () => {
            if (this.$generateCheckbox.prop('checked')) {
                this.$changePasswordCheckbox.prop('checked', false);
            }
            this.updatePasswordFields();
        });
        this.$changePasswordCheckbox.on('change', () => {
            if (this.$changePasswordCheckbox.prop('checked')) {
                this.$generateCheckbox.prop('checked', false);
            }
            this.updatePasswordFields();
        });
    },

    // === Обработчики событий модального окна ===
    /**
     * Обрабатывает событие показа модального окна
    */
    handleModalShow: function () {
        this.resetForm();
        this.showLoadingSpinner();
        if (selectedUserId) {
            this.loadUserData().finally(() => {
                this.hideLoadingSpinner();
            });
        }
        this.$modal.removeAttr('aria-hidden');
    },

    /**
     * Устанавливает фокус на поле логина после показа модального окна
    */
    handleModalShown: function () {
        this.$usernameInput.trigger('focus');
    },

    /**
     * Снимает фокус и скрывает спиннер при закрытии модального окна
    */
    handleModalHide: function () {
        if (document.activeElement) {
            document.activeElement.blur();
        }
        this.hideSpinner();
        this.$changePasswordCheckbox.prop('checked', false);
        this.$generateCheckbox.prop('checked', false);
        this.$passwordFields.addClass('password-fields-hidden');
        this.updatePasswordFields();
    },

    /**
     * Устанавливает атрибут aria-hidden после скрытия модального окна
     */
    handleModalHidden: function () {
        setTimeout(() => {
            this.$modal.attr('aria-hidden', '');
        }, 100);
    },

    /**
     * Закрывает модальное окно при клике на кнопку закрытия
     */
    handleCloseClick: function (e) {
        e.preventDefault();
        this.modal.hide();
    },

    /**
     * Закрывает модальное окно при клике на кнопку отмены
     */
    handleCancel: function (e) {
        e.preventDefault();
        this.modal.hide();
    },

    // === Валидация ===
    // === Валидация ФИО ===
    /**
     * Обрабатывает и проверяет ФИО
     * @param {string} name - Введенное ФИО
     * @param {Object} options - Настройки валидации
     * @returns {Object} Результат валидации
     */
    processFullName: function (name, options = {}) {
        const defaults = {
            requireMiddleName: false,
            minLength: 2,
            maxLength: 100,
            allowHyphen: true,
            allowApostrophe: true,
            allowSinglePart: false,
            autoFixCase: true
        };

        const settings = { ...defaults, ...options };

        if (!name || typeof name !== 'string') {
            return { isValid: false, formattedName: '', error: 'Пустое поле' };
        }

        const cleanedName = name.trim().replace(/\s+/g, ' ');
        if (cleanedName === '') {
            return { isValid: false, formattedName: '', error: 'Пустое поле' };
        }

        if (/[a-zA-Z]/.test(cleanedName)) {
            return { isValid: false, formattedName: cleanedName, error: 'Латинские символы недопустимы' };
        }

        let parts = cleanedName.split(' ');
        if (settings.requireMiddleName && parts.length !== 3) {
            return { isValid: false, formattedName: cleanedName, error: 'Требуется три слова' };
        }

        if (!settings.allowSinglePart && parts.length < 2) {
            return { isValid: false, formattedName: cleanedName, error: 'Требуется минимум два слова' };
        }

        if (parts.length > 3) {
            return { isValid: false, formattedName: cleanedName, error: 'Максимум три слова' };
        }

        const formatPart = part => {
            if (!settings.autoFixCase || !part) return part;

            if (settings.allowHyphen && part.includes('-')) {
                return part.split('-').map(subPart => {
                    return subPart.charAt(0).toUpperCase() + subPart.slice(1).toLowerCase();
                }).join('-');
            }

            if (settings.allowApostrophe && part.includes("'")) {
                return part.split("'").map((subPart, i) => {
                    if (i === 0) {
                        return subPart.charAt(0).toUpperCase() + subPart.slice(1).toLowerCase();
                    }
                    return "'" + subPart.charAt(0).toUpperCase() + subPart.slice(1).toLowerCase();
                }).join('').replace(/''/g, "'");
            }

            return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        };

        const formattedParts = parts.filter(part => part).map(formatPart);
        const formattedName = formattedParts.join(' ');

        const regexParts = ['^[А-ЯЁ]'];
        let mainPart = '[а-яё]+';
        if (settings.allowHyphen) {
            mainPart = '(?:[а-яё]+(?:-[А-ЯЁ][а-яё]+)*)';
        }
        if (settings.allowApostrophe) {
            mainPart = '(?:[а-яё]*(?:\'[А-ЯЁ][а-яё]+)*)';
        }
        regexParts.push(mainPart, '$');
        const regex = new RegExp(regexParts.join(''), 'i');

        for (const part of formattedParts) {
            if (!regex.test(part)) {
                return { isValid: false, formattedName, error: 'Некорректные символы' };
            }

            if (part.length < settings.minLength || part.length > settings.maxLength) {
                return { isValid: false, formattedName, error: 'Недопустимая длина слова' };
            }

            if (settings.allowApostrophe && part.includes("'")) {
                const subParts = part.split("'");
                for (let i = 1; i < subParts.length; i++) {
                    if (!subParts[i] || !/^[А-ЯЁ]/.test(subParts[i])) {
                        return { isValid: false, formattedName, error: 'Некорректный апостроф' };
                    }
                }
            }

            if (settings.allowHyphen && part.includes("-")) {
                const subParts = part.split("-");
                for (let i = 1; i < subParts.length; i++) {
                    if (!subParts[i] || !/^[А-ЯЁ]/.test(subParts[i])) {
                        return { isValid: false, formattedName, error: 'Некорректный дефис' };
                    }
                }
            }
        }

        return { isValid: true, formattedName };
    },

    /**
     * Проверяет поле ввода ФИО
     * @returns {boolean} Результат валидации
     */
    validateFullNameInput() {
        const fullName = this.$fullNameInput.val().trim();
        const fullNameResult = this.processFullName(fullName);

        if (!fullName) {
            this.$fullNameInput.removeClass('is-invalid');
            $('#editFullNameFeedback').hide();
            return true;
        }
        if (!fullNameResult.isValid) {
            this.$fullNameInput.addClass('is-invalid');
            $('#editFullNameFeedback').text('Введите корректное ФИО (2-3 слова, каждое с заглавной буквы)').show();
            return false;
        }
        this.$fullNameInput.removeClass('is-invalid');
        $('#editFullNameFeedback').hide();
        return true;
    },

    /**
    * Проверяет корректность email
    * @returns {boolean} Результат валидации
    */
    validateEmailInput: function () {
        const email = this.$emailInput.val().trim();
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (!this.$generateCheckbox.prop('checked') && email === '') {
            this.$emailInput.removeClass('is-invalid');
            $('#editEmailFeedback').hide();
            return true;
        }

        if (this.$generateCheckbox.prop('checked') && email === '') {
            this.$emailInput.addClass('is-invalid');
            $('#editEmailFeedback').text('Пожалуйста, введите email').show();
            return false;
        }

        if (email && !emailRegex.test(email)) {
            this.$emailInput.addClass('is-invalid');
            $('#editEmailFeedback').text('Введите корректный email (например, example@domain.com)').show();
            return false;
        }

        this.$emailInput.removeClass('is-invalid');
        $('#editEmailFeedback').hide();
        return true;
    },

    /**
    * Проверяет корректность логина
    * @returns {boolean} Результат валидации
    */
    validateUsernameInput: function () {
        const username = this.$usernameInput.val().trim();
        if (!username) {
            this.$usernameInput.addClass('is-invalid');
            $('#editUsernameFeedback').text('Пожалуйста, введите логин').show();
            return false;
        } else {
            this.$usernameInput.removeClass('is-invalid');
            $('#editUsernameFeedback').hide();
            return true;
        }
    },

    /**
     * Проверяет корректность пароля
     * @returns {boolean} Результат валидации
     */
    validatePassword: function () {
        if (this.$generateCheckbox.prop('checked') || !this.$changePasswordCheckbox.prop('checked')) {
            this.$password1Input.removeClass('is-invalid');
            this.$password2Input.removeClass('is-invalid');
            $('#editPassword1Feedback').hide();
            $('#editPassword2Feedback').hide();
            return true;
        }

        const password1 = this.$password1Input.val();
        const password2 = this.$password2Input.val();
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/;
        let isValid = true;

        if (!password1) {
            this.$password1Input.addClass('is-invalid');
            $('#editPassword1Feedback').text('Введите пароль').show();
            isValid = false;
        } else if (password1.length < 8) {
            this.$password1Input.addClass('is-invalid');
            $('#editPassword1Feedback').text('Пароль должен содержать минимум 8 символов').show();
            isValid = false;
        } else if (!passwordRegex.test(password1)) {
            this.$password1Input.addClass('is-invalid');
            $('#editPassword1Feedback').text('Пароль должен содержать буквы и цифры').show();
            isValid = false;
        } else {
            this.$password1Input.removeClass('is-invalid');
            $('#editPassword1Feedback').hide();
        }

        if (!password2) {
            this.$password2Input.addClass('is-invalid');
            $('#editPassword2Feedback').text('Введите подтверждение пароля').show();
            isValid = false;
        } else if (password1 !== password2) {
            this.$password2Input.addClass('is-invalid');
            $('#editPassword2Feedback').text('Пароли не совпадают').show();
            isValid = false;
        } else {
            this.$password2Input.removeClass('is-invalid');
            $('#editPassword2Feedback').hide();
        }

        return isValid;
    },

    /**
    * Проверяет корректность заполнения формы
    * @returns {boolean} Результат валидации
    */
    validateForm: function () {
        let isValid = true;

        if (!this.validateUsernameInput()) {
            isValid = false;
        }

        if (this.$generateCheckbox.prop('checked') && !this.validateEmailInput()) {
            isValid = false;
        } else if (!this.$generateCheckbox.prop('checked') && this.$emailInput.val().trim() !== '' && !this.validateEmailInput()) {
            isValid = false;
        }

        if (!this.validateFullNameInput()) {
            isValid = false;
        }

        if (!this.$generateCheckbox.prop('checked') && this.$changePasswordCheckbox.prop('checked')) {
            if (!this.validatePassword()) {
                isValid = false;
            }
        }

        return isValid;
    },

    // === Управление полями ===
    /**
     * Обновляет счетчик символов для ФИО
    */
    updateFullNameCounter: function () {
        const length = this.$fullNameInput.val().length;
        this.$fullNameCounter.text(length);
    },

    /**
     * Обновляет счетчик символов для email
     */
    updateEmailCounter: function () {
        const length = this.$emailInput.val().length;
        this.$emailCounter.text(length);
    },

    /**
     * Обновляет счетчик символов для логина
     */
    updateUsernameCounter: function () {
        const length = this.$usernameInput.val().length;
        $('#editUsernameCounter').text(length);
    },

    /**
    * Обновляет счетчик символов для первого пароля
    */
    updatePassword1Counter: function () {
        const length = this.$password1Input.val().length;
        this.$password1Counter.text(length);
    },

    /**
     * Обновляет счетчик символов для второго пароля
     */
    updatePassword2Counter: function () {
        const length = this.$password2Input.val().length;
        this.$password2Counter.text(length);
    },

    /**
    * Переключает видимость полей пароля
    * @param {string} fieldId - ID поля пароля
    */
    togglePasswordVisibility: function (fieldId) {
        const $field = $(`#${fieldId}`);
        const $checkbox = $(`#edit_show${fieldId.replace('edit_', '').charAt(0).toUpperCase() + fieldId.replace('edit_', '').slice(1)}`);
        $field.attr('type', $checkbox.prop('checked') ? 'text' : 'password');
    },

    /**
     * Ограничивает ввод пароля латинскими символами
     * @param {HTMLElement} inputElement - Элемент ввода
     */
    restrictToLatin: function (inputElement) {
        const value = inputElement.value;
        const cursorPos = inputElement.selectionStart;
        const newValue = value.replace(/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g, '');

        if (value !== newValue) {
            inputElement.value = newValue;
            inputElement.setSelectionRange(cursorPos - (value.length - newValue.length), cursorPos - (value.length - newValue.length));
            inputElement.name === "password1" ? this.updatePassword1Counter() : this.updatePassword2Counter();
            showNotification('Пароль должен содержать только латинские буквы, цифры и специальные символы', 'warning');
        }
    },

    /**
     * Обновляет состояние полей пароля
     */
    updatePasswordFields: function () {
        const showPasswordFields = !this.$generateCheckbox.prop('checked') && this.$changePasswordCheckbox.prop('checked');
        this.$passwordFields.toggleClass('password-fields-hidden', !showPasswordFields);

        const isEmailRequired = this.$generateCheckbox.prop('checked');
        $('label[for="edit_email"]').toggleClass('required-field', isEmailRequired);

        if (!showPasswordFields) {
            this.$password1Input.val('').removeClass('is-invalid');
            this.$password2Input.val('').removeClass('is-invalid');
            this.$showPassword1.prop('checked', false);
            this.$showPassword2.prop('checked', false);
            this.$password1Input.attr('type', 'password');
            this.$password2Input.attr('type', 'password');
            $('#editPassword1Feedback').hide();
            $('#editPassword2Feedback').hide();
            this.updatePassword1Counter();
            this.updatePassword2Counter();
        }
    },

    // === Запросы к серверу ===
    /**
     * Загружает данные пользователя с сервера
     */
    loadUserData: async function () {
        try {
            const response = await fetch(`/admin/user/${selectedUserId}/`);
            const data = await response.json();
            if (data.error) {
                showNotification(data.error, 'error');
                return;
            }

            const isCurrentUser = data.is_current_user || false;
            this.$usernameInput.val(data.username || '');
            this.$emailInput.val(data.email || '');
            const fullName = `${data.last_name || ''} ${data.first_name || ''}`.trim();
            this.$fullNameInput.val(fullName);

            if (isCurrentUser) {
                this.$isStaffCheckbox.prop('checked', true).prop('disabled', true);
                this.$isActiveCheckbox.prop('checked', true).prop('disabled', true);
                this.$generateCheckbox.prop('checked', false).prop('disabled', true);
                this.$changePasswordCheckbox.prop('checked', false).prop('disabled', true);

                const message = `
                    <div class="alert alert-info mt-3" id="current-user-message">
                        <strong>Ограничения для текущего пользователя:</strong><br>
                        - Для изменения пароля перейдите в <a href="/admin/change-password/">настройки профиля</a>.<br>
                        - Нельзя снять права администратора или деактивировать учетную запись.<br>
                        <strong>Доступные изменения:</strong><br>
                        - Логин<br>
                        - Email<br>
                        - ФИО
                    </div>
                `;
                this.$form.find('.form-check-switch').first().after(message);
            } else {
                this.$isStaffCheckbox.prop('checked', data.is_staff || false).prop('disabled', false);
                this.$isActiveCheckbox.prop('checked', data.is_active || false).prop('disabled', false);
                this.$generateCheckbox.prop('checked', false).prop('disabled', false);
                this.$changePasswordCheckbox.prop('checked', false).prop('disabled', false);
            }

            this.updateUsernameCounter();
            this.updateEmailCounter();
            this.updateFullNameCounter();
            this.updatePassword1Counter();
            this.updatePassword2Counter();
            this.updatePasswordFields();
            this.validateEmailInput();
        } catch (error) {
            console.error('Ошибка при загрузке данных пользователя:', error);
            showNotification('Ошибка загрузки данных пользователя', 'error');
        }
    },

    /**
     * Собирает данные формы для отправки
     * @returns {FormData} Данные формы
     */
    getFormData: function () {
        const disabledFields = this.$form.find(':disabled');
        const disabledStates = [];
        disabledFields.each(function () {
            disabledStates.push($(this).prop('disabled'));
            $(this).prop('disabled', false);
        });

        const formData = new FormData(this.$form[0]);

        disabledFields.each(function (index) {
            $(this).prop('disabled', disabledStates[index]);
        });

        return formData;
    },

    /**
 * Отправляет данные формы на сервер
 */
    submitForm: async function (e) {
        e.preventDefault();
        if (!this.validateForm()) {
            const $firstError = this.$form.find('.is-invalid').first();
            if ($firstError.length) {
                $('html, body').animate({
                    scrollTop: $firstError.offset().top - 100
                }, 500);
            }
            showNotification('Пожалуйста, исправьте ошибки в форме', 'error');
            return;
        }

        this.showSpinner();

        const formData = this.getFormData();
        let isCurrentUser = false;
        try {
            const response = await fetch(`/admin/user/${selectedUserId}/`);
            const data = await response.json();
            isCurrentUser = data.is_current_user || false;
        } catch (error) {
            console.error('Ошибка проверки текущего пользователя:', error);
        }

        if (!isCurrentUser && this.$generateCheckbox.prop('checked')) {
            try {
                const response = await $.ajax({
                    url: `/admin/generate-password/${selectedUserId}/`,
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': Cookies.get('csrftoken')
                    },
                    contentType: 'application/json'
                });
                if (!response.success) {
                    showNotification(response.error, 'error');
                    this.hideSpinner();
                    return;
                }
            } catch (error) {
                showNotification('Ошибка генерации пароля', 'error');
                this.hideSpinner();
                return;
            }
        }

        try {
            const response = await fetch(`/admin/edit/${selectedUserId}/`, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': Cookies.get('csrftoken')
                }
            });
            const data = await response.json();

            if (data.success) {
                showNotification(data.success, 'success');
                if (data.is_current_user) {
                    showNotification(data.success, 'success');
                }
                this.modal.hide();
                UserManager.fetchUsers({
                    search: $('#search-input').val(),
                    role: $('input[name="roleCheck"]:checked').val(),
                    status: $('input[name="statusCheck"]:checked').val(),
                    sort: $('.form-check-inline img.active').attr('id') === 'asc-sort' ? 'asc' : 'desc'
                });
                UserManager.getUserData(selectedUserId);
            } else {
                let errorMessage = 'Ошибка редактирования пользователя';
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
            }
        } catch (error) {
            showNotification(`Не удалось выполнить запрос: ${error.message || 'Неизвестная ошибка'}`, 'error');
        } finally {
            this.hideSpinner();
        }
    },

    // === Управление спиннером ===
    /**
     * Показывает спиннер отправки
     */
    showSpinner: function () {
        this.$submitBtn.prop('disabled', true);
        this.$spinner.removeClass('d-none');
    },

    /**
     * Скрывает спиннер отправки
     */
    hideSpinner: function () {
        this.$submitBtn.prop('disabled', false);
        this.$spinner.addClass('d-none');
    },

    /**
     * Показывает спиннер загрузки данных формы
     */
    showLoadingSpinner: function () {
        this.$loadingSpinner.removeClass('d-none');
        this.$form.addClass('d-none');
    },

    /**
     * Скрывает спиннер загрузки данных формы
     */
    hideLoadingSpinner: function () {
        this.$loadingSpinner.addClass('d-none');
        this.$form.removeClass('d-none');
    },

    // === Сброс формы ===
    /**
     * Сбрасывает форму и очищает поля
     */
    resetForm: function () {
        this.$form.trigger('reset');
        this.$form.find('.is-invalid').removeClass('is-invalid');
        $('#editUsernameFeedback').hide();
        $('#editEmailFeedback').hide();
        $('#editPassword1Feedback').hide();
        $('#editPassword2Feedback').hide();
        $('#editFullNameFeedback').hide();
        this.$generateCheckbox.prop('checked', false);
        this.$changePasswordCheckbox.prop('checked', false);
        this.$showPassword1.prop('checked', false);
        this.$showPassword2.prop('checked', false);
        this.$password1Input.attr('type', 'password');
        this.$password2Input.attr('type', 'password');
        this.$passwordFields.addClass('password-field-hidden');
        this.updatePasswordFields();
        this.hideSpinner();
        $('#editUsernameCounter').text('0');
        this.$emailCounter.text('0');
        this.$fullNameCounter.text('0');
        this.$password1Counter.text('0');
        this.$password2Counter.text('0');
        this.$form.find('#current-user-message').remove();
    },
};

// Инициализация при загрузке документа
$(document).ready(function () {
    if ($('#editUserModal').length) {
        UserEditForm.init();
    }
});