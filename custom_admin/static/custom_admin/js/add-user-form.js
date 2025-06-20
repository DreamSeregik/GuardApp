/**
 * UserForm - модуль для работы с формой добавления пользователя
 */
const UserForm = {
    init: function () {
        this.cacheElements();
        this.bindEvents();

        this.modal = new bootstrap.Modal(this.$modal[0], {
            focus: false
        });
    },

    cacheElements: function () {
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
    },

    bindEvents: function () {
        this.$generateCheckbox.on('change', this.updatePasswordFields.bind(this));
        this.$submitBtn.on('click', this.submitForm.bind(this));
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
        this.$showPassword1.on('change', this.togglePasswordVisibility.bind(this, 'password1'));
        this.$showPassword2.on('change', this.togglePasswordVisibility.bind(this, 'password2'));

        this.$modal.on('show.bs.modal', this.handleModalShow.bind(this));
        this.$modal.on('shown.bs.modal', this.handleModalShown.bind(this));
        this.$modal.on('hide.bs.modal', this.handleModalHide.bind(this));
        this.$modal.on('hidden.bs.modal', this.handleModalHidden.bind(this));

        this.$closeBtn.on('click', this.handleCloseClick.bind(this));
        this.$cancelBtn.on('click', this.handleCancelClick.bind(this));

        this.$fullNameInput.on('input', () => {
            this.validateFullNameInput();
            this.updateFullNameCounter();
        })
        this.$fullNameInput.on('blur', this.validateFullNameInput.bind(this));
    },

    handleModalShow: function () {
        this.resetForm();
        this.updatePasswordFields();
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

    validateFullNameInput: function () {
        const fullName = this.$fullNameInput.val().trim();
        const fullNameRegex = /^[А-ЯЁ][а-яё]+\s[А-ЯЁ][а-яё]+(?:\s[А-ЯЁ][а-яё]+)?$/;

        if (fullName === '') {
            this.$fullNameInput.removeClass('is-invalid');
            $('#fullNameFeedback').hide();
            return true;
        } else if (!fullNameRegex.test(fullName)) {
            this.$fullNameInput.addClass('is-invalid');
            $('#fullNameFeedback').text('Введите корректное ФИО (2-3 слова, каждое с заглавной буквы)').show();
            return false;
        } else {
            this.$fullNameInput.removeClass('is-invalid');
            $('#fullNameFeedback').hide();
            return true;
        }
    },

    validateEmailInput: function () {
        const email = this.$emailInput.val().trim();
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (!this.$generateCheckbox.prop('checked') && email === '') {
            this.$emailInput.removeClass('is-invalid');
            $('#emailFeedback').hide();
            return true;
        }

        if (this.$generateCheckbox.prop('checked') && email === '') {
            this.$emailInput.addClass('is-invalid');
            $('#emailFeedback').text('Пожалуйста, введите email').show();
            return false;
        }

        // Проверка формата email, если поле не пустое
        if (email && !emailRegex.test(email)) {
            this.$emailInput.addClass('is-invalid');
            $('#emailFeedback').text('Введите корректный email (например, example@domain.com)').show();
            return false;
        }

        this.$emailInput.removeClass('is-invalid');
        $('#emailFeedback').hide();
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
        this.$usernameCounter.text(length);
    },

    updatePassword1Counter: function () {
        const length = this.$password1Input.val().length;
        this.$password1Counter.text(length);
    },

    updatePassword2Counter: function () {
        const length = this.$password2Input.val().length;
        this.$password2Counter.text(length);
    },

    updatePasswordFields: function () {
        const showPasswordFields = !this.$generateCheckbox.prop('checked');
        $('.password-field').toggleClass('password-fields-hidden', !showPasswordFields);

        const isEmailRequired = this.$generateCheckbox.prop('checked');
        $('label[for="email"]').toggleClass('required-field', isEmailRequired);

        // Скрываем ошибку email, если галочка отключена
        if (!isEmailRequired) {
            this.$emailInput.removeClass('is-invalid');
            $('#emailFeedback').hide();
        }

        if (!showPasswordFields) {
            // Сбрасываем значения и валидацию паролей
            this.$password1Input.val('').removeClass('is-invalid');
            this.$password2Input.val('').removeClass('is-invalid');

            // Сбрасываем видимость паролей
            this.$showPassword1.prop('checked', false);
            this.$showPassword2.prop('checked', false);
            this.$password1Input.attr('type', 'password');
            this.$password2Input.attr('type', 'password');

            // Скрываем сообщения об ошибках
            $('#password1Feedback').hide();
            $('#password2Feedback').hide();
        }
    },

    validateUsernameInput: function () {
        const username = this.$usernameInput.val().trim();

        if (username === '') {
            this.$usernameInput.addClass('is-invalid');
            $('#usernameFeedback').text('Пожалуйста, введите логин').show();
            return false;
        } else {
            this.$usernameInput.removeClass('is-invalid');
            $('#usernameFeedback').hide();
            return true;
        }
    },

    togglePasswordVisibility: function (fieldId) {
        const $field = $(`#${fieldId}`);
        const $checkbox = $(`#show${fieldId.charAt(0).toUpperCase() + fieldId.slice(1)}`);
        $field.attr('type', $checkbox.prop('checked') ? 'text' : 'password');
    },


    validatePasswordInputs: function () {
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

        // Валидация первого поля пароля
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

        // Валидация второго поля пароля (подтверждение)
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

    restrictToLatin: function (inputElement) {
        const value = inputElement.value;
        const cursorPos = inputElement.selectionStart;
        const newValue = value.replace(/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g, '');

        if (value !== newValue) {
            inputElement.value = newValue;
            inputElement.setSelectionRange(cursorPos - 1, cursorPos - 1);
            inputElement.name === "password1" ? this.updatePassword1Counter() : this.updatePassword2Counter()
            showNotification('Пароль должен содержать только латинские буквы и символы', 'warning');
        }
    },


    validateForm: function () {
        let isValid = true;

        // Валидация логина (обязательное поле)
        if (!this.validateUsernameInput()) {
            isValid = false;
        }

        // Валидация email (обязателен только если включена генерация пароля)
        if (this.$generateCheckbox.prop('checked') && !this.validateEmailInput()) {
            isValid = false;
        } else if (!this.$generateCheckbox.prop('checked') && this.$emailInput.val().trim() !== '' && !this.validateEmailInput()) {
            // Если email не обязателен, но введен - проверяем его валидность
            isValid = false;
        }

        // Валидация паролей (если не генерируется автоматически)
        if (!this.$generateCheckbox.prop('checked')) {
            const password1 = this.$password1Input.val();
            const password2 = this.$password2Input.val();
            const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

            if (!password1) {
                this.$password1Input.addClass('is-invalid');
                $('#password1Feedback').text('Введите пароль').show();
                isValid = false;
            } else if (password1.length < 8) {
                this.$password1Input.addClass('is-invalid');
                $('#password1Feedback').text('Пароль должен содержать минимум 8 символов').show();
                isValid = false;
            } else if (!passwordRegex.test(password1)) {
                this.$password1Input.addClass('is-invalid');
                $('#password1Feedback').text('Пароль должен содержать буквы и цифры').show();
                isValid = false;
            }

            if (!password2) {
                this.$password2Input.addClass('is-invalid');
                $('#password2Feedback').text('Введите подтверждение пароля').show();
                isValid = false;
            } else if (password1 !== password2) {
                this.$password2Input.addClass('is-invalid');
                $('#password2Feedback').text('Пароли не совпадают').show();
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
                await fetchUsers({
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
                await fetchUsers({
                    search: $('#search-input').val(),
                    role: $('input[name="roleCheck"]:checked').val(),
                    status: $('input[name="statusCheck"]:checked').val(),
                    sort: $('.form-check-inline img.active').attr('id') === 'asc-sort' ? 'asc' : 'desc'
                });
            }
        } catch (error) {
            const errorMessage = `Не удалось выполнить запрос: ${error.message || 'Неизвестная ошибка'}`;
            showNotification(errorMessage, 'error');
            await fetchUsers({
                search: $('#search-input').val(),
                role: $('input[name="roleCheck"]:checked').val(),
                status: $('input[name="statusCheck"]:checked').val(),
                sort: $('.form-check-inline img.active').attr('id') === 'asc-sort' ? 'asc' : 'desc'
            });
        } finally {
            this.hideSpinner();
        }
    },

    resetForm: function () {
        this.$form.trigger('reset');
        this.$form.find('.is-invalid').removeClass('is-invalid');
        $('#usernameFeedback').hide();
        $('#emailFeedback').hide();
        $('#password1Feedback').hide();
        $('#password2Feedback').hide();
        this.$generateCheckbox.prop('checked', true);
        this.$showPassword1.prop('checked', false)
        this.$showPassword2.prop('checked', false)
        this.updatePasswordFields();
        this.updateUsernameCounter();
        this.updatePassword1Counter();
        this.updatePassword2Counter();
        this.hideSpinner();
    }
};

// Инициализация при загрузке документа
$(document).ready(function () {
    if ($('#addUserModal').length) {
        UserForm.init();
    }
});