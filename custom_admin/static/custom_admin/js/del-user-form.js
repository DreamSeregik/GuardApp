/**
 * Модуль для работы с формой удаления пользователя
 * @file del-user-form.js
 */
const UserDeleteForm = {
    /**
     * @section Инициализация
     * Инициализация формы и модального окна
     */

    /**
     * Инициализирует форму удаления пользователя
     * @returns {void}
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.modal = new bootstrap.Modal(this.$modal[0], { focus: false });
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
        this.$modal = $('#deleteUserModal');
        this.$form = $('#deleteUserForm');
        this.$modalContent = $('.modal-content', this.$modal);
        this.$closeBtn = $('.btn-close', this.$modal);
        this.$cancelBtn = $('.btn-secondary', this.$modal);
        this.$submitBtn = $('button[type="submit"]', this.$form);
        this.$spinner = $('#deleteUserSpinner');
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
        this.$form.on('submit', this.submitForm.bind(this));
        this.$closeBtn.on('click', this.handleCloseClick.bind(this));
        this.$cancelBtn.on('click', this.handleCancelClick.bind(this));
        this.$modal.on('show.bs.modal', this.handleModalShow.bind(this));
        this.$modal.on('shown.bs.modal', this.handleModalShown.bind(this));
        this.$modal.on('hide.bs.modal', this.handleModalHide.bind(this));
        this.$modal.on('hidden.bs.modal', this.handleModalHidden.bind(this));
    },

    /**
     * Обрабатывает событие показа модального окна
     * @returns {void}
     */
    handleModalShow() {
        this.resetForm();
        this.$modal.removeAttr('aria-hidden');
    },

    /**
     * Обрабатывает событие после показа модального окна
     * @returns {void}
     */
    handleModalShown() {
        this.$submitBtn.trigger('focus');
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
     * Обрабатывает событие после полного скрытия модального окна
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
     * @section Валидация
     * Методы для проверки корректности данных
     */

    /**
     * Проверяет форму перед отправкой
     * @returns {boolean} Результат валидации
     */
    validateForm() {
        if (!selectedUserId) {
            showNotification('Выберите пользователя для удаления', 'error');
            return false;
        }
        return true;
    },

    /**
     * @section Вспомогательные методы
     * Методы для управления состоянием формы
     */

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
     * Сбрасывает форму в начальное состояние
     * @returns {void}
     */
    resetForm() {
        this.hideSpinner();
    },

    /**
     * Получает данные формы
     * @returns {FormData} Данные формы
     */
    getFormData() {
        return new FormData(this.$form[0]);
    },

    /**
     * @section Отправка формы
     * Методы для обработки и отправки данных формы
     */

    /**
     * Отправляет форму на сервер
     * @param {Event} e - Событие отправки формы
     * @returns {Promise<void>}
     */
    async submitForm(e) {
        e.preventDefault();
        if (!this.validateForm()) {
            return;
        }

        this.showSpinner();
        const formData = this.getFormData();
        const actionUrl = this.$form.attr('action');

        const response = await sendPostRequest(actionUrl, formData);

        if (response && response.success) {
            showNotification(response.success, 'success');
            this.modal.hide();
            selectedUserId = null;
            selectedUserData = null;
            $('#worker-info-fio').text('Выберите пользователя');
            $('#user-fio').text('Не выбрано');
            $('#user-email').text('Не выбрано');
            $('#user-login').text('Не выбрано');
            $('#user-status').text('Не выбрано');
            await UserManager.fetchUsers({
                search: $('#search-input').val(),
                role: $('input[name="roleCheck"]:checked').val(),
                status: $('input[name="statusCheck"]:checked').val(),
                sort: $('.form-check-inline img.active').attr('id') === 'asc-sort' ? 'asc' : 'desc',
            });
        } else {
            let errorMessage = response?.error || 'Ошибка удаления пользователя';
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
    if ($('#deleteUserModal').length) {
        UserDeleteForm.init();
    }
});