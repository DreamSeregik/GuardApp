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
    },

    /**
     * Навешивание обработчиков событий
     */
    bindEvents: function () {
        // Обработчики для полей формы
        this.$examinationType.on('change', this.handleExaminationTypeChange.bind(this));
        this.$fullNameInput.on('input', this.updateCounter.bind(this, 'napravFullName'));
        this.$submitBtn.on('click', this.submitForm.bind(this));
        this.$hasOMS.on('change', this.handleInsuranceChange.bind(this));
        this.$hasDMS.on('change', this.handleInsuranceChange.bind(this));

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

        // Обновляем счетчики при показе полей
        if (this.$hasOMS.is(':checked')) {
            this.updateOMSCounter();
        }
        if (this.$hasDMS.is(':checked')) {
            this.updateDMSCounter();
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
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        this.$directionDate.val(formattedDate);
        this.$directionDatePsych.val(formattedDate);
        try {
            const userFIO = await sendGetRequest('/user');
            this.$employerRepName.val(userFIO.FIO);
            if (worker_id) {
                await this.loadEmployeeData(worker_id);
            }
        } finally {
            this.hideLoadingSpinner(); // Скрываем индикатор загрузки после загрузки данных
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
                if (employees.oms_number)
                    $('#napravOMSNumber').val(employees.oms_number || '')

                // Устанавливаем номер ДМС
                if (employees.dms_number)
                    $('#napravDMSNumber').val(employees.dms_number || '')

                if (employees.department)
                    $('#napravDepartmentName').val(employees.department || '')

                // Устанавливаем должность
                $('#napravEmployeePosition').val(employees.position || '');
                $('#napravEmployeePositionPsych').val(employees.position || '');
                this.$submitBtn.prop('disabled', false);
            }
        } catch (error) {
            console.error('Ошибка при загрузке данных сотрудника:', error);
            showToast('Ошибка загрузки данных сотрудника', 'error');
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
    },

    /**
     * Обновление счетчика символов
     * @param {string} field - имя поля ('napravFullName')
     */
    updateCounter: function (field) {
        const $counter = $(`#${field}Counter`);
        $counter.text(this.$fullNameInput.val().length);
    },

    updateOMSCounter: function () {
        const length = this.$OMSNumber.val().length;
        this.$OMSCounter.text(length);
        this.validateOMS(); // Вызываем валидацию при каждом изменении
    },

    updateDMSCounter: function () {
        const length = this.$DMSNumber.val().length;
        this.$DMSCounter.text(length);
        this.validateDMS(); // Вызываем валидацию при каждом изменении
    },

    /**
 * Валидация номера ОМС
 */
    validateOMS: function () {
        const oms = this.$OMSNumber.val().trim();
        if (oms && oms.length !== 16) {
            this.showError(this.$OMSNumber, 'napravOMSFeedback', 'Номер полиса ОМС должен содержать 16 цифр');
            return false;
        } else if (oms && !/^\d+$/.test(oms)) {
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
        const dms = this.$DMSNumber.val().trim();
        if (dms && dms.length < 10) {
            this.showError(this.$DMSNumber, 'napravDMSFeedback', 'Номер полиса ДМС должен содержать минимум 10 символов');
            return false;
        } else {
            this.hideError(this.$DMSNumber, 'napravDMSFeedback');
            return true;
        }
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

        // Валидация ФИО (обязательное поле)
        const fullNameValidation = EmployeeForm.processFullName(this.$fullNameInput.val());
        if (!this.$fullNameInput.val() || !fullNameValidation.isValid) {
            this.$fullNameInput.addClass('is-invalid');
            $('#napravEmployeeFullNameFeedback').text(fullNameValidation.message || 'Пожалуйста, введите корректное ФИО (2-3 слова, каждое с заглавной буквы)');
            isValid = false;
        } else {
            this.$fullNameInput.removeClass('is-invalid');
        }

        // Валидация даты рождения (обязательное поле)
        if (!this.$birthDateInput.val()) {
            this.$birthDateInput.addClass('is-invalid');
            isValid = false;
        } else {
            const birthDate = new Date(this.$birthDateInput.val());
            const currentDate = new Date();

            if (birthDate > currentDate) {
                this.$birthDateInput.addClass('is-invalid');
                $(this.$birthDateInput).next('.invalid-feedback').text('Дата рождения не может быть в будущем');
                isValid = false;
            } else {
                this.$birthDateInput.removeClass('is-invalid');
            }
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
            if (!this.$directionNumber.val()) {
                this.$directionNumber.addClass('is-invalid');
                isValid = false;
            } else {
                this.$directionNumber.removeClass('is-invalid');
            }

            if (!this.$directionDate.val()) {
                this.$directionDate.addClass('is-invalid');
                isValid = false;
            } else {
                this.$directionDate.removeClass('is-invalid');
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
            // Валидация даты направления для психиатрического освидетельствования
            if (!this.$directionDatePsych.val()) {
                this.$directionDatePsych.addClass('is-invalid');
                isValid = false;
            } else {
                this.$directionDatePsych.removeClass('is-invalid');
            }

            const psychiatricRequired = [
                '#napravEmployerName',
                '#napravMedicalOrgPsych',
                '#napravMedicalAddressPsych',
                '#napravOgrnPsych',
                '#napravEmployeePositionPsych',
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
                'departmentName': $('#napravDepartmentName').val(),
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
        this.$form.addClass('d-none'); // Скрываем форму во время загрузки
    },

    hideLoadingSpinner: function () {
        this.$loadingSpinner.addClass('d-none');
        this.$form.removeClass('d-none'); // Показываем форму после загрузки
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
        if (!this.validateForm()) return;

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

        // Сброс ошибок ОМС/ДМС
        this.hideError(this.$OMSNumber, 'napravOMSFeedback');
        this.hideError(this.$DMSNumber, 'napravDMSFeedback');
        $('#napravInsuranceFeedback').hide();

        this.$OMSCounter.text('0');
        this.$DMSCounter.text('0');

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