/**
 * EmployeeDeleteModal - модуль для работы с модальным окном удаления сотрудника
 */
const EmployeeDeleteModal = {
    init: function () {
        this.cacheElements();
        this.bindEvents();

        this.modal = new bootstrap.Modal(this.$modal[0], {
            backdrop: 'static',
            keyboard: false
        });
    },

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

    bindEvents: function () {
        this.$modal.on('show.bs.modal', this.handleModalShow.bind(this));
        this.$modal.on('shown.bs.modal', this.handleModalShown.bind(this));
        this.$modal.on('hide.bs.modal', this.handleModalHide.bind(this));

        this.$closeBtn.on('click', this.handleCloseClick.bind(this));
        this.$cancelBtn.on('click', this.handleCancelClick.bind(this));
        this.$submitBtn.on('click', this.handleSubmitClick.bind(this));
    },

    handleModalShow: async function () {
        this.$loadingSpinner.removeClass('d-none');
        this.$content.addClass('d-none');
        this.$submitBtn.prop('disabled', true); // Отключаем кнопку при открытии
        try {
            const url = new URL(`${FIO}${worker_id}`);
            const data = await sendGetRequest(url);
            this.$employeeName.html(data.FIO);
            this.$submitBtn.prop('disabled', false); // Активируем кнопку после загрузки
        } catch (error) {
            console.error('Ошибка при загрузке данных сотрудника:', error);
            showNotification('Ошибка загрузки данных');
        } finally {
            this.$loadingSpinner.addClass('d-none');
            this.$content.removeClass('d-none');
        }
    },

    handleModalShown: function () {
        this.$submitBtn.trigger('focus');
    },

    handleModalHide: function () {
        if (document.activeElement) {
            document.activeElement.blur();
        }
        this.hideSpinner();
        this.$loadingSpinner.addClass('d-none');
        this.$content.removeClass('d-none');
        this.$submitBtn.prop('disabled', true); // Отключаем кнопку при закрытии
    },

    handleCloseClick: function (e) {
        e.preventDefault();
        this.modal.hide();
    },

    handleCancelClick: function (e) {
        e.preventDefault();
        this.modal.hide();
    },

    handleSubmitClick: function (e) {
        e.preventDefault();
        this.submitForm();
    },

    showSpinner: function () {
        this.$submitBtn.prop('disabled', true);
        this.$spinner.removeClass('d-none');
    },

    hideSpinner: function () {
        this.$submitBtn.prop('disabled', false);
        this.$spinner.addClass('d-none');
    },

    submitForm: async function () {
        const url = new URL(WORKER_DELETE);
        this.showSpinner();

        try {
            const data = await sendPostRequest(url, { 'employee_id': worker_id });

            if (data.status === 'SUCCESS') {
                worker_id = null;
                await filterWorkers(filter_query);
                sortWorkersByFIO(sort_type);
                $("#info-tbl-main tbody, #info-tbl-med tbody, #info-tbl-education tbody").empty();
                $("#worker-info-fio").html("Выберите сотрудника");
                $(document).trigger('updateNotify');
                this.modal.hide();
                showNotification('Сотрудник успешно удалён', 'success');
            } else {
                showNotification(data.description || 'Ошибка удаления');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            showNotification('Ошибка при отправке данных');
        } finally {
            this.hideSpinner();
        }
    }
};

// Инициализация при загрузке документа
$(document).ready(function () {
    if ($('#delWorkerModal').length) {
        EmployeeDeleteModal.init();
    }
});