/**
 * Модуль EducationForm для работы с формой добавления обучения сотрудника
 */
const EducationForm = {
    // === Инициализация ===
    /**
     * Инициализирует модуль, кэширует элементы, привязывает события и счетчики
     */
    init: function () {
        this.cacheElements();
        this.bindEvents();
        this.modal = new bootstrap.Modal(this.$modal[0], { focus: false });
        this.files = [];
        this.initCounters();
    },

    // === Кэширование DOM-элементов ===
    /**
     * Сохраняет ссылки на DOM-элементы формы
     */
    cacheElements: function () {
        this.$modal = $('#addEduModal');
        this.$form = $('#educationAddForm');
        this.$modalContent = $('.modal-content', this.$modal);
        this.$closeBtn = $('.btn-close', this.$modal);
        this.$programSelect = $('#educationProgram');
        this.$hours = $('#educationHours');
        this.$submitBtn = $('#submitEducationForm');
        this.$fileInput = $('#educationFileInput');
        this.$fileList = $('#educationFileList');
        this.$fileUploadBtn = $('#educationFileUploadBtn');
        this.$spinner = $('#submitEducationSpinner');
        this.$protocolNumInput = $('#educationProtocolNum');
        this.$certNumInput = $('#educationCertNum');
        this.$protocolNumCounter = $('#protocolNumCounter');
        this.$certNumCounter = $('#certNumCounter');
        this.$dateFrom = $('#educationDateFrom');
        this.$dateTo = $('#educationDateTo');
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

        this.$programSelect.on('input change', this.validateProgram.bind(this));
        this.$hours.on('input', this.validateHours.bind(this));
        this.$dateFrom.on('input change', () => {
            this.validateDateFrom();
            this.validateDateTo();
        });
        this.$dateTo.on('input change', () => {
            this.validateDateTo();
            this.validateDateFrom();
        });
        this.$form.find('[required]').on('input change', (e) => this.validateRequired($(e.target)));
    },

    // === Обработчики событий модального окна ===
    /**
     * Сбрасывает форму при показе модального окна
     */
    handleModalShow: function () {
        this.resetForm();
        this.$modal.removeAttr('aria-hidden');
    },

    /**
     * Устанавливает фокус на поле выбора программы
     */
    handleModalShown: function () {
        this.$programSelect.trigger('focus');
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

    /**
     * Инициализирует счетчики для полей ввода
     */
    initCounters: function () {
        this.updateCounter('protocolNum');
        this.updateCounter('certNum');
    },

    /**
     * Обновляет счетчик символов для указанного поля
     * @param {string} field - Имя поля
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
     * Валидация программы обучения 
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
   * Валидация часов обучения 
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
        let feedback = '';

        if (!value) {
            isValid = false;
            feedback = 'Поле обязательно для заполнения';
        } else {
            // Проверяем формат: целое число или с одной цифрой после запятой
            if (!/^\d+(\.\d{0,1})?$/.test(value)) {
                isValid = false;
                feedback = 'Допускается целое число или с одной цифрой после точки';
            } else {
                const hours = parseFloat(value);
                if (isNaN(hours)) {
                    isValid = false;
                    feedback = 'Введите корректное число';
                } else if (hours < 1 || hours > 1000) {
                    isValid = false;
                    feedback = 'Часы должны быть от 1.0 до 1000.0';
                }
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
        // Проверяем дату окончания при изменении даты начала
        this.validateDateTo();
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
            if (dateTo < dateFrom) {
                isValid = false;
                feedback = 'Дата окончания не может быть раньше даты начала';
            }
        }

        $input.toggleClass('is-invalid', !isValid);
        const $feedback = $input.next('.invalid-feedback');
        if ($feedback.length) {

            $feedback.text(feedback);
            $feedback.toggle(!!feedback); // Показываем/скрываем в зависимости от наличия текста
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
        } else {
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
        } else {
            $input.after(`<div class="invalid-feedback">${feedback}</div>`);
        }
        return isValid;
    },

    /**
     * Валидация обязательных полей 
     * @param {jQuery} $input - Поле 
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
        }
        return true;

    },

    /**
     * Собирает данные формы для отправки
     * @returns {Object} Данные формы
     */
    getFormData: function () {
        return {
            employee_id: worker_id,
            program: this.$programSelect.val(),
            protocol_num: this.$protocolNumInput.val(),
            udostoverenie_num: this.$certNumInput.val(),
            hours: this.$hours.val(),
            date_from: this.$dateFrom.val(),
            date_to: this.$dateTo.val()
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
        const url = new URL(API_ENDPOINTS.EDU_ADD);

        try {
            const data = await sendPostRequest(url, formData);

            if (data.status === "SUCCESS") {
                if (this.files.length > 0) {
                    await this.uploadFiles(data.id);
                }
                await getEducationData(worker_id);
                $(document).trigger('updateNotify');
                this.modal.hide();
                showNotification('Обучение успешно добавлено', 'success');
            } else {
                showNotification(data.description || 'Ошибка при добавлении обучения', 'error');
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
     * @param {number} educationId - ID записи об обучении
     */
    uploadFiles: async function (educationId) {
        const uploadPromises = this.files.map(file => {
            const formData = new FormData();
            formData.append('file', file.file);
            formData.append('file_type', 'education');
            formData.append('object_id', educationId);

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
     * Сбрасывает форму, очищает список файлов и обновляет счетчики
     */
    resetForm: function () {
        this.$form.trigger('reset');
        this.$form.find('.is-invalid').removeClass('is-invalid');
        this.$form.find('.invalid-feedback').text('');
        this.files = [];
        this.updateFileList();
        this.hideSpinner();
        this.initCounters();
    }
};

// === Инициализация модуля ===
$(document).ready(function () {
    if ($('#addEduModal').length) {
        EducationForm.init();
    }
});