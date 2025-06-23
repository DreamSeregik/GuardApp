/**
 * Модуль MedicalExamForm для работы с формой добавления медицинского осмотра
 */
const MedicalExamForm = {
    // === Инициализация ===
    /**
     * Инициализирует модуль, кэширует элементы и привязывает события
     */
    init: function () {
        this.cacheElements();
        this.bindEvents();
        this.modal = new bootstrap.Modal(this.$modal[0], { focus: false });
        this.files = [];
    },

    // === Кэширование DOM-элементов ===
    /**
     * Сохраняет ссылки на DOM-элементы формы
     */
    cacheElements: function () {
        this.$modal = $('#addMedModal');
        this.$form = $('#medicalExamAddForm');
        this.$modalContent = $('.modal-content', this.$modal);
        this.$closeBtn = $('.btn-close', this.$modal);
        this.$examTypeSelect = $('#medicalExamType');
        this.$submitBtn = $('#submitMedicalExamForm');
        this.$fileInput = $('#medicalFileInput');
        this.$fileList = $('#medicalFileList');
        this.$fileUploadBtn = $('#medicalFileUploadBtn');
        this.$spinner = $('#submitSpinner');
    },

    // === Привязка событий ===
    /**
     * Привязывает обработчики событий к элементам формы
     */
    bindEvents: function () {
        this.$submitBtn.on('click', this.submitForm.bind(this));
        this.$fileInput.on('change', this.handleFileSelect.bind(this));
        this.$fileUploadBtn.on('click', () => this.$fileInput.trigger('click'));
        this.$fileList.on('click', '.remove-file', this.removeFile.bind(this));
        this.$modal.on('show.bs.modal', this.handleModalShow.bind(this));
        this.$modal.on('shown.bs.modal', this.handleModalShown.bind(this));
        this.$modal.on('hide.bs.modal', this.handleModalHide.bind(this));
        this.$modal.on('hidden.bs.modal', this.handleModalHidden.bind(this));
        this.$closeBtn.on('click', this.handleCloseClick.bind(this));

        $('#medicalExamDate').on('input change', () => {
            this.validateExamDate();
            this.validateExpiryDate();
        });
        $('#medicalExamExpiryDate').on('input change', () => {
            this.validateExpiryDate();
        });
        this.$examTypeSelect.on('change', this.validateExamType.bind(this));
    },

    // === Обработчики событий модального окна ===
    /**
     * Сбрасывает форму при показе модального окна
     */
    handleModalShow: function () {
        this.resetForm();
    },

    /**
     * Устанавливает фокус на поле выбора типа осмотра
     */
    handleModalShown: function () {
        this.$examTypeSelect.trigger('focus');
    },

    /**
     * Снимает фокус и скрывает спиннер при закрытии модального окна
     */
    handleModalHide: function () {
        if (document.activeElement) {
            document.activeElement.blur();
        }
        this.hideSpinner();
    },

    /**
     * Устанавливает атрибут aria-hidden после скрытия модального окна
     */
    handleModalHidden: function () {
        setTimeout(() => {
            this.$modal.attr('aria-hidden', 'true');
        }, 100);
    },

    /**
     * Закрывает модальное окно при клике на кнопку закрытия
     */
    handleCloseClick: function (e) {
        e.preventDefault();
        this.modal.hide();
    },

    // === Обработка файлов ===
    /**
     * Обрабатывает выбор файлов пользователем
     */
    handleFileSelect: function (e) {
        const files = e.target.files;
        for (let i = 0; i < files.length; i++) {
            this.addFile(files[i]);
        }
        this.$fileInput.val('');
        this.updateFileList();
    },

    /**
     * Добавляет файл в список
     * @param {File} file - Файл для добавления
     */
    addFile: function (file) {
        if (file && file.name) {
            this.files.push({
                file: file,
                id: Date.now() + Math.random().toString(36).substr(2, 5)
            });
        } else {
            console.warn('Пропущен файл без имени:', file);
        }
    },

    /**
     * Удаляет файл из списка
     * @param {Event} e - Событие клика
     */
    removeFile: function (e) {
        e.preventDefault();
        const fileId = $(e.currentTarget).data('id');
        this.files = this.files.filter(f => f.id !== fileId);
        this.updateFileList();
    },

    /**
     * Форматирует размер файла в удобный для чтения формат
     * @param {number} bytes - Размер файла в байтах
     * @returns {string} Форматированный размер
     */
    formatFileSize: function (bytes) {
        if (isNaN(bytes) || bytes == null) {
            console.warn('Некорректный размер файла:', bytes);
            return 'Неизвестно';
        }
        const units = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    },

    /**
     * Экранирует HTML-символы в строке
     * @param {string} str - Входная строка
     * @returns {string} Экранированная строка
     */
    escapeHTML: function (str) {
        if (typeof str !== 'string' || str == null) {
            console.warn('Некорректное значение в escapeHTML:', str);
            return str == null ? '' : str.toString();
        }
        return str.replace(/[&<>"']/g, match => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[match]));
    },

    /**
     * Обрезает длинные имена файлов
     * @param {string} name - Имя файла
     * @param {number} [maxLength=30] - Максимальная длина
     * @returns {string} Обрезанное имя файла
     */
    truncateFileName: function (name, maxLength = 30) {
        if (typeof name !== 'string' || name == null) {
            console.warn('Некорректное имя файла:', name);
            return name == null ? '' : name.toString();
        }
        if (name.length > maxLength) {
            const extIndex = name.lastIndexOf('.');
            const ext = extIndex !== -1 ? name.substring(extIndex) : '';
            const nameWithoutExt = extIndex !== -1 ? name.substring(0, extIndex) : name;
            const truncated = nameWithoutExt.substring(0, maxLength - ext.length - 3);
            return `${truncated}...${ext}`;
        }
        return name;
    },

    /**
     * Обновляет отображение списка файлов
     */
    updateFileList: function () {
        this.$fileList.empty();
        if (!this.files.length) {
            this.$fileList.append('<tr><td colspan="3" class="text-muted text-center">Нет прикрепленных файлов</td></tr>');
            return;
        }

        this.files.forEach(file => {
            const fileName = this.escapeHTML(this.truncateFileName(file.file.name));
            const fileSize = this.escapeHTML(this.formatFileSize(file.file.size));
            const fileItem = $(`
                <tr>
                    <td class="file-name-cell">
                        <span title="${this.escapeHTML(file.file.name)}">${fileName}</span>
                    </td>
                    <td>${fileSize}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-danger remove-file" data-id="${file.id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `);
            this.$fileList.append(fileItem);
        });
    },

    // === Валидация формы ===
    /**
     * Проверяет корректность заполнения формы
     * @returns {boolean} Результат валидации
     */
    validateForm: function () {
        let isValid = true;

        if (!this.validateExamType()) {
            isValid = false;
        }

        if (!this.validateExamDate()) {
            isValid = false;
        }

        if (!this.validateExpiryDate()) {
            isValid = false;
        }

        return isValid;
    },

    /**
 * Валидация типа медосмотра
 * @returns {boolean} Результат валидации
 */
    validateExamType: function () {
        const isValid = !!this.$examTypeSelect.val();
        this.$examTypeSelect.toggleClass('is-invalid', !isValid);

        const $feedback = this.$examTypeSelect.next('.invalid-feedback');
        if ($feedback.length) {
            $feedback.text(isValid ? '' : 'Поле обязательно для заполнения');
        } else if (!isValid) {
            this.$examTypeSelect.after('<div class="invalid-feedback">Поле обязательно для заполнения</div>');
        }

        return isValid;
    },

    /**
     * Валидация даты прохождения осмотра
     * @returns {boolean} Результат валидации
     */
    validateExamDate: function () {
        const $input = $('#medicalExamDate');
        const value = $input.val();
        const date = new Date(value);
        const isValid = !!date.getTime();

        $input.toggleClass('is-invalid', !isValid);

        const $feedback = $input.next('.invalid-feedback');
        if ($feedback.length) {
            $feedback.text(isValid ? '' : 'Укажите корректную дату');
        } else if (!isValid) {
            $input.after('<div class="invalid-feedback">Укажите корректную дату</div>');
        }

        return isValid;
    },

    /**
     * Валидация даты окончания действия осмотра
     * @returns {boolean} Результат валидации
     */
    validateExpiryDate: function () {
        const $input = $('#medicalExamExpiryDate');
        const value = $input.val();
        const expiryDate = new Date(value);
        let isValid = !!expiryDate.getTime();
        let feedback = '';



        if (isValid) {
            const examDate = new Date($('#medicalExamDate').val());
            if (expiryDate < examDate) {
                isValid = false;
                feedback = 'Дата окончания не может быть раньше даты прохождения';
            }
        } else {
            feedback = 'Укажите корректную дату';
        }

        $input.toggleClass('is-invalid', !isValid);

        const $feedback = $input.next('.invalid-feedback');
        if ($feedback.length) {
            $feedback.text(feedback);
        } else if (!isValid) {
            $input.after(`<div class="invalid-feedback">${feedback}</div>`);
        }

        return isValid;
    },


    /**
     * Собирает данные формы для отправки
     * @returns {Object} Данные формы
     */
    getFormData: function () {
        return {
            employee_id: worker_id,
            exam_type: this.$examTypeSelect.val(),
            exam_date: $('#medicalExamDate').val(),
            expiry_date: $('#medicalExamExpiryDate').val()
        };
    },

    // === Управление спиннером ===
    /**
     * Показывает спиннер загрузки
     */
    showSpinner: function () {
        this.$submitBtn.prop('disabled', true);
        this.$spinner.removeClass('d-none');
    },

    /**
     * Скрывает спиннер загрузки
     */
    hideSpinner: function () {
        this.$submitBtn.prop('disabled', false);
        this.$spinner.addClass('d-none');
    },

    // === Отправка формы ===
    /**
     * Отправляет данные формы на сервер
     */
    submitForm: async function () {
        if (!this.validateForm()) return;
        this.showSpinner();

        const formData = this.getFormData();
        const url = new URL(API_ENDPOINTS.MED_ADD);

        try {
            const data = await sendPostRequest(url, formData);

            if (data.status === "SUCCESS") {
                if (this.files.length > 0) {
                    await this.uploadFiles(data.id);
                }
                await getMedData(worker_id);
                $(document).trigger('updateNotify');
                this.modal.hide();
                showNotification('Медицинский осмотр успешно добавлен', 'success');
            } else {
                showNotification(data.description || 'Ошибка при добавлении медицинского осмотра');
            }
        } catch (error) {
            console.error('Ошибка при отправке формы:', error);
            showNotification('Произошла ошибка при отправке формы');
        } finally {
            this.hideSpinner();
        }
    },

    /**
     * Загружает файлы на сервер
     * @param {number} medId - ID медицинского осмотра
     */
    uploadFiles: async function (medId) {
        const uploadPromises = this.files.map(file => {
            const formData = new FormData();
            formData.append('file', file.file);
            formData.append('file_type', 'med');
            formData.append('object_id', medId);

            return fetch(`/files/upload/`, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': Cookies.get('csrftoken')
                }
            }).then(response => response.json());
        });

        try {
            const results = await Promise.all(uploadPromises);
            return results;
        } catch (error) {
            console.error('Ошибка при загрузке файлов:', error);
            throw error;
        }
    },

    /**
     * Сбрасывает форму и очищает список файлов
     */
    resetForm: function () {
        this.$form.trigger('reset');
        this.$form.find('.is-invalid').removeClass('is-invalid');
        this.files = [];
        this.updateFileList();
        this.hideSpinner();
    }
};

// === Инициализация модуля ===
$(document).ready(function () {
    if ($('#addMedModal').length) {
        MedicalExamForm.init();
    }
});