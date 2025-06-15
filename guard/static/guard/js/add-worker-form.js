/**
 * EmployeeForm - модуль для работы с формой добавления сотрудника
 */
const EmployeeForm = {
    init: function () {
        this.cacheElements();
        this.bindEvents();
        this.initCounters();

        this.modal = new bootstrap.Modal(this.$modal[0], {
            focus: false
        });
    },

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

    bindEvents: function () {
        this.$fullNameInput.on('input', this.updateCounter.bind(this, 'fullName'));
        this.$positionInput.on('input', this.updateCounter.bind(this, 'position'));
        this.$structInput.on('input', this.updateCounter.bind(this, 'struct'));
        this.$omsInput.on('input', this.updateCounter.bind(this, 'oms'));
        this.$dmsInput.on('input', this.updateCounter.bind(this, 'dms'));
        this.$submitBtn.on('click', this.submitForm.bind(this));
        this.$birthDateInput.on('input', this.validateBirthDateInput.bind(this));
        this.$omsInput.on('input', () => {
            this.updateCounter('oms');
            this.validateOMS();
        });

        this.$dmsInput.on('input', () => {
            this.updateCounter('dms');
            this.validateDMS();
        });

        this.$modal.on('show.bs.modal', this.handleModalShow.bind(this));
        this.$modal.on('shown.bs.modal', this.handleModalShown.bind(this));
        this.$modal.on('hide.bs.modal', this.handleModalHide.bind(this));
        this.$modal.on('hidden.bs.modal', this.handleModalHidden.bind(this));

        this.$closeBtn.on('click', this.handleCloseClick.bind(this));
    },

    handleModalShow: function () {
        this.resetForm();
        this.$modal.removeAttr('aria-hidden');
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
        this.updateCounter('fullName');
        this.updateCounter('position');
        this.updateCounter('struct');
        this.updateCounter('oms');
        this.updateCounter('dms');
    },

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
            return { isValid: false, formattedName: '' };
        }

        const cleanedName = name.trim().replace(/\s+/g, ' ');

        if (cleanedName === '') {
            return { isValid: false, formattedName: '' };
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

    validateBirthDateInput: function () {
        const birthDateInput = this.$birthDateInput.val();
        if (!birthDateInput || !this.validateBirthDate(birthDateInput)) {
            this.$birthDateInput.addClass('is-invalid');
            $('#birthDateFeedback').text('Пожалуйста, укажите корректную дату рождения (возраст от 16 до 100 лет, не в будущем)');
        } else {
            this.$birthDateInput.removeClass('is-invalid');
        }
    },


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

    // Валидация ОМС
    // Валидация ОМС
    validateOMS: function () {
        const oms = this.$omsInput.val().trim();
        const $feedback = $('#omsFeedback');

        if (oms && oms.length !== 16) {
            this.$omsInput.addClass('is-invalid');
            $feedback.text('Номер полиса ОМС должен содержать 16 цифр').show();
            return false;
        } else if (oms && !/^\d+$/.test(oms)) {
            this.$omsInput.addClass('is-invalid');
            $feedback.text('Номер полиса ОМС должен содержать только цифры').show();
            return false;
        } else {
            this.$omsInput.removeClass('is-invalid');
            $feedback.text('').hide();
            return true;
        }
    },

    // Валидация ДМС
    validateDMS: function () {
        const dms = this.$dmsInput.val().trim();
        const $feedback = $('#dmsFeedback');

        if (dms && dms.length < 10) {
            this.$dmsInput.addClass('is-invalid');
            $feedback.text('Номер полиса ДМС должен содержать минимум 10 символов').show();
            return false;
        } else {
            this.$dmsInput.removeClass('is-invalid');
            $feedback.text('').hide();
            return true;
        }
    },

    validateForm: function () {
        let isValid = true;

        // Валидация ФИО
        if (!this.processFullName(this.$fullNameInput.val()).isValid) {
            this.$fullNameInput.addClass('is-invalid');
            $('#fullNameFeedback').text('Пожалуйста, введите корректное ФИО (2-3 слова, каждое с заглавной буквы)');
            isValid = false;
        } else {
            this.$fullNameInput.removeClass('is-invalid');
        }

        // Валидация должности
        if (this.$positionInput.val().trim().length < 2) {
            this.$positionInput.addClass('is-invalid');
            isValid = false;
        } else {
            this.$positionInput.removeClass('is-invalid');
        }

        // Валидация даты рождения
        const birthDateInput = $('#employeeBirthDate').val();
        if (!birthDateInput || !this.validateBirthDate(birthDateInput)) {
            $('#employeeBirthDate').addClass('is-invalid');
            $('#birthDateFeedback').text('Пожалуйста, укажите корректную дату рождения');
            isValid = false;
        } else {
            $('#employeeBirthDate').removeClass('is-invalid');
        }

        // Валидация ОМС и ДМС
        if (this.$omsInput.val().trim() && !this.validateOMS()) isValid = false;
        if (this.$dmsInput.val().trim() && !this.validateDMS()) isValid = false;

        // Валидация обязательных полей
        this.$form.find('[required]').each(function () {
            if (!$(this).val()) {
                $(this).addClass('is-invalid');
                isValid = false;
            } else {
                $(this).removeClass('is-invalid');
            }
        });

        return isValid;
    },

    getFormData: function () {
        return {
            FIO: this.processFullName(this.$fullNameInput.val()).formattedName,
            gender: $('input[name="employeeGender"]:checked').val(),
            birthday: $('#employeeBirthDate').val(),
            position: this.$positionInput.val(),
            department: this.$structInput.val(),
            oms_number: this.$omsInput.val(),
            dms_number: this.$dmsInput.val(),
            status: $('#employeeStatus').val(),
            is_edu: $('#employeeIsLearning').is(':checked')
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

    submitForm: async function () {
        if (!this.validateForm()) return;

        this.showSpinner()
        const formData = this.getFormData();
        const url = new URL(`${SERVER}/worker/add/`);

        try {
            const data = await sendPostRequest(url, formData);

            if (data.status === "SUCCESS") {
                await filterWorkers(filter_query);
                sortWorkersByFIO(sort_type);
                this.modal.hide();
                showNotification('Сотрудник успешно добавлен', 'success');
            } else {
                showNotification(data.message || 'Ошибка при добавлении сотрудника');
            }
        } catch (error) {
            console.error('Ошибка при отправке формы:', error);
            showNotification('Произошла ошибка при отправке формы');
        } finally {
            this.hideSpinner()
        }
    },

    resetForm: function () {
        this.$form.trigger('reset');
        this.$form.find('.is-invalid').removeClass('is-invalid');
        this.$birthDateInput.removeClass('is-invalid');
        $('#birthDateFeedback').text('');
        $('#omsFeedback').text('').hide();
        $('#dmsFeedback').text('').hide();
        this.initCounters();
        this.hideSpinner();
    },
};

// Инициализация при загрузке документа
$(document).ready(function () {
    if ($('#addWorkerModal').length) {
        EmployeeForm.init();
    }
});