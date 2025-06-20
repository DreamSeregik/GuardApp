/**
 * MedicalExaminationForm - модуль для работы с формой направления на медосмотр
 */
const MedicalExaminationForm = {
    /**
     * Инициализация формы
     */
    init: function () {
        this.cacheElements();
        this.bindEvents();
        this.initCounters();

        // Инициализация модального окна с отключенным автофокусом
        this.modal = new bootstrap.Modal(this.$modal[0], {
            focus: false
        });
    },

    /**
     * Кэширование jQuery объектов элементов
     */
    cacheElements: function () {
        this.$modal = $('#mednapravModal');
        this.$form = $('#medicalExaminationForm');
        this.$modalContent = $('.modal-content', this.$modal);
        this.$closeBtn = $('.btn-close', this.$modal);
        this.$submitBtn = $('#submitMedicalForm');
        this.$examinationType = $('#napravExaminationType');
        this.$regularFields = $('#napravRegularExaminationFields');
        this.$psychiatricFields = $('#napravPsychiatricExaminationFields');
        this.$fullNameInput = $('#napravEmployeeFullName');
        this.$birthDateInput = $('#napravEmployeeBirthDate');
        this.$hasOMS = $('#napravHasOMS');
        this.$hasDMS = $('#napravHasDMS');
        this.$OMSNumber = $('#napravOMSNumber');
        this.$DMSNumber = $('#napravDMSNumber');
        this.$OMSFields = $('#napravOMSFields');
        this.$DMSFields = $('#napravDMSFields');
        this.$directionNumber = $('#napravNumber');
        this.$directionDate = $('#napravCreationDate');
        this.$directionDatePsych = $('#napravCreationDatePsych');
        this.$previousConclusions = $('#napravPreviousConclusions');
        this.$employerRepName = $('#napravEmployerRepresentativeName');
        this.$employerRepPosition = $('#napravEmployerRepresentativePosition');
        this.$OMSCounter = $('#napravOMSCounter');
        this.$DMSCounter = $('#napravDMSCounter');
        this.$submitSpinner = $('#submitMedicalSpinner');
        this.$loadingSpinner = $('#napravLoadingSpinner');
        this.$directionNumberCounter = $('#napravNumberCounter');
        this.$medicalOrgInput = $('#napravMedicalOrganization');
        this.$medicalAddressInput = $('#napravMedicalAddress');
        this.$medicalOrgPsychInput = $('#napravMedicalOrgPsych');
        this.$medicalAddressPsychInput = $('#napravMedicalAddressPsych');
        this.$medicalOrgCounter = $('#medicalOrgCounter');
        this.$medicalAddressCounter = $('#medicalAddressCounter');
        this.$medicalOrgPsychCounter = $('#medicalOrgPsychCounter');
        this.$medicalAddressPsychCounter = $('#medicalAddressPsychCounter');
        this.$ogrnCodeInput = $('#napravOgrnCode');
        this.$ogrnPsychInput = $('#napravOgrnPsych');
        this.$medicalEmailInput = $('#napravMedicalEmail');
        this.$medicalPhoneInput = $('#napravMedicalPhone');
        this.$medicalEmailPsychInput = $('#napravMedicalEmailPsych');
        this.$medicalPhonePsychInput = $('#napravMedicalPhonePsych');
        this.$medicalEmailCounter = $('#medicalEmailCounter');
        this.$medicalPhoneCounter = $('#medicalPhoneCounter');
        this.$medicalEmailPsychCounter = $('#medicalEmailPsychCounter');
        this.$medicalPhonePsychCounter = $('#medicalPhonePsychCounter');
        this.$medicalEmailPsychCounter = $('#medicalEmailPsychCounter');
        this.$departmentNameInput = $('#napravDepartmentName');
        this.$departmentCounter = $('#napravDepartmentCounter');
        this.$positionInput = $('#napravEmployeePosition');
        this.$positionPsychInput = $('#napravEmployeePositionPsych');
        this.$hazardFactorsInput = $('#napravHazardFactors');
        this.$employerRepNameInput = $('#napravEmployerRepresentativeName');
        this.$employerRepNameCounter = $('#employerRepNameCounter');
        this.$employerRepPositionInput = $('#napravEmployerRepresentativePosition');
        this.$employerRepPositionCounter = $('#employerRepPositionCounter');
    },

    /**
     * Навешивание обработчиков событий
     */
    bindEvents: function () {
        // Обработчики для полей формы
        this.$examinationType.on('change', this.handleExaminationTypeChange.bind(this));
        this.$fullNameInput.on('input', () => {
            this.updateCounter('napravFullName');
            this.validateFullNameInput();
        });
        this.$birthDateInput.on('input', this.validateBirthDateInput.bind(this));
        this.$submitBtn.on('click', this.submitForm.bind(this));
        this.$hasOMS.on('change', this.handleInsuranceChange.bind(this));
        this.$hasDMS.on('change', this.handleInsuranceChange.bind(this));
        this.$directionNumber.on('input', () => {
            this.updateDirectionNumberCounter();
            this.validateDirectionNumber();
        });
        this.$directionNumber.on('blur', this.validateDirectionNumber.bind(this));
        this.$directionDate.on('change', this.validateDirectionDate.bind(this));
        this.$directionDate.on('blur', this.validateDirectionDate.bind(this));
        this.$directionDatePsych.on('change', this.validateDirectionDatePsych.bind(this));
        this.$directionDatePsych.on('blur', this.validateDirectionDatePsych.bind(this));
        this.$medicalOrgInput.on('blur', () => this.validateMedicalOrg());
        this.$medicalOrgInput.on('input', () => {
            this.updateCounter('medicalOrg');
            this.validateMedicalOrg();
        });
        this.$medicalAddressInput.on('blur', () => this.validateMedicalAddress());
        this.$medicalAddressInput.on('input', () => {
            this.updateCounter('napravMedicalAddress');
            this.validateMedicalAddress();
        });
        this.$medicalOrgPsychInput.on('blur', () => this.validateMedicalOrgPsych());
        this.$medicalOrgPsychInput.on('input', () => {
            this.updateCounter('medicalOrgPsych');
            this.validateMedicalOrgPsych();
        });
        this.$medicalAddressPsychInput.on('blur', () => this.validateMedicalAddressPsych());
        this.$medicalAddressPsychInput.on('input', () => {
            this.updateCounter('medicalAddressPsych');
            this.validateMedicalAddressPsych();
        });
        this.$ogrnCodeInput.on('blur', () => this.validateOgrnCode());
        this.$ogrnPsychInput.on('blur', () => this.validateOgrnPsych());
        this.$medicalEmailInput.on('input', () => {
            this.updateCounter('medicalEmail');
            this.validateEmail(this.$medicalEmailInput, 'napravMedicalEmailFeedback');
        });
        this.$medicalPhoneInput.on('input', (e) => {
            this.formatPhoneInput(e.target);
            this.updateCounter('medicalPhone');
            this.validatePhone(this.$medicalPhoneInput, 'napravMedicalPhoneFeedback');
        });
        this.$medicalEmailPsychInput.on('input', () => {
            this.updateCounter('medicalEmailPsych');
            this.validateEmail(this.$medicalEmailPsychInput, 'napravMedicalEmailPsychFeedback');
        });
        this.$medicalPhonePsychInput.on('input', (e) => {
            this.formatPhoneInput(e.target);
            this.updateCounter('medicalPhonePsych');
            this.validatePhone(this.$medicalPhonePsychInput, 'napravMedicalPhonePsychFeedback');
        });
        this.$departmentNameInput.on('input', () => {
            this.updateCounter('departmentName');
        });

        this.$positionInput.on('input', () => {
            this.updateCounter('position');
            this.validatePosition();
        });
        this.$positionInput.on('blur', this.validatePosition.bind(this));

        this.$positionPsychInput.on('input', () => {
            this.updateCounter('positionPsych');
            this.validatePositionPsych();
        });

        this.$hazardFactorsInput.on('input', () => {
            this.updateCounter('hazardFactors');
            this.validateHazardFactors();
        });

        this.$employerRepNameInput.on('input', () => {
            this.updateCounter('employerRepName');
            this.validateEmployerRepName();
        });
        this.$employerRepNameInput.on('blur', this.validateEmployerRepName.bind(this));

        this.$employerRepPositionInput.on('input', () => {
            this.updateCounter('employerRepPosition');
            this.validateEmployerRepPosition();
        });
        this.$employerRepPositionInput.on('blur', this.validateEmployerRepPosition.bind(this));

        this.$hazardFactorsInput.on('blur', this.validateHazardFactors.bind(this));
        this.$positionPsychInput.on('blur', this.validatePositionPsych.bind(this));

        // Обработчики модального окна
        this.$modal.on('show.bs.modal', this.handleModalShow.bind(this));
        this.$modal.on('shown.bs.modal', this.handleModalShown.bind(this));
        this.$modal.on('hide.bs.modal', this.handleModalHide.bind(this));
        this.$modal.on('hidden.bs.modal', this.handleModalHidden.bind(this));
        this.$OMSNumber.on('input', this.validateOMS.bind(this));
        this.$OMSNumber.on('input', this.updateOMSCounter.bind(this));
        this.$DMSNumber.on('input', this.updateDMSCounter.bind(this));
        this.$DMSNumber.on('input', this.validateDMS.bind(this));

        // Альтернативный обработчик кнопки закрытия
        this.$closeBtn.on('click', this.handleCloseClick.bind(this));

        // Добавлены обработчики для валидации при потере фокуса
        this.$fullNameInput.on('blur', this.validateFullNameInput.bind(this));
        this.$birthDateInput.on('blur', this.validateBirthDateInput.bind(this));

    },

    /**
     * Обработчик изменения типа медосмотра
     */
    handleExaminationTypeChange: function () {
        const type = this.$examinationType.val();

        this.$regularFields.hide();
        this.$psychiatricFields.hide();

        if (type === 'preliminary' || type === 'periodic') {
            this.$regularFields.show();
        } else if (type === 'psychiatric') {
            this.$psychiatricFields.show();
        }
    },

    handleInsuranceChange: function () {
        this.$OMSFields.toggle(this.$hasOMS.is(':checked'));
        this.$DMSFields.toggle(this.$hasDMS.is(':checked'));

        // Скрываем ошибки при снятии галочек
        if (!this.$hasOMS.is(':checked')) {
            this.hideError(this.$OMSNumber, 'napravOMSFeedback');
        } else {
            this.validateOMS(); // Проверяем, если галочка установлена
        }

        if (!this.$hasDMS.is(':checked')) {
            this.hideError(this.$DMSNumber, 'napravDMSFeedback');
        } else {
            this.validateDMS(); // Проверяем, если галочка установлена
        }

    },
    /**
     * Обработчик открытия модального окна
     */
    handleModalShow: async function () {
        this.showLoadingSpinner();
        this.$submitBtn.prop('disabled', true);
        this.resetForm();
        this.$modal.removeAttr('aria-hidden');

        // Устанавливаем текущую дату для обоих типов направлений
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        this.$directionDate.val(formattedDate);
        this.$directionDatePsych.val(formattedDate);

        try {
            const userFIO = await sendGetRequest('/user');
            this.$employerRepName.val(userFIO.FIO);
            this.updateCounter("employerRepName")
            if (worker_id) {
                await this.loadEmployeeData(worker_id);
            }
        } finally {
            this.hideLoadingSpinner();
        }
    },

    /**
     * Обновление счетчика символов для номера направления
     */
    updateDirectionNumberCounter: function () {
        const length = this.$directionNumber.val().length;
        this.$directionNumberCounter.text(length);
    },

    /**
     * Валидация номера направления
     */
    validateDirectionNumber: function () {
        const directionNumber = this.$directionNumber.val().trim();
        const maxLength = 20;

        if (!directionNumber) {
            this.showError(this.$directionNumber, 'napravNumberFeedback', 'Поле обязательно для заполнения');
            return false;
        } else if (directionNumber.length > maxLength) {
            this.showError(this.$directionNumber, 'napravNumberFeedback', `Номер направления не должен превышать ${maxLength} символов`);
            return false;
        } else {
            this.hideError(this.$directionNumber, 'napravNumberFeedback');
            return true;
        }
    },

    validateEmployerRepName: function () {
        const fullName = this.$employerRepNameInput.val().trim();
        const fullNameResult = this.processFullName(fullName);

        if (!fullName) {
            this.showError(this.$employerRepNameInput, 'employerRepNameFeedback', 'Поле обязательно для заполнения');
        } else if (!fullNameResult.isValid) {
            if (fullNameResult.error === 'latin') {
                this.showError(this.$employerRepNameInput, 'employerRepNameFeedback', 'ФИО должно содержать только кириллицу');
            } else {
                this.showError(this.$employerRepNameInput, 'employerRepNameFeedback', 'Введите корректное ФИО (2-3 слова, каждое с заглавной буквы)');
            }
        } else {
            this.hideError(this.$employerRepNameInput, 'employerRepNameFeedback');
        }
        return fullNameResult.isValid && fullName;
    },

    validateEmployerRepPosition: function () {
        const position = this.$employerRepPositionInput.val().trim();
        const minLength = 3;
        const maxLength = 50;

        if (!position) {
            this.showError(this.$employerRepPositionInput, 'employerRepPositionFeedback', 'Поле обязательно для заполнения');
            return false;
        } else if (position.length < minLength) {
            this.showError(this.$employerRepPositionInput, 'employerRepPositionFeedback', `Должность должна содержать минимум ${minLength} символа`);
            return false;
        } else if (position.length > maxLength) {
            this.showError(this.$employerRepPositionInput, 'employerRepPositionFeedback', `Должность не должна превышать ${maxLength} символов`);
            return false;
        } else {
            this.hideError(this.$employerRepPositionInput, 'employerRepPositionFeedback');
            return true;
        }
    },


    /**
     * Загрузка данных сотрудника
     * @param {string} employeeId - ID сотрудника
     */
    loadEmployeeData: async function (employeeId) {
        try {
            const url = new URL(FILTER);
            url.searchParams.append('id', employeeId);
            const { status, employees } = await sendGetRequest(url);

            if (status == "SUCCESS") {
                // Заполняем обязательные поля
                this.$fullNameInput.val(employees.FIO || '');
                this.updateCounter('napravFullName');

                // Устанавливаем пол
                $(`input[name="napravEmployeeGender"][value="${employees.gender === 'Женский' ? 'F' : 'M'}"]`).prop('checked', true);

                // Устанавливаем дату рождения
                if (employees.birthday) {
                    const [day, month, year] = employees.birthday.split('.');
                    this.$birthDateInput.val(`${year}-${month}-${day}`);
                }

                // Устанавливаем номер ОМС
                if (employees.oms_number) {
                    $('#napravOMSNumber').val(employees.oms_number || '');
                    this.updateOMSCounter();
                }

                // Устанавливаем номер ДМС
                if (employees.dms_number) {
                    $('#napravDMSNumber').val(employees.dms_number || '');
                    this.updateDMSCounter();
                }

                if (employees.department)
                    $('#napravDepartmentName').val(employees.department || '');

                // Устанавливаем должность
                if (employees.position) {
                    this.$positionInput.val(employees.position || '');
                    this.$positionPsychInput.val(employees.position || '');

                    // Обновляем счётчики после установки значений
                    this.updateCounter('position');
                    this.updateCounter('positionPsych');
                }
                this.$submitBtn.prop('disabled', false);
            }
        } catch (error) {
            console.error('Ошибка при загрузке данных сотрудника:', error);
            showToast('Ошибка загрузки данных сотрудника', 'error');
        }
    },

    validateMedicalOrg: function () {
        const value = this.$medicalOrgInput.val().trim();
        if (!value) {
            this.showError(this.$medicalOrgInput, 'napravMedicalOrganizationFeedback', 'Поле обязательно для заполнения');
            return false;
        }
        this.hideError(this.$medicalOrgInput, 'napravMedicalOrganizationFeedback');
        return true;
    },

    validateMedicalAddress: function () {
        const value = this.$medicalAddressInput.val().trim();
        if (!value) {
            this.showError(this.$medicalAddressInput, 'napravMedicalAddressFeedback', 'Поле обязательно для заполнения');
            return false;
        }
        this.hideError(this.$medicalAddressInput, 'napravMedicalAddressFeedback');
        return true;
    },

    validateMedicalOrgPsych: function () {
        const value = this.$medicalOrgPsychInput.val().trim();
        if (!value) {
            this.showError(this.$medicalOrgPsychInput, 'napravMedicalOrgPsychFeedback', 'Поле обязательно для заполнения');
            return false;
        }
        this.hideError(this.$medicalOrgPsychInput, 'napravMedicalOrgPsychFeedback');
        return true;
    },

    validateMedicalAddressPsych: function () {
        const value = this.$medicalAddressPsychInput.val().trim();
        if (!value) {
            this.showError(this.$medicalAddressPsychInput, 'napravMedicalAddressPsychFeedback', 'Поле обязательно для заполнения');
            return false;
        }
        this.hideError(this.$medicalAddressPsychInput, 'napravMedicalAddressPsychFeedback');
        return true;
    },

    validateOgrnCode: function () {
        const value = this.$ogrnCodeInput.val().trim();
        if (!value) {
            this.showError(this.$ogrnCodeInput, 'napravOgrnCodeFeedback', 'Поле обязательно для заполнения');
            return false;
        }
        this.hideError(this.$ogrnCodeInput, 'napravOgrnCodeFeedback');
        return true;
    },

    validateOgrnPsych: function () {
        const value = this.$ogrnPsychInput.val().trim();
        if (!value) {
            this.showError(this.$ogrnPsychInput, 'napravOgrnPsychFeedback', 'Поле обязательно для заполнения');
            return false;
        }
        this.hideError(this.$ogrnPsychInput, 'napravOgrnPsychFeedback');
        return true;
    },

    validateEmail: function ($input, feedbackId) {
        const value = $input.val().trim();

        if (!value) {
            this.hideError($input, feedbackId);
            return true;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            this.showError($input, feedbackId, 'Введите корректный email (например, example@domain.com)');
            return false;
        }

        this.hideError($input, feedbackId);
        return true;
    },

    validatePhone: function ($input, feedbackId) {
        const value = $input.val().trim();

        if (!value) {
            this.hideError($input, feedbackId);
            return true;
        }

        // Разрешаем цифры, пробелы, +, -, (, ), #, ext. для добавочных номеров
        const phoneRegex = /^[\d\s\-\(\)\+]*(?:#[\d]+|доб\.?\s*\d+)?$/i;
        if (!phoneRegex.test(value)) {
            this.showError($input, feedbackId, 'Допустимые символы: цифры, пробелы, +-()#, "доб." для добавочного номера');
            return false;
        }

        // Проверяем, что есть минимум 5 цифр в основном номере
        const mainNumber = value.replace(/(#[\d]+|доб\.?\s*\d+)$/i, '').replace(/\D/g, '');
        if (mainNumber.length < 5) {
            this.showError($input, feedbackId, 'Минимум 5 цифр в основном номере');
            return false;
        }

        // Проверяем длину добавочного номера, если есть
        const extensionMatch = value.match(/(#[\d]+|доб\.?\s*\d+)/i);
        if (extensionMatch) {
            const extensionDigits = extensionMatch[0].replace(/\D/g, '');
            if (extensionDigits.length > 9) {
                this.showError($input, feedbackId, 'Добавочный номер не должен превышать 9 цифр');
                return false;
            }
        }

        this.hideError($input, feedbackId);
        return true;
    },

    formatPhoneInput: function (input) {
        // Получаем текущее значение и позицию курсора
        let value = input.value;
        const cursorPosition = input.selectionStart;

        // Сохраняем только допустимые символы: цифры, пробелы, +, -, (, ), #, доб.
        const cleanedValue = value.replace(/[^\d\s\-\(\)\+#доб\.]/gi, '')
            // Предотвращаем множественные # или ext.
            .replace(/(#+)/g, '#')
            .replace(/(ext\.?\s*)+/gi, 'доб. ');

        // Если значение изменилось, обновляем поле ввода
        if (cleanedValue !== value) {
            input.value = cleanedValue;
            // Корректируем позицию курсора
            const diff = value.length - cleanedValue.length;
            input.setSelectionRange(cursorPosition - diff, cursorPosition - diff);
        }
    },


    validateDirectionDatePsych: function () {
        const directionDate = this.$directionDatePsych.val();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!directionDate) {
            this.showError(this.$directionDatePsych, 'napravDirectionDatePsychFeedback', 'Поле обязательно для заполнения');
            return false;
        }

        const inputDate = new Date(directionDate);
        inputDate.setHours(0, 0, 0, 0);

        if (isNaN(inputDate.getTime())) {
            this.showError(this.$directionDatePsych, 'napravDirectionDatePsychFeedback', 'Некорректный формат даты');
            return false;
        }

        if (inputDate > today) {
            this.showError(this.$directionDatePsych, 'napravDirectionDatePsychFeedback', 'Дата не может быть в будущем');
            return false;
        }

        this.hideError(this.$directionDatePsych, 'napravDirectionDatePsychFeedback');
        return true;
    },

    validateDirectionDate: function () {
        const directionDate = this.$directionDate.val();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!directionDate) {
            this.showError(this.$directionDate, 'napravDirectionDateFeedback', 'Поле обязательно для заполнения');
            return false;
        }

        const inputDate = new Date(directionDate);
        inputDate.setHours(0, 0, 0, 0);

        if (isNaN(inputDate.getTime())) {
            this.showError(this.$directionDate, 'napravDirectionDateFeedback', 'Некорректный формат даты');
            return false;
        }

        if (inputDate > today) {
            this.showError(this.$directionDate, 'napravDirectionDateFeedback', 'Дата не может быть в будущем');
            return false;
        }

        this.hideError(this.$directionDate, 'napravDirectionDateFeedback');
        return true;
    },

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
            return { isValid: false, formattedName: '', error: 'empty' };
        }

        const cleanedName = name.trim().replace(/\s+/g, ' ');
        if (cleanedName === '') {
            return { isValid: false, formattedName: '', error: 'empty' };
        }

        if (/[a-zA-Z]/.test(cleanedName)) {
            return { isValid: false, formattedName: cleanedName, error: 'latin' };
        }

        let parts = cleanedName.split(' ');
        if (settings.requireMiddleName && parts.length !== 3) {
            return { isValid: false, formattedName: cleanedName };
        }

        if (!settings.allowSinglePart && parts.length < 2) {
            return { isValid: false, formattedName: cleanedName };
        }

        if (parts.length > 3) {
            return { isValid: false, formattedName: cleanedName };
        }

        const formatPart = (part) => {
            if (!settings.autoFixCase) return part;
            if (!part) return part;

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

        const regexParts = [];
        regexParts.push('^[А-ЯЁ]');

        let mainPart = '[а-яё]+';
        if (settings.allowHyphen) {
            mainPart = '(?:[а-яё]+(?:-[А-ЯЁ][а-яё]+)*)';
        }
        if (settings.allowApostrophe) {
            mainPart = '(?:[а-яё]*(?:\'[А-ЯЁ][а-яё]+)*)';
        }

        regexParts.push(mainPart);
        regexParts.push('$');

        const regex = new RegExp(regexParts.join(''), 'i');

        for (const part of formattedParts) {
            if (!regex.test(part)) {
                return { isValid: false, formattedName: formattedName };
            }

            if (part.length < settings.minLength || part.length > settings.maxLength) {
                return { isValid: false, formattedName: formattedName };
            }

            if (settings.allowApostrophe && part.includes("'")) {
                const subParts = part.split("'");
                for (let i = 1; i < subParts.length; i++) {
                    if (!subParts[i] || !/^[А-ЯЁ]/.test(subParts[i])) {
                        return { isValid: false, formattedName: formattedName };
                    }
                }
            }

            if (settings.allowHyphen && part.includes("-")) {
                const subParts = part.split("-");
                for (let i = 1; i < subParts.length; i++) {
                    if (!subParts[i] || !/^[А-ЯЁ]/.test(subParts[i])) {
                        return { isValid: false, formattedName: formattedName };
                    }
                }
            }
        }

        return {
            isValid: true,
            formattedName: formattedName
        };
    },

    /**
     * Валидация ФИО
     */
    validateFullNameInput: function () {
        const fullName = this.$fullNameInput.val().trim();
        const fullNameResult = this.processFullName(fullName);

        if (!fullName) {
            this.showError(this.$fullNameInput, 'napravEmployeeFullNameFeedback', 'Поле обязательно для заполнения');
        } else if (!fullNameResult.isValid) {
            if (fullNameResult.error === 'latin') {
                this.showError(this.$fullNameInput, 'napravEmployeeFullNameFeedback', 'ФИО должно содержать только кириллицу');
            } else {
                this.showError(this.$fullNameInput, 'napravEmployeeFullNameFeedback', 'Введите корректное ФИО (2-3 слова, каждое с заглавной буквы)');
            }
        } else {
            this.hideError(this.$fullNameInput, 'napravEmployeeFullNameFeedback');
        }
        return fullNameResult.isValid && fullName;
    },

    /**
     * Валидация даты рождения
     */
    validateBirthDate: function (dateStr) {
        if (!dateStr) return false;

        const inputDate = new Date(dateStr);

        if (isNaN(inputDate.getTime())) return false; // Некорректная дата

        const today = new Date();
        const minAgeDate = new Date(today.getFullYear() - 14, today.getMonth(), today.getDate());
        const maxAgeDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());

        // Проверка: дата не в будущем, не моложе 14 лет и не старше 100 лет
        return inputDate <= today && inputDate <= minAgeDate && inputDate >= maxAgeDate;
    },

    /**
     * Валидация даты рождения
     */
    validateBirthDateInput: function () {
        const birthDateInput = this.$birthDateInput.val();
        if (!birthDateInput) {
            this.showError(this.$birthDateInput, 'napravBirthDateFeedback', 'Поле обязательно для заполнения');
            return false;
        } else if (!this.validateBirthDate(birthDateInput)) {
            this.showError(this.$birthDateInput, 'napravBirthDateFeedback', 'Пожалуйста, укажите корректную дату рождения (возраст от 14 до 100 лет)');
            return false;
        } else {
            this.hideError(this.$birthDateInput, 'napravBirthDateFeedback');
            return true;
        }
    },

    /**
     * Обработчик после открытия модального окна
     */
    handleModalShown: function () {
        this.$examinationType.trigger('focus');
    },

    /**
     * Обработчик перед закрытием модального окна
     */
    handleModalHide: function () {
        this.$OMSFields.hide();
        this.$DMSFields.hide();

        if (document.activeElement) {
            document.activeElement.blur();
        }
    },

    /**
     * Обработчик после закрытия модального окна
     */
    handleModalHidden: function () {
        setTimeout(() => {
            this.$modal.attr('aria-hidden', 'true');
        }, 100);
    },

    /**
     * Обработчик клика по кнопке закрытия
     */
    handleCloseClick: function (e) {
        e.preventDefault();
        this.modal.hide();
    },

    /**
     * Инициализация счетчиков символов
     */
    initCounters: function () {
        this.updateCounter('napravFullName');
        this.updateCounter('medicalOrg');
        this.updateCounter('napravMedicalAddress');
        this.updateCounter('medicalOrgPsych');
        this.updateCounter('medicalAddressPsych');
        this.updateCounter('medicalEmail');
        this.updateCounter('medicalPhone');
        this.updateCounter('medicalEmailPsych');
        this.updateCounter('medicalPhonePsych');
        this.updateCounter('departmentName');
        this.updateCounter('position');
        this.updateCounter('positionPsych');
        this.updateCounter('hazardFactors');
        this.updateCounter('employerRepName');
        this.updateCounter('employerRepPosition');
        this.updateDirectionNumberCounter();
    },

    /**
     * Обновление счетчика символов
     * @param {string} field - имя поля ('napravFullName')
     */
    updateCounter: function (field) {
        // Определяем соответствие между именами полей и их ID в HTML
        const fieldMap = {
            'napravFullName': ['napravEmployeeFullName', 'napravFullNameCounter'],
            'medicalOrg': ['napravMedicalOrganization', 'medicalOrgCounter'],
            'napravMedicalAddress': ['napravMedicalAddress', 'medicalAddressCounter'],
            'medicalOrgPsych': ['napravMedicalOrgPsych', 'medicalOrgPsychCounter'],
            'medicalAddressPsych': ['napravMedicalAddressPsych', 'medicalAddressPsychCounter'],
            'medicalEmail': ['napravMedicalEmail', 'medicalEmailCounter'],
            'medicalPhone': ['napravMedicalPhone', 'medicalPhoneCounter'],
            'medicalEmailPsych': ['napravMedicalEmailPsych', 'medicalEmailPsychCounter'],
            'medicalPhonePsych': ['napravMedicalPhonePsych', 'medicalPhonePsychCounter'],
            'departmentName': ['napravDepartmentName', 'napravDepartmentCounter'],
            'position': ['napravEmployeePosition', 'napravPositionCounter'],
            'positionPsych': ['napravEmployeePositionPsych', 'napravPositionPsychCounter'],
            'hazardFactors': ['napravHazardFactors', 'hazardFactorsCounter'],
            'employerRepName': ['napravEmployerRepresentativeName', 'employerRepNameCounter'],
            'employerRepPosition': ['napravEmployerRepresentativePosition', 'employerRepPositionCounter']
        };

        if (fieldMap[field]) {
            const [inputId, counterId] = fieldMap[field];
            const $input = $(`#${inputId}`);
            const $counter = $(`#${counterId}`);

            if ($input.length && $counter.length) {
                $counter.text($input.val().length);
            }
        }
    },

    updateOMSCounter: function () {
        const length = this.$OMSNumber.val().length;
        this.$OMSCounter.text(length);
        this.validateOMS();
    },

    updateDMSCounter: function () {
        const length = this.$DMSNumber.val().length;
        this.$DMSCounter.text(length);
        this.validateDMS();
    },

    /**
     * Валидация номера ОМС
     */
    validateOMS: function () {
        if (!this.$hasOMS.is(':checked')) {
            this.hideError(this.$OMSNumber, 'napravOMSFeedback');
            return true; // Не проверяем, если галочка не отмечена
        }

        const oms = this.$OMSNumber.val().trim();
        const requiredLength = 16;

        if (!oms) {
            this.showError(this.$OMSNumber, 'napravOMSFeedback', 'Поле обязательно для заполнения');
            return false;
        } else if (oms.length !== requiredLength) {
            this.showError(this.$OMSNumber, 'napravOMSFeedback', `Номер полиса ОМС должен содержать ${requiredLength} цифр`);
            return false;
        } else if (!/^\d+$/.test(oms)) {
            this.showError(this.$OMSNumber, 'napravOMSFeedback', 'Номер полиса ОМС должен содержать только цифры');
            return false;
        } else {
            this.hideError(this.$OMSNumber, 'napravOMSFeedback');
            return true;
        }
    },

    /**
     * Валидация номера ДМС
     */
    validateDMS: function () {
        if (!this.$hasDMS.is(':checked')) {
            this.hideError(this.$DMSNumber, 'napravDMSFeedback');
            return true; // Не проверяем, если галочка не отмечена
        }

        const dms = this.$DMSNumber.val().trim();
        const minLength = 10;
        const maxLength = 16;

        if (!dms) {
            this.showError(this.$DMSNumber, 'napravDMSFeedback', 'Поле обязательно для заполнения');
            return false;
        } else if (dms.length < minLength) {
            this.showError(this.$DMSNumber, 'napravDMSFeedback', `Номер полиса ДМС должен содержать минимум ${minLength} символов`);
            return false;
        } else if (dms.length > maxLength) {
            this.showError(this.$DMSNumber, 'napravDMSFeedback', `Номер полиса ДМС не должен превышать ${maxLength} символов`);
            return false;
        } else {
            this.hideError(this.$DMSNumber, 'napravDMSFeedback');
            return true;
        }
    },

    validatePosition: function () {
        const position = this.$positionInput.val().trim();
        const minLength = 3;
        const maxLength = 100;

        if (!position) {
            this.showError(this.$positionInput, 'napravPositionFeedback', 'Поле обязательно для заполнения');
            return false;
        } else if (position.length < minLength) {
            this.showError(this.$positionInput, 'napravPositionFeedback', `Должность должна содержать минимум ${minLength} символа`);
            return false;
        } else if (position.length > maxLength) {
            this.showError(this.$positionInput, 'napravPositionFeedback', `Должность не должна превышать ${maxLength} символов`);
            return false;
        } else if (!/^[А-ЯЁа-яё\s\-]+$/i.test(position)) {
            this.showError(this.$positionInput, 'napravPositionFeedback', 'Должность должна содержать только кириллические символы, пробелы и дефисы');
            return false;
        } else {
            this.hideError(this.$positionInput, 'napravPositionFeedback');
            return true;
        }
    },

    validatePositionPsych: function () {
        const position = this.$positionPsychInput.val().trim();
        const minLength = 3;
        const maxLength = 100;

        if (!position) {
            this.showError(this.$positionPsychInput, 'napravPositionPsychFeedback', 'Поле обязательно для заполнения');
            return false;
        } else if (position.length < minLength) {
            this.showError(this.$positionPsychInput, 'napravPositionPsychFeedback', `Должность должна содержать минимум ${minLength} символа`);
            return false;
        } else if (position.length > maxLength) {
            this.showError(this.$positionPsychInput, 'napravPositionPsychFeedback', `Должность не должна превышать ${maxLength} символов`);
            return false;
        } else if (!/^[А-ЯЁа-яё\s\-]+$/i.test(position)) {
            this.showError(this.$positionPsychInput, 'napravPositionPsychFeedback', 'Должность должна содержать только кириллические символы, пробелы и дефисы');
            return false;
        } else {
            this.hideError(this.$positionPsychInput, 'napravPositionPsychFeedback');
            return true;
        }
    },

    validateHazardFactors: function () {
        const value = this.$hazardFactorsInput.val().trim();
        const maxLength = 1000;

        if (value.length > maxLength) {
            this.showError(this.$hazardFactorsInput, 'hazardFactorsFeedback',
                `Превышена максимальная длина (${maxLength} символов)`);
            return false;
        }

        this.hideError(this.$hazardFactorsInput, 'hazardFactorsFeedback');
        return true;
    },

    /**
     * Показать ошибку
     */
    showError: function ($input, feedbackId, message) {
        $input.addClass('is-invalid');
        $(`#${feedbackId}`).text(message).show();
    },

    /**
     * Скрыть ошибку
     */
    hideError: function ($input, feedbackId) {
        $input.removeClass('is-invalid');
        $(`#${feedbackId}`).text('').hide();
    },

    /**
     * Валидация формы
     * @returns {boolean}
     */
    validateForm: function () {
        let isValid = true;
        const type = this.$examinationType.val();

        // Валидация типа медосмотра
        if (!type) {
            this.$examinationType.addClass('is-invalid');
            isValid = false;
        } else {
            this.$examinationType.removeClass('is-invalid');
        }

        // Валидация ФИО
        if (!this.validateFullNameInput()) {
            isValid = false;
        }

        // Валидация даты рождения
        if (!this.validateBirthDateInput()) {
            isValid = false;
        }


        // Валидация полей в зависимости от типа медосмотра
        if (type === 'preliminary' || type === 'periodic') {
            if (!this.$employerRepName.val()) {
                this.$employerRepName.addClass('is-invalid');
                isValid = false;
            } else {
                this.$employerRepName.removeClass('is-invalid');
            }

            // Валидация страховых полисов
            if (!this.$hasOMS.is(':checked') && !this.$hasDMS.is(':checked')) {
                $('#napravInsuranceFeedback').show();
                isValid = false;
            } else {
                $('#napravInsuranceFeedback').hide();

                if (this.$hasOMS.is(':checked') && !this.validateOMS()) {
                    isValid = false;
                }

                if (this.$hasDMS.is(':checked') && !this.validateDMS()) {
                    isValid = false;
                }
            }

            if (!this.$employerRepPosition.val()) {
                this.$employerRepPosition.addClass('is-invalid');
                isValid = false;
            } else {
                this.$employerRepPosition.removeClass('is-invalid');
            }

            // Валидация номера и даты направления для обычных осмотров
            if (!this.validateDirectionNumber()) {
                isValid = false;
            }

            if (!this.validateDirectionDate()) {
                isValid = false;
            }

            if (!this.validateMedicalOrg()) {
                isValid = false;
            }
            if (!this.validateMedicalAddress()) {
                isValid = false;
            }
            if (!this.validateOgrnCode()) {
                isValid = false;
            }
            if (!this.validateHazardFactors()) {
                isValid = false;
            }

            if (!this.validateEmployerRepName()) {
                isValid = false;
            }

            if (this.$hasOMS.is(':checked') && !this.validateOMS()) {
                isValid = false;
            }

            if (this.$hasDMS.is(':checked') && !this.validateDMS()) {
                isValid = false;
            }

            if (!this.validateEmployerRepPosition()) {
                isValid = false;
            }

            const departmentName = this.$departmentNameInput.val();
            if (departmentName && departmentName.length > 1000) {
                this.showError(this.$departmentNameInput, 'napravDepartmentFeedback', 'Наименование подразделения не должно превышать 1000 символов');
                isValid = false;
            } else {
                this.hideError(this.$departmentNameInput, 'napravDepartmentFeedback');
            }


            this.validateEmail(this.$medicalEmailInput, 'napravMedicalEmailFeedback');
            this.validatePhone(this.$medicalPhoneInput, 'napravMedicalPhoneFeedback');

            const regularRequired = [
                '#napravMedicalOrganization',
                '#napravMedicalAddress',
                '#napravOgrnCode',
                '#napravEmployeePosition',
                '#napravEmployerRepresentativePosition',
                '#napravEmployerRepresentativeName'
            ];

            regularRequired.forEach(field => {
                if (!$(field).val()) {
                    $(field).addClass('is-invalid');
                    isValid = false;
                } else {
                    $(field).removeClass('is-invalid');
                }
            });
        } else if (type === 'psychiatric') {
            // Валидация даты направления для психиатрического освидетельствования
            if (!this.validateDirectionDatePsych()) {
                isValid = false;
            }

            this.validateEmail(this.$medicalEmailPsychInput, 'napravMedicalEmailPsychFeedback');
            this.validatePhone(this.$medicalPhonePsychInput, 'napravMedicalPhonePsychFeedback');

            const psychiatricRequired = [
                '#napravEmployerName',
                '#napravMedicalOrgPsych',
                '#napravMedicalAddressPsych',
                '#napravOgrnPsych',
                '#napravEmployeePositionPsych',
                '#napravCreationDatePsych'
            ];

            psychiatricRequired.forEach(field => {
                if (!$(field).val()) {
                    $(field).addClass('is-invalid');
                    isValid = false;
                } else {
                    $(field).removeClass('is-invalid');
                }
            });
        }

        return isValid;
    },

    /**
     * Сбор данных формы
     * @returns {object}
     */
    getFormData: function () {
        const type = this.$examinationType.val();
        const fullName = EmployeeForm.processFullName(this.$fullNameInput.val()).formattedName;

        const commonData = {
            'examinationType': type,
            'FIO': fullName,
            'birthDate': this.$birthDateInput.val(),
            'gender': $('input[name="napravEmployeeGender"]:checked').val(),
            'hasOMS': this.$hasOMS.is(':checked'),
            'hasDMS': this.$hasDMS.is(':checked'),
            'OMSNumber': this.$OMSNumber.val(),
            'DMSNumber': this.$DMSNumber.val(),
            'employeeId': worker_id
        };

        if (type === 'preliminary' || type === 'periodic') {
            return {
                ...commonData,
                'employerRepresentativeName': getInitials(this.$employerRepName.val()),
                'employerRepresentativePosition': this.$employerRepPosition.val(),
                'directionNumber': this.$directionNumber.val(),
                'directionDate': this.$directionDate.val(),
                'medicalOrganization': $('#napravMedicalOrganization').val(),
                'medicalAddress': $('#napravMedicalAddress').val(),
                'ogrnCode': $('#napravOgrnCode').val(),
                'medicalEmail': $('#napravMedicalEmail').val(),
                'medicalPhone': $('#napravMedicalPhone').val(),
                'departmentName': this.$departmentNameInput.val(),
                'position': $('#napravEmployeePosition').val(),
                'hazardFactors': $('#napravHazardFactors').val() || '-',
            };
        } else if (type === 'psychiatric') {
            return {
                ...commonData,
                'directionDatePsych': this.$directionDatePsych.val(),
                'employerName': $('#napravEmployerName').val(),
                'employerEmail': $('#napravEmployerEmail').val(),
                'employerPhone': $('#napravEmployerPhone').val(),
                'okvedCode': $('#napravOkvedCode').val(),
                'medicalOrgPsych': $('#napravMedicalOrgPsych').val(),
                'medicalAddressPsych': $('#napravMedicalAddressPsych').val(),
                'ogrnPsych': $('#napravOgrnPsych').val(),
                'medicalEmailPsych': $('#napravMedicalEmailPsych').val(),
                'medicalPhonePsych': $('#napravMedicalPhonePsych').val(),
                'positionPsych': $('#napravEmployeePositionPsych').val(),
                'activityTypes': $('#napravActivityTypes').val(),
                'previousConclusions': this.$previousConclusions.val(),
                'directionIssueDate': $('#napravDirectionDate').val()
            };
        }

        return commonData;
    },

    showLoadingSpinner: function () {
        this.$loadingSpinner.removeClass('d-none');
        this.$form.addClass('d-none');
    },

    hideLoadingSpinner: function () {
        this.$loadingSpinner.addClass('d-none');
        this.$form.removeClass('d-none');
    },

    showSubmitSpinner: function () {
        this.$submitBtn.prop('disabled', true);
        this.$submitSpinner.removeClass('d-none');
    },

    hideSubmitSpinner: function () {
        this.$submitSpinner.addClass('d-none');
    },

    /**
     * Отправка формы
     */
    submitForm: async function () {
        if (!this.validateForm()) {
            // Прокручиваем к первой ошибке
            const firstError = this.$form.find('.is-invalid').first();
            if (firstError.length) {
                $('html, body').animate({
                    scrollTop: firstError.offset().top - 100
                }, 500);
            }
            return;
        }

        this.showSubmitSpinner();
        const formData = this.getFormData();
        const url = new URL(NAPRAV);

        try {
            const data = await sendPostRequest(url, formData);

            if (data.status === "SUCCESS") {
                showNotification('Направление успешно сформировано', 'success');
                this.modal.hide();
            } else {
                console.error('Ошибка при отправке формы:', data.message);
                showNotification(data.message || 'Ошибка при формировании направления', 'error');
            }
        } catch (error) {
            console.error('Ошибка при отправке формы:', error);
            showNotification('Произошла ошибка при отправке формы', 'error');
        } finally {
            this.hideSubmitSpinner();
            this.$submitBtn.prop('disabled', false);
        }
    },

    /**
     * Сброс формы
     */
    resetForm: function () {
        this.$form.trigger('reset');
        this.$form.find('.is-invalid').removeClass('is-invalid');
        this.$regularFields.hide();
        this.$psychiatricFields.hide();
        this.initCounters();
        this.hideSubmitSpinner();
        this.$directionNumberCounter.text('0');

        // Сброс ошибок ОМС/ДМС
        this.hideError(this.$OMSNumber, 'napravOMSFeedback');
        this.hideError(this.$DMSNumber, 'napravDMSFeedback');
        $('#napravInsuranceFeedback').hide();

        this.$OMSCounter.text('0');
        this.$DMSCounter.text('0');

        // Сброс счетчиков и ошибок для email и телефона
        this.$medicalEmailCounter.text('0');
        this.$medicalPhoneCounter.text('0');
        this.$medicalEmailPsychCounter.text('0');
        this.$medicalPhonePsychCounter.text('0');
        this.hideError(this.$medicalEmailInput, 'napravMedicalEmailFeedback');
        this.hideError(this.$medicalPhoneInput, 'napravMedicalPhoneFeedback');
        this.hideError(this.$medicalEmailPsychInput, 'napravMedicalEmailPsychFeedback');
        this.hideError(this.$medicalPhonePsychInput, 'napravMedicalPhonePsychFeedback');
        this.hideError(this.$departmentNameInput, 'napravDepartmentFeedback');
        this.hideError(this.$positionInput, 'napravPositionFeedback');
        this.hideError(this.$positionPsychInput, 'napravPositionPsychFeedback');
        this.hideError(this.$hazardFactorsInput, 'hazardFactorsFeedback');
        this.hideError(this.$employerRepNameInput, 'employerRepNameFeedback');
        this.hideError(this.$employerRepPositionInput, 'employerRepPositionFeedback');
        this.$hasOMS.prop('checked', false);
        this.$hasDMS.prop('checked', false);
        this.$OMSNumber.val('');
        this.$DMSNumber.val('');
        this.hideError(this.$OMSNumber, 'napravOMSFeedback');
        this.hideError(this.$DMSNumber, 'napravDMSFeedback');
        this.$OMSCounter.text('0');
        this.$DMSCounter.text('0');
        $('#napravInsuranceFeedback').hide();
        this.$departmentCounter.text('0');

        // Устанавливаем текущую дату при сбросе формы
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        this.$directionDate.val(formattedDate);
        this.$directionDatePsych.val(formattedDate);
        this.$employerRepName.val('');
        this.$employerRepPosition.val('');
    }
};

// Инициализация при загрузке документа
$(document).ready(function () {
    if ($('#mednapravModal').length) {
        MedicalExaminationForm.init();
    }
});