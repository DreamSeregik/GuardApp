/**
 * Модуль для работы с формой редактирования данных обучения
 */
const EducationEditForm = {
    // === Инициализация ===
    /**
     * Инициализирует модуль, кэширует элементы, привязывает события и счетчики
     */
    init: function () {
        this.cacheElements();
        this.bindEvents();
        this.modal = new bootstrap.Modal(this.$modal[0], { focus: false });
        this.files = [];
        this.existingFiles = [];
        this.initCounters();
    },

    // === Кэширование DOM-элементов ===
    /**
     * Сохраняет ссылки на DOM-элементы формы
     */
    cacheElements: function () {
        this.$modal = $('#editEduModal');
        this.$form = $('#educationEditForm');
        this.$modalContent = $('.modal-content', this.$modal);
        this.$closeBtn = $('.btn-close', this.$modal);
        this.$programSelect = $('#editEducationProgram');
        this.$hours = $('#editEducationHours');
        this.$submitBtn = $('#submitEditEducationForm');
        this.$fileInput = $('#editEducationFileInput');
        this.$fileList = $('#editEducationFileList');
        this.$fileUploadBtn = $('#editEducationFileUploadBtn');
        this.$protocolNumInput = $('#editEducationProtocolNum');
        this.$certNumInput = $('#editEducationCertNum');
        this.$spinner = $('#editEducationSpinner');
        this.$loadingSpinner = $('#editEducationLoadingSpinner');
        this.$protocolNumCounter = $('#editProtocolNumCounter');
        this.$certNumCounter = $('#editCertNumCounter');
        this.$dateFrom = $('#editEducationDateFrom');
        this.$dateTo = $('#editEducationDateTo');
    },

    // === Привязка событий ===
    /**
     * Привязывает обработчики событий к элементам формы
     */
    bindEvents: function () {
        this.$modal.on('show.bs.modal', this.handleModalShow.bind(this));
        this.$modal.on('shown.bs.modal', this.handleModalShown.bind(this));
        this.$modal.on('hide.bs.modal', this.handleModalHide.bind(this));
        this.$modal.on('hidden.bs.modal', this.handleModalHidden.bind(this));
        this.$submitBtn.on('click', this.submitForm.bind(this));
        this.$fileInput.on('change', this.handleFileSelect.bind(this));
        this.$fileUploadBtn.on('click', () => this.$fileInput.trigger('click'));
        this.$fileList.on('click', '.remove-file', this.removeFile.bind(this));
        this.$closeBtn.on('click', this.handleCloseClick.bind(this));
        this.$protocolNumInput.on('input', () => {
            this.restrictInputLength(this.$protocolNumInput, 50);
            this.updateCounter('protocolNum');
            this.validateProtocolNum();
        });
        this.$certNumInput.on('input', () => {
            this.restrictInputLength(this.$certNumInput, 50);
            this.updateCounter('certNum');
            this.validateCertNum();
        });
        this.$hours.on('input', this.restrictHoursInput.bind(this));

        this.$programSelect.on('input change', this.validateProgram.bind(this));
        this.$hours.on('input', this.validateHours.bind(this));
        this.$dateFrom.on('input change', () => {
            this.validateDateFrom();
            this.validateDateTo();
        });
        this.$dateTo.on('input change', this.validateDateTo.bind(this));
        this.$form.find('[required]').on('input change', (e) => this.validateRequired($(e.target)));
    },

    // === Обработчики событий ===
    /**
     * Загружает данные обучения при открытии модального окна
     * @param {Event} event - Событие открытия модального окна
     */
    handleModalShow: function (event) {
        this.showLoadingSpinner();
        this.$submitBtn.prop('disabled', true);
        if (selectedEducationID) {
            this.loadEducationData(selectedEducationID).finally(() => {
                this.hideLoadingSpinner();
            });
        }
    },

    /**
     * Устанавливает фокус на поле программы обучения после открытия модального окна
     */
    handleModalShown: function () {
        this.$programSelect.trigger('focus');
    },

    /**
     * Обрабатывает закрытие модального окна
     */
    handleModalHide: function () {
        if (document.activeElement) {
            document.activeElement.blur();
        }
        this.hideSpinner();
        this.$submitBtn.prop('disabled', true);
    },

    /**
     * Устанавливает атрибут aria-hidden после полного закрытия модального окна
     */
    handleModalHidden: function () {
        setTimeout(() => {
            this.$modal.attr('aria-hidden', 'true');
        }, 100);
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
     * Ограничивает ввод часов обучения и проверяет формат
     */
    restrictHoursInput: function (e) {
        const $input = $(e.target);
        let value = $input.val();

        // Разрешены только цифры и одна десятичная точка
        value = value.replace(/[^0-9.]/g, ''); // Удаляет все символы, кроме цифр и десятичной точки
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts[1]; // Оставляет только одну десятичную точку
        }

        $input.val(value);

        // Запускает валидацию в реальном времени
        this.validateHours();
    },

    /**
     * Ограничивает длину ввода для текстовых полей
     * @param {jQuery} $input - Поле ввода
     * @param {number} maxLength - Максимальная длина
     */
    restrictInputLength: function ($input, maxLength) {
        const value = $input.val();
        if (value.length > maxLength) {
            $input.val(value.slice(0, maxLength));
        }
    },

    // === Управление счетчиками ===
    /**
     * Инициализирует счетчики символов для полей
     */
    initCounters: function () {
        this.updateCounter('protocolNum');
        this.updateCounter('certNum');
    },

    /**
     * Обновляет счетчик символов для указанного поля
     * @param {string} field - Название поля ('protocolNum' или 'certNum')
     */
    updateCounter: function (field) {
        let $input, $counter;
        switch (field) {
            case 'protocolNum':
                $input = this.$protocolNumInput;
                $counter = this.$protocolNumCounter;
                break;
            case 'certNum':
                $input = this.$certNumInput;
                $counter = this.$certNumCounter;
                break;
        }
        $counter.text($input.val().length);
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
                await this.loadEducationData(selectedEducationID);
                showNotification('Файл успешно удалён', 'success');
            } catch (error) {
                console.error('Ошибка при удалении файла:', error);
                showNotification(`Ошибка при удалении файла: ${error.message}`, 'error');
            }
        } else {
            this.files = this.files.filter(f => f.id !== fileId);
            this.updateFileList(this.existingFiles);
        }
    },

    /**
     * Экранирует HTML-символы в строке
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
     * @param {number} [maxLength=30] - Максимальная длина имени
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
     * Форматирует размер файла в читаемый вид
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
     * Обновляет список файлов в интерфейсе
     * @param {Array} [existingFiles=[]] - Список существующих файлов
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

    // === Валидация формы ===
    /**
     * Проверяет валидность всех полей формы
     * @returns {boolean} Результат валидации
     */
    validateForm: function () {
        let isValid = true;

        // Валидация программы обучения
        if (!this.validateProgram()) {
            isValid = false;
        }

        // Валидация часов обучения
        if (!this.validateHours()) {
            isValid = false;
        }

        // Валидация дат
        if (!this.validateDateFrom()) {
            isValid = false;
        }
        if (!this.validateDateTo()) {
            isValid = false;
        }

        // Валидация № протокола
        if (!this.validateProtocolNum()) {
            isValid = false;
        }

        // Валидация № сертификата
        if (!this.validateCertNum()) {
            isValid = false;
        }

        // Валидация обязательных полей
        this.$form.find('[required]').each((index, element) => {
            if (!this.validateRequired($(element))) {
                isValid = false;
            }
        });

        return isValid;
    },

    /**
 * Валидация программы 
 * @returns {boolean} Результат валидации
 */
    validateProgram: function () {
        const $input = this.$programSelect;
        if (!$input || !$input.length) {
            console.warn('Поле программы не найдено');
            return false;
        }
        const isValid = !!$input.val();
        $input.toggleClass('is-invalid', !isValid);
        const $feedback = $input.next('.invalid-feedback');
        if ($feedback.length) {
            $feedback.text(isValid ? '' : 'Поле обязательно для заполнения');
        } else {
            $input.after(`<div class="invalid-feedback">Поле обязательно для заполнения</div>`);
        }
        return isValid;
    },


    /**
 * Валидация часов
 * @returns {boolean} Результат валидации
 */
    validateHours: function () {
        const $input = this.$hours;
        if (!$input || !$input.length) {
            console.warn('Поле часов не найдено');
            return false;
        }
        const value = $input.val();
        let isValid = true;
        let feedbackText = '';

        if (!value) {
            isValid = false;
            feedbackText = 'Поле обязательно для заполнения';
        } else {
            // Проверяем формат: целое число или с одной цифрой после запятой
            if (!/^\d+(\.\d{0,1})?$/.test(value)) {
                isValid = false;
                feedbackText = 'Допускается целое число или с одной цифрой после точки';
            } else {
                const hours = parseFloat(value);
                if (isNaN(hours)) {
                    isValid = false;
                    feedbackText = 'Введите корректное число';
                } else if (hours < 1 || hours > 1000) {
                    isValid = false;
                    feedbackText = 'Часы должны быть от 1.0 до 1000.0';
                }
            }
        }

        $input.toggleClass('is-invalid', !isValid);
        const $feedback = $input.next('.invalid-feedback');
        if ($feedback.length) {
            $feedback.text(feedbackText);
        } else if (feedbackText) {
            $input.after(`<div class="invalid-feedback">${feedbackText}</div>`);
        }
        return isValid;
    },


    /**
     * Валидация даты начала
     * @returns {boolean} Результат валидации
     */
    validateDateFrom: function () {
        const $input = this.$dateFrom;
        if (!$input || !$input.length) {
            console.warn('Поле даты начала не найдено');
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
            $feedback.toggle(!!feedback);
        } else if (feedback) {
            $input.after(`<div class="invalid-feedback">${feedback}</div>`);
        }
        return isValid;
    },

    /**
     * Валидация даты окончания
     * @returns {boolean} Результат валидации
     */
    validateDateTo: function () {
        const $input = this.$dateTo;
        if (!$input || !$input.length) {
            console.warn('Поле даты окончания не найдено');
            return false;
        }
        const value = $input.val();
        const dateTo = new Date(value);
        let isValid = !!dateTo.getTime();
        let feedback = isValid ? '' : 'Укажите корректную дату';

        if (isValid && this.$dateFrom && this.$dateFrom.length) {
            const dateFrom = new Date(this.$dateFrom.val());
            if (dateFrom.getTime() && dateTo < dateFrom) {
                isValid = false;
                feedback = 'Дата окончания не может быть раньше даты начала';
            }
        }

        $input.toggleClass('is-invalid', !isValid);
        const $feedback = $input.next('.invalid-feedback');
        if ($feedback.length) {
            $feedback.text(feedback);
            $feedback.toggle(!!feedback);
        } else if (feedback) {
            $input.after(`<div class="invalid-feedback">${feedback}</div>`);
        }
        return isValid;
    },

    /**
     * Валидация № протокола
     * @returns {boolean} Результат валидации
     */
    validateProtocolNum: function () {
        const $input = this.$protocolNumInput;
        if (!$input || !$input.length) {
            console.warn('Поле № протокола не найдено');
            return false;
        }
        const value = $input.val();
        const isValid = !!value && value.length <= 50;
        let feedback = '';

        if (!value) {
            feedback = 'Поле обязательно для заполнения';
        } else if (value.length > 50) {
            feedback = 'Максимальная длина 50 символов';
        }

        $input.toggleClass('is-invalid', !isValid);
        const $feedback = $input.next('.invalid-feedback');
        if ($feedback.length) {
            $feedback.text(feedback);
            $feedback.toggle(!!feedback);
        } else if (feedback) {
            $input.after(`<div class="invalid-feedback">${feedback}</div>`);
        }
        return isValid;
    },

    /**
     * Валидация № удостоверения
     * @returns {boolean} Результат валидации
     */
    validateCertNum: function () {
        const $input = this.$certNumInput;
        if (!$input || !$input.length) {
            console.warn('Поле № удостоверения не найдено');
            return false;
        }
        const value = $input.val();
        const isValid = !!value && value.length <= 50;
        let feedback = '';

        if (!value) {
            feedback = 'Поле обязательно для заполнения';
        } else if (value.length > 50) {
            feedback = 'Максимальная длина 50 символов';
        }

        $input.toggleClass('is-invalid', !isValid);
        const $feedback = $input.next('.invalid-feedback');
        if ($feedback.length) {
            $feedback.text(feedback);
            $feedback.toggle(!!feedback);
        } else if (feedback) {
            $input.after(`<div class="invalid-feedback">${feedback}</div>`);
        }
        return isValid;
    },

    /**
     * Валидация обязательных полей
     * @param {jQuery} $input - Поле ввода
     * @returns {boolean} Результат валидации
     */
    validateRequired: function ($input) {
        if (!$input || !$input.length) {
            console.warn('Поле для валидации не найдено');
            return false;
        }
        if (!$input.val()) {
            const isValid = !!$input.val();
            $input.toggleClass('is-invalid', !isValid);
            const $feedback = $input.next('.invalid-feedback');
            if ($feedback.length) {
                $feedback.text(isValid ? '' : 'Поле обязательно для заполнения');
            } else {
                $input.after(`<div class="invalid-feedback">Поле обязательно для заполнения</div>`);
            }
            return isValid;
        }
        return true;
    },

    // === Загрузка данных ===
    /**
     * Загружает данные обучения по ID
     * @param {string} educationId - ID записи обучения
     */
    loadEducationData: async function (educationId) {
        try {
            const url = new URL(`${API_ENDPOINTS.EDU}${educationId}`);
            const data = await sendGetRequest(url);
            if (data.status === "SUCCESS") {
                this.$programSelect.val(data.data[0].program_type || data.data[0].program);
                this.$protocolNumInput.val(data.data[0].protocol_num);
                this.updateCounter('protocolNum');
                this.$certNumInput.val(data.data[0].udostoverenie_num);
                this.updateCounter('certNum');
                this.$hours.val(data.data[0].hours);
                this.$dateFrom.val(data.data[0].date_from);
                this.$dateTo.val(data.data[0].date_to);
                this.existingFiles = data.data[0].attachments || [];
                this.updateFileList(this.existingFiles);
                this.$submitBtn.prop('disabled', false);
            } else {
                console.error('Ошибка загрузки данных:', data.description);
                showNotification(data.description || 'Ошибка загрузки данных', 'error');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            showNotification('Не удалось загрузить данные', 'error');
        }
    },

    // === Получение данных формы ===
    /**
     * Собирает данные из формы для отправки
     * @returns {Object} Данные формы
     */
    getFormData: function () {
        return {
            program: this.$programSelect.val(),
            protocol_num: this.$protocolNumInput.val(),
            udostoverenie_num: this.$certNumInput.val(),
            hours: this.$hours.val(),
            date_from: this.$dateFrom.val(),
            date_to: this.$dateTo.val()
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
        const url = new URL(`${API_ENDPOINTS.EDU_UPDATE}${selectedEducationID}`);
        try {
            const data = await sendPatchRequest(url, formData);
            if (data.status === 'SUCCESS') {
                if (this.files.length > 0) {
                    await this.uploadFiles(selectedEducationID);
                }
                await getEducationData(worker_id);
                await this.loadEducationData(selectedEducationID);
                $(document).trigger('updateNotify');
                this.modal.hide();
                showNotification('Обучение успешно обновлено', 'success');
            } else {
                showNotification(data.description || 'Ошибка при обновлении данных', 'error');
            }
        } catch (error) {
            console.error('Ошибка при отправке формы:', error);
            showNotification('Произошла ошибка при отправке формы', 'error');
        } finally {
            this.hideSpinner();
        }
    },

    /**
     * Загружает файлы на сервер
     * @param {string} educationId - ID записи обучения
     * @returns {Promise} Результат загрузки
     */
    uploadFiles: async function (educationId) {
        const uploadPromises = this.files.map(async file => {
            const formData = new FormData();
            formData.append('file', file.file);
            formData.append('file_type', 'education');
            formData.append('object_id', educationId);
            const response = await fetch(`/files/upload/`, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': Cookies.get('csrftoken')
                }
            });
            return await response.json();
        });
        try {
            const results = await Promise.all(uploadPromises);
            results.forEach(result => {
                if (result.status !== 'SUCCESS') {
                    console.warn('Ошибка загрузки файла:', result);
                    showNotification(`Ошибка загрузки файла: ${result.description || 'Неизвестная ошибка'}`, 'error');
                }
            });
            this.files = [];
            await this.loadEducationData(educationId);
            return results;
        } catch (error) {
            console.error('Ошибка загрузки файлов:', error);
            showNotification('Произошла ошибка при загрузке файлов', 'error');
            throw error;
        }
    },

    // === Сброс формы ===
    /**
     * Сбрасывает форму до начального состояния
     */
    resetForm: function () {
        this.$form.trigger('reset');
        this.$form.find('.is-invalid').removeClass('is-invalid');
        this.$form.find('.invalid-feedback').remove();
        this.files = [];
        this.existingFiles = [];
        this.updateFileList();
        this.hideSpinner();
        this.initCounters();
    }
};

// === Инициализация модуля ===
$(document).ready(function () {
    if ($('#editEduModal').length) {
        EducationEditForm.init();
    }
});