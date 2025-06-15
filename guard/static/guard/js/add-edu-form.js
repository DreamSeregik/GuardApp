/**
 * EducationForm - модуль для работы с формой добавления обучения сотрудника
 */
const EducationForm = {
    init: function () {
        this.cacheElements();
        this.bindEvents();
        this.modal = new bootstrap.Modal(this.$modal[0], { focus: false });
        this.files = [];
    },

    cacheElements: function () {
        this.$modal = $('#addEduModal');
        this.$form = $('#educationAddForm');
        this.$modalContent = $('.modal-content', this.$modal);
        this.$closeBtn = $('.btn-close', this.$modal);
        this.$programSelect = $('#educationProgram');
        this.$submitBtn = $('#submitEducationForm');
        this.$fileInput = $('#educationFileInput');
        this.$fileList = $('#educationFileList');
        this.$fileUploadBtn = $('#educationFileUploadBtn');
        this.$spinner = $('#submitEducationSpinner');
    },

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
    },

    handleModalShow: function () {
        this.resetForm();
        this.$modal.removeAttr('aria-hidden');
    },

    handleModalShown: function () {
        this.$programSelect.trigger('focus');
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

    handleFileSelect: function (e) {
        const files = e.target.files;
        for (let i = 0; i < files.length; i++) {
            this.addFile(files[i]);
        }
        this.$fileInput.val('');
        this.updateFileList();
    },

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

    removeFile: function (e) {
        e.preventDefault();
        const fileId = $(e.currentTarget).data('id');
        this.files = this.files.filter(f => f.id !== fileId);
        this.updateFileList();
    },

    // Функция для форматирования размера файла
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

    // Функция для экранирования HTML-символов
    escapeHTML: function (str) {
        if (typeof str !== 'string' || str == null) {
            console.warn('Некорректный входной параметр в escapeHTML:', str);
            return str == null ? '' : str.toString();
        }
        return str.replace(/[&<>"']/g, function (match) {
            const escape = {
                '&': '&',
                '<': '<',
                '>': '>',
                '"': '"',
                "'": "'"
            };
            return escape[match];
        });
    },

    // Функция для обрезки длинных имён файлов
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

    updateFileList: function () {
        this.$fileList.empty();

        if (this.files.length === 0) {
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

    validateForm: function () {
        let isValid = true;

        if (!this.$programSelect.val()) {
            this.$programSelect.addClass('is-invalid');
            isValid = false;
        }

        const hours = parseInt($('#educationHours').val());
        if (isNaN(hours) || hours < 1 || hours > 1000) {
            $('#educationHours').addClass('is-invalid');
            isValid = false;
        }

        const dateFrom = new Date($('#educationDateFrom').val());
        const dateTo = new Date($('#educationDateTo').val());

        if (!dateFrom.getTime()) {
            $('#educationDateFrom').addClass('is-invalid');
            isValid = false;
        }

        if (!dateTo.getTime()) {
            $('#educationDateTo').addClass('is-invalid');
            isValid = false;
        }

        if (dateTo < dateFrom) {
            $('#educationDateTo').addClass('is-invalid');
            $('#educationDateTo').next('.invalid-feedback').text('Дата окончания не может быть раньше даты прохождения');
            isValid = false;
        }

        this.$form.find('[required]').each(function () {
            if (!$(this).val()) {
                $(this).addClass('is-invalid');
                isValid = false;
            }
        });

        return isValid;
    },

    getFormData: function () {
        return {
            'employee_id': worker_id,
            'programm': this.$programSelect.val(),
            'protocol_num': $('#educationProtocolNum').val(),
            'udostoverenie_num': $('#educationCertNum').val(),
            'hours': $('#educationHours').val(),
            'date_from': $('#educationDateFrom').val(),
            'date_to': $('#educationDateTo').val()
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
        this.showSpinner();

        const formData = this.getFormData();
        const url = new URL(`${SERVER}/worker/education/add`);

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
                showNotification(data.message || 'Ошибка при добавлении обучения');
            }
        } catch (error) {
            console.error('Ошибка при отправке формы:', error);
            showNotification('Произошла ошибка при отправке формы');
        } finally {
            this.hideSpinner();
        }
    },

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
            console.error('Ошибка загрузки файлов:', error);
            throw error;
        }
    },

    resetForm: function () {
        this.$form.trigger('reset');
        this.$form.find('.is-invalid').removeClass('is-invalid');
        this.files = [];
        this.updateFileList();
        this.hideSpinner();
    }
};

$(document).ready(function () {
    if ($('#addEduModal').length) {
        EducationForm.init();
    }
});