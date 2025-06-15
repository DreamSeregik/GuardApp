/**
 * UserDeleteForm - модуль для работы с формой удаления пользователя
 */
const UserDeleteForm = {
    init: function () {
        this.cacheElements();
        this.bindEvents();

        this.modal = new bootstrap.Modal(this.$modal[0], {
            focus: false
        });
    },

    cacheElements: function () {
        this.$modal = $('#deleteUserModal');
        this.$form = $('#deleteUserForm');
        this.$modalContent = $('.modal-content', this.$modal);
        this.$closeBtn = $('.btn-close', this.$modal);
        this.$cancelBtn = $('.btn-secondary', this.$modal);
        this.$submitBtn = $('button[type="submit"]', this.$form);
        this.$spinner = $('#deleteUserSpinner');
    },

    bindEvents: function () {
        this.$form.on('submit', this.submitForm.bind(this));
        this.$closeBtn.on('click', this.handleCloseClick.bind(this));
        this.$cancelBtn.on('click', this.handleCancelClick.bind(this));

        this.$modal.on('show.bs.modal', this.handleModalShow.bind(this));
        this.$modal.on('shown.bs.modal', this.handleModalShown.bind(this));
        this.$modal.on('hide.bs.modal', this.handleModalHide.bind(this));
        this.$modal.on('hidden.bs.modal', this.handleModalHidden.bind(this));
    },

    handleModalShow: function () {
        this.resetForm();
        this.$modal.removeAttr('aria-hidden');
    },

    handleModalShown: function () {
        this.$submitBtn.trigger('focus');
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

    validateForm: function () {
        if (!selectedUserId) {
            showNotification('Выберите пользователя для удаления', 'error');
            return false;
        }
        return true;
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
                    'X-CSRFToken': Cookies.get('csrftoken'),
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showNotification(data.success, 'success');
                this.modal.hide();
                selectedUserId = null;
                selectedUserData = null;
                $('#worker-info-fio').text('Выберите пользователя');
                $('#user-fio').text('Не выбрано');
                $('#user-email').text('Не выбрано');
                $('#user-login').text('Не выбрано');
                $('#user-status').text('Не выбрано');
                await fetchUsers({
                    search: $('#search-input').val(),
                    role: $('input[name="roleCheck"]:checked').val(),
                    status: $('input[name="statusCheck"]:checked').val(),
                    sort: $('.form-check-inline img.active').attr('id') === 'asc-sort' ? 'asc' : 'desc'
                });
            } else {
                let errorMessage = data.error || 'Ошибка удаления пользователя';
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
                        errorMessage += ': ' + detailedErrors.join('; ');
                    }
                }
                showNotification(errorMessage, 'error');
            }
        } catch (error) {
            console.error('Ошибка при отправке запроса удаления:', error);
            const errorMessage = `Не удалось выполнить запрос: ${error.message || 'Неизвестная ошибка'}`;
            showNotification(errorMessage, 'error');
        } finally {
            this.hideSpinner();
        }
    },

    getFormData: function () {
        return new FormData(this.$form[0]);
    },

    resetForm: function () {
        this.hideSpinner();
    }
};

// Инициализация при загрузке документа
$(document).ready(function () {
    if ($('#deleteUserModal').length) {
        UserDeleteForm.init();
    }
});