/**
 * MedicalExamEditForm - модуль для работы с формой редактирования медосмотра
 */
const MedicalExamEditForm = {
    init: function () {
        this.cacheElements();
        this.bindEvents();
        this.modal = new bootstrap.Modal(this.$modal[0], { focus: false });
        this.files = [];
        this.existingFiles = []; // Храним существующие файлы
    },

    cacheElements: function () {
        this.$modal = $('#editMedModal');
        this.$form = $('#medicalExamEditForm');
        this.$submitBtn = $('#submitEditMedicalExamForm');
        this.$fileInput = $('#editMedicalFileInput');
        this.$fileList = $('#editMedicalFileList');
        this.$fileUploadBtn = $('#editMedicalFileUploadBtn');
        this.$spinner = $('#editSubmitSpinner');
        this.$loadingSpinner = $('#editMedLoadingSpinner');
    },

    bindEvents: function () {
        this.$modal.off('show.bs.modal').on('show.bs.modal', this.handleModalShow.bind(this));
        this.$submitBtn.off('click').on('click', this.submitForm.bind(this));
        this.$modal.off('hide.bs.modal').on('hide.bs.modal', this.handleModalHide.bind(this));
        this.$fileInput.off('change').on('change', this.handleFileSelect.bind(this));
        this.$fileUploadBtn.off('click').on('click', () => this.$fileInput.trigger('click'));
        this.$fileList.off('click', '.remove-file').on('click', '.remove-file', this.removeFile.bind(this));
    },

    handleModalShow: function (event) {
        this.showLoadingSpinner();
        if (selectedMedID) {
            this.loadExamData(selectedMedID).finally(() => {
                this.hideLoadingSpinner();
            });
        }
    },

    handleFileSelect: function (e) {
        const files = e.target.files;
        for (let i = 0; i < files.length; i++) {
            this.addFile(files[i]);
        }
        this.$fileInput.val('');
        this.updateFileList(this.existingFiles); // Передаём существующие файлы
    },

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
                await this.loadExamData(selectedMedID); // Перезагружаем данные, включая existingFiles
                showNotification('Файл успешно удалён', 'success');
            } catch (error) {
                console.error('Ошибка при удалении файла:', error);
                showNotification('Ошибка при удалении файла: ' + error.message);
            }
        } else {
            this.files = this.files.filter(f => f.id !== fileId);
            this.updateFileList(this.existingFiles);
        }
    },

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

    updateFileList: function (existingFiles = []) {
        this.$fileList.empty();

        if (existingFiles.length === 0 && this.files.length === 0) {
            this.$fileList.append('<tr><td colspan="3" class="text-muted text-center">Нет прикрепленных файлов</td></tr>');
            return;
        }

        // Существующие файлы
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

        // Новые файлы
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

    loadExamData: async function (examId) {
        try {
            const data = await sendGetRequest(MED + examId);

            if (data.status === 'SUCCESS') {
                $('#editMedicalExamType').val(data.data[0].type_code);
                $('#editMedicalExamDate').val(data.data[0].date_from);
                $('#editMedicalExamExpiryDate').val(data.data[0].date_to);

                if (data.data[0].attachments) {
                    this.existingFiles = data.data[0].attachments; // Сохраняем существующие файлы
                    this.updateFileList(this.existingFiles);
                } else {
                    this.existingFiles = [];
                    this.updateFileList();
                }
            } else {
                console.error('Ошибка загрузки данных:', data.description);
                showNotification(data.description || 'Ошибка загрузки данных');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            showNotification('Не удалось загрузить данные');
        }
    },

    handleModalHide: function () {
        if (document.activeElement) {
            document.activeElement.blur();
        }
        this.files = [];
        this.existingFiles = []; // Очищаем при закрытии
        this.updateFileList();
        this.hideSpinner();
    },

    validateForm: function () {
        let isValid = true;

        if (!$('#editMedicalExamType').val()) {
            $('#editMedicalExamType').addClass('is-invalid');
            isValid = false;
        }

        const dateFrom = new Date($('#editMedicalExamDate').val());
        const dateTo = new Date($('#editMedicalExamExpiryDate').val());

        if (!dateFrom.getTime()) {
            $('#editMedicalExamDate').addClass('is-invalid');
            isValid = false;
        }

        if (!dateTo.getTime()) {
            $('#editMedicalExamExpiryDate').addClass('is-invalid');
            isValid = false;
        }

        if (dateTo < dateFrom) {
            $('#editMedicalExamExpiryDate').addClass('is-invalid');
            $('#editMedicalExamExpiryDate').next('.invalid-feedback').text('Дата окончания не может быть раньше даты прохождения');
            isValid = false;
        }

        return isValid;
    },

    getFormData: function () {
        return {
            exam_type: $('#editMedicalExamType').val(),
            exam_date: $('#editMedicalExamDate').val(),
            expiry_date: $('#editMedicalExamExpiryDate').val()
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
        if (!this.validateForm()) return;

        this.showSpinner();
        const formData = this.getFormData();
        const url = new URL(MED_UPDATE + selectedMedID);

        try {
            const data = await sendPatchRequest(url, formData);

            if (data.status === 'SUCCESS') {
                if (this.files.length > 0) {
                    await this.uploadFiles(selectedMedID);
                }
                await getMedData(worker_id);
                await this.loadExamData(selectedMedID);
                $(document).trigger('updateNotify');
                this.modal.hide();
                showNotification('Медосмотр успешно обновлён', 'success');
            } else {
                showNotification(data.description || 'Ошибка обновления');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            showNotification('Ошибка при отправке данных');
        } finally {
            this.hideSpinner();
        }
    },

    uploadFiles: async function (medId) {
        const uploadPromises = this.files.map(file => {
            const formData = new FormData();
            formData.append('file', file.file);
            formData.append('file_type', 'med');
            formData.append('object_id', medId);

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
            this.files = [];
            await this.loadExamData(selectedMedID);
            return results;
        } catch (error) {
            console.error('Ошибка загрузки файлов:', error);
            throw error;
        }
    }
};

$(document).ready(function () {
    if ($('#editMedModal').length) {
        MedicalExamEditForm.init();
    }
});