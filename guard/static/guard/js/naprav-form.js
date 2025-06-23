/**
 * Модуль для работы с формой направления на медицинский осмотр
 */
const MedicalExaminationForm = {
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
        this.$medicalEmailInput = $('#napravMedicalEmail');
        this.$medicalPhoneInput = $('#napravMedicalPhone');
        this.$medicalEmailPsychInput = $('#napravMedicalEmailPsych');
        this.$medicalPhonePsychInput = $('#napravMedicalPhonePsych');
        this.$medicalEmailCounter = $('#medicalEmailCounter');
        this.$medicalPhoneCounter = $('#medicalPhoneCounter');
        this.$medicalEmailPsychCounter = $('#medicalEmailPsychCounter');
        this.$medicalPhonePsychCounter = $('#medicalPhonePsychCounter');
        this.$departmentNameInput = $('#napravDepartmentName');
        this.$departmentCounter = $('#napravDepartmentCounter');
        this.$positionInput = $('#napravEmployeePosition');
        this.$positionPsychInput = $('#napravEmployeePositionPsych');
        this.$hazardFactorsInput = $('#napravHazardFactors');
        this.$employerNameInput = $('#napravEmployerName');
        this.$employerNameCounter = $('#employerNameCounter');
        this.$employerPhoneInput = $('#napravEmployerPhone');
        this.$employerPhoneCounter = $('#employerPhoneCounter');
        this.$medOrgEmailPsychInput = $('#napravMedOrgEmailPsych');
        this.$medOrgPhonePsychInput = $('#napravMedOrgPhonePsych');
        this.$medOrgEmailCounter = $('#medOrgEmailPsychCounter');
        this.$medOrgPhoneCounter = $('#medOrgPhonePsychCounter');
        this.$activityTypesInput = $('#napravActivityTypes');
        this.$activityTypesCounter = $('#activityTypesCounter');
        this.$previousConclusionsInput = $('#napravPreviousConclusions');
        this.$previousConclusionsCounter = $('#previousConclusionsCounter');
        this.$ogrnPsychInput = $('#napravOgrnPsych');
        this.$ogrnPsychCounter = $('#ogrnPsychCounter');
        this.$ogrnCodeInput = $('#napravOgrnCode');
        this.$ogrnCodeCounter = $('#ogrnCodeCounter');
        this.$okvedCodeInput = $('#napravOkvedCode');
        this.$okvedCodeCounter = $('#okvedCodeCounter');
    },

    // === Привязка событий ===
    /**
     * Привязывает обработчики событий к элементам формы
     */
    bindEvents: function () {
        this.$examinationType.on('change', this.handleExaminationTypeChange.bind(this));
        this.$fullNameInput.on('input', () => {
            this.updateCounter('napravFullName');
            this.validateFullNameInput();
        }).on('blur', this.validateFullNameInput.bind(this));
        this.$birthDateInput.on('input', this.validateBirthDateInput.bind(this)).on('blur', this.validateBirthDateInput.bind(this));
        this.$submitBtn.on('click', this.submitForm.bind(this));
        this.$hasOMS.on('change', this.handleInsuranceChange.bind(this));
        this.$hasDMS.on('change', this.handleInsuranceChange.bind(this));
        this.$directionNumber.on('input', () => {
            this.updateCounter('directionNumber');
            this.validateDirectionNumber();
        }).on('blur', this.validateDirectionNumber.bind(this));
        this.$directionDate.on('change blur', this.validateDirectionDate.bind(this));
        this.$directionDatePsych.on('change blur', this.validateDirectionDatePsych.bind(this));
        this.$medicalOrgInput.on('input', () => {
            this.updateCounter('medicalOrg');
            this.validateMedicalOrg();
        }).on('blur', this.validateMedicalOrg.bind(this));
        this.$medicalAddressInput.on('input', () => {
            this.updateCounter('napravMedicalAddress');
            this.validateMedicalAddress();
        }).on('blur', this.validateMedicalAddress.bind(this));
        this.$medicalOrgPsychInput.on('input', () => {
            this.updateCounter('medicalOrgPsych');
            this.validateMedicalOrgPsych();
        }).on('blur', this.validateMedicalOrgPsych.bind(this));
        this.$medicalAddressPsychInput.on('input', () => {
            this.updateCounter('medicalAddressPsych');
            this.validateMedicalAddressPsych();
        }).on('blur', this.validateMedicalAddressPsych.bind(this));
        this.$ogrnCodeInput.on('input', (e) => {
            this.formatOgrnInput(e.target);
            this.updateCounter('ogrnCode');
            this.validateOgrnCode();
        }).on('blur', this.validateOgrnCode.bind(this));
        this.$ogrnPsychInput.on('input', (e) => {
            this.formatOgrnInput(e.target);
            this.updateCounter('ogrnPsych');
            this.validateOgrnCodePsych();
        }).on('blur', this.validateOgrnCodePsych.bind(this));
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
        this.$employerPhoneInput.on('input', (e) => {
            this.formatPhoneInput(e.target);
            this.updateCounter('employerPhone');
            this.validatePhone(this.$employerPhoneInput, 'napravEmployerPhoneFeedback');
        });
        this.$departmentNameInput.on('input', () => {
            this.updateCounter('departmentName');
        });
        this.$positionInput.on('input', () => {
            this.updateCounter('position');
            this.validatePosition();
        }).on('blur', this.validatePosition.bind(this));
        this.$positionPsychInput.on('input', () => {
            this.updateCounter('positionPsych');
            this.validatePositionPsych();
        }).on('blur', this.validatePositionPsych.bind(this));
        this.$hazardFactorsInput.on('input', () => {
            this.updateCounter('hazardFactors');
            this.validateHazardFactors();
        }).on('blur', this.validateHazardFactors.bind(this));
        this.$employerRepName.on('input', () => {
            this.updateCounter('employerRepName');
            this.validateEmployerRepName();
        }).on('blur', this.validateEmployerRepName.bind(this));
        this.$employerRepPosition.on('input', () => {
            this.updateCounter('employerRepPosition');
            this.validateEmployerRepPosition();
        }).on('blur', this.validateEmployerRepPosition.bind(this));
        this.$employerNameInput.on('input', () => {
            this.updateCounter('employerName');
            this.validateEmployerName();
        }).on('blur', this.validateEmployerName.bind(this));
        this.$medOrgEmailPsychInput.on('input', () => {
            this.updateCounter('medOrgEmailPsych');
            this.validateEmail(this.$medOrgEmailPsychInput, 'napravMedOrgEmailPsychFeedback');
        });
        this.$medOrgPhonePsychInput.on('input', (e) => {
            this.formatPhoneInput(e.target);
            this.updateCounter('medOrgPhonePsych');
            this.validatePhone(this.$medOrgPhonePsychInput, 'napravMedOrgPhonePsychFeedback');
        });
        this.$activityTypesInput.on('input', () => {
            this.updateCounter('activityTypes');
            this.validateActivityTypes();
        });
        this.$previousConclusionsInput.on('input', () => {
            this.updateCounter('previousConclusions');
            this.validatePreviousConclusions();
        });
        this.$okvedCodeInput.on('input', () => {
            this.updateCounter('okvedCode');
            this.validateOkvedCode();
        }).on('blur', this.validateOkvedCode.bind(this));
        this.$OMSNumber.on('input', (e) => {
            this.formatOMSInput(e.target);
            this.updateCounter('OMS');
            this.validateOMS();
        });
        this.$DMSNumber.on('input', () => {
            this.updateCounter('DMS');
            this.validateDMS();
        });
        this.$modal.on('show.bs.modal', this.handleModalShow.bind(this));
        this.$modal.on('shown.bs.modal', this.handleModalShown.bind(this));
        this.$modal.on('hide.bs.modal', this.handleModalHide.bind(this));
        this.$modal.on('hidden.bs.modal', this.handleModalHidden.bind(this));
        this.$closeBtn.on('click', this.handleCloseClick.bind(this));
    },

    // === Обработчики событий ===
    /**
     * Обрабатывает изменение типа медицинского осмотра
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

    /**
     * Обрабатывает изменение статуса страховых полисов
     */
    handleInsuranceChange: function () {
        this.$OMSFields.toggle(this.$hasOMS.is(':checked'));
        this.$DMSFields.toggle(this.$hasDMS.is(':checked'));
        if (!this.$hasOMS.is(':checked')) {
            this.hideError(this.$OMSNumber, 'napravOMSFeedback');
        }
        if (!this.$hasDMS.is(':checked')) {
            this.hideError(this.$DMSNumber, 'napravDMSFeedback');
        }
    },

    /**
     * Обрабатывает открытие модального окна
     */
    handleModalShow: async function () {
        this.showLoadingSpinner();
        this.$submitBtn.prop('disabled', true);
        this.resetForm();
        this.$modal.removeAttr('aria-hidden');
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        this.$directionDate.val(formattedDate);
        this.$directionDatePsych.val(formattedDate);
        try {
            const userFIO = await sendGetRequest('/user');
            this.$employerRepName.val(userFIO.FIO);
            this.updateCounter('employerRepName');
            if (worker_id) {
                await this.loadEmployeeData(worker_id);
            }
        } finally {
            this.hideLoadingSpinner();
        }
    },

    /**
     * Устанавливает фокус на поле типа осмотра после открытия модального окна
     */
    handleModalShown: function () {
        this.$examinationType.trigger('focus');
    },

    /**
     * Обрабатывает закрытие модального окна
     */
    handleModalHide: function () {
        this.$OMSFields.hide();
        this.$DMSFields.hide();
        if (document.activeElement) {
            document.activeElement.blur();
        }
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

    // === Загрузка данных ===
    /**
     * Загружает данные сотрудника по ID
     * @param {string} employeeId - ID сотрудника
     */
    loadEmployeeData: async function (employeeId) {
        try {
            const url = new URL(FILTER);
            url.searchParams.append('id', employeeId);
            const { status, employees } = await sendGetRequest(url);
            if (status === 'SUCCESS') {
                this.$fullNameInput.val(employees.FIO || '');
                this.updateCounter('napravFullName');
                $(`input[name="napravEmployeeGender"][value="${employees.gender === 'Женский' ? 'F' : 'M'}"]`).prop('checked', true);
                if (employees.birthday) {
                    const [day, month, year] = employees.birthday.split('.');
                    this.$birthDateInput.val(`${year}-${month}-${day}`);
                }
                if (employees.oms_number) {
                    this.$OMSNumber.val(employees.oms_number);
                    this.updateCounter('OMS');
                }
                if (employees.dms_number) {
                    this.$DMSNumber.val(employees.dms_number);
                    this.updateCounter('DMS');
                }
                if (employees.department) {
                    this.$departmentNameInput.val(employees.department);
                    this.updateCounter('departmentName');
                }
                if (employees.position) {
                    this.$positionInput.val(employees.position);
                    this.$positionPsychInput.val(employees.position);
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

    // === Валидация формы ===
    /**
     * Проверяет валидность всех полей формы
     * @returns {boolean} Результат валидации
     */
    validateForm: function () {
        let isValid = true;
        const type = this.$examinationType.val();
        if (!type) {
            this.$examinationType.addClass('is-invalid');
            isValid = false;
        } else {
            this.$examinationType.removeClass('is-invalid');
        }
        if (!this.validateFullNameInput()) isValid = false;
        if (!this.validateBirthDateInput()) isValid = false;
        if (type === 'preliminary' || type === 'periodic') {
            if (!this.validateEmployerRepName()) isValid = false;
            if (!this.$hasOMS.is(':checked') && !this.$hasDMS.is(':checked')) {
                $('#napravInsuranceFeedback').show();
                isValid = false;
            } else {
                $('#napravInsuranceFeedback').hide();
                if (this.$hasOMS.is(':checked') && !this.validateOMS()) isValid = false;
                if (this.$hasDMS.is(':checked') && !this.validateDMS()) isValid = false;
            }
            if (!this.validateEmployerRepPosition()) isValid = false;
            if (!this.validateDirectionNumber()) isValid = false;
            if (!this.validateDirectionDate()) isValid = false;
            if (!this.validateMedicalOrg()) isValid = false;
            if (!this.validateMedicalAddress()) isValid = false;
            if (!this.validateOgrnCode()) isValid = false;
            if (!this.validateHazardFactors()) isValid = false;
            if (!this.validatePosition()) isValid = false;
            if (!this.validateEmail(this.$medicalEmailInput, 'napravMedicalEmailFeedback')) isValid = false;
            if (!this.validatePhone(this.$medicalPhoneInput, 'napravMedicalPhoneFeedback')) isValid = false;
            const departmentName = this.$departmentNameInput.val();
            if (departmentName && departmentName.length > 1000) {
                this.showError(this.$departmentNameInput, 'napravDepartmentFeedback', 'Наименование подразделения не должно превышать 1000 символов');
                isValid = false;
            } else {
                this.hideError(this.$departmentNameInput, 'napravDepartmentFeedback');
            }
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
            if (!this.validateDirectionDatePsych()) isValid = false;
            if (!this.validateEmail(this.$medicalEmailPsychInput, 'napravMedicalEmailPsychFeedback')) isValid = false;
            if (!this.validatePhone(this.$medicalPhonePsychInput, 'napravMedicalPhonePsychFeedback')) isValid = false;
            if (!this.validateEmployerName()) isValid = false;
            if (this.$medOrgEmailPsychInput.val() && !this.validateEmail(this.$medOrgEmailPsychInput, 'napravMedOrgEmailPsychFeedback')) isValid = false;
            if (this.$medOrgPhonePsychInput.val() && !this.validatePhone(this.$medOrgPhonePsychInput, 'napravMedOrgPhonePsychFeedback')) isValid = false;
            if (this.$activityTypesInput.val().trim() && !this.validateActivityTypes()) isValid = false;
            if (this.$previousConclusionsInput.val().trim() && !this.validatePreviousConclusions()) isValid = false;
            if (!this.validateOgrnCodePsych()) isValid = false;
            if (this.$okvedCodeInput.val().trim() && !this.validateOkvedCode()) isValid = false;
            if (!this.validatePositionPsych()) isValid = false;
            if (!this.validateMedicalOrgPsych()) isValid = false;
            if (!this.validateMedicalAddressPsych()) isValid = false;
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
     * Валидирует ФИО сотрудника
     * @returns {boolean} Результат валидации
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
     * Валидирует дату рождения
     * @returns {boolean} Результат валидации
     */
    validateBirthDateInput: function () {
        const birthDateInput = this.$birthDateInput.val();
        if (!birthDateInput) {
            this.showError(this.$birthDateInput, 'napravBirthDateFeedback', 'Поле обязательно для заполнения');
            return false;
        } else if (!this.validateBirthDate(birthDateInput)) {
            this.showError(this.$birthDateInput, 'napravBirthDateFeedback', 'Укажите корректную дату рождения (возраст от 14 до 100 лет)');
            return false;
        } else {
            this.hideError(this.$birthDateInput, 'napravBirthDateFeedback');
            return true;
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

    /**
     * Валидирует номер направления
     * @returns {boolean} Результат валидации
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

    /**
     * Валидирует дату направления для обычных осмотров
     * @returns {boolean} Результат валидации
     */
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

    /**
     * Валидирует дату направления для психиатрического освидетельствования
     * @returns {boolean} Результат валидации
     */
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

    /**
     * Валидирует медицинскую организацию для обычных осмотров
     * @returns {boolean} Результат валидации
     */
    validateMedicalOrg: function () {
        const maxLength = 500;
        const minLength = 3;
        const value = this.$medicalOrgInput.val().trim();
        if (!value) {
            this.showError(this.$medicalOrgInput, 'napravMedicalOrganizationFeedback', 'Поле обязательно для заполнения');
            return false;
        }
        if (value.length < minLength) {
            this.showError(this.$medicalOrgInput, 'napravMedicalOrganizationFeedback', `Название должно содержать минимум ${minLength} символа`);
            return false;
        }
        if (value.length > maxLength) {
            this.showError(this.$medicalOrgInput, 'napravMedicalOrganizationFeedback', `Название не должно превышать ${maxLength} символов`);
            return false;
        }
        this.hideError(this.$medicalOrgInput, 'napravMedicalOrganizationFeedback');
        return true;
    },

    /**
     * Валидирует адрес медицинской организации для обычных осмотров
     * @returns {boolean} Результат валидации
     */
    validateMedicalAddress: function () {
        const value = this.$medicalAddressInput.val().trim();
        if (!value) {
            this.showError(this.$medicalAddressInput, 'napravMedicalAddressFeedback', 'Поле обязательно для заполнения');
            return false;
        }
        this.hideError(this.$medicalAddressInput, 'napravMedicalAddressFeedback');
        return true;
    },

    /**
     * Валидирует медицинскую организацию для психиатрического освидетельствования
     * @returns {boolean} Результат валидации
     */
    validateMedicalOrgPsych: function () {
        const maxLength = 500;
        const minLength = 3;
        const value = this.$medicalOrgPsychInput.val().trim();
        if (!value) {
            this.showError(this.$medicalOrgPsychInput, 'napravMedicalOrgPsychFeedback', 'Поле обязательно для заполнения');
            return false;
        }
        if (value.length < minLength) {
            this.showError(this.$medicalOrgPsychInput, 'napravMedicalOrgPsychFeedback', `Название должно содержать минимум ${minLength} символа`);
            return false;
        }
        if (value.length > maxLength) {
            this.showError(this.$medicalOrgPsychInput, 'napravMedicalOrgPsychFeedback', `Название не должно превышать ${maxLength} символов`);
            return false;
        }
        this.hideError(this.$medicalOrgPsychInput, 'napravMedicalOrgPsychFeedback');
        return true;
    },

    /**
     * Валидирует адрес медицинской организации для психиатрического освидетельствования
     * @returns {boolean} Результат валидации
     */
    validateMedicalAddressPsych: function () {
        const value = this.$medicalAddressPsychInput.val().trim();
        if (!value) {
            this.showError(this.$medicalAddressPsychInput, 'napravMedicalAddressPsychFeedback', 'Поле обязательно для заполнения');
            return false;
        }
        this.hideError(this.$medicalAddressPsychInput, 'napravMedicalAddressPsychFeedback');
        return true;
    },

    /**
     * Валидирует ОГРН для обычных осмотров
     * @returns {boolean} Результат валидации
     */
    validateOgrnCode: function () {
        const value = this.$ogrnCodeInput.val().trim();
        if (!value) {
            this.showError(this.$ogrnCodeInput, 'napravOgrnCodeFeedback', 'Поле обязательно для заполнения');
            return false;
        } else if (value.length !== 13) {
            this.showError(this.$ogrnCodeInput, 'napravOgrnCodeFeedback', 'ОГРН должен содержать ровно 13 цифр');
            return false;
        } else if (!/^\d{13}$/.test(value)) {
            this.showError(this.$ogrnCodeInput, 'napravOgrnCodeFeedback', 'ОГРН должен содержать только цифры');
            return false;
        }
        this.hideError(this.$ogrnCodeInput, 'napravOgrnCodeFeedback');
        return true;
    },

    /**
     * Валидирует ОГРН для психиатрического освидетельствования
     * @returns {boolean} Результат валидации
     */
    validateOgrnCodePsych: function () {
        const value = this.$ogrnPsychInput.val().trim();
        if (!value) {
            this.showError(this.$ogrnPsychInput, 'napravOgrnPsychFeedback', 'Поле обязательно для заполнения');
            return false;
        } else if (value.length !== 13) {
            this.showError(this.$ogrnPsychInput, 'napravOgrnPsychFeedback', 'ОГРН должен содержать ровно 13 цифр');
            return false;
        } else if (!/^\d{13}$/.test(value)) {
            this.showError(this.$ogrnPsychInput, 'napravOgrnPsychFeedback', 'ОГРН должен содержать только цифры');
            return false;
        }
        this.hideError(this.$ogrnPsychInput, 'napravOgrnPsychFeedback');
        return true;
    },

    /**
     * Валидирует код ОКВЭД
     * @returns {boolean} Результат валидации
     */
    validateOkvedCode: function () {
        const value = this.$okvedCodeInput.val().trim();
        const maxLength = 10;
        const minLength = 2;
        if (!value) {
            this.hideError(this.$okvedCodeInput, 'napravOkvedCodeFeedback');
            return true;
        }
        if (!/^[\d.]+$/.test(value)) {
            this.showError(this.$okvedCodeInput, 'napravOkvedCodeFeedback', 'Код ОКВЭД должен содержать только цифры и точки');
            return false;
        }
        if (value.length > maxLength) {
            this.showError(this.$okvedCodeInput, 'napravOkvedCodeFeedback', `Код ОКВЭД не должен превышать ${maxLength} символов`);
            return false;
        }
        if (value.length < minLength) {
            this.showError(this.$okvedCodeInput, 'napravOkvedCodeFeedback', `Код ОКВЭД должен содержать минимум ${minLength} символа`);
            return false;
        }
        this.hideError(this.$okvedCodeInput, 'napravOkvedCodeFeedback');
        return true;
    },

    /**
     * Валидирует предыдущие заключения
     * @returns {boolean} Результат валидации
     */
    validatePreviousConclusions: function () {
        const value = this.$previousConclusionsInput.val().trim();
        const maxLength = 2000;
        if (value.length > maxLength) {
            this.showError(this.$previousConclusionsInput, 'napravPreviousConclusionsFeedback', `Превышена максимальная длина (${maxLength} символов)`);
            return false;
        }
        this.hideError(this.$previousConclusionsInput, 'napravPreviousConclusionsFeedback');
        return true;
    },

    /**
     * Валидирует типы деятельности
     * @returns {boolean} Результат валидации
     */
    validateActivityTypes: function () {
        const value = this.$activityTypesInput.val().trim();
        const maxLength = 1000;
        if (value.length > maxLength) {
            this.showError(this.$activityTypesInput, 'napravActivityTypesFeedback', `Превышена максимальная длина (${maxLength} символов)`);
            return false;
        }
        this.hideError(this.$activityTypesInput, 'napravActivityTypesFeedback');
        return true;
    },

    /**
     * Валидирует ФИО представителя работодателя
     * @returns {boolean} Результат валидации
     */
    validateEmployerRepName: function () {
        const fullName = this.$employerRepName.val().trim();
        const fullNameResult = this.processFullName(fullName);
        if (!fullName) {
            this.showError(this.$employerRepName, 'employerRepNameFeedback', 'Поле обязательно для заполнения');
        } else if (!fullNameResult.isValid) {
            if (fullNameResult.error === 'latin') {
                this.showError(this.$employerRepName, 'employerRepNameFeedback', 'ФИО должно содержать только кириллицу');
            } else {
                this.showError(this.$employerRepName, 'employerRepNameFeedback', 'Введите корректное ФИО (2-3 слова, каждое с заглавной буквы)');
            }
        } else {
            this.hideError(this.$employerRepName, 'employerRepNameFeedback');
        }
        return fullNameResult.isValid && fullName;
    },

    /**
     * Валидирует должность представителя работодателя
     * @returns {boolean} Результат валидации
     */
    validateEmployerRepPosition: function () {
        const position = this.$employerRepPosition.val().trim();
        const minLength = 3;
        const maxLength = 50;
        if (!position) {
            this.showError(this.$employerRepPosition, 'employerRepPositionFeedback', 'Поле обязательно для заполнения');
            return false;
        } else if (position.length < minLength) {
            this.showError(this.$employerRepPosition, 'employerRepPositionFeedback', `Должность должна содержать минимум ${minLength} символа`);
            return false;
        } else if (position.length > maxLength) {
            this.showError(this.$employerRepPosition, 'employerRepPositionFeedback', `Должность не должна превышать ${maxLength} символов`);
            return false;
        } else {
            this.hideError(this.$employerRepPosition, 'employerRepPositionFeedback');
            return true;
        }
    },

    /**
     * Валидирует название работодателя
     * @returns {boolean} Результат валидации
     */
    validateEmployerName: function () {
        const name = this.$employerNameInput.val().trim();
        const minLength = 3;
        const maxLength = 255;
        if (!name) {
            this.showError(this.$employerNameInput, 'employerNameFeedback', 'Поле обязательно для заполнения');
            return false;
        } else if (name.length < minLength) {
            this.showError(this.$employerNameInput, 'employerNameFeedback', `Название должно содержать минимум ${minLength} символа`);
            return false;
        } else if (name.length > maxLength) {
            this.showError(this.$employerNameInput, 'employerNameFeedback', `Название не должно превышать ${maxLength} символов`);
            return false;
        } else if (!/^[А-ЯЁа-яё0-9\s\-"«».,()]+$/i.test(name)) {
            this.showError(this.$employerNameInput, 'employerNameFeedback', 'Допустимы кириллица, цифры, пробелы и знаки -"«».,()');
            return false;
        } else {
            this.hideError(this.$employerNameInput, 'employerNameFeedback');
            return true;
        }
    },

    /**
     * Валидирует должность сотрудника для обычных осмотров
     * @returns {boolean} Результат валидации
     */
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

    /**
     * Валидирует должность сотрудника для психиатрического освидетельствования
     * @returns {boolean} Результат валидации
     */
    validatePositionPsych: function () {
        const position = this.$positionPsychInput.val().trim();
        const minLength = 3;
        const maxLength = 100;
        if (!position) {
            this.showError(this.$positionPsychInput, 'napravEmployeePositionPsychFeedback', 'Поле обязательно для заполнения');
            return false;
        } else if (position.length < minLength) {
            this.showError(this.$positionPsychInput, 'napravEmployeePositionPsychFeedback', `Должность должна содержать минимум ${minLength} символа`);
            return false;
        } else if (position.length > maxLength) {
            this.showError(this.$positionPsychInput, 'napravEmployeePositionPsychFeedback', `Должность не должна превышать ${maxLength} символов`);
            return false;
        } else if (!/^[А-ЯЁа-яё\s\-]+$/i.test(position)) {
            this.showError(this.$positionPsychInput, 'napravEmployeePositionPsychFeedback', 'Должность должна содержать только кириллические символы, пробелы и дефисы');
            return false;
        } else {
            this.hideError(this.$positionPsychInput, 'napravEmployeePositionPsychFeedback');
            return true;
        }
    },

    /**
     * Валидирует вредные факторы
     * @returns {boolean} Результат валидации
     */
    validateHazardFactors: function () {
        const value = this.$hazardFactorsInput.val().trim();
        const maxLength = 1000;
        if (value.length > maxLength) {
            this.showError(this.$hazardFactorsInput, 'hazardFactorsFeedback', `Превышена максимальная длина (${maxLength} символов)`);
            return false;
        }
        this.hideError(this.$hazardFactorsInput, 'hazardFactorsFeedback');
        return true;
    },

    /**
     * Валидирует номер ОМС
     * @returns {boolean} Результат валидации
     */
    validateOMS: function () {
        if (!this.$hasOMS.is(':checked')) {
            this.hideError(this.$OMSNumber, 'napravOMSFeedback');
            return true;
        }
        const oms = this.$OMSNumber.val().trim();
        const requiredLength = 16;
        if (!oms) {
            this.showError(this.$OMSNumber, 'napravOMSFeedback', 'Поле обязательно для заполнения');
            return false;
        } else if (!/^\d+$/.test(oms)) {
            this.showError(this.$OMSNumber, 'napravOMSFeedback', 'Номер полиса ОМС должен содержать только цифры');
            return false;
        } else if (oms.length !== requiredLength) {
            this.showError(this.$OMSNumber, 'napravOMSFeedback', `Номер полиса ОМС должен содержать ${requiredLength} цифр`);
            return false;
        } else {
            this.hideError(this.$OMSNumber, 'napravOMSFeedback');
            return true;
        }
    },

    /**
     * Валидирует номер ДМС
     * @returns {boolean} Результат валидации
     */
    validateDMS: function () {
        if (!this.$hasDMS.is(':checked')) {
            this.hideError(this.$DMSNumber, 'napravDMSFeedback');
            return true;
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

    /**
     * Валидирует email
     * @param {jQuery} $input - Поле ввода
     * @param {string} feedbackId - ID элемента обратной связи
     * @returns {boolean} Результат валидации
     */
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

    /**
     * Валидирует номер телефона
     * @param {jQuery} $input - Поле ввода
     * @param {string} feedbackId - ID элемента обратной связи
     * @returns {boolean} Результат валидации
     */
    validatePhone: function ($input, feedbackId) {
        const value = $input.val().trim();
        const minDigits = 5;
        const maxExtension = 9;
        if (!value) {
            this.hideError($input, feedbackId);
            return true;
        }
        if (!/^[\d\s\-\(\)\+]*(?:#|доб\.?)?[\d\s]*$/i.test(value)) {
            this.showError($input, feedbackId, 'Допустимы цифры, пробелы, +-() и добавочный через # или "доб."');
            return false;
        }
        const mainNumber = value.split(/#|доб\.?/i)[0].replace(/\D/g, '');
        if (mainNumber.length < minDigits) {
            this.showError($input, feedbackId, `Основной номер должен содержать минимум ${minDigits} цифр`);
            return false;
        }
        const extensionMatch = value.match(/(?:#|доб\.?)([\d\s]+)/i);
        if (extensionMatch) {
            const extensionDigits = extensionMatch[1].replace(/\D/g, '');
            if (extensionDigits.length > maxExtension) {
                this.showError($input, feedbackId, `Добавочный номер не должен превышать ${maxExtension} цифр`);
                return false;
            }
        }
        this.hideError($input, feedbackId);
        return true;
    },

    // === Форматирование ввода ===
    /**
     * Форматирует ввод ОГРН
     * @param {HTMLInputElement} input - Поле ввода
     */
    formatOgrnInput: function (input) {
        input.value = input.value.replace(/\D/g, '').slice(0, 13);
    },

    /**
     * Форматирует ввод номера телефона
     * @param {HTMLInputElement} input - Поле ввода
     */
    formatPhoneInput: function (input) {
        let value = input.value;
        const cursorPosition = input.selectionStart;
        const cleanedValue = value.replace(/[^\d\s\-\(\)\+#доб.]/gi, '');
        if (cleanedValue !== value) {
            input.value = cleanedValue;
            const diff = value.length - cleanedValue.length;
            input.setSelectionRange(cursorPosition - diff, cursorPosition - diff);
        }
    },

    /**
     * Форматирует ввод номера ОМС
     * @param {HTMLInputElement} input - Поле ввода
     */
    formatOMSInput: function (input) {
        input.value = input.value.replace(/\D/g, '').slice(0, 16);
    },

    // === Обработка ФИО ===
    /**
     * Обрабатывает и форматирует ФИО
     * @param {string} name - Входное ФИО
     * @param {Object} options - Настройки обработки
     * @returns {Object} Результат обработки
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
        return { isValid: true, formattedName: formattedName };
    },

    // === Получение данных формы ===
    /**
     * Собирает данные из формы для отправки
     * @returns {Object} Данные формы
     */
    getFormData: function () {
        const type = this.$examinationType.val();
        const fullName = this.processFullName(this.$fullNameInput.val()).formattedName;
        const commonData = {
            examinationType: type,
            FIO: fullName,
            birthDate: this.$birthDateInput.val(),
            gender: $('input[name="napravEmployeeGender"]:checked').val(),
            hasOMS: this.$hasOMS.is(':checked'),
            hasDMS: this.$hasDMS.is(':checked'),
            OMSNumber: this.$OMSNumber.val(),
            DMSNumber: this.$DMSNumber.val(),
            employeeId: worker_id
        };
        if (type === 'preliminary' || type === 'periodic') {
            return {
                ...commonData,
                employerRepresentativeName: getInitials(this.$employerRepName.val()),
                employerRepresentativePosition: this.$employerRepPosition.val(),
                directionNumber: this.$directionNumber.val(),
                directionDate: this.$directionDate.val(),
                medicalOrganization: this.$medicalOrgInput.val(),
                medicalAddress: this.$medicalAddressInput.val(),
                ogrnCode: this.$ogrnCodeInput.val(),
                medicalEmail: this.$medicalEmailInput.val(),
                medicalPhone: this.$medicalPhoneInput.val(),
                departmentName: this.$departmentNameInput.val(),
                position: this.$positionInput.val(),
                hazardFactors: this.$hazardFactorsInput.val() || '-'
            };
        } else if (type === 'psychiatric') {
            return {
                ...commonData,
                directionDatePsych: this.$directionDatePsych.val(),
                employerName: this.$employerNameInput.val(),
                employerEmail: $('#napravEmployerEmail').val(),
                employerPhone: this.$employerPhoneInput.val(),
                okvedCode: this.$okvedCodeInput.val(),
                medicalOrgPsych: this.$medicalOrgPsychInput.val(),
                medicalAddressPsych: this.$medicalAddressPsychInput.val(),
                ogrnPsych: this.$ogrnPsychInput.val(),
                medicalEmailPsych: this.$medicalEmailPsychInput.val(),
                medicalPhonePsych: this.$medicalPhonePsychInput.val(),
                positionPsych: this.$positionPsychInput.val(),
                activityTypes: this.$activityTypesInput.val(),
                previousConclusions: this.$previousConclusions.val(),
                directionIssueDate: this.$directionDate.val()
            };
        }
        return commonData;
    },

    // === Управление счетчиками ===
    /**
     * Инициализирует счетчики символов для полей
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
        this.updateCounter('employerName');
        this.updateCounter('employerPhone');
        this.updateCounter('medOrgEmailPsych');
        this.updateCounter('medOrgPhonePsych');
        this.updateCounter('activityTypes');
        this.updateCounter('previousConclusions');
        this.updateCounter('ogrnPsych');
        this.updateCounter('ogrnCode');
        this.updateCounter('okvedCode');
        this.updateCounter('OMS');
        this.updateCounter('DMS');
        this.updateCounter('directionNumber');
    },

    /**
     * Обновляет счетчик символов для указанного поля
     * @param {string} field - Название поля
     */
    updateCounter: function (field) {
        const fieldMap = {
            napravFullName: ['napravEmployeeFullName', 'napravFullNameCounter'],
            medicalOrg: ['napravMedicalOrganization', 'medicalOrgCounter'],
            napravMedicalAddress: ['napravMedicalAddress', 'medicalAddressCounter'],
            medicalOrgPsych: ['napravMedicalOrgPsych', 'medicalOrgPsychCounter'],
            medicalAddressPsych: ['napravMedicalAddressPsych', 'medicalAddressPsychCounter'],
            medicalEmail: ['napravMedicalEmail', 'medicalEmailCounter'],
            medicalPhone: ['napravMedicalPhone', 'medicalPhoneCounter'],
            medicalEmailPsych: ['napravMedicalEmailPsych', 'medicalEmailPsychCounter'],
            medicalPhonePsych: ['napravMedicalPhonePsych', 'medicalPhonePsychCounter'],
            departmentName: ['napravDepartmentName', 'napravDepartmentCounter'],
            position: ['napravEmployeePosition', 'napravPositionCounter'],
            positionPsych: ['napravEmployeePositionPsych', 'napravPositionPsychCounter'],
            hazardFactors: ['napravHazardFactors', 'hazardFactorsCounter'],
            employerRepName: ['napravEmployerRepresentativeName', 'employerRepNameCounter'],
            employerRepPosition: ['napravEmployerRepresentativePosition', 'employerRepPositionCounter'],
            employerName: ['napravEmployerName', 'employerNameCounter'],
            employerPhone: ['napravEmployerPhone', 'employerPhoneCounter'],
            medOrgEmailPsych: ['napravMedOrgEmailPsych', 'medOrgEmailPsychCounter'],
            medOrgPhonePsych: ['napravMedOrgPhonePsych', 'medOrgPhonePsychCounter'],
            activityTypes: ['napravActivityTypes', 'activityTypesCounter'],
            previousConclusions: ['napravPreviousConclusions', 'previousConclusionsCounter'],
            ogrnPsych: ['napravOgrnPsych', 'ogrnPsychCounter'],
            ogrnCode: ['napravOgrnCode', 'ogrnCodeCounter'],
            okvedCode: ['napravOkvedCode', 'okvedCodeCounter'],
            OMS: ['napravOMSNumber', 'napravOMSCounter'],
            DMS: ['napravDMSNumber', 'napravDMSCounter'],
            directionNumber: ['napravNumber', 'napravNumberCounter']
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

    // === Управление спиннерами ===
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

    /**
     * Показывает спиннер отправки и отключает кнопку
     */
    showSubmitSpinner: function () {
        this.$submitBtn.prop('disabled', true);
        this.$submitSpinner.removeClass('d-none');
    },

    /**
     * Скрывает спиннер отправки
     */
    hideSubmitSpinner: function () {
        this.$submitSpinner.addClass('d-none');
    },

    // === Отправка формы ===
    /**
     * Отправляет данные формы на сервер
     */
    submitForm: async function () {
        if (!this.validateForm()) {
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
        const url = new URL(API_ENDPOINTS.NAPRAV);
        try {
            const data = await sendPostRequest(url, formData);
            if (data.status === 'SUCCESS') {
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

    // === Сброс формы ===
    /**
     * Сбрасывает форму до начального состояния
     */
    resetForm: function () {
        this.$form.trigger('reset');
        this.$form.find('.is-invalid').removeClass('is-invalid');
        this.$regularFields.hide();
        this.$psychiatricFields.hide();
        this.initCounters();
        this.hideSubmitSpinner();
        this.$directionNumberCounter.text('0');
        this.hideError(this.$OMSNumber, 'napravOMSFeedback');
        this.hideError(this.$DMSNumber, 'napravDMSFeedback');
        $('#napravInsuranceFeedback').hide();
        this.$OMSCounter.text('0');
        this.$DMSCounter.text('0');
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
        this.hideError(this.$positionPsychInput, 'napravEmployeePositionPsychFeedback');
        this.hideError(this.$hazardFactorsInput, 'hazardFactorsFeedback');
        this.hideError(this.$employerRepName, 'employerRepNameFeedback');
        this.hideError(this.$employerRepPosition, 'employerRepPositionFeedback');
        this.hideError(this.$employerNameInput, 'employerNameFeedback');
        this.$activityTypesInput.val('');
        this.$activityTypesCounter.text('0');
        this.hideError(this.$activityTypesInput, 'napravActivityTypesFeedback');
        this.$medOrgEmailPsychInput.val('');
        this.$medOrgPhonePsychInput.val('');
        this.$previousConclusionsInput.val('');
        this.$previousConclusionsCounter.text('0');
        this.hideError(this.$previousConclusionsInput, 'napravPreviousConclusionsFeedback');
        this.$medOrgEmailCounter.text('0');
        this.$medOrgPhoneCounter.text('0');
        this.hideError(this.$medOrgEmailPsychInput, 'napravMedOrgEmailPsychFeedback');
        this.hideError(this.$medOrgPhonePsychInput, 'napravMedOrgPhonePsychFeedback');
        this.$hasOMS.prop('checked', false);
        this.$hasDMS.prop('checked', false);
        this.$OMSNumber.val('');
        this.$DMSNumber.val('');
        this.$ogrnPsychInput.val('');
        this.$ogrnCodeInput.val('');
        this.$ogrnPsychCounter.text('0');
        this.$ogrnCodeCounter.text('0');
        this.hideError(this.$ogrnPsychInput, 'napravOgrnPsychFeedback');
        this.hideError(this.$ogrnCodeInput, 'napravOgrnCodeFeedback');
        this.$departmentCounter.text('0');
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        this.$directionDate.val(formattedDate);
        this.$directionDatePsych.val(formattedDate);
        this.$employerRepName.val('');
        this.$employerRepPosition.val('');
    },

    // === Вспомогательные методы ===
    /**
     * Показывает сообщение об ошибке
     * @param {jQuery} $input - Поле ввода
     * @param {string} feedbackId - ID элемента обратной связи
     * @param {string} message - Сообщение об ошибке
     */
    showError: function ($input, feedbackId, message) {
        $input.addClass('is-invalid');
        $(`#${feedbackId}`).text(message).show();
    },

    /**
     * Скрывает сообщение об ошибке
     * @param {jQuery} $input - Поле ввода
     * @param {string} feedbackId - ID элемента обратной связи
     */
    hideError: function ($input, feedbackId) {
        $input.removeClass('is-invalid');
        $(`#${feedbackId}`).text('').hide();
    }
};

// === Инициализация модуля ===
$(document).ready(function () {
    if ($('#mednapravModal').length) {
        MedicalExaminationForm.init();
    }
});