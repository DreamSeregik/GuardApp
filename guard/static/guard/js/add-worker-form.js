/**
 * Модуль EmployeeForm для работы с формой добавления сотрудника
 */
const EmployeeForm = {
    // === Инициализация ===
    /**
     * Инициализирует модуль, кэширует элементы, привязывает события и счетчики
     */
    init: function () {
        this.cacheElements();
        this.bindEvents();
        this.initCounters();
        this.modal = new bootstrap.Modal(this.$modal[0], { focus: false });
    },

    // === Кэширование DOM-элементов ===
    /**
     * Сохраняет ссылки на DOM-элементы формы
     */
    cacheElements: function () {
        this.$modal = $('#addWorkerModal');
        this.$form = $('#employeeAddForm');
        this.$modalContent = $('.modal-content', this.$modal);
        this.$closeBtn = $('.btn-close', this.$modal);
        this.$fullNameInput = $('#employeeFullName');
        this.$positionInput = $('#employeePosition');
        this.$structInput = $('#employeeStruct');
        this.$omsInput = $('#employeeOMS');
        this.$dmsInput = $('#employeeDMS');
        this.$submitBtn = $('#submitEmployeeForm');
        this.$birthDateInput = $('#employeeBirthDate');
        this.$spinner = $('#addWorkerSpinner');
    },

    // === Привязка событий ===
    /**
     * Привязывает обработчики событий к элементам формы
     */
    bindEvents: function () {
        this.$fullNameInput.on('input', () => {
            this.updateCounter('fullName');
            this.validateFullNameInput();
        });
        this.$positionInput.on('input', () => {
            this.updateCounter('position');
            this.validatePosition();
        });
        this.$structInput.on('input', this.updateCounter.bind(this, 'struct'));
        this.$omsInput.on('input', (e) => {
            this.formatOMSInput(e.target)
            this.updateCounter('oms');
            this.validateOMS();
        });
        this.$dmsInput.on('input', () => {
            this.updateCounter('dms');
            this.validateDMS();
        });
        this.$birthDateInput.on('input', this.validateBirthDateInput.bind(this));
        this.$submitBtn.on('click', this.submitForm.bind(this));
        this.$modal.on('show.bs.modal', this.handleModalShow.bind(this));
        this.$modal.on('shown.bs.modal', this.handleModalShown.bind(this));
        this.$modal.on('hide.bs.modal', this.handleModalHide.bind(this));
        this.$modal.on('hidden.bs.modal', this.handleModalHidden.bind(this));
        this.$closeBtn.on('click', this.handleCloseClick.bind(this));
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
     * Устанавливает фокус на поле ввода ФИО
     */
    handleModalShown: function () {
        this.$fullNameInput.trigger('focus');
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

    // === Управление счетчиками ===
    /**
     * Инициализирует счетчики для полей ввода
     */
    initCounters: function () {
        this.updateCounter('fullName');
        this.updateCounter('position');
        this.updateCounter('struct');
        this.updateCounter('oms');
        this.updateCounter('dms');
    },

    /**
     * Обновляет счетчик символов для указанного поля
     * @param {string} field - Имя поля
     */
    updateCounter: function (field) {
        let $input, $counter;
        switch (field) {
            case 'fullName':
                $input = this.$fullNameInput;
                $counter = $('#fullNameCounter');
                break;
            case 'position':
                $input = this.$positionInput;
                $counter = $('#positionCounter');
                break;
            case 'struct':
                $input = this.$structInput;
                $counter = $('#structCounter');
                break;
            case 'oms':
                $input = this.$omsInput;
                $counter = $('#omsCounter');
                break;
            case 'dms':
                $input = this.$dmsInput;
                $counter = $('#dmsCounter');
                break;
        }
        $counter.text($input.val().length);
    },

    // === Валидация ФИО ===
    /**
     * Обрабатывает и проверяет ФИО
     * @param {string} name - Введенное ФИО
     * @param {Object} options - Настройки валидации
     * @returns {Object} Результат валидации
     */
    processFullName: function (name, options = {}) {
        const defaults = {
            requireMiddleName: false,
            minLength: 2,
            maxLength: 30,
            allowHyphen: true,
            allowApostrophe: true,
            allowSinglePart: false,
            autoFixCase: true
        };

        const settings = { ...defaults, ...options };

        if (!name || typeof name !== 'string') {
            return { isValid: false, formattedName: '', error: 'Пустое поле' };
        }

        const cleanedName = name.trim().replace(/\s+/g, ' ');
        if (cleanedName === '') {
            return { isValid: false, formattedName: '', error: 'Пустое поле' };
        }

        if (/[a-zA-Z]/.test(cleanedName)) {
            return { isValid: false, formattedName: cleanedName, error: 'Латинские символы недопустимы' };
        }

        let parts = cleanedName.split(' ');
        if (settings.requireMiddleName && parts.length !== 3) {
            return { isValid: false, formattedName: cleanedName, error: 'Требуется три слова' };
        }

        if (!settings.allowSinglePart && parts.length < 2) {
            return { isValid: false, formattedName: cleanedName, error: 'Требуется минимум два слова' };
        }

        if (parts.length > 3) {
            return { isValid: false, formattedName: cleanedName, error: 'Максимум три слова' };
        }

        const formatPart = part => {
            if (!settings.autoFixCase || !part) return part;

            if (settings.allowHyphen && part.includes('-')) {
                return part.split('-').map(subPart => {
                    return subPart.charAt(0).toUpperCase() + subPart.slice(1).toLowerCase();
                }).join('-');
            }

            if (settings.allowApostrophe && part.includes("'")) {
                return part.split("'").map((subPart, i) => {
                    if (i === 0) {
                        return subPart.charAt(0).toUpperCase() + subPart.slice(1).toLowerCase();
                    }
                    return "'" + subPart.charAt(0).toUpperCase() + subPart.slice(1).toLowerCase();
                }).join('').replace(/''/g, "'");
            }

            return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        };

        const formattedParts = parts.filter(part => part).map(formatPart);
        const formattedName = formattedParts.join(' ');

        const regexParts = ['^[А-ЯЁ]'];
        let mainPart = '[а-яё]+';
        if (settings.allowHyphen) {
            mainPart = '(?:[а-яё]+(?:-[А-ЯЁ][а-яё]+)*)';
        }
        if (settings.allowApostrophe) {
            mainPart = '(?:[а-яё]*(?:\'[А-ЯЁ][а-яё]+)*)';
        }
        regexParts.push(mainPart, '$');
        const regex = new RegExp(regexParts.join(''), 'i');

        for (const part of formattedParts) {
            if (!regex.test(part)) {
                return { isValid: false, formattedName, error: 'Некорректные символы' };
            }

            if (part.length < settings.minLength || part.length > settings.maxLength) {
                return { isValid: false, formattedName, error: 'Недопустимая длина слова' };
            }

            if (settings.allowApostrophe && part.includes("'")) {
                const subParts = part.split("'");
                for (let i = 1; i < subParts.length; i++) {
                    if (!subParts[i] || !/^[А-ЯЁ]/.test(subParts[i])) {
                        return { isValid: false, formattedName, error: 'Некорректный апостроф' };
                    }
                }
            }

            if (settings.allowHyphen && part.includes("-")) {
                const subParts = part.split("-");
                for (let i = 1; i < subParts.length; i++) {
                    if (!subParts[i] || !/^[А-ЯЁ]/.test(subParts[i])) {
                        return { isValid: false, formattedName, error: 'Некорректный дефис' };
                    }
                }
            }
        }

        return { isValid: true, formattedName };
    },

    /**
     * Проверяет поле ввода ФИО
     * @returns {boolean} Результат валидации
     */
    validateFullNameInput: function () {
        const fullName = this.$fullNameInput.val().trim();
        const fullNameResult = this.processFullName(fullName);

        if (!fullName) {
            this.showError(this.$fullNameInput, 'fullNameFeedback', 'Поле ФИО обязательно для заполнения');
        } else if (!fullNameResult.isValid) {
            if (fullNameResult.error === 'Латинские символы недопустимы') {
                this.showError(this.$fullNameInput, 'fullNameFeedback', 'ФИО должно содержать только кириллицу');
            } else {
                this.showError(this.$fullNameInput, 'fullNameFeedback', 'Введите корректное ФИО (2-3 слова, каждое с заглавной буквы, только кириллица)');
            }
        } else {
            this.hideError(this.$fullNameInput, 'fullNameFeedback');
        }
        return fullNameResult.isValid && fullName;
    },

    /**
     * Проверяет поле ввода должности
     * @returns {boolean} Результат валидации
     */
    validatePosition: function () {
        const position = this.$positionInput.val().trim();

        if (!position) {
            this.showError(this.$positionInput, 'positionFeedback', 'Укажите должность');
            return false;
        } else if (position.length < 3) {
            this.showError(this.$positionInput, 'positionFeedback', 'Должность должна содержать минимум 3 символа');
            return false;
        } else {
            this.hideError(this.$positionInput, 'positionFeedback');
            return true;
        }
    },

    /**
     * Проверяет поле ввода даты рождения
     */
    validateBirthDateInput: function () {
        const birthDateInput = this.$birthDateInput.val();
        if (!birthDateInput || !this.validateBirthDate(birthDateInput)) {
            this.showError(this.$birthDateInput, 'birthDateFeedback', 'Укажите корректную дату рождения (возраст от 14 до 100 лет, не в будущем)');
        } else {
            this.hideError(this.$birthDateInput, 'birthDateFeedback');
        }
    },

    /**
     * Проверяет корректность даты рождения
     * @param {string} dateStr - Дата в формате строки
     * @returns {boolean} Результат валидации
     */
    validateBirthDate: function (dateStr) {
        if (!dateStr) return false;

        const inputDate = new Date(dateStr);
        if (isNaN(inputDate.getTime())) return false;

        const today = new Date();
        const minAgeDate = new Date(today.getFullYear() - 14, today.getMonth(), today.getDate());
        const maxAgeDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());

        return inputDate <= today && inputDate <= minAgeDate && inputDate >= maxAgeDate;
    },

    formatOMSInput: function (input) {
        input.value = input.value.replace(/\D/g, '').slice(0, 16);
    },

    /**
     * Проверяет поле ввода номера ОМС
     * @returns {boolean} Результат валидации
     */
    validateOMS: function () {
        const oms = this.$omsInput.val().trim();
        const requiredLength = 16;

        if (!oms) {
            this.hideError(this.$omsInput, 'omsFeedback');
            return true;
        } else if (!/^\d+$/.test(oms)) {
            this.showError(this.$omsInput, 'omsFeedback', 'Номер полиса ОМС должен содержать только цифры');
            return false;
        } else if (oms.length !== requiredLength) {
            this.showError(this.$omsInput, 'omsFeedback', `Номер полиса ОМС должен содержать ${requiredLength} цифр`);
            return false;
        } else {
            this.hideError(this.$omsInput, 'omsFeedback');
            return true;
        }
    },

    /**
     * Проверяет поле ввода номера ДМС
     * @returns {boolean} Результат валидации
     */
    validateDMS: function () {
        const dms = this.$dmsInput.val().trim();
        const minLength = 10;
        const maxLength = 16;

        if (dms.length < minLength) {
            this.showError(this.$dmsInput, 'dmsFeedback', `Номер полиса ДМС должен содержать минимум ${minLength} символов`);
            return false;
        } else if (dms.length > maxLength) {
            this.showError(this.$dmsInput, 'dmsFeedback', `Номер полиса ДМС не должен превышать ${maxLength} символов`);
            return false;
        } else {
            this.hideError(this.$dmsInput, 'dmsFeedback');
            return true;
        }
    },

    /**
     * Показывает сообщение об ошибке
     * @param {jQuery} $input - Элемент ввода
     * @param {string} feedbackId - ID элемента обратной связи
     * @param {string} message - Сообщение об ошибке
     */
    showError: function ($input, feedbackId, message) {
        $input.addClass('is-invalid');
        $(`#${feedbackId}`).text(message).show();
    },

    /**
     * Скрывает сообщение об ошибке
     * @param {jQuery} $input - Элемент ввода
     * @param {string} feedbackId - ID элемента обратной связи
     */
    hideError: function ($input, feedbackId) {
        $input.removeClass('is-invalid');
        $(`#${feedbackId}`).text('').hide();
    },

    // === Валидация формы ===
    /**
     * Проверяет корректность заполнения формы
     * @returns {boolean} Результат валидации
     */
    validateForm: function () {
        let isValid = true;

        if (!this.validateFullNameInput()) isValid = false;

        if (!this.validatePosition()) isValid = false;

        const birthDateInput = this.$birthDateInput.val();
        if (!birthDateInput || !this.validateBirthDate(birthDateInput)) {
            this.showError(this.$birthDateInput, 'birthDateFeedback', 'Укажите корректную дату рождения');
            isValid = false;
        } else {
            this.hideError(this.$birthDateInput, 'birthDateFeedback');
        }

        const genderSelected = $('input[name="employeeGender"]:checked').length > 0;
        if (!genderSelected) {
            this.showError($('input[name="employeeGender"]').closest('.d-flex'), 'genderFeedback', 'Выберите пол');
            isValid = false;
        } else {
            this.hideError($('input[name="employeeGender"]').closest('.d-flex'), 'genderFeedback');
        }

        const status = $('#employeeStatus').val();
        if (!status) {
            this.showError($('#employeeStatus'), 'statusFeedback', 'Выберите статус');
            isValid = false;
        } else {
            this.hideError($('#employeeStatus'), 'statusFeedback');
        }

        if (this.$omsInput.val().trim() && !this.validateOMS()) isValid = false;
        if (this.$dmsInput.val().trim() && !this.validateDMS()) isValid = false;

        return isValid;
    },

    /**
     * Собирает данные формы для отправки
     * @returns {Object} Данные формы
     */
    getFormData: function () {
        return {
            FIO: this.processFullName(this.$fullNameInput.val()).formattedName,
            gender: $('input[name="employeeGender"]:checked').val(),
            birthday: this.$birthDateInput.val(),
            position: this.$positionInput.val(),
            department: this.$structInput.val(),
            oms_number: this.$omsInput.val(),
            dms_number: this.$dmsInput.val(),
            status: $('#employeeStatus').val(),
            is_edu: $('#employeeIsLearning').is(':checked')
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
        const url = new URL(API_ENDPOINTS.WORKER_ADD);

        try {
            const data = await sendPostRequest(url, formData);

            if (data.status === "SUCCESS") {
                await filterWorkers(filter_query);
                sortWorkersByFIO(sort_type);
                this.modal.hide();
                showNotification('Сотрудник успешно добавлен', 'success');
            } else {
                showNotification(data.description || 'Ошибка при добавлении сотрудника');
            }
        } catch (error) {
            console.error('Ошибка при отправке формы:', error);
            showNotification('Произошла ошибка при отправке формы');
        } finally {
            this.hideSpinner();
        }
    },

    /**
     * Сбрасывает форму и обновляет счетчики
     */
    resetForm: function () {
        this.$form.trigger('reset');
        this.$form.find('.is-invalid').removeClass('is-invalid');
        this.$form.find('.invalid-feedback').text('').hide();
        this.initCounters();
        this.hideSpinner();
    }
};

// === Инициализация модуля ===
$(document).ready(function () {
    if ($('#addWorkerModal').length) {
        EmployeeForm.init();
    }
});