/**
 * Модуль для работы с модальным окном удаления сотрудника
 */
const EmployeeDeleteModal = {
    // === Инициализация ===
    /**
     * Инициализирует модуль, кэширует элементы и привязывает события
     */
    init: function () {
        this.cacheElements();
        this.bindEvents();
        this.modal = new bootstrap.Modal(this.$modal[0], {
            backdrop: 'static',
            keyboard: false
        });
    },

    // === Кэширование DOM-элементов ===
    /**
     * Сохраняет ссылки на DOM-элементы модального окна
     */
    cacheElements: function () {
        this.$modal = $('#delWorkerModal');
        this.$form = $('#deleteEmployeeForm');
        this.$employeeName = $('#employeeName');
        this.$closeBtn = $('.btn-close', this.$modal);
        this.$cancelBtn = $('.btn-secondary', this.$modal);
        this.$submitBtn = $('.btn-danger', this.$form);
        this.$spinner = $('#delSubmitSpinner');
        this.$loadingSpinner = $('#delWorkerLoadingSpinner');
        this.$content = $('#delWorkerContent');
    },

    // === Привязка событий ===
    /**
     * Привязывает обработчики событий к элементам модального окна
     */
    bindEvents: function () {
        this.$modal.on('show.bs.modal', this.handleModalShow.bind(this));
        this.$modal.on('shown.bs.modal', this.handleModalShown.bind(this));
        this.$modal.on('hide.bs.modal', this.handleModalHide.bind(this));
        this.$closeBtn.on('click', this.handleCloseClick.bind(this));
        this.$cancelBtn.on('click', this.handleCancelClick.bind(this));
        this.$submitBtn.on('click', this.handleSubmitClick.bind(this));
    },

    // === Обработчики событий ===
    /**
     * Загружает данные сотрудника при показе модального окна
     */
    handleModalShow: async function () {
        this.$loadingSpinner.removeClass('d-none');
        this.$content.addClass('d-none');
        this.$submitBtn.prop('disabled', true);
        try {
            const url = new URL(`${API_ENDPOINTS.FIO}${worker_id}`);
            const data = await sendGetRequest(url);
            this.$employeeName.html(data.FIO);
            this.$submitBtn.prop('disabled', false);
        } catch (error) {
            console.error('Ошибка при загрузке данных сотрудника:', error);
            showNotification('Ошибка при загрузке данных');
        } finally {
            this.$loadingSpinner.addClass('d-none');
            this.$content.removeClass('d-none');
        }
    },

    /**
     * Устанавливает фокус на кнопку подтверждения при показе модального окна
     */
    handleModalShown: function () {
        this.$submitBtn.trigger('focus');
    },

    /**
     * Снимает фокус, скрывает спиннеры и отключает кнопку при скрытии модального окна
     */
    handleModalHide: function () {
        if (document.activeElement) {
            document.activeElement.blur();
        }
        this.hideSpinner();
        this.$loadingSpinner.addClass('d-none');
        this.$content.removeClass('d-none');
        this.$submitBtn.prop('disabled', true);
    },

    /**
     * Закрывает модальное окно при клике на кнопку закрытия
     * @param {Event} e - Событие клика
     */
    handleCloseClick: function (e) {
        e.preventDefault();
        this.modal.hide();
    },

    /**
     * Закрывает модальное окно при клике на кнопку отмены
     * @param {Event} e - Событие клика
     */
    handleCancelClick: function (e) {
        e.preventDefault();
        this.modal.hide();
    },

    /**
     * Обрабатывает клик по кнопке подтверждения удаления
     * @param {Event} e - Событие клика
     */
    handleSubmitClick: function (e) {
        e.preventDefault();
        this.submitForm();
    },

    // === Управление спиннером ===
    /**
     * Показывает спиннер и отключает кнопку отправки
     */
    showSpinner: function () {
        this.$submitBtn.prop('disabled', true);
        this.$spinner.removeClass('d-none');
    },

    /**
     * Скрывает спиннер и активирует кнопку отправки
     */
    hideSpinner: function () {
        this.$submitBtn.prop('disabled', false);
        this.$spinner.addClass('d-none');
    },

    // === Отправка формы ===
    /**
     * Отправляет запрос на удаление сотрудника
     */
    submitForm: async function () {
        const url = new URL(API_ENDPOINTS.WORKER_DELETE);
        this.showSpinner();
        try {
            const data = await sendPostRequest(url, { employee_id: worker_id });
            if (data.status === 'SUCCESS') {
                worker_id = null;
                await filterWorkers(filter_query);
                sortWorkersByFIO(sort_type);
                $("#info-tbl-main tbody, #info-tbl-med tbody, #info-tbl-education tbody").empty();
                $("#info-tbl-med tbody").append('<tr class="no-data"><td colspan="6" style="text-align: center">Выберите сотрудника</td></tr>');
                $("#info-tbl-education tbody").append('<tr class="no-data"><td colspan="9" style="text-align: center">Выберите сотрудника</td></tr>');
                $("#info-tbl-main tbody").append('<tr class="no-data"><td colspan="9" style="text-align: center">Выберите сотрудника</td></tr>');
                $("#worker-info-fio").html("Выберите сотрудника");
                $(document).trigger('updateNotify');
                this.modal.hide();
                showNotification('Сотрудник успешно удалён', 'success');
            } else {
                showNotification(data.description || 'Ошибка при удалении данных');
            }
        } catch (error) {
            console.error('Ошибка при удалении сотрудника:', error);
            showNotification('Произошла ошибка при отправке данных');
        } finally {
            this.hideSpinner();
        }
    }
};

// === Инициализация модуля ===
$(document).ready(function () {
    if ($('#delWorkerModal').length) {
        EmployeeDeleteModal.init();
    }
});