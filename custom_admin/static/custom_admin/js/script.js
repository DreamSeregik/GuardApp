let selectedUserId = null;
let selectedUserData = null;

function clickOnWorker(element) {
    $('.worker').removeClass('selected-item');
    element.addClass('selected-item');
    selectedUserId = $(element).data('id');
}

async function getUserData(id) {
    try {
        // Устанавливаем состояние загрузки для каждой строки
        $('#info-tbl-users tbody tr').each(function () {
            $(this).find('td').text('Загрузка данных...');
        });

        const response = await fetch(`/admin/api/user/${id}/`);
        const data = await response.json();
        if (data.error) {
            showNotification(data.error);
            return;
        }

        // Сохраняем данные пользователя
        selectedUserData = data;

        // Безопасное создание полного имени
        const full_name = formatUserName(data.last_name, data.first_name, data.username);
        $('#worker-info-fio').text(full_name);

        // Форматированное ФИО с заглавными буквами
        const display_name = formatDisplayName(data.last_name, data.first_name) || '-';
        $('#user-fio').text(display_name);

        // Остальные данные
        $('#user-email').text(data.email || '-');
        $('#user-login').text(data.username || '-');

        const statusText = [
            data.is_active ? 'активен' : 'неактивен',
            data.is_staff ? 'администратор' : 'пользователь'
        ].join(', ');
        $('#user-status').text(statusText);
    } catch (error) {
        console.error('Ошибка при загрузке данных пользователя:', error);
        showNotification('Ошибка при загрузке данных пользователя');
    }
}

// Вспомогательные функции для форматирования имен
function formatUserName(lastName, firstName, username) {
    try {
        const safeLastName = lastName || '';
        const safeFirstName = firstName || '';
        return `${safeLastName} ${safeFirstName}`.trim() || username || 'Неизвестный';
    } catch (e) {
        console.error('Ошибка форматирования имени:', e);
        return username || 'Неизвестный';
    }
}

function formatDisplayName(lastName, firstName) {
    try {
        if (!lastName && !firstName) return null;

        const capitalize = (str) =>
            str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';

        const safeLastName = capitalize(lastName || '');
        const safeFirstName = capitalize(firstName || '');

        return `${safeLastName} ${safeFirstName}`.trim();
    } catch (e) {
        console.error('Ошибка форматирования отображаемого имени:', e);
        return null;
    }
}

let currentRequest = null;

function fetchUsers(params = {}) {
    const $container = $('#worker-container');

    // Отменяем предыдущий запрос
    if (currentRequest && currentRequest.abort) {
        currentRequest.abort();
    }

    // Устанавливаем состояние загрузки
    $container.data('loading', true);
    $container.html('<div class="text-muted text-center">Загрузка пользователей...</div>');

    currentRequest = $.ajax({
        url: '/admin/api/users/',
        method: 'GET',
        data: {
            search: params.search || '',
            role: params.role || '',
            status: params.status || '',
            sort: params.sort || 'desc'
        },
        success: function (data) {
            // Проверяем, не был ли отменен запрос
            if ($container.data('loading') === false) return;

            $container.empty();

            // Проверяем наличие данных
            if (!data || !data.users || data.users.length === 0) {
                const noUsersText = (params.search || '').trim() === ''
                    ? 'Нет пользователей'
                    : 'Пользователи не найдены';
                $container.append(`<div class="text-muted text-center">${noUsersText}</div>`);
                return;
            }

            // Обрабатываем каждого пользователя
            data.users.forEach(function (user) {
                try {
                    let display_name = '';

                    // Форматируем имя для отображения
                    if (user.last_name && user.first_name) {
                        const lastName = user.last_name || '';
                        const firstName = user.first_name || '';

                        const capitalizedLastName = lastName.charAt(0).toUpperCase() +
                            lastName.slice(1).toLowerCase();
                        const firstNameParts = firstName.trim().split(' ');
                        const firstInitial = firstNameParts[0] && firstNameParts[0][0]
                            ? firstNameParts[0][0].toUpperCase()
                            : '';
                        const patronymicInitial = firstNameParts[1] && firstNameParts[1][0]
                            ? firstNameParts[1][0].toUpperCase()
                            : '';

                        display_name = `${capitalizedLastName} ${firstInitial}.${patronymicInitial ? patronymicInitial + '.' : ''}`;
                    } else {
                        const username = user.username || '';
                        display_name = username.charAt(0).toUpperCase() +
                            username.slice(1).toLowerCase();
                    }

                    display_name = display_name.substring(0, 20);

                    const $worker = $(`
                        <div class="worker" data-id="${user.id}" onclick="getUserData(${user.id}); clickOnWorker($(this))">
                            ${display_name}
                        </div>
                    `);

                    if (selectedUserId && selectedUserId == user.id) {
                        clickOnWorker($worker);
                    }

                    $container.append($worker);
                } catch (e) {
                    console.error('Ошибка обработки пользователя:', user, e);
                }
            });
        },
        error: function (xhr, status, error) {
            if (status === 'abort') return;

            if ($container.data('loading') === false) return;

            $container.html('<div class="text-muted text-center">Ошибка загрузки пользователей</div>');
            console.error('Ошибка при загрузке пользователей:', error);
        },
        complete: function () {
            $container.data('loading', false);
        }
    });
}

$(document).ready(function () {
    // Инициализация
    fetchUsers({
        search: $('#search-input').val() || '',
        role: $('input[name="roleCheck"]:checked').val() || '',
        status: $('input[name="statusCheck"]:checked').val() || '',
        sort: $('.form-check-inline img.active').attr('id') === 'asc-sort' ? 'asc' : 'desc'
    });

    $('.toggle-filters').click(function () {
        const icon = $(this).find('i');
        const isExpanded = $(this).attr('aria-expanded') === 'true';
        icon.toggleClass('bi-chevron-down', !isExpanded).toggleClass('bi-chevron-up', isExpanded);
    });

    // Обработчики событий
    $('#search-input').on('input', function () {
        fetchUsers({
            search: $(this).val() || '',
            role: $('input[name="roleCheck"]:checked').val() || '',
            status: $('input[name="statusCheck"]:checked').val() || '',
            sort: $('.form-check-inline img.active').attr('id') === 'asc-sort' ? 'asc' : 'desc'
        });
    });

    $('input[name="roleCheck"], input[name="statusCheck"]').on('change', function () {
        fetchUsers({
            search: $('#search-input').val() || '',
            role: $('input[name="roleCheck"]:checked').val() || '',
            status: $('input[name="statusCheck"]:checked').val() || '',
            sort: $('.form-check-inline img.active').attr('id') === 'asc-sort' ? 'asc' : 'desc'
        });
    });

    // Сортировка
    $('#asc-sort, #desc-sort').click(function () {
        $('.form-check-inline img').removeClass('active');
        $(this).addClass('active');

        fetchUsers({
            search: $('#search-input').val() || '',
            role: $('input[name="roleCheck"]:checked').val() || '',
            status: $('input[name="statusCheck"]:checked').val() || '',
            sort: $(this).attr('id') === 'asc-sort' ? 'asc' : 'desc'
        });
    });

    // Остальные обработчики (добавление/редактирование/удаление)
    $('#addNewUser').click(function () {
        $('#addUserModal').modal('show');
    });

    $('#editUser').click(function () {
        if (!selectedUserId || !selectedUserData) {
            showNotification('Выберите пользователя для редактирования');
            return;
        }

        // Заполнение формы редактирования
        $('#edit_username').val(selectedUserData.username || '');
        $('#edit_email').val(selectedUserData.email || '');
        $('#edit_full_name').val(
            formatDisplayName(selectedUserData.last_name, selectedUserData.first_name) || ''
        );

        $('#edit_is_staff').prop('checked', !!selectedUserData.is_staff);
        $('#edit_is_active').prop('checked', !!selectedUserData.is_active);
        $('#edit_generate_password').prop('checked', false);
        $('#edit_change_password').prop('checked', false);
        $('#edit_password1').val('');
        $('#edit_password2').val('');

        $('#editUserModal').modal('show');
    });

    $('#deleteUser').click(function () {
        if (!selectedUserId) {
            showNotification('Выберите пользователя для удаления');
            return;
        }
        $('#deleteUserForm').attr('action', `/admin/delete/${selectedUserId}/`);
        $('#deleteUserModal').modal('show');
    });
});