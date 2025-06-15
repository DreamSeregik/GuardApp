/**
 * MedDeleteModal - модуль для работы с модальным окном удаления данных медосмотра
 */
const MedDeleteModal = {
    init: function () {
        this.cacheElements();
        this.bindEvents();

        this.modal = new bootstrap.Modal(this.$modal[0], {
            backdrop: 'static',
            keyboard: false
        });
    },

    cacheElements: function () {
        this.$modal = $('#delMedModal');
        this.$form = $('#deleteMedForm');
        this.$closeBtn = $('.btn-close', this.$modal);
        this.$cancelBtn = $('.btn-secondary', this.$modal);
        this.$submitBtn = $('.btn-danger', this.$form);
        this.$spinner = $('#delSubmitSpinner');
    },

    bindEvents: function () {
        this.$modal.on('shown.bs.modal', this.handleModalShown.bind(this));
        this.$modal.on('hide.bs.modal', this.handleModalHide.bind(this));

        this.$closeBtn.on('click', this.handleCloseClick.bind(this));
        this.$cancelBtn.on('click', this.handleCancelClick.bind(this));
        this.$submitBtn.on('click', this.handleSubmitClick.bind(this));
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
        const url = new URL(MED_DELETE);
        this.showSpinner();
        try {
            const data = await sendPostRequest(url, { 'med_id': selectedMedID });

            if (data.status === 'SUCCESS') {
                selectedMedID = null;
                await getMedData(worker_id);
                $(document).trigger('updateNotify');
                this.modal.hide();
                showNotification('Данные медосмотра успешно удалены', 'success');
            } else {
                showNotification(data.description || 'Ошибка удаления');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            showNotification('Ошибка при отправке данных');
        } finally {
            this.hideSpinner(); // Скрываем спиннер после завершения
        }
    }
};

// Инициализация при загрузке документа
$(document).ready(function () {
    if ($('#delMedModal').length) {
        MedDeleteModal.init();
    }
});