/**
 * Модуль для управления интерфейсом пользователей
 * @file script.js
 */

/**
 * @section Глобальные переменные
 * Переменные для хранения состояния выбранного пользователя
 */
let selectedUserId = null;
let selectedUserData = null;
let currentRequest = null;

const UserManager = {
    /**
     * @section Инициализация
     * Инициализация интерфейса пользователей
     */

    /**
     * Инициализирует интерфейс пользователей
     * @returns {void}
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.fetchUsers(this.getFilterParams());
    },

    /**
     * @section Кэширование элементов
     * Сохранение ссылок на DOM-элементы
     */

    /**
     * Кэширует DOM-элементы интерфейса
     * @returns {void}
     */
    cacheElements() {
        this.$workerContainer = $('#worker-container');
        this.$searchInput = $('#search-input');
        this.$roleCheck = $('input[name="roleCheck"]');
        this.$statusCheck = $('input[name="statusCheck"]');
        this.$sortAsc = $('#asc-sort');
        this.$sortDesc = $('#desc-sort');
        this.$toggleFilters = $('.toggle-filters');
        this.$addNewUser = $('#addNewUser');
        this.$editUser = $('#editUser');
        this.$deleteUser = $('#deleteUser');
        this.$workerInfoFio = $('#worker-info-fio');
        this.$userFio = $('#user-fio');
        this.$userEmail = $('#user-email');
        this.$userLogin = $('#user-login');
        this.$userStatus = $('#user-status');
    },

    /**
     * @section Обработка событий
     * Привязка обработчиков событий к элементам интерфейса
     */

    /**
     * Привязывает обработчики событий к элементам интерфейса
     * @returns {void}
     */
    bindEvents() {
        this.$toggleFilters.on('click', this.handleToggleFilters.bind(this));
        this.$searchInput.on('input', this.handleFilterChange.bind(this));
        this.$roleCheck.on('change', this.handleFilterChange.bind(this));
        this.$statusCheck.on('change', this.handleFilterChange.bind(this));
        this.$sortAsc.on('click', this.handleSortClick.bind(this));
        this.$sortDesc.on('click', this.handleSortClick.bind(this));
        this.$addNewUser.on('click', this.handleAddUserClick.bind(this));
        this.$editUser.on('click', this.handleEditUserClick.bind(this));
        this.$deleteUser.on('click', this.handleDeleteUserClick.bind(this));
    },

    /**
     * Обрабатывает клик по кнопке переключения фильтров
     * @returns {void}
     */
    handleToggleFilters() {
        const icon = this.$toggleFilters.find('i');
        const isExpanded = this.$toggleFilters.attr('aria-expanded') === 'true';
        icon.toggleClass('bi-chevron-down', !isExpanded).toggleClass('bi-chevron-up', isExpanded);
    },

    /**
     * Обрабатывает изменение фильтров
     * @returns {void}
     */
    handleFilterChange() {
        this.fetchUsers(this.getFilterParams());
    },

    /**
     * Обрабатывает клик по кнопке сортировки
     * @param {Event} e - Событие клика
     * @returns {void}
     */
    handleSortClick(e) {
        $('.form-check-inline img').removeClass('active');
        $(e.target).addClass('active');
        this.fetchUsers(this.getFilterParams());
    },

    /**
     * Обрабатывает клик по кнопке добавления пользователя
     * @returns {void}
     */
    handleAddUserClick() {
        $('#addUserModal').modal('show');
    },

    /**
     * Обрабатывает клик по кнопке редактирования пользователя
     * @returns {void}
     */
    handleEditUserClick() {
        if (!selectedUserId || !selectedUserData) {
            showNotification('Выберите пользователя для редактирования', 'error');
            return;
        }

        $('#edit_username').val(selectedUserData.username || '');
        $('#edit_email').val(selectedUserData.email || '');
        $('#edit_full_name').val(this.formatDisplayName(selectedUserData.last_name, selectedUserData.first_name) || '');
        $('#edit_is_staff').prop('checked', !!selectedUserData.is_staff);
        $('#edit_is_active').prop('checked', !!selectedUserData.is_active);
        $('#edit_generate_password').prop('checked', false);
        $('#edit_change_password').prop('checked', false);
        $('#edit_password1').val('');
        $('#edit_password2').val('');

        $('#editUserModal').modal('show');
    },

    /**
     * Обрабатывает клик по кнопке удаления пользователя
     * @returns {void}
     */
    handleDeleteUserClick() {
        if (!selectedUserId) {
            showNotification('Выберите пользователя для удаления', 'error');
            return;
        }
        $('#deleteUserForm').attr('action', `/admin/delete/${selectedUserId}/`);
        $('#deleteUserModal').modal('show');
    },

    /**
     * Обрабатывает клик по элементу пользователя
     * @param {jQuery} $element - Элемент пользователя
     * @returns {void}
     */
    clickOnWorker($element) {
        $('.worker').removeClass('selected-item');
        $element.addClass('selected-item');
        selectedUserId = $element.data('id');
    },

    /**
     * @section Загрузка данных
     * Методы для загрузки данных пользователей
     */

    /**
     * Загружает данные пользователя с сервера
     * @param {number} id - ID пользователя
     * @returns {Promise<void>}
     */
    async getUserData(id) {
        try {
            $('#info-tbl-users tbody tr').each(function () {
                $(this).find('td').text('Загрузка данных...');
            });

            const data = await sendGetRequest(`/admin/user/${id}/`);
            if (data.error) {
                showNotification(data.error, 'error');
                return;
            }

            selectedUserData = data;
            const fullName = this.formatUserName(data.last_name, data.first_name, data.username);
            this.$workerInfoFio.text(fullName);
            this.$userFio.text(this.formatDisplayName(data.last_name, data.first_name) || '-');
            this.$userEmail.text(data.email || '-');
            this.$userLogin.text(data.username || '-');

            const statusText = [
                data.is_active ? 'активен' : 'неактивен',
                data.is_staff ? 'администратор' : 'пользователь',
            ].join(', ');
            this.$userStatus.text(statusText);
        } catch (error) {
            console.error('Ошибка при загрузке данных пользователя:', error);
            showNotification('Ошибка при загрузке данных пользователя', 'error');
        }
    },

    /**
     * Загружает список пользователей с сервера
     * @param {Object} params - Параметры фильтрации
     * @param {string} [params.search=''] - Поисковый запрос
     * @param {string} [params.role=''] - Роль пользователя
     * @param {string} [params.status=''] - Статус пользователя
     * @param {'asc' | 'desc'} [params.sort='desc'] - Направление сортировки
     * @returns {Promise<void>}
     */
    async fetchUsers(params = {}) {
        if (currentRequest && currentRequest.abort) {
            currentRequest.abort();
        }

        this.$workerContainer.data('loading', true).html('<div class="text-muted text-center">Загрузка пользователей...</div>');

        try {
            currentRequest = $.ajax({
                url: '/admin/users/',
                method: 'GET',
                data: {
                    search: params.search || '',
                    role: params.role || '',
                    status: params.status || '',
                    sort: params.sort || 'desc',
                },
                success: (data) => {
                    if (this.$workerContainer.data('loading') === false) return;

                    this.$workerContainer.empty();

                    if (!data || !data.users || data.users.length === 0) {
                        const noUsersText = (params.search || '').trim() === '' ? 'Нет пользователей' : 'Пользователи не найдены';
                        this.$workerContainer.append(`<div class="text-muted text-center">${noUsersText}</div>`);
                        return;
                    }

                    data.users.forEach((user) => {
                        try {
                            const displayName = this.formatWorkerDisplayName(user.last_name, user.first_name, user.username);
                            const $worker = $(`
                <div class="worker" data-id="${user.id}" onclick="UserManager.clickOnWorker($(this)); UserManager.getUserData(${user.id})">
                  ${displayName}
                </div>
              `);

                            if (selectedUserId && selectedUserId == user.id) {
                                this.clickOnWorker($worker);
                            }

                            this.$workerContainer.append($worker);
                        } catch (e) {
                            console.error('Ошибка обработки пользователя:', user, e);
                        }
                    });
                },
                error: (xhr, status, error) => {
                    if (status === 'abort') return;
                    if (this.$workerContainer.data('loading') === false) return;

                    this.$workerContainer.html('<div class="text-muted text-center">Ошибка загрузки пользователей</div>');
                    console.error('Ошибка при загрузке пользователей:', error);
                },
                complete: () => {
                    this.$workerContainer.data('loading', false);
                    currentRequest = null;
                },
            });
        } catch (error) {
            console.error('Ошибка при загрузке пользователей:', error);
            this.$workerContainer.html('<div class="text-muted text-center">Ошибка загрузки пользователей</div>');
            this.$workerContainer.data('loading', false);
        }
    },

    /**
     * @section Форматирование данных
     * Методы для форматирования имен пользователей
     */

    /**
     * Форматирует полное имя пользователя
     * @param {string} lastName - Фамилия
     * @param {string} firstName - Имя
     * @param {string} username - Логин
     * @returns {string} Форматированное имя
     */
    formatUserName(lastName, firstName, username) {
        try {
            const safeLastName = lastName || '';
            const safeFirstName = firstName || '';
            return `${safeLastName} ${safeFirstName}`.trim() || username || 'Неизвестный';
        } catch (e) {
            console.error('Ошибка форматирования имени:', e);
            return username || 'Неизвестный';
        }
    },

    /**
     * Форматирует отображаемое имя пользователя
     * @param {string} lastName - Фамилия
     * @param {string} firstName - Имя
     * @returns {string|null} Форматированное имя или null
     */
    formatDisplayName(lastName, firstName) {
        try {
            if (!lastName && !firstName) return null;

            const capitalize = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '');
            const safeLastName = capitalize(lastName || '');
            const safeFirstName = capitalize(firstName || '');

            return `${safeLastName} ${safeFirstName}`.trim();
        } catch (e) {
            console.error('Ошибка форматирования отображаемого имени:', e);
            return null;
        }
    },

    /**
     * Форматирует имя пользователя для отображения в списке
     * @param {string} lastName - Фамилия
     * @param {string} firstName - Имя
     * @param {string} username - Логин
     * @returns {string} Форматированное имя
     */
    formatWorkerDisplayName(lastName, firstName, username) {
        try {
            if (lastName && firstName) {
                const capitalizedLastName = lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();
                const firstNameParts = firstName.trim().split(' ');
                const firstInitial = firstNameParts[0] && firstNameParts[0][0] ? firstNameParts[0][0].toUpperCase() : '';
                const patronymicInitial = firstNameParts[1] && firstNameParts[1][0] ? firstNameParts[1][0].toUpperCase() : '';
                const displayName = `${capitalizedLastName} ${firstInitial}.${patronymicInitial ? patronymicInitial + '.' : ''}`;
                return displayName.substring(0, 20);
            }
            const safeUsername = username || '';
            return safeUsername.charAt(0).toUpperCase() + safeUsername.slice(1).toLowerCase();
        } catch (e) {
            console.error('Ошибка форматирования имени работника:', e);
            return username || 'Неизвестный';
        }
    },

    /**
     * @section Вспомогательные методы
     * Методы для получения параметров фильтрации
     */

    /**
     * Получает параметры фильтрации
     * @returns {Object} Параметры фильтрации
     */
    getFilterParams() {
        return {
            search: this.$searchInput.val() || '',
            role: this.$roleCheck.filter(':checked').val() || '',
            status: this.$statusCheck.filter(':checked').val() || '',
            sort: $('.form-check-inline img.active').attr('id') === 'asc-sort' ? 'asc' : 'desc',
        };
    },
};

// Инициализация при загрузке документа
$(document).ready(() => {
    UserManager.init();
});