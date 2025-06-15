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
        this.$fullNameInput = $('#full_name');
        this.$generateCheckbox = $('#generate_password');
        this.$password1Input = $('#password1');
        this.$password2Input = $('#password2');
        this.$spinner = $('#addUserSpinner');
    },

    bindEvents: function () {
        this.$generateCheckbox.on('change', this.updatePasswordFields.bind(this));
        this.$submitBtn.on('click', this.submitForm.bind(this));
        this.$emailInput.on('input', this.validateEmailInput.bind(this));
        this.$usernameInput.on('input', this.validateUsernameInput.bind(this));
        this.$password1Input.on('input', this.validatePasswordInputs.bind(this));
        this.$password2Input.on('input', this.validatePasswordInputs.bind(this));

        this.$modal.on('show.bs.modal', this.handleModalShow.bind(this));
        this.$modal.on('shown.bs.modal', this.handleModalShown.bind(this));
        this.$modal.on('hide.bs.modal', this.handleModalHide.bind(this));
        this.$modal.on('hidden.bs.modal', this.handleModalHidden.bind(this));

        this.$closeBtn.on('click', this.handleCloseClick.bind(this));
        this.$cancelBtn.on('click', this.handleCancelClick.bind(this));
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

    updatePasswordFields: function () {
        const showPasswordFields = !this.$generateCheckbox.prop('checked');
        $('.password-field').toggleClass('password-fields-hidden', !showPasswordFields);
        if (!showPasswordFields) {
            this.$password1Input.val('').removeClass('is-invalid');
            this.$password2Input.val('').removeClass('is-invalid');
            $('#password1Feedback').hide();
            $('#password2Feedback').hide();
        }
    },

    validateUsernameInput: function () {
        const username = this.$usernameInput.val().trim();
        if (!username) {
            this.$usernameInput.addClass('is-invalid');
            $('#usernameFeedback').text('Пожалуйста, введите логин').show();
        } else {
            this.$usernameInput.removeClass('is-invalid');
            $('#usernameFeedback').hide();
        }
    },

    validateEmailInput: function () {
        const email = this.$emailInput.val().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (this.$generateCheckbox.prop('checked') && (!email || !emailRegex.test(email))) {
            this.$emailInput.addClass('is-invalid');
            $('#emailFeedback').text(email ? 'Введите корректный email' : 'Пожалуйста, введите email').show();
        } else {
            this.$emailInput.removeClass('is-invalid');
            $('#emailFeedback').hide();
        }
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

        if (!password1) {
            this.$password1Input.addClass('is-invalid');
            $('#password1Feedback').text('Введите пароль').show();
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

    validateForm: function () {
        let isValid = true;

        // Валидация логина
        if (!this.$usernameInput.val().trim()) {
            this.$usernameInput.addClass('is-invalid');
            $('#usernameFeedback').text('Пожалуйста, введите логин').show();
            isValid = false;
        } else {
            this.$usernameInput.removeClass('is-invalid');
            $('#usernameFeedback').hide();
        }

        // Валидация email
        const email = this.$emailInput.val().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (this.$generateCheckbox.prop('checked')) {
            if (!email) {
                this.$emailInput.addClass('is-invalid');
                $('#emailFeedback').text('Пожалуйста, введите email').show();
                isValid = false;
            } else if (!emailRegex.test(email)) {
                this.$emailInput.addClass('is-invalid');
                $('#emailFeedback').text('Введите корректный email').show();
                isValid = false;
            } else {
                this.$emailInput.removeClass('is-invalid');
                $('#emailFeedback').hide();
            }
        }

        // Валидация паролей
        if (!this.$generateCheckbox.prop('checked')) {
            const password1 = this.$password1Input.val();
            const password2 = this.$password2Input.val();
            if (!password1 || !password2) {
                if (!password1) {
                    this.$password1Input.addClass('is-invalid');
                    $('#password1Feedback').text('Введите пароль').show();
                }
                if (!password2) {
                    this.$password2Input.addClass('is-invalid');
                    $('#password2Feedback').text('Введите подтверждение пароля').show();
                }
                isValid = false;
            } else if (password1 !== password2) {
                this.$password2Input.addClass('is-invalid');
                $('#password2Feedback').text('Пароли не совпадают').show();
                isValid = false;
            } else {
                this.$password1Input.removeClass('is-invalid');
                this.$password2Input.removeClass('is-invalid');
                $('#password1Feedback').hide();
                $('#password2Feedback').hide();
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
        this.updatePasswordFields();
        this.hideSpinner();
    }
};

// Инициализация при загрузке документа
$(document).ready(function () {
    if ($('#addUserModal').length) {
        UserForm.init();
    }
});