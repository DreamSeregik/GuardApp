let selectedUserId = null;
let selectedUserData = null;

function clickOnWorker(element) {
    $('.worker').removeClass('selected-item');
    element.addClass('selected-item');
    selectedUserId = $(element).data('id');
}

async function getUserData(id) {
    try {
        const response = await fetch(`/admin/api/user/${id}/`);
        const data = await response.json();
        if (data.error) {
            showNotification(data.error)
            return;
        }
        // Сохраняем данные пользователя
        selectedUserData = data;
        // Полное имя для #worker-info-fio
        const full_name = `${data.last_name} ${data.first_name}`.trim() || data.username;
        $('#worker-info-fio').text(full_name);
        // Полное ФИО с заглавными первыми буквами для #user-fio
        let display_name;
        if (data.last_name && data.first_name) {
            const capitalizedLastName = data.last_name.split(' ').map(word =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
            const capitalizedFirstName = data.first_name.split(' ').map(word =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
            display_name = `${capitalizedLastName} ${capitalizedFirstName}`.trim();
        } else {
            display_name = '-'
        }
        $('#user-fio').text(display_name);
        $('#user-email').text(data.email || '-');
        $('#user-login').text(data.username);
        $('#user-status').text(`${data.is_active === true ? 'активен' : 'неактивен'}, ${data.is_staff === true ? 'администратор' : 'пользователь'}`);
    } catch (error) {
        showNotification(error)
    }
}

function fetchUsers(params = {}) {
    $.ajax({
        url: '/admin/api/users/',
        method: 'GET',
        data: params,
        success: function (data) {
            const $container = $('#worker-container');
            $container.empty();
            if (data.users.length === 0) {
                $container.append('<div class="text-muted text-center">нет пользователей</div>');
            } else {
                data.users.forEach(function (user) {
                    let display_name;
                    if (user.last_name && user.first_name) {
                        // Формат: Фамилия И.О. с заглавными первыми буквами
                        const capitalizedLastName = user.last_name.charAt(0).toUpperCase() + user.last_name.slice(1).toLowerCase();
                        const firstNameParts = user.first_name.trim().split(' ');
                        const firstInitial = firstNameParts[0][0] ? firstNameParts[0][0].toUpperCase() : '';
                        const patronymicInitial = firstNameParts[1]?.[0] ? firstNameParts[1][0].toUpperCase() : '';
                        display_name = `${capitalizedLastName} ${firstInitial}.${patronymicInitial ? patronymicInitial + '.' : ''}`;
                    } else {
                        // Если ФИО не полное, используем username с заглавной первой буквой
                        display_name = user.username.charAt(0).toUpperCase() + user.username.slice(1).toLowerCase();
                    }
                    // Ограничение длины до 20 символов
                    display_name = display_name.substring(0, 20);
                    const $worker = $(`
                        <div class="worker" data-id="${user.id}" onclick="getUserData(${user.id}); clickOnWorker($(this))">
                            ${display_name}
                        </div>
                    `);
                    if (selectedUserId && selectedUserId == $($worker).data("id"))
                        clickOnWorker($worker)
                    $container.append($worker);
                });
            }
        },
        error: function (xhr, status, error) {
            showNotification('Ошибка загрузки списка пользователей');
        }
    });
}

$(document).ready(function () {

    fetchUsers({
        search: $('#search-input').val(),
        role: $('input[name="roleCheck"]:checked').val(),
        status: $('input[name="statusCheck"]:checked').val(),
        sort: $('.form-check-inline img.active').attr('id') === 'asc-sort' ? 'asc' : 'desc'
    });


    $('.toggle-filters').click(function () {
        const icon = $(this).find('i');
        const isExpanded = $(this).attr('aria-expanded') === 'true';
        icon.toggleClass('bi-chevron-down', !isExpanded).toggleClass('bi-chevron-up', isExpanded);
    });

    function togglePasswordFields(modalId) {
        const $modal = $(modalId);
        const $generateCheckbox = $modal.find('[name="generate_password"]');
        const $changePasswordCheckbox = modalId === '#editUserModal' ? $modal.find('[name="change_password"]') : null;
        const $passwordFields = $modal.find('.password-field');

        if (!$generateCheckbox.length || !$passwordFields.length) {
            return;
        }

        function updateFields() {
            const isAddUserModal = modalId === '#addUserModal';
            const shouldShowPasswordFields = !isAddUserModal ?
                (!$generateCheckbox.is(':checked') && ($changePasswordCheckbox?.is(':checked') || !$changePasswordCheckbox)) :
                !$generateCheckbox.is(':checked');
            $passwordFields.toggleClass('password-fields-hidden', !shouldShowPasswordFields);
            if (!shouldShowPasswordFields) {
                $passwordFields.find('input').val('');
            }
        }

        // Обработчик для "Сгенерировать пароль"
        $generateCheckbox.on('change', function () {
            if ($(this).is(':checked')) {
                if ($changePasswordCheckbox) {
                    // Для формы редактирования отключаем "Изменить пароль вручную"
                    $changePasswordCheckbox.prop('checked', false);
                }
            }
            updateFields();
        });

        // Обработчик для "Изменить пароль вручную" (только для редактирования)
        if ($changePasswordCheckbox) {
            $changePasswordCheckbox.on('change', function () {
                if ($(this).is(':checked')) {
                    $generateCheckbox.prop('checked', false);
                }
                updateFields();
            });
        }

        updateFields();
    }

    togglePasswordFields('#addUserModal');
    togglePasswordFields('#editUserModal');

    $('#addNewUser').click(function () {
        $('#addUserModal').modal('show');
    });

    $('#editUser').click(function () {
        if (selectedUserId && selectedUserData) {
            // Заполняем форму данными пользователя
            $('#edit_username').val(selectedUserData.username);
            $('#edit_email').val(selectedUserData.email);
            const full_name = `${selectedUserData.last_name} ${selectedUserData.first_name}`.trim() || '';
            $('#edit_full_name').val(full_name);
            // Преобразуем is_staff и is_active в булевы значения
            const isStaff = selectedUserData.is_staff === true || selectedUserData.is_staff === 'true' || selectedUserData.is_staff === 1;
            const isActive = selectedUserData.is_active === true || selectedUserData.is_active === 'true' || selectedUserData.is_active === 1;
            $('#edit_is_staff').prop('checked', isStaff);
            $('#edit_is_active').prop('checked', isActive);
            $('#edit_generate_password').prop('checked', false);
            $('#edit_change_password').prop('checked', false);
            $('#edit_password1').val('');
            $('#edit_password2').val('');

            $('#editUserModal').modal('show');
        } else {
            showNotification('Выберите пользователя для редактирования');
        }
    });

    $('#deleteUser').click(function () {
        if (selectedUserId) {
            $('#deleteUserForm').attr('action', `/admin/delete/${selectedUserId}/`);
            $('#deleteUserModal').modal('show');
        } else {
            showNotification('Выберите пользователя для удаления');
        }
    });

    // Поиск
    $('#search-input').on('input', function () {
        fetchUsers({
            search: $(this).val(),
            role: $('input[name="roleCheck"]:checked').val(),
            status: $('input[name="statusCheck"]:checked').val(),
            sort: $('.form-check-inline img.active').attr('id') === 'asc-sort' ? 'asc' : 'desc'
        });
    });

    // фильтр по роли
    $('input[name="roleCheck"]').on('change', function () {
        fetchUsers({
            search: $('#search-input').val(),
            role: $(this).val(),
            status: $('input[name="statusCheck"]:checked').val(),
            sort: $('.form-check-inline img.active').attr('id') === 'asc-sort' ? 'asc' : 'desc'
        });
    });

    // фильр по статусу
    $('input[name="statusCheck"]').on('change', function () {
        fetchUsers({
            search: $('#search-input').val(),
            role: $('input[name="roleCheck"]:checked').val(),
            status: $(this).val(),
            sort: $('.form-check-inline img.active').attr('id') === 'asc-sort' ? 'asc' : 'desc'
        });
    });

    // Sorting
    $('#asc-sort').click(function () {
        $('.form-check-inline img').removeClass('active');
        $(this).addClass('active');
        fetchUsers({
            search: $('#search-input').val(),
            role: $('input[name="roleCheck"]:checked').val(),
            status: $('input[name="statusCheck"]:checked').val(),
            sort: 'asc'
        });
    });

    $('#desc-sort').click(function () {
        $('.form-check-inline img').removeClass('active');
        $(this).addClass('active');
        fetchUsers({
            search: $('#search-input').val(),
            role: $('input[name="roleCheck"]:checked').val(),
            status: $('input[name="statusCheck"]:checked').val(),
            sort: 'desc'
        });
    });
});