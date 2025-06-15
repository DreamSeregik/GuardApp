let tab_id = 1;
let worker_id = null;
let selectedMedID = null;
let selectedEducationID = null;
let sort_type = "desc";
let filter_query = {};

let originalMedRows = [];
let originalEduRows = [];

$(document).ready(async function () {
    $("#addNewWorker").click(() => {
        $("#addWorkerModal").modal("show");
    });

    $("#editWorker").click(() => {
        if (!worker_id) {
            showNotification("не выбран сотрудник")
            return
        }
        $("#editWorkerModal").modal("show");
    });

    $("#delWorker").click(() => {
        if (!worker_id) {
            showNotification("не выбран сотрудник")
            return
        }
        $("#delWorkerModal").modal("show");
    });

    $("#addMed").click(() => {
        if (!worker_id) {
            showNotification("не выбран сотрудник")
            return
        }
        $("#addMedModal").modal("show");
    });

    $("#editMed").click(() => {
        if (!worker_id || !selectedMedID) {
            showNotification("не выбран сотрудник или медосмотр")
            return
        }
        $("#editMedModal").modal("show");
    });

    $("#delMed").click(() => {
        if (!worker_id || !selectedMedID) {
            showNotification("не выбран сотрудник или медосмотр")
            return
        }
        $("#delMedModal").modal("show");
    });

    $("#createDoc").click(() => {
        if (!worker_id) {
            showNotification("не выбран сотрудник")
            return
        }
        $("#mednapravModal").modal("show");
    });

    $("#addEdu").click(() => {
        if (!worker_id) {
            showNotification("не выбран сотрудник")
            return
        }
        $("#addEduModal").modal("show");
    });

    $("#editEdu").click(() => {
        if (!worker_id || !selectedEducationID) {
            showNotification("не выбран сотрудник или обучение")
            return
        }
        $("#editEduModal").modal("show");
    });

    $("#delEdu").click(() => {
        if (!worker_id || !selectedEducationID) {
            showNotification("не выбран сотрудник или обучение")
            return
        }
        $("#delEduModal").modal("show");
    });

    $(".toggle-filters").click(function () {
        const icon = $(this).find("i");
        const isExpanded = $(this).attr("aria-expanded") === 'true';
        icon.toggleClass('bi-chevron-down', !isExpanded).toggleClass('bi-chevron-up', isExpanded);
    });

    $("#all-med").click(async () => {
        const url = new URL(MED);
        const { data, status } = await sendGetRequest(url);
        if (status === "SUCCESS") {
            const tbody = $("#allMedicalExamsTableBody");
            tbody.empty();
            originalMedRows = [];
            data.forEach((el, index) => {
                let attachmentsHtml = "-";
                if (el.attachments && el.attachments.length > 0) {
                    const fileLinks = el.attachments.map(attachment => {
                        const fileName = attachment.name && attachment.name.trim() ? attachment.name : `file_${attachment.id}`;
                        if (!attachment.name) {
                            console.warn(`Empty or invalid file name for attachment ID ${attachment.id}:`, attachment);
                        }
                        return `<a href="/files/preview/${attachment.id}/" target="_blank" class="file-link" title="${fileName}">
                        <i class="bi ${getFileIcon(fileName)}"></i> ${fileName}
                    </a>`;
                    }).join("");
                    attachmentsHtml = `<div class="file-list">${fileLinks}</div>`;
                }
                const row = $(`<tr data-attachments-count="${el.attachments ? el.attachments.length : 0}">
                <td>${index + 1}</td>
                <td>${el.owner}</td>
                <td>${el.type}</td>
                <td>${el.date_from}</td>
                <td>${el.date_to}</td>
                <td>${attachmentsHtml}</td>
            </tr>`);
                tbody.append(row);
                originalMedRows.push(row.clone());
            });
            $("#allMedicalExamsTable .sortable").addClass("none");
            $("#allMedModal").modal("show");

            // Reset search input
            $("#allMedSearch").val("");
            filterMedTable(); // Apply initial filter (show all)
        }
    });

    // All Educations Modal Click Handler
    $("#all-edu").click(async () => {
        const url = new URL(EDU);
        const { data, status } = await sendGetRequest(url);
        if (status === "SUCCESS") {
            const tbody = $("#allEducationsTableBody");
            tbody.empty();
            originalEduRows = [];
            data.forEach((el, index) => {
                let attachmentsHtml = "-";
                if (el.attachments && el.attachments.length > 0) {
                    const fileLinks = el.attachments.map(attachment => {
                        const fileName = attachment.name && attachment.name.trim() ? attachment.name : `file_${attachment.id}`;
                        if (!attachment.name) {
                            console.warn(`Empty or invalid file name for attachment ID ${attachment.id}:`, attachment);
                        }
                        return `<a href="/files/preview/${attachment.id}/" target="_blank" class="file-link" title="${fileName}">
                        <i class="bi ${getFileIcon(fileName)}"></i> ${fileName}
                    </a>`;
                    }).join("");
                    attachmentsHtml = `<div class="file-list">${fileLinks}</div>`;
                }
                const row = $(`<tr data-attachments-count="${el.attachments ? el.attachments.length : 0}">
                <td>${index + 1}</td>
                <td>${el.owner}</td>
                <td>${el.program}</td>
                <td>${el.protocol_num}</td>
                <td>${el.udostoverenie_num}</td>
                <td>${el.hours}</td>
                <td>${el.date_from}</td>
                <td>${el.date_to}</td>
                <td>${attachmentsHtml}</td>
            </tr>`);
                tbody.append(row);
                originalEduRows.push(row.clone());
            });
            $("#allEducationsTable .sortable").addClass("none");
            $("#allEduModal").modal("show");

            // Reset search input
            $("#allEduSearch").val("");
            filterEduTable(); // Apply initial filter (show all)
        }
    });

    // Search Functionality for Medical Exams Table
    function filterMedTable() {
        const searchText = $("#allMedSearch").val().toLowerCase();
        const dateFrom = $("#medDateFrom").val();
        const dateTo = $("#medDateTo").val();
        const tbody = $("#allMedicalExamsTableBody");
        tbody.empty();

        const filteredRows = originalMedRows.filter(row => {
            const rowText = $(row).text().toLowerCase();
            const rowDateFrom = $(row).find("td:eq(3)").text(); // Дата прохождения
            const rowDateTo = $(row).find("td:eq(4)").text();   // Дата окончания

            // Проверка поиска
            const textMatch = searchText === '' || rowText.includes(searchText);

            // Проверка дат
            let dateMatch = true;
            if (dateFrom || dateTo) {
                const fromDate = dateFrom ? new Date(dateFrom) : null;
                const toDate = dateTo ? new Date(dateTo) : null;
                const examDateFrom = parseDate(rowDateFrom);
                const examDateTo = parseDate(rowDateTo);

                // Если указана дата "с", то дата прохождения должна быть >= этой даты
                if (fromDate && examDateFrom <= fromDate) {
                    dateMatch = false;
                }
                // Если указана дата "по", то дата окончания должна быть <= этой даты
                if (toDate && examDateTo >= toDate) {
                    dateMatch = false;
                }
            }

            return textMatch && dateMatch;
        });

        if (filteredRows.length === 0) {
            tbody.append('<tr class="no-data"><td colspan="6" style="text-align: center">Записей нет</td></tr>');
        } else {
            filteredRows.forEach((row, index) => {
                const newRow = row.clone();
                newRow.find("td:first").text(index + 1); // Update row number
                tbody.append(newRow);
            });
        }
    }

    function filterEduTable() {
        const searchText = $("#allEduSearch").val().toLowerCase();
        const dateFrom = $("#eduDateFrom").val();
        const dateTo = $("#eduDateTo").val();
        const tbody = $("#allEducationsTableBody");
        tbody.empty();

        const filteredRows = originalEduRows.filter(row => {
            const rowText = $(row).text().toLowerCase();
            const rowDateFrom = $(row).find("td:eq(6)").text(); // Дата начала обучения
            const rowDateTo = $(row).find("td:eq(7)").text();   // Дата окончания обучения

            // Проверка текстового поиска
            const textMatch = searchText === '' || rowText.includes(searchText);

            // Проверка дат
            let dateMatch = true;
            if (dateFrom || dateTo) {
                const fromDate = dateFrom ? new Date(dateFrom) : null;
                const toDate = dateTo ? new Date(dateTo) : null;
                const eduDateFrom = parseDate(rowDateFrom);
                const eduDateTo = parseDate(rowDateTo);

                if (fromDate && eduDateTo <= fromDate) {
                    dateMatch = false;
                }
                if (toDate && eduDateFrom >= toDate) {
                    dateMatch = false;
                }
            }

            return textMatch && dateMatch;
        });

        if (filteredRows.length === 0) {
            tbody.append('<tr class="no-data"><td colspan="9" style="text-align: center">Записей нет</td></tr>');
        } else {
            filteredRows.forEach((row, index) => {
                const newRow = row.clone();
                newRow.find("td:first").text(index + 1); // Update row number
                tbody.append(newRow);
            });
        }
    }

    // Attach search event listeners
    $("#allMedSearch").on("input", filterMedTable);
    $("#allEduSearch").on("input", filterEduTable);


    $(".sortable").click(function () {
        const tableId = $(this).closest("table").attr("id");
        const column = $(this).data("column");
        const sortable = $(this).data("sortable");
        if (sortable === false) return;

        const tbody = $(`#${tableId} tbody`);

        // Проверка наличия строки с классом 'no-data'
        if (tbody.find('tr.no-data').length > 0) {
            return; // Ничего не делаем, если таблица содержит строку 'no-data'
        }

        const isMedTable = tableId === "allMedicalExamsTable";
        const originalRows = isMedTable ? originalMedRows : originalEduRows;

        let currentSort = $(this).hasClass("asc")
            ? "asc"
            : $(this).hasClass("desc")
                ? "desc"
                : "none";

        let newSort = currentSort === "none" || currentSort === "desc"
            ? "asc"
            : currentSort === "asc"
                ? "desc"
                : "none";

        $(`#${tableId} .sortable`).removeClass("asc desc").addClass("none");

        if (newSort === "none") {
            tbody.empty();
            originalRows.forEach((row, index) => {
                const newRow = row.clone();
                newRow.find("td:first").text(index + 1);
                tbody.append(newRow);
            });
        } else {
            const rows = tbody.find("tr").get();
            rows.sort((a, b) => {
                let aValue = $(a).find(`td:eq(${$(`#${tableId} th[data-column="${column}"]`).index()})`).text().trim();
                let bValue = $(b).find(`td:eq(${$(`#${tableId} th[data-column="${column}"]`).index()})`).text().trim();

                if (column === "date_from" || column === "date_to") {
                    const aDate = parseDate(aValue);
                    const bDate = parseDate(bValue);
                    return newSort === "asc" ? aDate - bDate : bDate - aDate;
                } else if (column === "hours") {
                    aValue = parseInt(aValue) || 0;
                    bValue = parseInt(bValue) || 0;
                    return newSort === "asc" ? aValue - bValue : bValue - aValue;
                } else if (column === "attachments_count") {
                    aValue = parseInt($(a).data("attachments-count")) || 0;
                    bValue = parseInt($(b).data("attachments-count")) || 0;
                    return newSort === "asc" ? aValue - bValue : bValue - aValue;
                } else {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                    return newSort === "asc"
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);
                }
            });

            tbody.empty();
            rows.forEach((row, index) => {
                // Обновляем номер строки только для строк без класса 'no-data'
                if (!$(row).hasClass('no-data')) {
                    $(row).find("td:first").text(index + 1);
                }
                tbody.append(row);
            });

            $(this).removeClass("none").addClass(newSort);
        }
    });

    $("#nav-main-tab").click(async () => {
        if ($("#nav-main-tab").attr("aria-selected") === "true") {
            tab_id = 1;
            if (worker_id) await getWorkerData(worker_id);
        }
    });

    $("#nav-med-tab").click(async () => {
        if ($("#nav-med-tab").attr("aria-selected") === "true") {
            tab_id = 2;
            if (worker_id) await getWorkerData(worker_id);
        }
    });

    $("#nav-education-tab").click(async () => {
        if ($("#nav-education-tab").attr("aria-selected") === "true") {
            tab_id = 3;
            if (worker_id) await getEducationData(worker_id);
        }
    });

    $("#asc-sort").click(() => {
        sortWorkersByFIO("asc");
        sort_type = "asc";
    });

    $("#desc-sort").click(() => {
        sortWorkersByFIO("desc");
        sort_type = "desc";
    });

    $("#all").click(async () => {
        filter_query["gender"] = "";
        await filterWorkers(filter_query);
    });
    $("#male").click(async () => {
        filter_query["gender"] = "M";
        await filterWorkers(filter_query);
    });
    $("#female").click(async () => {
        filter_query["gender"] = "F";
        await filterWorkers(filter_query);
    });
    $("#age_from").change(async () => {
        filter_query["min_age"] = $("#age_from").val();
        await filterWorkers(filter_query);
    });
    $("#age_to").change(async () => {
        filter_query["max_age"] = $("#age_to").val();
        await filterWorkers(filter_query);
    });
    $("#allEdu").click(async () => {
        filter_query["is_edu"] = $("#allEdu").val();
        await filterWorkers(filter_query);
    });
    $("#ed").click(async () => {
        filter_query["is_edu"] = $("#ed").val();
        await filterWorkers(filter_query);
    });
    $("#ned").click(async () => {
        filter_query["is_edu"] = $("#ned").val();
        await filterWorkers(filter_query);
    });

    $("#nav-med").on("click", "#info-tbl-med tbody tr", function () {
        if ($(this).hasClass("no-data")) return;
        selectedMedID = $(this).data("id");
        $(this).addClass("selected-row").siblings().removeClass("selected-row");
    });

    $("#nav-education").on("click", "#info-tbl-education tbody tr", function () {
        if ($(this).hasClass("no-data")) return;
        selectedEducationID = $(this).data("id");
        $(this).addClass("selected-row").siblings().removeClass("selected-row");
    });

    $("#search-input").keyup(async function () {
        const url = new URL(WORKER_SEARCH);
        const container = $("#worker-container");
        const { employees } = await sendPostRequest(url, { query: $(this).val() });

        container.empty();

        if (employees.length === 0) {
            container.append('<div class="text-muted text-center">нет сотрудников</div>');
            return;
        }

        employees.forEach((el) => {
            const html = $("<div>", {
                class: "worker",
                "data-id": el.id,
                text: getInitials(el.FIO),
            });

            html.on("click", () => {
                getWorkerData(el.id);
                clickOnWorker(html);
            });

            if (worker_id && worker_id == $(html).data("id"))
                clickOnWorker(html);

            container.append(html);
            if (!container.html() === "") sortWorkersByFIO(sort_type);
        });
    });

    setupMedTableSorting();
    setupEduTableSorting();

    $("#resetMedDates").click(function () {
        $("#medDateFrom").val("");
        $("#medDateTo").val("");
        filterMedTable();
    });

    $("#resetEduDates").click(function () {
        $("#eduDateFrom").val("");
        $("#eduDateTo").val("");
        filterEduTable();
    });

    $("#eduDateFrom, #eduDateTo").on("change", filterEduTable);
    $("#medDateFrom, #medDateTo").on("change", filterMedTable);

    await fetchNotifications();
    setInterval(async () => {
        await fetchNotifications();
    }, 600000);
});

function parseDate(dateStr) {
    if (!dateStr || typeof dateStr !== "string") {
        console.warn(`Invalid date string: ${dateStr}`);
        return new Date(0);
    }

    const ddmmyyyyMatch = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (ddmmyyyyMatch) {
        const day = parseInt(ddmmyyyyMatch[1], 10);
        const month = parseInt(ddmmyyyyMatch[2], 10);
        const year = parseInt(ddmmyyyyMatch[3], 10);

        if (month < 1 || month > 12 || day < 1 || day > 31) {
            console.warn(`Invalid date components: ${dateStr}`);
            return new Date(0);
        }

        const date = new Date(year, month - 1, day);
        if (isNaN(date.getTime())) {
            console.warn(`Failed to create valid date from: ${dateStr}`);
            return new Date(0);
        }
        return date;
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        console.warn(`Failed to parse date: ${dateStr}`);
        return new Date(0);
    }
    return date;
}

// Функция для сортировки таблицы медицинских осмотров
function setupMedTableSorting() {
    $('#info-tbl-med>thead th.sortable-med').click(function () {
        const table = $('#info-tbl-med');

        // Check if table contains a row with class 'no-data'
        if (table.find('tbody tr.no-data').length > 0) {
            return; // Do nothing if 'no-data' row exists
        }

        const column = $(this).index();
        const isNumeric = $(this).hasClass('numeric');
        const isDate = $(this).hasClass('date');
        const isSortedAsc = $(this).hasClass('sorted-asc');
        const isSortedDesc = $(this).hasClass('sorted-desc');

        // Сброс сортировки для всех заголовков
        table.find('th').removeClass('sorted-asc sorted-desc');

        let newSort;
        if (isSortedAsc) {
            // If already sorted ascending, switch to descending
            newSort = 'desc';
            $(this).addClass('sorted-desc');
        } else {
            // If not sorted or sorted descending, sort ascending
            newSort = 'asc';
            $(this).addClass('sorted-asc');
        }

        const rows = table.find('tbody tr').get();

        rows.sort((a, b) => {
            let aValue = $(a).find('td').eq(column).text().trim();
            let bValue = $(b).find('td').eq(column).text().trim();

            if (isNumeric) {
                aValue = parseFloat(aValue) || 0;
                bValue = parseFloat(bValue) || 0;
                return newSort === 'asc' ? aValue - bValue : bValue - aValue;
            } else if (isDate) {
                aValue = parseDate(aValue);
                bValue = parseDate(bValue);
                return newSort === 'asc' ? aValue - bValue : bValue - aValue;
            } else {
                return newSort === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }
        });

        table.find('tbody').empty().append(rows);

        // Обновляем номера строк только для строк без класса 'no-data'
        table.find('tbody tr:not(.no-data)').each(function (index) {
            $(this).find('td:first').text(index + 1);
        });
    });
}

function setupEduTableSorting() {
    $('#info-tbl-education>thead th.sortable-edu').click(function () {
        const table = $('#info-tbl-education');

        // Check if table contains a row with class 'no-data'
        if (table.find('tbody tr.no-data').length > 0) {
            return; // Do nothing if 'no-data' row exists
        }

        const column = $(this).index();
        const isNumeric = $(this).hasClass('numeric');
        const isDate = $(this).hasClass('date');
        const currentSort = $(this).hasClass('sorted-asc') ? 'asc' :
            $(this).hasClass('sorted-desc') ? 'desc' : 'none';

        // Сброс сортировки для всех заголовков
        table.find('th').removeClass('sorted-asc sorted-desc');

        let newSort;
        if (currentSort === 'none' || currentSort === 'desc') {
            newSort = 'asc';
            $(this).addClass('sorted-asc');
        } else {
            newSort = 'desc';
            $(this).addClass('sorted-desc');
        }

        const rows = table.find('tbody tr').get();

        rows.sort((a, b) => {
            let aValue = $(a).find('td').eq(column).text().trim();
            let bValue = $(b).find('td').eq(column).text().trim();

            if (isNumeric) {
                aValue = parseFloat(aValue) || 0;
                bValue = parseFloat(bValue) || 0;
                return newSort === 'asc' ? aValue - bValue : bValue - aValue;
            } else if (isDate) {
                aValue = parseDate(aValue);
                bValue = parseDate(bValue);
                return newSort === 'asc' ? aValue - bValue : bValue - aValue;
            } else {
                return newSort === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }
        });

        table.find('tbody').empty().append(rows);

        // Обновляем номера строк только для строк без класса 'no-data'
        table.find('tbody tr:not(.no-data)').each(function (index) {
            $(this).find('td:first').text(index + 1);
        });
    });
}

$(document).on("updateNotify", () => {
    fetchNotifications();
});

function sortWorkersByFIO(order = "asc") {
    const container = $("#worker-container");
    const workers = $(".worker").detach();

    workers.sort((a, b) => {
        const aFIO = $(a).html().toLowerCase();
        const bFIO = $(b).html().toLowerCase();
        return order === "asc"
            ? aFIO.localeCompare(bFIO)
            : bFIO.localeCompare(aFIO);
    });

    container.append(workers);
}

function getInitials(FIO) {
    if (!FIO || typeof FIO !== "string") {
        return FIO || "";
    }

    const parts = FIO.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) return "";

    const lastName = parts[0];
    let initials = "";

    if (parts.length >= 2) {
        const firstName = parts[1];
        initials += firstName.charAt(0) + ". ";
    }

    if (parts.length >= 3) {
        const middleName = parts[2];
        initials += middleName.charAt(0) + ".";
    }

    if (parts.length === 2 && parts[1].endsWith(".") && parts[1].length <= 3) {
        return FIO.trim();
    }

    if (parts.length === 1) {
        return lastName;
    }

    return `${lastName} ${initials}`.trim();
}

async function filterWorkers({
    gender = null,
    min_age = null,
    max_age = null,
    order = null,
    is_edu = "a",
}) {
    const url = new URL(FILTER);
    const container = $("#worker-container");

    if (gender) url.searchParams.set("gender", gender);
    if (is_edu) url.searchParams.set("is_edu", is_edu);
    if (min_age) url.searchParams.set("min_age", min_age);
    if (max_age) url.searchParams.set("max_age", max_age);
    if (order) url.searchParams.set("order", order);

    const { employees } = await sendGetRequest(url);
    container.empty();

    if (employees.length === 0) {
        container.append('<div class="text-muted text-center">нет сотрудников</div>');
        return;
    }

    employees.forEach((el) => {
        const html = $("<div>", {
            class: "worker",
            "data-id": el.id,
            text: getInitials(el.FIO),
        });

        html.on("click", () => {
            getWorkerData(el.id);
            clickOnWorker(html);
        });

        if (worker_id && worker_id == $(html).data("id"))
            clickOnWorker(html);

        container.append(html);
        if (!container.html() === "") sortWorkersByFIO(sort_type);
    });
}

async function getFIO(id) {
    const url = new URL(`${FIO}${id}`);
    const data = await sendGetRequest(url);
    $("#worker-info-fio").html(data.FIO);
}

async function getMainData(id) {
    const url = new URL(`${FILTER}`);
    url.searchParams.set("id", id);
    const { status, employees } = await sendGetRequest(url);
    if (status != "SUCCESS") {
        return;
    }
    $("#worker-info-fio").html(employees.FIO);
    $("#info-tbl-main tbody").html("").append(`
        <tr data-id="${employees.id}">
            <td>${$("#info-tbl-main>tbody tr").length + 1}</td> 
            <td>${employees.birthday}</td> 
            <td>${employees.gender}</td> 
            <td>${employees.oms_number || '-'}</td> 
            <td>${employees.dms_number || '-'}</td>
            <td>${employees.department || '-'}</td>
            <td>${employees.position}</td>
            <td>${employees.status}</td>
            <td>${employees.is_edu == true ? "да" : "нет"}</td>
        </tr>`);
}

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

async function getMedData(id) {
    const url = new URL(`${MED_DATA}${id}`);
    const data = await sendGetRequest(url);

    if (data["data"].length !== 0) {
        $("#info-tbl-med tbody").html("");
        data["data"].forEach((el) => {
            let attachmentsHtml = "-";
            if (el.attachments && el.attachments.length > 0) {
                attachmentsHtml = el.attachments.map(attachment => {
                    const fileName = attachment.name && attachment.name.trim() ? attachment.name : `file_${attachment.id}`;
                    if (!attachment.name) {
                        console.warn(`Empty or invalid file name for attachment ID ${attachment.id}:`, attachment);
                    }
                    return `<a href="/files/preview/${attachment.id}/" target="_blank" class="file-link">
                        <i class="bi ${getFileIcon(fileName)}"></i> ${fileName}
                    </a>`;
                }).join(", ");
            }

            $("#info-tbl-med tbody").append(
                `<tr data-id="${el.id}">
                    <td>${$("#info-tbl-med>tbody tr").length + 1}</td>
                    <td>${el.type}</td>
                    <td>${el.date_from}</td>
                    <td>${el.date_to}</td>
                    <td>${attachmentsHtml}</td>
                </tr>`
            );
        });
    } else {
        $("#info-tbl-med tbody").html("").append(
            `<tr class="no-data"><td colspan='6' style='text-align: center'>Записей нет</td></tr>`
        );
    }
}

async function getEducationData(id) {
    const url = `${EDUCATION_DATA}${id}`;
    const data = await sendGetRequest(url);
    if (data["data"].length !== 0) {
        $("#info-tbl-education tbody").html("");
        data["data"].forEach((el) => {
            let attachmentsHtml = "-";
            if (el.attachments && el.attachments.length > 0) {
                attachmentsHtml = el.attachments.map(attachment =>
                    `<a href="${attachment.url}" target="_blank" class="file-link">
                        <i class="bi bi-file-earmark-text"></i> ${attachment.name || 'Файл'}
                    </a>`
                ).join(", ");
            }

            $("#info-tbl-education tbody").append(
                `<tr data-id="${el.id}">
                    <td>${$("#info-tbl-education>tbody tr").length + 1}</td>
                    <td>${el.programm}</td>
                    <td>${el.protocol_num}</td>
                    <td>${el.udostoverenie_num}</td>
                    <td>${el.hours}</td>
                    <td>${el.date_from}</td>
                    <td>${el.date_to}</td>
                    <td>${attachmentsHtml}</td>
                </tr>`
            );
        });
    } else {
        $("#info-tbl-education tbody").html("").append(
            `<tr class="no-data"><td colspan='9' style='text-align: center'>Записей нет</td></tr>`
        );
    }
}

async function getWorkerData(id) {
    if (id !== null && Number.isInteger(id) && id !== worker_id) {
        worker_id = parseInt(id);
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
            break;
    }
}

function clickOnWorker(obj) {
    $(".worker").removeClass("selected-item");
    $(obj).addClass("selected-item");
}