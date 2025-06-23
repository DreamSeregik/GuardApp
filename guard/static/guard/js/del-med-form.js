/**
 * Модуль для работы с модальным окном удаления данных медосмотра
 */
const MedDeleteModal = {
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
        this.$modal = $('#delMedModal');
        this.$form = $('#deleteMedForm');
        this.$closeBtn = $('.btn-close', this.$modal);
        this.$cancelBtn = $('.btn-secondary', this.$modal);
        this.$submitBtn = $('.btn-danger', this.$form);
        this.$spinner = $('#delSubmitSpinnerMed');
    },

    // === Привязка событий ===
    /**
     * Привязывает обработчики событий к элементам модального окна
     */
    bindEvents: function () {
        this.$modal.on('shown.bs.modal', this.handleModalShown.bind(this));
        this.$modal.on('hide.bs.modal', this.handleModalHide.bind(this));
        this.$closeBtn.on('click', this.handleCloseClick.bind(this));
        this.$cancelBtn.on('click', this.handleCancelClick.bind(this));
        this.$submitBtn.on('click', this.handleSubmitClick.bind(this));
    },

    // === Обработчики событий ===
    /**
     * Устанавливает фокус на кнопку подтверждения при показе модального окна
     */
    handleModalShown: function () {
        this.$submitBtn.trigger('focus');
    },

    /**
     * Снимает фокус и скрывает спиннер при скрытии модального окна
     */
    handleModalHide: function () {
        if (document.activeElement) {
            document.activeElement.blur();
        }
        this.hideSpinner();
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
     * Отправляет запрос на удаление данных медосмотра
     */
    submitForm: async function () {
        const url = new URL(API_ENDPOINTS.MED_DELETE);
        this.showSpinner();
        try {
            const data = await sendPostRequest(url, { med_id: selectedMedID });
            if (data.status === 'SUCCESS') {
                selectedMedID = null;
                await getMedData(worker_id);
                $(document).trigger('updateNotify');
                this.modal.hide();
                showNotification('Данные медосмотра успешно удалены', 'success');
            } else {
                showNotification(data.description || 'Ошибка при удалении данных');
            }
        } catch (error) {
            console.error('Ошибка при удалении данных медосмотра:', error);
            showNotification('Произошла ошибка при отправке данных');
        } finally {
            this.hideSpinner();
        }
    }
};

// === Инициализация модуля ===
$(document).ready(function () {
    if ($('#delMedModal').length) {
        MedDeleteModal.init();
    }
});