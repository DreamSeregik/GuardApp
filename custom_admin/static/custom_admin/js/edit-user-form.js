/**
 * UserEditForm - модуль для работы с формой редактирования пользователя
 */
const UserEditForm = {
    init: function () {
        this.cacheElements();
        this.bindEvents();

        this.modal = new bootstrap.Modal(this.$modal[0], {
            focus: false
        });
    },

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
            this.validatePasswordInputs();
            this.updatePassword1Counter();
            this.restrictToLatin(e.target);
        });
        this.$password2Input.on('input', (e) => {
            this.validatePasswordInputs();
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
        this.$cancelBtn.on('click', this.handleCancelClick.bind(this));

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

    validateFullNameInput: function () {
        const fullName = this.$fullNameInput.val().trim();
        const fullNameRegex = /^[А-ЯЁ][а-яё]+\s[А-ЯЁ][а-яё]+(?:\s[А-ЯЁ][а-яё]+)?$/;

        if (fullName === '') {
            this.$fullNameInput.removeClass('is-invalid');
            $('#editFullNameFeedback').hide();
            return true;
        } else if (!fullNameRegex.test(fullName)) {
            this.$fullNameInput.addClass('is-invalid');
            $('#editFullNameFeedback').text('Введите корректное ФИО (2-3 слова, каждое с заглавной буквы)').show();
            return false;
        } else {
            this.$fullNameInput.removeClass('is-invalid');
            $('#editFullNameFeedback').hide();
            return true;
        }
    },

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

    updateFullNameCounter: function () {
        const length = this.$fullNameInput.val().length;
        this.$fullNameCounter.text(length);
    },

    updateEmailCounter: function () {
        const length = this.$emailInput.val().length;
        this.$emailCounter.text(length);
    },

    updateUsernameCounter: function () {
        const length = this.$usernameInput.val().length;
        $('#editUsernameCounter').text(length);
    },

    updatePassword1Counter: function () {
        const length = this.$password1Input.val().length;
        this.$password1Counter.text(length);
    },

    updatePassword2Counter: function () {
        const length = this.$password2Input.val().length;
        this.$password2Counter.text(length);
    },

    togglePasswordVisibility: function (fieldId) {
        const $field = $(`#${fieldId}`);
        const $checkbox = $(`#edit_show${fieldId.replace('edit_', '').charAt(0).toUpperCase() + fieldId.replace('edit_', '').slice(1)}`);
        $field.attr('type', $checkbox.prop('checked') ? 'text' : 'password');
    },

    handleModalShow: function () {
        this.resetForm();
        this.showLoadingSpinner();
        if (selectedUserId) {
            this.loadUserData(selectedUserId).finally(() => {
                this.hideLoadingSpinner();
            });
        }
        this.$modal.removeAttr('aria-hidden');
    },

    handleModalShown: function () {
        this.$usernameInput.trigger('focus');
    },

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

    handleModalHidden: function () {
        setTimeout(() => {
            this.$modal.attr('aria-hidden', 'true');
        }, 100);
    },

    handleCloseClick: function (e) {
        e.preventDefault();
        this.modal.hide();
    },

    handleCancelClick: function (e) {
        e.preventDefault();
        this.modal.hide();
    },

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

    validatePasswordInputs: function () {
        if (this.$generateCheckbox.prop('checked') || !this.$changePasswordCheckbox.prop('checked')) {
            this.$password1Input.removeClass('is-invalid');
            this.$password2Input.removeClass('is-invalid');
            $('#editPassword1Feedback').hide();
            $('#editPassword2Feedback').hide();
            return;
        }

        const password1 = this.$password1Input.val();
        const password2 = this.$password2Input.val();
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/;

        if (!password1) {
            this.$password1Input.addClass('is-invalid');
            $('#editPassword1Feedback').text('Введите пароль').show();
        } else if (password1.length < 8) {
            this.$password1Input.addClass('is-invalid');
            $('#editPassword1Feedback').text('Пароль должен содержать минимум 8 символов').show();
        } else if (!passwordRegex.test(password1)) {
            this.$password1Input.addClass('is-invalid');
            $('#editPassword1Feedback').text('Пароль должен содержать буквы и цифры').show();
        } else {
            this.$password1Input.removeClass('is-invalid');
            $('#editPassword1Feedback').hide();
        }

        if (!password2) {
            this.$password2Input.addClass('is-invalid');
            $('#editPassword2Feedback').text('Введите подтверждение пароля').show();
        } else if (password1 !== password2) {
            this.$password2Input.addClass('is-invalid');
            $('#editPassword2Feedback').text('Пароли не совпадают').show();
        } else {
            this.$password2Input.removeClass('is-invalid');
            $('#editPassword2Feedback').hide();
        }
    },

    restrictToLatin: function (inputElement) {
        const value = inputElement.value;
        const cursorPos = inputElement.selectionStart;
        const newValue = value.replace(/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g, '');

        if (value !== newValue) {
            inputElement.value = newValue;
            inputElement.setSelectionRange(cursorPos - 1, cursorPos - 1);
            inputElement.name === "password1" ? this.updatePassword1Counter() : this.updatePassword2Counter();
            showNotification('Пароль должен содержать только латинские буквы, цифры и специальные символы', 'warning');
        }
    },

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
        }
    },

    loadUserData: async function (userId) {
        try {
            const response = await fetch(`/admin/api/user/${userId}/`);
            const data = await response.json();
            if (data.error) {
                showNotification(data.error, 'error');
                return;
            }
            this.$usernameInput.val(data.username || '');
            this.$emailInput.val(data.email || '');
            const fullName = `${data.last_name || ''} ${data.first_name || ''}`.trim();
            this.$fullNameInput.val(fullName);
            this.$isStaffCheckbox.prop('checked', data.is_staff || false);
            this.$isActiveCheckbox.prop('checked', data.is_active || false);
            this.$generateCheckbox.prop('checked', false);
            this.$changePasswordCheckbox.prop('checked', false);

            // Обновляем счетчики
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
            const password1 = this.$password1Input.val();
            const password2 = this.$password2Input.val();
            const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/;

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
            }

            if (!password2) {
                this.$password2Input.addClass('is-invalid');
                $('#editPassword2Feedback').text('Введите подтверждение пароля').show();
                isValid = false;
            } else if (password1 !== password2) {
                this.$password2Input.addClass('is-invalid');
                $('#editPassword2Feedback').text('Пароли не совпадают').show();
                isValid = false;
            }
        }

        return isValid;
    },

    getFormData: function () {
        const formData = new FormData(this.$form[0]);
        return formData;
    },

    showSpinner: function () {
        this.$submitBtn.prop('disabled', true);
        this.$spinner.removeClass('d-none');
    },

    hideSpinner: function () {
        this.$submitBtn.prop('disabled', false);
        this.$spinner.addClass('d-none');
    },

    showLoadingSpinner: function () {
        this.$loadingSpinner.removeClass('d-none');
        this.$form.addClass('d-none');
    },

    hideLoadingSpinner: function () {
        this.$loadingSpinner.addClass('d-none');
        this.$form.removeClass('d-none');
    },

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

        if (this.$generateCheckbox.prop('checked')) {
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

        const formData = this.getFormData();
        const actionUrl = this.$form.attr('action');

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
                this.modal.hide();
                fetchUsers({
                    search: $('#search-input').val(),
                    role: $('input[name="roleCheck"]:checked').val(),
                    status: $('input[name="statusCheck"]:checked').val(),
                    sort: $('.form-check-inline img.active').attr('id') === 'asc-sort' ? 'asc' : 'desc'
                });
                getUserData(selectedUserId);
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
            const errorMessage = `Не удалось выполнить запрос: ${error.message || 'Неизвестная ошибка'}`;
            showNotification(errorMessage, 'error');
        } finally {
            this.hideSpinner();
        }
    },

    resetForm: function () {
        this.$form.trigger('reset');
        this.$form.find('.is-invalid').removeClass('is-invalid');
        $('#editUsernameFeedback').hide();
        $('#editEmailFeedback').hide();
        $('#editPassword1Feedback').hide();
        $('#editPassword2Feedback').hide();
        this.$generateCheckbox.prop('checked', false);
        this.$changePasswordCheckbox.prop('checked', false);
        this.$showPassword1.prop('checked', false);
        this.$showPassword2.prop('checked', false);
        this.$password1Input.attr('type', 'password');
        this.$password2Input.attr('type', 'password');
        this.$passwordFields.addClass('password-fields-hidden');
        this.updatePasswordFields();
        this.hideSpinner();

        // Сброс счетчиков
        $('#editUsernameCounter').text('0');
        this.$emailCounter.text('0');
        this.$fullNameCounter.text('0');
        this.$password1Counter.text('0');
        this.$password2Counter.text('0');
    },
}

// Инициализация при загрузке документа
$(document).ready(function () {
    if ($('#editUserModal').length) {
        UserEditForm.init();
    }
});