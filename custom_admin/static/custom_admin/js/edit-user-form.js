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
        this.$fullNameInput = $('#edit_full_name');
        this.$isStaffCheckbox = $('#edit_is_staff');
        this.$isActiveCheckbox = $('#edit_is_active');
        this.$generateCheckbox = $('#edit_generate_password');
        this.$changePasswordCheckbox = $('#edit_change_password');
        this.$password1Input = $('#edit_password1');
        this.$password2Input = $('#edit_password2');
        this.$passwordFields = $('.password-field');
        this.$spinner = $('#editUserSpinner');
    },

    bindEvents: function () {
        this.$emailInput.on('input', this.validateEmailInput.bind(this));
        this.$usernameInput.on('input', this.validateUsernameInput.bind(this));
        this.$password1Input.on('input', this.validatePasswordInputs.bind(this));
        this.$password2Input.on('input', this.validatePasswordInputs.bind(this));
        this.$generateCheckbox.on('change', this.handleCheckboxChange.bind(this));
        this.$changePasswordCheckbox.on('change', this.handleCheckboxChange.bind(this));
        this.$submitBtn.on('click', this.submitForm.bind(this));

        this.$modal.on('show.bs.modal', this.handleModalShow.bind(this));
        this.$modal.on('shown.bs.modal', this.handleModalShown.bind(this));
        this.$modal.on('hide.bs.modal', this.handleModalHide.bind(this));
        this.$modal.on('hidden.bs.modal', this.handleModalHidden.bind(this));

        this.$closeBtn.on('click', this.handleCloseClick.bind(this));
        this.$cancelBtn.on('click', this.handleCancelClick.bind(this));
    },

    handleModalShow: function () {
        this.resetForm();
        if (selectedUserId) {
            this.loadUserData(selectedUserId);
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
        } else {
            this.$usernameInput.removeClass('is-invalid');
            $('#editUsernameFeedback').hide();
        }
    },

    validateEmailInput: function () {
        const email = this.$emailInput.val().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (this.$generateCheckbox.prop('checked') && (!email || !emailRegex.test(email))) {
            this.$emailInput.addClass('is-invalid');
            $('#editEmailFeedback').text(email ? 'Введите корректный email' : 'Пожалуйста, введите email').show();
        } else {
            this.$emailInput.removeClass('is-invalid');
            $('#editEmailFeedback').hide();
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

        if (!password1) {
            this.$password1Input.addClass('is-invalid');
            $('#editPassword1Feedback').text('Введите пароль').show();
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

    handleCheckboxChange: function () {
        if (this.$generateCheckbox.prop('checked')) {
            this.$changePasswordCheckbox.prop('checked', false);
        } else if (this.$changePasswordCheckbox.prop('checked')) {
            this.$generateCheckbox.prop('checked', false);
        }
        this.updatePasswordFields();
    },

    updatePasswordFields: function () {
        const showPasswordFields = !this.$generateCheckbox.prop('checked') && this.$changePasswordCheckbox.prop('checked');
        this.$passwordFields.toggleClass('password-fields-hidden', !showPasswordFields);
        if (!showPasswordFields) {
            this.$password1Input.val('').removeClass('is-invalid');
            this.$password2Input.val('').removeClass('is-invalid');
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
            this.updatePasswordFields();
            this.validateEmailInput();
        } catch (error) {
            console.error('Ошибка при загрузке данных пользователя:', error);
            showNotification('Ошибка загрузки данных пользователя', 'error');
        }
    },

    validateForm: function () {
        let isValid = true;

        // Валидация логина
        if (!this.$usernameInput.val().trim()) {
            this.$usernameInput.addClass('is-invalid');
            $('#editUsernameFeedback').text('Пожалуйста, введите логин').show();
            isValid = false;
        } else {
            this.$usernameInput.removeClass('is-invalid');
            $('#editUsernameFeedback').hide();
        }

        // Валидация email
        const email = this.$emailInput.val().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (this.$generateCheckbox.prop('checked')) {
            if (!email) {
                this.$emailInput.addClass('is-invalid');
                $('#editEmailFeedback').text('Пожалуйста, введите email').show();
                isValid = false;
            } else if (!emailRegex.test(email)) {
                this.$emailInput.addClass('is-invalid');
                $('#editEmailFeedback').text('Введите корректный email').show();
                isValid = false;
            } else {
                this.$emailInput.removeClass('is-invalid');
                $('#editEmailFeedback').hide();
            }
        }

        // Валидация паролей
        if (!this.$generateCheckbox.prop('checked') && this.$changePasswordCheckbox.prop('checked')) {
            const password1 = this.$password1Input.val();
            const password2 = this.$password2Input.val();
            if (!password1 || !password2) {
                if (!password1) {
                    this.$password1Input.addClass('is-invalid');
                    $('#editPassword1Feedback').text('Введите пароль').show();
                }
                if (!password2) {
                    this.$password2Input.addClass('is-invalid');
                    $('#editPassword2Feedback').text('Введите подтверждение пароля').show();
                }
                isValid = false;
            } else if (password1 !== password2) {
                this.$password2Input.addClass('is-invalid');
                $('#editPassword2Feedback').text('Пароли не совпадают').show();
                isValid = false;
            } else {
                this.$password1Input.removeClass('is-invalid');
                this.$password2Input.removeClass('is-invalid');
                $('#editPassword1Feedback').hide();
                $('#editPassword2Feedback').hide();
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
        this.updatePasswordFields();
        this.hideSpinner();
    }
};

// Инициализация при загрузке документа
$(document).ready(function () {
    if ($('#editUserModal').length) {
        UserEditForm.init();
    }
});