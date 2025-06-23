/**
 * Модуль для работы с формой редактирования данных сотрудника
 */
const EmployeeEditForm = {
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
        this.$modal = $('#editWorkerModal');
        this.$form = $('#employeeEditForm');
        this.$modalContent = $('.modal-content', this.$modal);
        this.$closeBtn = $('.btn-close', this.$modal);
        this.$fullNameInput = $('#editEmployeeFullName');
        this.$positionInput = $('#editEmployeePosition');
        this.$structInput = $('#editEmployeeStruct');
        this.$omsInput = $('#editEmployeeOMS');
        this.$dmsInput = $('#editEmployeeDMS');
        this.$birthDateInput = $('#editEmployeeBirthDate');
        this.$genderInputs = $('input[name="editEmployeeGender"]');
        this.$statusSelect = $('#editEmployeeStatus');
        this.$isLearningCheckbox = $('#editEmployeeIsLearning');
        this.$submitBtn = $('#submitEditEmployeeForm');
        this.$spinner = $('#editWorkerSpinner');
        this.$loadingSpinner = $('#editWorkerLoadingSpinner');
    },

    // === Привязка событий ===
    /**
     * Привязывает обработчики событий к элементам формы
     */
    bindEvents: function () {
        // Счетчики символов
        this.$fullNameInput.on('input', this.updateCounter.bind(this, 'editFullName'));
        this.$positionInput.on('input', this.updateCounter.bind(this, 'editPosition'));
        this.$structInput.on('input', this.updateCounter.bind(this, 'editStruct'));
        this.$omsInput.on('input', this.updateCounter.bind(this, 'editOms'));
        this.$dmsInput.on('input', this.updateCounter.bind(this, 'editDms'));

        // Валидация в реальном времени
        this.$fullNameInput.on('input', this.validateFullName.bind(this));
        this.$positionInput.on('input', this.validatePosition.bind(this));
        this.$birthDateInput.on('change', this.validateBirthDate.bind(this));
        this.$omsInput.on('input', this.validateOMS.bind(this));
        this.$dmsInput.on('input', this.validateDMS.bind(this));
        this.$genderInputs.on('change', this.validateGender.bind(this));
        this.$statusSelect.on('change', this.validateStatus.bind(this));

        // Обработчик отправки формы
        this.$submitBtn.on('click', this.submitForm.bind(this));

        // Обработчики модального окна
        this.$modal.on('show.bs.modal', this.handleModalShow.bind(this));
        this.$modal.on('shown.bs.modal', this.handleModalShown.bind(this));
        this.$modal.on('hide.bs.modal', this.handleModalHide.bind(this));
        this.$modal.on('hidden.bs.modal', this.handleModalHidden.bind(this));

        // Обработчик кнопки закрытия
        this.$closeBtn.on('click', this.handleCloseClick.bind(this));
    },

    // === Валидация полей ===
    /**
     * Валидирует поле ФИО
     * @returns {boolean} Результат валидации
     */
    validateFullName: function () {
        const fullName = this.$fullNameInput.val().trim();
        const fullNameResult = EmployeeForm.processFullName(fullName);

        if (!fullName) {
            this.showError(this.$fullNameInput, 'editFullNameFeedback', 'Поле обязательно для заполнения');
        } else if (!fullNameResult.isValid) {
            if (fullNameResult.error === 'latin') {
                this.showError(this.$fullNameInput, 'editFullNameFeedback', 'ФИО должно содержать только кириллицу');
            } else {
                this.showError(this.$fullNameInput, 'editFullNameFeedback', 'Введите корректное ФИО (2-3 слова, каждое с заглавной буквы, только кириллица)');
            }
        } else {
            this.hideError(this.$fullNameInput, 'editFullNameFeedback');
        }
        return fullNameResult.isValid && fullName;
    },

    /**
     * Валидирует поле должности
     * @returns {boolean} Результат валидации
     */
    validatePosition: function () {
        const position = this.$positionInput.val().trim();
        if (!position) {
            this.showError(this.$positionInput, 'editPositionFeedback', 'Пожалуйста, укажите должность');
            return false;
        } else if (position.length < 3) {
            this.showError(this.$positionInput, 'editPositionFeedback', 'Должность должна содержать минимум 3 символа');
            return false;
        } else {
            this.hideError(this.$positionInput, 'editPositionFeedback');
            return true;
        }
    },

    /**
     * Валидирует поле даты рождения
     * @returns {boolean} Результат валидации
     */
    validateBirthDate: function () {
        const dateStr = this.$birthDateInput.val();
        const isValid = this.isValidBirthDate(dateStr);
        if (!dateStr) {
            this.showError(this.$birthDateInput, 'editBirthDateFeedback', 'Поле обязательно для заполнения');
        } else if (!isValid) {
            this.showError(this.$birthDateInput, 'editBirthDateFeedback', 'Возраст должен быть от 14 до 100 лет');
        } else {
            this.hideError(this.$birthDateInput, 'editBirthDateFeedback');
        }
        return !!dateStr && isValid;
    },

    /**
     * Валидирует поле номера полиса ОМС
     * @returns {boolean} Результат валидации
     */
    validateOMS: function () {
        const oms = this.$omsInput.val().trim();
        const requiredLength = 16;
        if (!oms) {
            this.hideError(this.$omsInput, 'editOMSFeedback');
            return true;
        } else if (!/^\d+$/.test(oms)) {
            this.showError(this.$omsInput, 'editOMSFeedback', 'Номер полиса ОМС должен содержать только цифры');
            return false;
        } else if (oms.length !== requiredLength) {
            this.showError(this.$omsInput, 'editOMSFeedback', `Номер полиса ОМС должен содержать ${requiredLength} цифр`);
            return false;
        } else {
            this.hideError(this.$omsInput, 'editOMSFeedback');
            return true;
        }
    },

    /**
     * Валидирует поле номера полиса ДМС
     * @returns {boolean} Результат валидации
     */
    validateDMS: function () {
        const dms = this.$dmsInput.val().trim();
        const minLength = 10;
        const maxLength = 16;
        if (!dms) {
            this.hideError(this.$dmsInput, 'editDMSFeedback');
            return true;
        } else if (dms.length < minLength) {
            this.showError(this.$dmsInput, 'editDMSFeedback', `Номер полиса ДМС должен содержать минимум ${minLength} символов`);
            return false;
        } else if (dms.length > maxLength) {
            this.showError(this.$dmsInput, 'editDMSFeedback', `Номер полиса ДМС не должен превышать ${maxLength} символов`);
            return false;
        } else {
            this.hideError(this.$dmsInput, 'editDMSFeedback');
            return true;
        }
    },

    /**
     * Валидирует поле пола
     * @returns {boolean} Результат валидации
     */
    validateGender: function () {
        const genderSelected = this.$genderInputs.filter(':checked').length > 0;
        if (!genderSelected) {
            this.showError(this.$genderInputs.closest('.d-flex'), 'editGenderFeedback', 'Пожалуйста, выберите пол');
            return false;
        } else {
            this.hideError(this.$genderInputs.closest('.d-flex'), 'editGenderFeedback');
            return true;
        }
    },

    /**
     * Валидирует поле статуса
     * @returns {boolean} Результат валидации
     */
    validateStatus: function () {
        const status = this.$statusSelect.val();
        if (!status) {
            this.showError(this.$statusSelect, 'editStatusFeedback', 'Пожалуйста, выберите статус');
            return false;
        } else {
            this.hideError(this.$statusSelect, 'editStatusFeedback');
            return true;
        }
    },

    /**
     * Проверяет валидность даты рождения
     * @param {string} dateStr - Строка с датой рождения
     * @returns {boolean} Результат валидации
     */
    isValidBirthDate: function (dateStr) {
        if (!dateStr) return false;
        const inputDate = new Date(dateStr);
        if (isNaN(inputDate.getTime())) return false;
        const today = new Date();
        const minAgeDate = new Date(today.getFullYear() - 14, today.getMonth(), today.getDate());
        const maxAgeDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
        return inputDate <= minAgeDate && inputDate >= maxAgeDate;
    },

    // === Управление ошибками ===
    /**
     * Показывает сообщение об ошибке для поля
     * @param {jQuery} $input - Элемент ввода
     * @param {string} feedbackId - ID элемента обратной связи
     * @param {string} message - Сообщение об ошибке
     */
    showError: function ($input, feedbackId, message) {
        $input.addClass('is-invalid');
        $(`#${feedbackId}`).text(message).show();
    },

    /**
     * Скрывает сообщение об ошибке для поля
     * @param {jQuery} $input - Элемент ввода
     * @param {string} feedbackId - ID элемента обратной связи
     */
    hideError: function ($input, feedbackId) {
        $input.removeClass('is-invalid');
        $(`#${feedbackId}`).text('').hide();
    },

    // === Обработчики событий модального окна ===
    /**
     * Загружает данные сотрудника при открытии модального окна
     */
    handleModalShow: async function () {
        this.showLoadingSpinner();
        this.$submitBtn.prop('disabled', true);
        if (worker_id) {
            await this.loadEmployeeData(worker_id);
            this.hideLoadingSpinner();
        }
    },

    /**
     * Устанавливает фокус на поле ФИО после открытия модального окна
     */
    handleModalShown: function () {
        this.$fullNameInput.trigger('focus');
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

    // === Управление счетчиками ===
    /**
     * Инициализирует счетчики символов для полей
     */
    initCounters: function () {
        this.updateCounter('editFullName');
        this.updateCounter('editPosition');
        this.updateCounter('editStruct');
        this.updateCounter('editOms');
        this.updateCounter('editDms');
    },

    /**
     * Обновляет счетчик символов для указанного поля
     * @param {string} field - Название поля
     */
    updateCounter: function (field) {
        let $input, $counter;
        switch (field) {
            case 'editFullName':
                $input = this.$fullNameInput;
                $counter = $('#editFullNameCounter');
                break;
            case 'editPosition':
                $input = this.$positionInput;
                $counter = $('#editPositionCounter');
                break;
            case 'editStruct':
                $input = this.$structInput;
                $counter = $('#editStructCounter');
                break;
            case 'editOms':
                $input = this.$omsInput;
                $counter = $('#editOmsCounter');
                break;
            case 'editDms':
                $input = this.$dmsInput;
                $counter = $('#editDmsCounter');
                break;
        }
        $counter.text($input.val().length);
    },

    // === Валидация формы ===
    /**
     * Проверяет валидность всех полей формы
     * @returns {boolean} Результат валидации
     */
    validateForm: function () {
        let isValid = true;
        if (!this.validateFullName()) isValid = false;
        if (!this.validatePosition()) isValid = false;
        if (!this.validateBirthDate()) isValid = false;
        if (!this.validateGender()) isValid = false;
        if (!this.validateStatus()) isValid = false;
        if (this.$omsInput.val().trim() && !this.validateOMS()) isValid = false;
        if (this.$dmsInput.val().trim() && !this.validateDMS()) isValid = false;
        return isValid;
    },

    // === Получение данных формы ===
    /**
     * Собирает данные из формы для отправки
     * @returns {Object} Данные формы
     */
    getFormData: function () {
        return {
            FIO: EmployeeForm.processFullName(this.$fullNameInput.val()).formattedName,
            gender: $('input[name="editEmployeeGender"]:checked').val(),
            birthday: this.$birthDateInput.val(),
            position: this.$positionInput.val(),
            department: this.$structInput.val(),
            oms_number: this.$omsInput.val(),
            dms_number: this.$dmsInput.val(),
            status: this.$statusSelect.val(),
            is_edu: this.$isLearningCheckbox.is(':checked')
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

    // === Загрузка данных ===
    /**
     * Загружает данные сотрудника по ID
     * @param {string} employeeId - ID сотрудника
     */
    loadEmployeeData: async function (employeeId) {
        try {
            const url = new URL(API_ENDPOINTS.FILTER);
            url.searchParams.append('id', employeeId);
            const { status, employees } = await sendGetRequest(url);
            if (status === 'SUCCESS') {
                this.$fullNameInput.val(employees.FIO || '');
                this.updateCounter('editFullName');
                this.validateFullName();
                $(`input[name="editEmployeeGender"][value="${employees.gender === 'Женский' ? 'F' : 'M'}"]`).prop('checked', true);
                this.validateGender();
                if (employees.birthday) {
                    const [day, month, year] = employees.birthday.split('.');
                    this.$birthDateInput.val(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
                    this.validateBirthDate();
                }
                this.$positionInput.val(employees.position || '');
                this.updateCounter('editPosition');
                this.validatePosition();
                this.$structInput.val(employees.department || '');
                this.updateCounter('editStruct');
                this.$omsInput.val(employees.oms_number || '');
                this.updateCounter('editOms');
                this.validateOMS();
                this.$dmsInput.val(employees.dms_number || '');
                this.updateCounter('editDms');
                this.validateDMS();
                this.$statusSelect.val(employees.status_code || 'W');
                this.validateStatus();
                this.$isLearningCheckbox.prop('checked', employees.is_edu || false);
                this.$submitBtn.prop('disabled', false);
            }
        } catch (error) {
            console.error('Ошибка при загрузке данных сотрудника:', error);
            showNotification('Ошибка при загрузке данных сотрудника');
        }
    },

    // === Отправка формы ===
    /**
     * Отправляет данные формы на сервер
     */
    submitForm: async function () {
        if (!this.validateForm()) {
            const $firstError = this.$form.find('.is-invalid').first();
            if ($firstError.length) {
                $('html, body').animate({
                    scrollTop: $firstError.offset().top - 100
                }, 500);
            }
            return;
        }
        this.showSpinner();
        const formData = this.getFormData();
        const url = new URL(`${API_ENDPOINTS.PERSONAL_DATA_UPDATE}${worker_id}`);
        try {
            const data = await sendPatchRequest(url, formData);
            if (data.status === 'SUCCESS') {
                await getMainData(worker_id);
                await filterWorkers(filter_query);
                sortWorkersByFIO(sort_type);
                this.modal.hide();
                showNotification('Данные сотрудника успешно обновлены', 'success');
            } else {
                showNotification(data.message || 'Ошибка при обновлении данных');
            }
        } catch (error) {
            console.error('Ошибка при отправке формы:', error);
            showNotification('Произошла ошибка при отправке формы');
        } finally {
            this.hideSpinner();
        }
    },

    // === Сброс формы ===
    /**
     * Сбрасывает форму до начального состояния
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
    if ($('#editWorkerModal').length) {
        EmployeeEditForm.init();
    }
});