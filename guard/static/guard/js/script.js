/**
 * Главный скрипт приложения для управления данными сотрудников, медосмотров и обучений.
 * Обеспечивает взаимодействие с интерфейсом, фильтрацию, сортировку и загрузку данных.
 */

// === Глобальные переменные ===
/** @type {number} Идентификатор текущей вкладки (1: основная, 2: медосмотры, 3: обучение) */
let tab_id = 1;

/** @type {number|null} Идентификатор выбранного сотрудника */
let worker_id = null;

/** @type {number|null} Идентификатор выбранного медосмотра */
let selectedMedID = null;

/** @type {number|null} Идентификатор выбранного обучения */
let selectedEducationID = null;

/** @type {string} Тип сортировки сотрудников (asc/desc) */
let sort_type = 'desc';

/** @type {Object} Параметры фильтрации сотрудников */
let filter_query = {};

/** @type {Array<jQuery>} Исходные строки таблицы медосмотров */
let originalMedRows = [];

/** @type {Array<jQuery>} Исходные строки таблицы обучений */
let originalEduRows = [];

// === Константы ===
/** @type {number} Количество столбцов в таблице медосмотров */
const MED_TABLE_COLUMNS = 6;

/** @type {number} Количество столбцов в таблице обучений */
const EDU_TABLE_COLUMNS = 9;

/** @type {number} Интервал обновления уведомлений (в миллисекундах) */
const NOTIFICATION_INTERVAL = 600000;

// === Инициализация ===
/**
 * Инициализирует приложение при загрузке документа
 */
$(document).ready(async function () {
    initEventHandlers();
    setupTableSorting();
    await fetchNotifications();
    setInterval(fetchNotifications, NOTIFICATION_INTERVAL);
});

// === Обработчики событий ===
/**
 * Настраивает обработчики событий для элементов интерфейса
 */
function initEventHandlers() {
    // Открытие модальных окон
    $('#addNewWorker').click(() => $('#addWorkerModal').modal('show'));
    $('#editWorker').click(handleEditWorkerClick);
    $('#delWorker').click(handleDeleteWorkerClick);
    $('#addMed').click(handleAddMedClick);
    $('#editMed').click(handleEditMedClick);
    $('#delMed').click(handleDeleteMedClick);
    $('#createDoc').click(handleCreateDocClick);
    $('#addEdu').click(handleAddEduClick);
    $('#editEdu').click(handleEditEduClick);
    $('#delEdu').click(handleDeleteEduClick);

    // Переключение фильтров
    $('.toggle-filters').click(function () {
        const icon = $(this).find('i');
        const isExpanded = $(this).attr('aria-expanded') === 'true';
        icon.toggleClass('bi-chevron-down', !isExpanded).toggleClass('bi-chevron-up', isExpanded);
    });

    // Открытие таблиц всех медосмотров и обучений
    $('#all-med').click(handleAllMedClick);
    $('#all-edu').click(handleAllEduClick);

    // Переключение вкладок
    $('#nav-main-tab').click(handleMainTabClick);
    $('#nav-med-tab').click(handleMedTabClick);
    $('#nav-education-tab').click(handleEducationTabClick);

    // Сортировка сотрудников
    $('#asc-sort').click(() => sortWorkersByFIO('asc'));
    $('#desc-sort').click(() => sortWorkersByFIO('desc'));

    // Фильтрация сотрудников
    $('#all').click(() => filterWorkers({ gender: '' }));
    $('#male').click(() => filterWorkers({ gender: 'M' }));
    $('#female').click(() => filterWorkers({ gender: 'F' }));
    $('#age_from').change(() => filterWorkers({ min_age: $('#age_from').val() }));
    $('#age_to').change(() => filterWorkers({ max_age: $('#age_to').val() }));
    $('#allEdu').click(() => filterWorkers({ is_edu: 'a' }));
    $('#ed').click(() => filterWorkers({ is_edu: 'e' }));
    $('#ned').click(() => filterWorkers({ is_edu: 'ne' }));

    // Выбор строк в таблицах
    $('#nav-med').on('click', '#info-tbl-med tbody tr', handleMedRowClick);
    $('#nav-education').on('click', '#info-tbl-education tbody tr', handleEduRowClick);

    // Поиск сотрудников
    $('#search-input').keyup(handleSearchInput);

    // Сброс фильтров дат
    $('#resetMedDates').click(() => {
        $('#medDateFrom, #medDateTo').val('');
        filterMedTable();
    });
    $('#resetEduDates').click(() => {
        $('#eduDateFrom, #eduDateTo').val('');
        filterEduTable();
    });

    // Фильтрация таблиц по датам
    $('#medDateFrom, #medDateTo').on('change', filterMedTable);
    $('#eduDateFrom, #eduDateTo').on('change', filterEduTable);

    // Обновление уведомлений
    $(document).on('updateNotify', fetchNotifications);
}

/**
 * Обработчик клика по кнопке редактирования сотрудника
 */
function handleEditWorkerClick() {
    if (!worker_id) {
        showNotification('Сотрудник не выбран', 'error');
        return;
    }
    $('#editWorkerModal').modal('show');
}

/**
 * Обработчик клика по кнопке удаления сотрудника
 */
function handleDeleteWorkerClick() {
    if (!worker_id) {
        showNotification('Сотрудник не выбран', 'error');
        return;
    }
    $('#delWorkerModal').modal('show');
}

/**
 * Обработчик клика по кнопке добавления медосмотра
 */
function handleAddMedClick() {
    if (!worker_id) {
        showNotification('Сотрудник не выбран', 'error');
        return;
    }
    $('#addMedModal').modal('show');
}

/**
 * Обработчик клика по кнопке редактирования медосмотра
 */
function handleEditMedClick() {
    if (!worker_id || !selectedMedID) {
        showNotification('Сотрудник или медосмотр не выбраны', 'error');
        return;
    }
    $('#editMedModal').modal('show');
}

/**
 * Обработчик клика по кнопке удаления медосмотра
 */
function handleDeleteMedClick() {
    if (!worker_id || !selectedMedID) {
        showNotification('Сотрудник или медосмотр не выбраны', 'error');
        return;
    }
    $('#delMedModal').modal('show');
}

/**
 * Обработчик клика по кнопке создания документа
 */
function handleCreateDocClick() {
    if (!worker_id) {
        showNotification('Сотрудник не выбран', 'error');
        return;
    }
    $('#mednapravModal').modal('show');
}

/**
 * Обработчик клика по кнопке добавления обучения
 */
function handleAddEduClick() {
    if (!worker_id) {
        showNotification('Сотрудник не выбран', 'error');
        return;
    }
    $('#addEduModal').modal('show');
}

/**
 * Обработчик клика по кнопке редактирования обучения
 */
function handleEditEduClick() {
    if (!worker_id || !selectedEducationID) {
        showNotification('Сотрудник или обучение не выбраны', 'error');
        return;
    }
    $('#editEduModal').modal('show');
}

/**
 * Обработчик клика по кнопке удаления обучения
 */
function handleDeleteEduClick() {
    if (!worker_id || !selectedEducationID) {
        showNotification('Сотрудник или обучение не выбраны', 'error');
        return;
    }
    $('#delEduModal').modal('show');
}

/**
 * Обработчик клика по кнопке просмотра всех медосмотров
 */
async function handleAllMedClick() {
    $('#allMedLoadingSpinner').removeClass('d-none');
    $('#allMedContent').addClass('d-none');
    $('#allMedModal').modal('show');

    try {
        const url = new URL(API_ENDPOINTS.MED);
        const { data, status } = await sendGetRequest(url);

        if (status === 'SUCCESS') {
            renderMedTable(data);
            $('#allMedicalExamsTable .sortable').addClass('none');
            $('#allMedSearch').val('');
            filterMedTable();
        } else {
            showNotification('Ошибка загрузки медосмотров', 'error');
        }
    } catch (error) {
        console.error('Ошибка при загрузке медосмотров:', error);
        showNotification('Ошибка загрузки медосмотров', 'error');
    } finally {
        $('#allMedLoadingSpinner').addClass('d-none');
        $('#allMedContent').removeClass('d-none');
    }
}

/**
 * Обработчик клика по кнопке просмотра всех обучений
 */
async function handleAllEduClick() {
    $('#allEduLoadingSpinner').removeClass('d-none');
    $('#allEduContent').addClass('d-none');
    $('#allEduModal').modal('show');

    try {
        const url = new URL(API_ENDPOINTS.EDU);
        const { data, status } = await sendGetRequest(url);

        if (status === 'SUCCESS') {
            renderEduTable(data);
            $('#allEducationsTable .sortable').addClass('none');
            $('#allEduSearch').val('');
            filterEduTable();
        } else {
            showNotification('Ошибка загрузки обучений', 'error');
        }
    } catch (error) {
        console.error('Ошибка при загрузке обучений:', error);
        showNotification('Ошибка загрузки обучений', 'error');
    } finally {
        $('#allEduLoadingSpinner').addClass('d-none');
        $('#allEduContent').removeClass('d-none');
    }
}

/**
 * Обработчик клика по вкладке основной информации
 */
async function handleMainTabClick() {
    if ($('#nav-main-tab').attr('aria-selected') === 'true') {
        tab_id = 1;
        if (worker_id) await getWorkerData(worker_id);
    }
}

/**
 * Обработчик клика по вкладке медосмотров
 */
async function handleMedTabClick() {
    if ($('#nav-med-tab').attr('aria-selected') === 'true') {
        tab_id = 2;
        if (worker_id) await getWorkerData(worker_id);
    }
}

/**
 * Обработчик клика по вкладке обучений
 */
async function handleEducationTabClick() {
    if ($('#nav-education-tab').attr('aria-selected') === 'true') {
        tab_id = 3;
        if (worker_id) await getWorkerData(worker_id);
    }
}

/**
 * Обработчик клика по строке таблицы медосмотров
 * @param {Event} event - Событие клика
 */
function handleMedRowClick(event) {
    const $row = $(this);
    if ($row.hasClass('no-data')) return;
    selectedMedID = $row.data('id');
    $row.addClass('selected-row').siblings().removeClass('selected-row');
}

/**
 * Обработчик клика по строке таблицы обучений
 * @param {Event} event - Событие клика
 */
function handleEduRowClick(event) {
    const $row = $(this);
    if ($row.hasClass('no-data')) return;
    selectedEducationID = $row.data('id');
    $row.addClass('selected-row').siblings().removeClass('selected-row');
}

/**
 * Обработчик ввода в поле поиска сотрудников
 */
async function handleSearchInput() {
    const query = $(this).val();
    const url = new URL(API_ENDPOINTS.WORKER_SEARCH);
    const $container = $('#worker-container');

    $container.html('<div class="text-muted text-center">Загрузка списка сотрудников...</div>');

    try {
        const { employees } = await sendPostRequest(url, { query });
        renderWorkers(employees);
    } catch (error) {
        console.error('Ошибка при поиске сотрудников:', error);
        $container.html('<div class="text-muted text-center">Ошибка загрузки сотрудников</div>');
    }
}

// === Функции рендеринга ===
/**
 * Отрисовывает таблицу медосмотров
 * @param {Array<Object>} data - Данные медосмотров
 */
function renderMedTable(data) {
    const $tbody = $('#allMedicalExamsTableBody');
    $tbody.empty();
    originalMedRows = [];

    data.forEach((el, index) => {
        const attachmentsHtml = getAttachmentsHtml(el.attachments, el.id);
        const $row = $(`
            <tr data-attachments-count="${el.attachments ? el.attachments.length : 0}">
                <td>${index + 1}</td>
                <td>${el.owner || '-'}</td>
                <td>${el.type || '-'}</td>
                <td>${el.date_from || '-'}</td>
                <td>${el.date_to || '-'}</td>
                <td>${attachmentsHtml}</td>
            </tr>
        `);
        $tbody.append($row);
        originalMedRows.push($row.clone());
    });
}

/**
 * Отрисовывает таблицу обучений
 * @param {Array<Object>} data - Данные обучений
 */
function renderEduTable(data) {
    const $tbody = $('#allEducationsTableBody');
    $tbody.empty();
    originalEduRows = [];

    data.forEach((el, index) => {
        const attachmentsHtml = getAttachmentsHtml(el.attachments, el.id);
        const $row = $(`
            <tr data-attachments-count="${el.attachments ? el.attachments.length : 0}">
                <td>${index + 1}</td>
                <td>${el.owner || '-'}</td>
                <td>${el.program || '-'}</td>
                <td>${el.protocol_num || '-'}</td>
                <td>${el.udostoverenie_num || '-'}</td>
                <td>${el.hours || '-'}</td>
                <td>${el.date_from || '-'}</td>
                <td>${el.date_to || '-'}</td>
                <td>${attachmentsHtml}</td>
            </tr>
        `);
        $tbody.append($row);
        originalEduRows.push($row.clone());
    });
}

/**
 * Отрисовывает список сотрудников
 * @param {Array<Object>} employees - Данные сотрудников
 */
function renderWorkers(employees) {
    const $container = $('#worker-container');
    $container.empty();

    if (!employees.length) {
        $container.append('<div class="text-muted text-center">Нет сотрудников</div>');
        return;
    }

    employees.forEach(el => {
        const $worker = $('<div>', {
            class: 'worker',
            'data-id': el.id,
            text: getInitials(el.FIO)
        });

        $worker.on('click', () => {
            getWorkerData(el.id);
            clickOnWorker($worker);
        });

        if (worker_id && worker_id === $worker.data('id')) {
            clickOnWorker($worker);
        }

        $container.append($worker);
    });

    if ($container.html()) {
        sortWorkersByFIO(sort_type);
    }
}

/**
 * Формирует HTML для вложений
 * @param {Array<Object>} attachments - Список вложений
 * @param {number} id - Идентификатор записи
 * @returns {string} HTML-код вложений
 */
function getAttachmentsHtml(attachments, id) {
    if (!attachments || !Array.isArray(attachments) || !attachments.length) {
        return '-';
    }

    const fileLinks = attachments.map(attachment => {
        const fileName = attachment.name && attachment.name.trim() ? attachment.name : `file_${attachment.id || 'unknown'}`;
        if (!attachment.name || !attachment.id) {
            console.warn(`Некорректные данные вложения для ID ${id}:`, attachment);
        }
        return `
            <a href="/files/preview/${attachment.id}/" target="_blank" class="file-link" title="${fileName}">
                <i class="bi ${getFileIcon(fileName)}"></i> ${fileName}
            </a>
        `;
    }).join('');

    return `<div class="file-list">${fileLinks}</div>`;
}

// === Функции фильтрации ===
/**
 * Фильтрует таблицу медосмотров по поиску и датам
 */
function filterMedTable() {
    const searchText = $('#allMedSearch').val().toLowerCase();
    const dateFrom = $('#medDateFrom').val();
    const dateTo = $('#medDateTo').val();
    const $tbody = $('#allMedicalExamsTableBody');
    $tbody.empty();

    const filteredRows = originalMedRows.filter(row => {
        const rowText = $(row).text().toLowerCase();
        const rowDateFrom = $(row).find('td:eq(3)').text();
        const rowDateTo = $(row).find('td:eq(4)').text();

        const textMatch = !searchText || rowText.includes(searchText);
        let dateMatch = true;

        if (dateFrom || dateTo) {
            const fromDate = dateFrom ? new Date(dateFrom) : null;
            const toDate = dateTo ? new Date(dateTo) : null;
            const examDateFrom = parseDate(rowDateFrom);
            const examDateTo = parseDate(rowDateTo);

            if (fromDate && (!examDateFrom || examDateFrom < fromDate)) {
                dateMatch = false;
            }
            if (toDate && (!examDateTo || examDateTo > toDate)) {
                dateMatch = false;
            }
        }

        return textMatch && dateMatch;
    });

    renderFilteredRows($tbody, filteredRows, MED_TABLE_COLUMNS);
}

/**
 * Фильтрует таблицу обучений по поиску и датам
 */
function filterEduTable() {
    const searchText = $('#allEduSearch').val().toLowerCase();
    const dateFrom = $('#eduDateFrom').val();
    const dateTo = $('#eduDateTo').val();
    const $tbody = $('#allEducationsTableBody');
    $tbody.empty();

    const filteredRows = originalEduRows.filter(row => {
        const rowText = $(row).text().toLowerCase();
        const rowDateFrom = $(row).find('td:eq(6)').text();
        const rowDateTo = $(row).find('td:eq(7)').text();

        const textMatch = !searchText || rowText.includes(searchText);
        let dateMatch = true;

        if (dateFrom || dateTo) {
            const fromDate = dateFrom ? new Date(dateFrom) : null;
            const toDate = dateTo ? new Date(dateTo) : null;
            const eduDateFrom = parseDate(rowDateFrom);
            const eduDateTo = parseDate(rowDateTo);

            if (fromDate && (!eduDateTo || eduDateTo < fromDate)) {
                dateMatch = false;
            }
            if (toDate && (!eduDateFrom || eduDateFrom > toDate)) {
                dateMatch = false;
            }
        }

        return textMatch && dateMatch;
    });

    renderFilteredRows($tbody, filteredRows, EDU_TABLE_COLUMNS);
}

/**
 * Отрисовывает отфильтрованные строки таблицы
 * @param {jQuery} $tbody - Элемент tbody таблицы
 * @param {Array<jQuery>} rows - Отфильтрованные строки
 * @param {number} colSpan - Количество столбцов для пустой строки
 */
function renderFilteredRows($tbody, rows, colSpan) {
    if (!rows.length) {
        $tbody.append(`<tr class="no-data"><td colspan="${colSpan}" style="text-align: center">Записей нет</td></tr>`);
    } else {
        rows.forEach((row, index) => {
            const newRow = row.clone();
            newRow.find('td:first').text(index + 1);
            $tbody.append(newRow);
        });
    }
}

// === Функции сортировки ===
/**
 * Настраивает сортировку таблиц
 */
function setupTableSorting() {
    setupMedTableSorting();
    setupEduTableSorting();
    setupSortableColumns();
}

/**
 * Настраивает сортировку таблицы медосмотров
 */
function setupMedTableSorting() {
    $('#info-tbl-med>thead th.sortable-med').click(function () {
        const $table = $('#info-tbl-med');
        if ($table.find('tbody tr.no-data').length) return;

        const column = $(this).index();
        const isNumeric = $(this).hasClass('numeric');
        const isDate = $(this).hasClass('date');
        const currentSort = $(this).hasClass('sorted-asc') ? 'asc' : $(this).hasClass('sorted-desc') ? 'desc' : 'none';

        $table.find('th').removeClass('sorted-asc sorted-desc');
        const newSort = currentSort === 'asc' ? 'desc' : 'asc';
        $(this).addClass(`sorted-${newSort}`);

        sortTableRows($table, column, newSort, isNumeric, isDate);
    });
}

/**
 * Настраивает сортировку таблицы обучений
 */
function setupEduTableSorting() {
    $('#info-tbl-education>thead th.sortable-edu').click(function () {
        const $table = $('#info-tbl-education');
        if ($table.find('tbody tr.no-data').length) return;

        const column = $(this).index();
        const isNumeric = $(this).hasClass('numeric');
        const isDate = $(this).hasClass('date');
        const currentSort = $(this).hasClass('sorted-asc') ? 'asc' : $(this).hasClass('sorted-desc') ? 'desc' : 'none';

        $table.find('th').removeClass('sorted-asc sorted-desc');
        const newSort = currentSort === 'none' || currentSort === 'desc' ? 'asc' : 'desc';
        $(this).addClass(`sorted-${newSort}`);

        sortTableRows($table, column, newSort, isNumeric, isDate);
    });
}

/**
 * Настраивает сортировку для столбцов с классом .sortable
 */
function setupSortableColumns() {
    $('.sortable').click(function () {
        const $table = $(this).closest('table');
        if ($table.find('tbody tr.no-data').length) return;

        const column = $(this).data('column');
        const sortable = $(this).data('sortable');
        if (sortable === false) return;

        const tableId = $table.attr('id');
        const $tbody = $table.find('tbody');
        const isMedTable = tableId === 'allMedicalExamsTable';
        const originalRows = isMedTable ? originalMedRows : originalEduRows;

        let currentSort = $(this).hasClass('asc') ? 'asc' : $(this).hasClass('desc') ? 'desc' : 'none';
        const newSort = currentSort === 'none' || currentSort === 'desc' ? 'asc' : 'desc';

        $(`#${tableId} .sortable`).removeClass('asc desc').addClass('none');
        $(this).removeClass('none').addClass(newSort);

        if (newSort === 'none') {
            $tbody.empty();
            originalRows.forEach((row, index) => {
                const newRow = row.clone();
                newRow.find('td:first').text(index + 1);
                $tbody.append(newRow);
            });
        } else {
            const rows = $tbody.find('tr').get();
            rows.sort((a, b) => {
                const aValue = $(a).find(`td:eq(${$table.find(`th[data-column="${column}"]`).index()})`).text().trim();
                const bValue = $(b).find(`td:eq(${$table.find(`th[data-column="${column}"]`).index()})`).text().trim();
                return compareValues(aValue, bValue, newSort, column);
            });

            $tbody.empty();
            rows.forEach((row, index) => {
                if (!$(row).hasClass('no-data')) {
                    $(row).find('td:first').text(index + 1);
                }
                $tbody.append(row);
            });
        }
    });
}

/**
 * Сортирует строки таблицы
 * @param {jQuery} $table - Таблица
 * @param {number} column - Индекс столбца
 * @param {string} sortOrder - Порядок сортировки (asc/desc)
 * @param {boolean} isNumeric - Является ли столбец числовым
 * @param {boolean} isDate - Является ли столбец датой
 */
function sortTableRows($table, column, sortOrder, isNumeric, isDate) {
    const rows = $table.find('tbody tr').get();

    rows.sort((a, b) => {
        let aValue = $(a).find('td').eq(column).text().trim();
        let bValue = $(b).find('td').eq(column).text().trim();

        if (isNumeric) {
            aValue = parseFloat(aValue) || 0;
            bValue = parseFloat(bValue) || 0;
            return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        } else if (isDate) {
            aValue = parseDate(aValue);
            bValue = parseDate(bValue);
            return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        } else {
            return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
    });

    $table.find('tbody').empty().append(rows);
    $table.find('tbody tr:not(.no-data)').each((index, row) => {
        $(row).find('td:first').text(index + 1);
    });
}

/**
 * Сравнивает значения для сортировки
 * @param {string} aValue - Первое значение
 * @param {string} bValue - Второе значение
 * @param {string} sortOrder - Порядок сортировки (asc/desc)
 * @param {string} column - Название столбца
 * @returns {number} Результат сравнения
 */
function compareValues(aValue, bValue, sortOrder, column) {
    if (column === 'date_from' || column === 'date_to') {
        const aDate = parseDate(aValue);
        const bDate = parseDate(bValue);
        return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
    } else if (column === 'hours') {
        const aNum = parseInt(aValue) || 0;
        const bNum = parseInt(bValue) || 0;
        return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
    } else if (column === 'attachments_count') {
        const aNum = parseInt(aValue) || 0;
        const bNum = parseInt(bValue) || 0;
        return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
    } else {
        const aStr = aValue.toLowerCase();
        const bStr = bValue.toLowerCase();
        return sortOrder === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    }
}

/**
 * Сортирует сотрудников по ФИО
 * @param {string} order - Порядок сортировки (asc/desc)
 */
function sortWorkersByFIO(order = 'asc') {
    const $container = $('#worker-container');
    const workers = $('.worker').detach();

    workers.sort((a, b) => {
        const aFIO = $(a).html().toLowerCase();
        const bFIO = $(b).html().toLowerCase();
        return order === 'asc' ? aFIO.localeCompare(bFIO) : bFIO.localeCompare(aFIO);
    });

    $container.append(workers);
    sort_type = order;
}

// === Функции получения данных ===
/**
 * Получает данные сотрудника и обновляет интерфейс
 * @param {number} id - Идентификатор сотрудника
 */
async function getWorkerData(id) {
    if (!Number.isInteger(id)) {
        console.error('Некорректный ID сотрудника:', id);
        return;
    }

    if (id !== worker_id) {
        worker_id = id;
        await getFIO(id);
    }

    switch (tab_id) {
        case 1:
            await getMainData(id);
            break;
        case 2:
            await getMedData(id);
            break;
        case 3:
            await getEducationData(id);
            break;
        default:
            console.warn('Неизвестный tab_id:', tab_id);
    }
}

/**
 * Получает ФИО сотрудника
 * @param {number} id - Идентификатор сотрудника
 */
async function getFIO(id) {
    const url = new URL(`${API_ENDPOINTS.FIO}${id}`);
    const $fioElement = $('#worker-info-fio');
    $fioElement.html('Загрузка данных...');

    try {
        const data = await sendGetRequest(url);
        $fioElement.html(data.FIO || '-');
    } catch (error) {
        console.error('Ошибка при загрузке ФИО:', error);
        $fioElement.html('Ошибка загрузки');
    }
}

/**
 * Получает основную информацию о сотруднике
 * @param {number} id - Идентификатор сотрудника
 */
async function getMainData(id) {
    const url = new URL(API_ENDPOINTS.FILTER);
    url.searchParams.set('id', id);
    const $tbody = $('#info-tbl-main tbody');

    $tbody.html('<tr><td colspan="9" style="text-align: center">Загрузка данных...</td></tr>');

    try {
        const { status, employees } = await sendGetRequest(url);
        if (status === 'SUCCESS') {
            $('#worker-info-fio').html(employees.FIO || '-');
            $tbody.html(`
                <tr data-id="${employees.id}">
                    <td>${$tbody.find('tr').length}</td>
                    <td>${employees.birthday || '-'}</td>
                    <td>${employees.gender || '-'}</td>
                    <td>${employees.oms_number || '-'}</td>
                    <td>${employees.dms_number || '-'}</td>
                    <td>${employees.department || '-'}</td>
                    <td>${employees.position || '-'}</td>
                    <td>${employees.status || '-'}</td>
                    <td>${employees.is_edu ? 'да' : 'нет'}</td>
                </tr>
            `);
        } else {
            $tbody.html('<tr class="no-data"><td colspan="9" style="text-align: center">Данные не найдены</td></tr>');
        }
    } catch (error) {
        console.error('Ошибка при загрузке основной информации:', error);
        $tbody.html('<tr class="no-data"><td colspan="9" style="text-align: center">Ошибка загрузки данных</td></tr>');
    }
}

/**
 * Получает данные о медосмотрах сотрудника
 * @param {number} id - Идентификатор сотрудника
 */
async function getMedData(id) {
    const url = new URL(`${API_ENDPOINTS.MED_DATA}${id}`);
    const $tbody = $('#info-tbl-med tbody');

    $tbody.html('<tr><td colspan="5" style="text-align: center">Загрузка данных...</td></tr>');

    try {
        const { data } = await sendGetRequest(url);
        if (!data || !Array.isArray(data)) {
            throw new Error('Некорректные данные медосмотров');
        }

        $tbody.empty();
        if (data.length) {
            data.forEach((el, index) => {
                const attachmentsHtml = getAttachmentsHtml(el.attachments, el.id);
                $tbody.append(`
                    <tr data-id="${el.id}">
                        <td>${index + 1}</td>
                        <td>${el.type || '-'}</td>
                        <td>${el.date_from || '-'}</td>
                        <td>${el.date_to || '-'}</td>
                        <td>${attachmentsHtml}</td>
                    </tr>
                `);
            });
        } else {
            $tbody.html('<tr class="no-data"><td colspan="5" style="text-align: center">Записей нет</td></tr>');
        }
    } catch (error) {
        console.error('Ошибка при загрузке данных о медосмотрах:', error);
        $tbody.html('<tr class="no-data"><td colspan="5" style="text-align: center">Ошибка загрузки данных</td></tr>');
    }
}

/**
 * Получает данные об обучении сотрудника
 * @param {number} id - Идентификатор сотрудника
 */
async function getEducationData(id) {
    const url = `${API_ENDPOINTS.EDUCATION_DATA}${id}`;
    const $tbody = $('#info-tbl-education tbody');

    $tbody.html('<tr><td colspan="8" style="text-align: center">Загрузка данных...</td></tr>');

    try {
        const { data } = await sendGetRequest(url);
        if (!data || !Array.isArray(data)) {
            throw new Error('Некорректные данные обучений');
        }

        $tbody.empty();
        if (data.length) {
            data.forEach((el, index) => {
                const attachmentsHtml = getAttachmentsHtml(el.attachments, el.id);
                $tbody.append(`
                    <tr data-id="${el.id}">
                        <td>${index + 1}</td>
                        <td>${el.program || '-'}</td>
                        <td>${el.protocol_num || '-'}</td>
                        <td>${el.udostoverenie_num || '-'}</td>
                        <td>${el.hours || '-'}</td>
                        <td>${el.date_from || '-'}</td>
                        <td>${el.date_to || '-'}</td>
                        <td>${attachmentsHtml}</td>
                    </tr>
                `);
            });
        } else {
            $tbody.html('<tr class="no-data"><td colspan="8" style="text-align: center">Записей нет</td></tr>');
        }
    } catch (error) {
        console.error('Ошибка при загрузке данных об обучении:', error);
        $tbody.html('<tr class="no-data"><td colspan="8" style="text-align: center">Ошибка загрузки данных</td></tr>');
    }
}

/**
 * Фильтрует сотрудников по заданным параметрам
 * @param {Object} params - Параметры фильтрации
 * @param {string|null} params.gender - Пол сотрудника
 * @param {string|null} params.min_age - Минимальный возраст
 * @param {string|null} params.max_age - Максимальный возраст
 * @param {string|null} params.order - Порядок сортировки
 * @param {string} params.is_edu - Наличие обучения
 */
async function filterWorkers({ gender = null, min_age = null, max_age = null, order = null, is_edu = 'a' } = {}) {
    const url = new URL(API_ENDPOINTS.FILTER);
    const $container = $('#worker-container');

    $container.html('<div class="text-muted text-center">Загрузка списка сотрудников...</div>');

    if (gender) url.searchParams.set('gender', gender);
    if (is_edu) url.searchParams.set('is_edu', is_edu);
    if (min_age) url.searchParams.set('min_age', min_age);
    if (max_age) url.searchParams.set('max_age', max_age);
    if (order) url.searchParams.set('order', order);

    try {
        const { employees } = await sendGetRequest(url);
        renderWorkers(employees);
    } catch (error) {
        console.error('Ошибка при фильтрации сотрудников:', error);
        $container.html('<div class="text-muted text-center">Ошибка загрузки сотрудников</div>');
    }
}

// === Вспомогательные функции ===
/**
 * Парсит дату из строки
 * @param {string} dateStr - Строка с датой
 * @returns {Date} Объект Date или минимальная дата при ошибке
 */
function parseDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') {
        console.warn(`Некорректная строка даты: ${dateStr}`);
        return new Date(0);
    }

    const ddmmyyyyMatch = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (ddmmyyyyMatch) {
        const day = parseInt(ddmmyyyyMatch[1], 10);
        const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
        const year = parseInt(ddmmyyyyMatch[3], 10);
        const date = new Date(year, month, day);

        if (isNaN(date.getTime()) || date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
            console.warn(`Некорректные компоненты даты: ${dateStr}`);
            return new Date(0);
        }
        return date;
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        console.warn(`Не удалось распарсить дату: ${dateStr}`);
        return new Date(0);
    }
    return date;
}

/**
 * Возвращает иконку для файла по его расширению
 * @param {string} fileName - Имя файла
 * @returns {string} Класс иконки Bootstrap
 */
function getFileIcon(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const icons = {
        pdf: 'bi-file-earmark-pdf',
        doc: 'bi-file-earmark-word',
        docx: 'bi-file-earmark-word',
        xls: 'bi-file-earmark-excel',
        xlsx: 'bi-file-earmark-excel',
        jpg: 'bi-file-earmark-image',
        jpeg: 'bi-file-earmark-image',
        png: 'bi-file-earmark-image',
        gif: 'bi-file-earmark-image',
        txt: 'bi-file-earmark-text',
        zip: 'bi-file-earmark-zip',
        rar: 'bi-file-earmark-zip'
    };
    return icons[ext] || 'bi-file-earmark';
}

/**
 * Формирует инициалы из ФИО
 * @param {string} FIO - Полное ФИО
 * @returns {string} Форматированные инициалы
 */
function getInitials(FIO) {
    if (!FIO || typeof FIO !== 'string') {
        return FIO || '';
    }

    const parts = FIO.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '';

    const lastName = parts[0];
    let initials = '';

    if (parts.length >= 2) {
        const firstName = parts[1];
        initials += `${firstName.charAt(0)}. `;
    }

    if (parts.length >= 3) {
        const middleName = parts[2];
        initials += `${middleName.charAt(0)}.`;
    }

    if (parts.length === 2 && parts[1].endsWith('.') && parts[1].length <= 3) {
        return FIO.trim();
    }

    return parts.length === 1 ? lastName : `${lastName} ${initials}`.trim();
}

/**
 * Выделяет выбранного сотрудника в интерфейсе
 * @param {jQuery} $obj - Элемент сотрудника
 */
function clickOnWorker($obj) {
    $('.worker').removeClass('selected-item');
    $obj.addClass('selected-item');
}