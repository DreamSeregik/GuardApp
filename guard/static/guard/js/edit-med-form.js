/**
 * Модуль для работы с формой редактирования данных медосмотра
 */
const MedicalExamEditForm = {
    // === Инициализация ===
    /**
     * Инициализирует модуль, кэширует элементы и привязывает события
     */
    init: function () {
        this.cacheElements();
        this.bindEvents();
        this.modal = new bootstrap.Modal(this.$modal[0], { focus: false });
        this.files = [];
        this.existingFiles = [];
    },

    // === Кэширование DOM-элементов ===
    /**
     * Сохраняет ссылки на DOM-элементы формы
     */
    cacheElements: function () {
        this.$modal = $('#editMedModal');
        this.$form = $('#medicalExamEditForm');
        this.$submitBtn = $('#submitEditMedicalExamForm');
        this.$fileInput = $('#editMedicalFileInput');
        this.$fileList = $('#editMedicalFileList');
        this.$fileUploadBtn = $('#editMedicalFileUploadBtn');
        this.$spinner = $('#editSubmitSpinner');
        this.$loadingSpinner = $('#editMedLoadingSpinner');
    },

    // === Привязка событий ===
    /**
     * Привязывает обработчики событий к элементам формы
     */
    bindEvents: function () {
        this.$modal.off('show.bs.modal').on('show.bs.modal', this.handleModalShow.bind(this));
        this.$submitBtn.off('click').on('click', this.submitForm.bind(this));
        this.$modal.off('hide.bs.modal').on('hide.bs.modal', this.handleModalHide.bind(this));
        this.$fileInput.off('change').on('change', this.handleFileSelect.bind(this));
        this.$fileUploadBtn.off('click').on('click', () => this.$fileInput.trigger('click'));
        this.$fileList.off('click', '.remove-file').on('click', '.remove-file', this.removeFile.bind(this));

        // Добавляем обработчики для валидации в реальном времени
        $('#editMedicalExamDate').off('input change').on('input change', () => {
            this.validateExamDate();
            this.validateExpiryDate();
        });
        $('#editMedicalExamExpiryDate').off('input change').on('input change', () => {
            this.validateExpiryDate();
            this.validateExamDate();
        });
    },

    // === Обработчики событий ===
    /**
     * Загружает данные медосмотра при открытии модального окна
     * @param {Event} event - Событие открытия модального окна
     */
    handleModalShow: function (event) {
        this.showLoadingSpinner();
        this.$submitBtn.prop('disabled', true);
        if (selectedMedID) {
            this.loadExamData(selectedMedID).finally(() => {
                this.hideLoadingSpinner();
            });
        }
    },

    /**
     * Обрабатывает выбор файлов
     * @param {Event} e - Событие выбора файла
     */
    handleFileSelect: function (e) {
        const files = e.target.files;
        for (let i = 0; i < files.length; i++) {
            this.addFile(files[i]);
        }
        this.$fileInput.val('');
        this.updateFileList(this.existingFiles);
    },

    /**
     * Обрабатывает закрытие модального окна
     */
    handleModalHide: function () {
        if (document.activeElement) {
            document.activeElement.blur();
        }
        this.files = [];
        this.existingFiles = [];
        this.updateFileList();
        this.hideSpinner();
        this.$submitBtn.prop('disabled', true);
    },

    // === Управление файлами ===
    /**
     * Добавляет файл в список для загрузки
     * @param {File} file - Файл для добавления
     */
    addFile: function (file) {
        if (file && file.name) {
            this.files.push({
                file: file,
                id: Date.now() + Math.random().toString(36).substr(2, 5),
                isNew: true
            });
        } else {
            console.warn('Пропущен файл без имени:', file);
        }
    },

    /**
     * Удаляет файл из списка или сервера
     * @param {Event} e - Событие клика
     */
    removeFile: async function (e) {
        e.preventDefault();
        e.stopPropagation();
        const fileId = $(e.currentTarget).data('id');
        const isExistingFile = $(e.currentTarget).data('existing') === true;
        if (isExistingFile) {
            try {
                const response = await fetch(`/files/delete/`, {
                    method: 'POST',
                    body: JSON.stringify({ file_id: fileId }),
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': Cookies.get('csrftoken') || $('input[name="csrfmiddlewaretoken"]').val()
                    }
                });
                const data = await response.json();
                if (data.status !== 'SUCCESS') {
                    throw new Error(data.description || 'Ошибка удаления файла');
                }
                await this.loadExamData(selectedMedID);
                showNotification('Файл успешно удалён', 'success');
            } catch (error) {
                console.error('Ошибка при удалении файла:', error);
                showNotification(`Ошибка при удалении файла: ${error.message}`);
            }
        } else {
            this.files = this.files.filter(f => f.id !== fileId);
            this.updateFileList(this.existingFiles);
        }
    },

    /**
     * Экранирует HTML-символы
     * @param {string} str - Входная строка
     * @returns {string} Экранированная строка
     */
    escapeHTML: function (str) {
        if (typeof str !== 'string' || str == null) {
            console.warn('Некорректный входной параметр в escapeHTML:', str);
            return str == null ? '' : str.toString();
        }
        return str.replace(/[&<>"']/g, function (match) {
            const escape = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            };
            return escape[match];
        });
    },

    /**
     * Обрезает длинные имена файлов
     * @param {string} name - Имя файла
     * @param {number} maxLength - Максимальная длина имени
     * @returns {string} Обрезанное имя файла
     */
    truncateFileName: function (name, maxLength = 30) {
        if (typeof name !== 'string' || name == null) {
            console.warn('Некорректный входной параметр в truncateFileName:', name);
            return name == null ? '' : name.toString();
        }
        if (name.length <= maxLength) return name;
        const extIndex = name.lastIndexOf('.');
        const ext = extIndex !== -1 ? name.substring(extIndex) : '';
        const nameWithoutExt = extIndex !== -1 ? name.substring(0, extIndex) : name;
        const truncated = nameWithoutExt.substring(0, maxLength - ext.length - 3);
        return `${truncated}...${ext}`;
    },

    /**
     * Форматирует размер файла
     * @param {number} bytes - Размер файла в байтах
     * @returns {string} Форматированный размер
     */
    formatFileSize: function (bytes) {
        if (isNaN(bytes) || bytes == null) {
            console.warn('Некорректный размер файла:', bytes);
            return 'Неизвестно';
        }
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    },

    /**
     * Обновляет список файлов
     * @param {Array} existingFiles - Список существующих файлов
     */
    updateFileList: function (existingFiles = []) {
        this.$fileList.empty();
        if (existingFiles.length === 0 && this.files.length === 0) {
            this.$fileList.append('<tr><td colspan="3" class="text-muted text-center">Нет прикрепленных файлов</td></tr>');
            return;
        }
        existingFiles.forEach(file => {
            if (!file || !file.name || !file.url || !file.id) {
                console.warn('Некорректные данные файла:', file);
                return;
            }
            console.log(file);

            const fileName = this.escapeHTML(this.truncateFileName(file.name));
            const fileSize = this.escapeHTML(file.size);
            const fileItem = $(`
                <tr>
                    <td class="file-name-cell">
                        <a href="${this.escapeHTML(`/files/preview/${file.id}/`)}" target="_blank" title="${this.escapeHTML(file.name)}">${fileName}</a>
                    </td>
                    <td>${fileSize}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-danger remove-file" 
                                data-id="${file.id}" data-existing="true">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `);
            this.$fileList.append(fileItem);
        });
        this.files.forEach(file => {
            if (!file || !file.file || !file.file.name) {
                console.warn('Некорректные данные нового файла:', file);
                return;
            }
            const fileName = this.escapeHTML(this.truncateFileName(file.file.name));
            const fileSize = this.escapeHTML(this.formatFileSize(file.file.size));
            const fileItem = $(`
                <tr>
                    <td class="file-name-cell">
                        <span title="${this.escapeHTML(file.file.name)}">${fileName}</span>
                    </td>
                    <td>${fileSize}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-danger remove-file" 
                                data-id="${file.id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `);
            this.$fileList.append(fileItem);
        });
    },

    // === Загрузка данных ===
    /**
     * Загружает данные медосмотра по ID
     * @param {string} examId - ID медосмотра
     */
    loadExamData: async function (examId) {
        try {
            const data = await sendGetRequest(API_ENDPOINTS.MED + examId);
            if (data.status === 'SUCCESS') {
                $('#editMedicalExamType').val(data.data[0].type_code);
                $('#editMedicalExamDate').val(data.data[0].date_from);
                $('#editMedicalExamExpiryDate').val(data.data[0].date_to);
                this.existingFiles = data.data[0].attachments || [];
                this.updateFileList(this.existingFiles);
                this.$submitBtn.prop('disabled', false);
            } else {
                console.error('Ошибка загрузки данных:', data.description);
                showNotification(data.description || 'Ошибка загрузки данных');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            showNotification('Не удалось загрузить данные');
        }
    },

    // === Валидация формы ===
    /**
     * Проверяет валидность всех полей формы
     * @returns {boolean} Результат валидации
     */
    validateForm: function () {
        let isValid = true;

        // Validate exam type
        if (!$('#editMedicalExamType').val()) {
            $('#editMedicalExamType').addClass('is-invalid');
            isValid = false;
        }

        // Validate dates
        if (!this.validateExamDate()) {
            isValid = false;
        }
        if (!this.validateExpiryDate()) {
            isValid = false;
        }

        return isValid;
    },

    /**
 * Валидация даты прохождения осмотра
 * @returns {boolean} Результат валидации
 */
    validateExamDate: function () {
        const $input = $('#editMedicalExamDate');
        if (!$input || !$input.length) {
            console.warn('Поле даты осмотра не найдено');
            return false;
        }

        const value = $input.val();
        const date = new Date(value);
        const isValid = !!date.getTime();
        let feedback = isValid ? '' : 'Укажите корректную дату';

        $input.toggleClass('is-invalid', !isValid);
        const $feedback = $input.next('.invalid-feedback');
        if ($feedback.length) {
            $feedback.text(feedback);
        } else if (feedback) {
            $input.after(`<div class="invalid-feedback">${feedback}</div>`);
        }

        return isValid;
    },

    /**
     * Валидация даты окончания действия осмотра
     * @returns {boolean} Результат валидации
     */
    validateExpiryDate: function () {
        const $input = $('#editMedicalExamExpiryDate');
        if (!$input || !$input.length) {
            console.warn('Поле даты окончания не найдено');
            return false;
        }

        const value = $input.val();
        const expiryDate = new Date(value);
        let isValid = !!expiryDate.getTime();
        let feedback = isValid ? '' : 'Укажите корректную дату';

        if (isValid) {
            const examDate = new Date($('#editMedicalExamDate').val());
            if (expiryDate < examDate) {
                isValid = false;
                feedback = 'Дата окончания не может быть раньше даты прохождения';
            }
        }

        $input.toggleClass('is-invalid', !isValid);
        const $feedback = $input.next('.invalid-feedback');
        if ($feedback.length) {
            $feedback.text(feedback);
        } else if (feedback) {
            $input.after(`<div class="invalid-feedback">${feedback}</div>`);
        }

        return isValid;
    },

    // === Получение данных формы ===
    /**
     * Собирает данные из формы для отправки
     * @returns {Object} Данные формы
     */
    getFormData: function () {
        return {
            exam_type: $('#editMedicalExamType').val(),
            exam_date: $('#editMedicalExamDate').val(),
            expiry_date: $('#editMedicalExamExpiryDate').val()
        };
    },

    // === Управление спиннерами ===
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

    /**
     * Показывает спиннер загрузки и скрывает форму
     */
    showLoadingSpinner: function () {
        this.$loadingSpinner.removeClass('d-none');
        this.$form.addClass('d-none');
    },

    /**
     * Скрывает спиннер загрузки и показывает форму
     */
    hideLoadingSpinner: function () {
        this.$loadingSpinner.addClass('d-none');
        this.$form.removeClass('d-none');
    },

    // === Отправка формы ===
    /**
     * Отправляет данные формы на сервер
     */
    submitForm: async function () {
        if (!this.validateForm()) return;
        this.showSpinner();
        const formData = this.getFormData();
        const url = new URL(API_ENDPOINTS.MED_UPDATE + selectedMedID);
        try {
            const data = await sendPatchRequest(url, formData);
            if (data.status === 'SUCCESS') {
                if (this.files.length > 0) {
                    await this.uploadFiles(selectedMedID);
                }
                await getMedData(worker_id);
                await this.loadExamData(selectedMedID);
                $(document).trigger('updateNotify');
                this.modal.hide();
                showNotification('Медосмотр успешно обновлён', 'success');
            } else {
                showNotification(data.description || 'Ошибка при обновлении данных');
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
     * @param {string} medId - ID медосмотра
     * @returns {Promise} Результат загрузки
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
            results.forEach(result => {
                if (result.status !== 'SUCCESS') {
                    console.warn('Ошибка загрузки файла:', result);
                    showNotification(`Ошибка загрузки файла: ${result.description || 'Неизвестная ошибка'}`);
                }
            });
            this.files = [];
            await this.loadExamData(selectedMedID);
            return results;
        } catch (error) {
            console.error('Ошибка загрузки файлов:', error);
            showNotification('Произошла ошибка при загрузке файлов');
            throw error;
        }
    }
};

// === Инициализация модуля ===
$(document).ready(function () {
    if ($('#editMedModal').length) {
        MedicalExamEditForm.init();
    }
});