/**
 * EmployeeEditForm - модуль для работы с формой редактирования сотрудника
 */
const EmployeeEditForm = {
    init: function () {
        this.cacheElements();
        this.bindEvents();
        this.initCounters();

        this.modal = new bootstrap.Modal(this.$modal[0], {
            focus: false
        });
    },

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
        this.$omsInput.on('input', this.validateOms.bind(this));
        this.$dmsInput.on('input', this.validateDms.bind(this));
        this.$genderInputs.on('change', this.validateGender.bind(this));
        this.$statusSelect.on('change', this.validateStatus.bind(this));

        this.$submitBtn.on('click', this.submitForm.bind(this));

        this.$modal.on('show.bs.modal', this.handleModalShow.bind(this));
        this.$modal.on('shown.bs.modal', this.handleModalShown.bind(this));
        this.$modal.on('hide.bs.modal', this.handleModalHide.bind(this));
        this.$modal.on('hidden.bs.modal', this.handleModalHidden.bind(this));

        this.$closeBtn.on('click', this.handleCloseClick.bind(this));
    },

    // Валидация ФИО
    validateFullName: function () {
        const fullName = this.$fullNameInput.val().trim();
        const isValid = EmployeeForm.processFullName(fullName).isValid;

        if (!fullName) {
            this.showError(this.$fullNameInput, 'editFullNameFeedback', 'Поле обязательно для заполнения');
        } else if (!isValid) {
            this.showError(this.$fullNameInput, 'editFullNameFeedback',
                'Введите корректное ФИО (2-3 слова, каждое с заглавной буквы)');
        } else {
            this.hideError(this.$fullNameInput, 'editFullNameFeedback');
        }
        return isValid && fullName;
    },

    // Валидация должности
    validatePosition: function () {
        const position = this.$positionInput.val().trim();

        if (!position) {
            this.showError(this.$positionInput, 'editPositionFeedback', 'Поле обязательно для заполнения');
        } else if (position.length < 2) {
            this.showError(this.$positionInput, 'editPositionFeedback', 'Должность должна содержать минимум 2 символа');
        } else {
            this.hideError(this.$positionInput, 'editPositionFeedback');
        }
        return !!position && position.length >= 2;
    },

    // Валидация даты рождения
    validateBirthDate: function () {
        const dateStr = this.$birthDateInput.val();
        const isValid = this.isValidBirthDate(dateStr);

        if (!dateStr) {
            this.showError(this.$birthDateInput, 'editBirthDateFeedback', 'Поле обязательно для заполнения');
        } else if (!isValid) {
            this.showError(this.$birthDateInput, 'editBirthDateFeedback',
                'возраст от 14 до 100 лет');
        } else {
            this.hideError(this.$birthDateInput, 'editBirthDateFeedback');
        }
        return !!dateStr && isValid;
    },

    // Валидация ОМС
    validateOms: function () {
        const oms = this.$omsInput.val().trim();
        if (oms && oms.length !== 16) {
            this.showError(this.$omsInput, 'editOmsFeedback', 'Номер полиса ОМС должен содержать 16 цифр');
            return false;
        } else if (oms && !/^\d+$/.test(oms)) {
            this.showError(this.$omsInput, 'editOmsFeedback', 'Номер полиса ОМС должен содержать только цифры');
            return false;
        } else {
            this.hideError(this.$omsInput, 'editOmsFeedback');
            return true;
        }
    },

    // Валидация ДМС
    validateDms: function () {
        const dms = this.$dmsInput.val().trim();
        if (dms && dms.length < 10) {
            this.showError(this.$dmsInput, 'editDmsFeedback', 'Номер полиса ДМС должен содержать минимум 10 символов');
            return false;
        } else {
            this.hideError(this.$dmsInput, 'editDmsFeedback');
            return true;
        }
    },

    // Валидация пола
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

    // Валидация статуса
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

    // Проверка валидности даты рождения
    isValidBirthDate: function (dateStr) {
        if (!dateStr) return false;

        const inputDate = new Date(dateStr);
        if (isNaN(inputDate.getTime())) return false;

        const today = new Date();
        const minAgeDate = new Date(today.getFullYear() - 14, today.getMonth(), today.getDate());
        const maxAgeDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());

        return inputDate <= minAgeDate && inputDate >= maxAgeDate;
    },

    // Показать ошибку
    showError: function ($input, feedbackId, message) {
        $input.addClass('is-invalid');
        $(`#${feedbackId}`).text(message).show();
    },

    // Скрыть ошибку
    hideError: function ($input, feedbackId) {
        $input.removeClass('is-invalid');
        $(`#${feedbackId}`).text('').hide();
    },

    handleModalShow: function () {
        this.showLoadingSpinner(); // Показываем индикатор загрузки
        if (worker_id) {
            this.loadEmployeeData(worker_id).finally(() => {
                this.hideLoadingSpinner(); // Скрываем индикатор загрузки после загрузки данных
            });
        }
    },

    loadEmployeeData: async function (employeeId) {
        try {
            const url = new URL(FILTER);
            url.searchParams.append('id', employeeId);
            const { status, employees } = await sendGetRequest(url);
            if (status === "SUCCESS") {
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
                this.validateOms();

                this.$dmsInput.val(employees.dms_number || '');
                this.updateCounter('editDms');
                this.validateDms();

                this.$statusSelect.val(employees.status_code || 'W');
                this.validateStatus();

                this.$isLearningCheckbox.prop('checked', employees.is_edu || false);
            }
        } catch (error) {
            console.error('Ошибка при загрузке данных сотрудника:', error);
            showNotification('Ошибка загрузки данных сотрудника');
        }
    },

    handleModalShown: function () {
        this.$fullNameInput.trigger('focus');
    },

    handleModalHide: function () {
        if (document.activeElement) {
            document.activeElement.blur();
        }
        this.hideSpinner();
    },

    handleModalHidden: function () {
        setTimeout(() => {
            this.$modal.attr('aria-hidden', 'true');
        }, 100);
    },

    handleCloseClick: function (e) {
        e.preventDefault();
        this.modal.hide();
    },

    initCounters: function () {
        this.updateCounter('editFullName');
        this.updateCounter('editPosition');
        this.updateCounter('editStruct');
        this.updateCounter('editOms');
        this.updateCounter('editDms');
    },

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

    validateForm: function () {
        let isValid = true;

        // Проверяем все обязательные поля
        if (!this.validateFullName()) isValid = false;
        if (!this.validatePosition()) isValid = false;
        if (!this.validateBirthDate()) isValid = false;
        if (!this.validateGender()) isValid = false;
        if (!this.validateStatus()) isValid = false;

        // Необязательные поля проверяем только если они заполнены
        if (this.$omsInput.val().trim() && !this.validateOms()) isValid = false;
        if (this.$dmsInput.val().trim() && !this.validateDms()) isValid = false;

        return isValid;
    },

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

    showSpinner: function () {
        this.$submitBtn.prop('disabled', true);
        this.$spinner.removeClass('d-none');
    },

    hideSpinner: function () {
        this.$submitBtn.prop('disabled', false);
        this.$spinner.addClass('d-none');
    },

    showLoadingSpinner: function () {
        this.$loadingSpinner.removeClass('d-none');
        this.$form.addClass('d-none');
    },

    hideLoadingSpinner: function () {
        this.$loadingSpinner.addClass('d-none');
        this.$form.removeClass('d-none');
    },

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
        const url = new URL(`${PERSONAL_DATA_UPDATE}${worker_id}`);

        try {
            const data = await sendPatchRequest(url, formData);

            if (data.status === "SUCCESS") {
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
            this.hideSpinner(); // Скрываем спиннер после завершения
        }
    },

    resetForm: function () {
        this.$form.trigger('reset');
        this.$form.find('.is-invalid').removeClass('is-invalid');
        this.$form.find('.invalid-feedback').text('').hide();
        this.initCounters();
        this.hideSpinner()
    }
};

$(document).ready(function () {
    if ($('#editWorkerModal').length) {
        EmployeeEditForm.init();
    }
});