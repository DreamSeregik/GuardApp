/**
 * Вспомогательные функции для взаимодействия с сервером и управления уведомлениями
 * @file helper.js
 */

/**
 * @section Конфигурация сервера
 * Базовый URL сервера
 */
const SERVER = 'https://guardapp.onrender.com';

/**
 * @section Конечные точки API
 * URL-адреса для различных операций с данными
 */
const API_ENDPOINTS = {
  // Работа с данными сотрудников
  PERSONAL_DATA: `${SERVER}/worker/personal/`,
  PERSONAL_DATA_UPDATE: `${SERVER}/worker/personal/update/`,
  WORKER_ADD: `${SERVER}/worker/add/`,
  WORKER_DELETE: `${SERVER}/worker/delete/`,
  WORKER_SEARCH: `${SERVER}/worker/search/`,
  FIO: `${SERVER}/worker/personal/FIO/`,
  FILTER: `${SERVER}/worker/filter`,

  // Работа с медицинскими осмотрами
  MED_DATA: `${SERVER}/worker/med/`,
  MED_ADD: `${SERVER}/worker/med/add/`,
  MED: `${SERVER}/med/`,
  MED_UPDATE: `${SERVER}/med/update/`,
  MED_DELETE: `${SERVER}/med/delete/`,

  // Работа с обучением
  EDUCATION_DATA: `${SERVER}/worker/education/`,
  EDU: `${SERVER}/education/`,
  EDU_ADD: `${SERVER}/worker/education/add`,
  EDU_UPDATE: `${SERVER}/education/update/`,
  EDU_DELETE: `${SERVER}/education/delete/`,

  // Генерация направления
  NAPRAV: `${SERVER}/generate-naprav/`,
};

/**
 * @section Уведомления
 * Функции для отображения и получения уведомлений
 */

/**
 * Отображает уведомление с помощью SweetAlert2
 * @param {string} message - Сообщение для отображения
 * @param {'success' | 'error'} [type='error'] - Тип уведомления
 */
function showNotification(message, type = 'error') {
  Swal.fire({
    text: message,
    icon: type === 'success' ? 'success' : 'error',
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    showCloseButton: true,
    timer: 3000,
    timerProgressBar: true,
    background: type === 'success' ? '#e6fffa' : '#ffe6e6',
    color: '#333',
    customClass: {
      popup: 'swal2-toast',
      title: 'swal2-title',
      content: 'swal2-content',
    },
  });
}

/**
 * Загружает уведомления с сервера и обновляет меню уведомлений
 * @returns {Promise<void>}
 */
async function fetchNotifications() {
  const $notificationMenu = $('#notificationMenu');
  const $notificationCount = $('#notificationCount');

  // Показываем индикатор загрузки
  $notificationMenu.html(`
    <li class="dropdown-item text-center">
      <div class="d-flex justify-content-center align-items-center">
        <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
          <span class="visually-hidden">Загрузка...</span>
        </div>
        <span>Загрузка уведомлений...</span>
      </div>
    </li>
  `);

  try {
    const { status, notifications, count } = await sendGetRequest('/notifications');
    if (status === 'SUCCESS') {
      $notificationMenu.empty();
      if (count > 0) {
        notifications.forEach((notification) => {
          $notificationMenu.append(
            `<a class="dropdown-item" href="#">${notification.message}</a>`
          );
        });
        $notificationCount.text(count);
      } else {
        $notificationMenu.append(
          '<div class="dropdown-item text-center">Нет новых уведомлений</div>'
        );
        $notificationCount.text('0');
      }
    }
  } catch (error) {
    console.error('Ошибка при загрузке уведомлений:', error);
    $notificationMenu.empty().append(
      '<div class="dropdown-item text-center text-danger">Ошибка загрузки уведомлений</div>'
    );
    showNotification('Ошибка загрузки уведомлений', 'error');
  }
}

/**
 * @section HTTP-запросы
 * Функции для отправки запросов к серверу
 */

/**
 * Отправляет GET-запрос к серверу
 * @param {string} url - URL для запроса
 * @returns {Promise<object>} Данные ответа
 * @throws {Error} Если запрос не удался
 */
async function sendGetRequest(url) {
  if (!url) {
    throw new Error('URL не должен быть пустым');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP ошибка! Статус: ${response.status}`, { cause: errorData });
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      showNotification('Превышено время ожидания запроса');
      throw error;
    }
    throw error;
  }
}

/**
 * Отправляет POST-запрос к серверу
 * @param {string} url - URL для запроса
 * @param {object} formData - Данные для отправки
 * @returns {Promise<object|null>} Данные ответа или null при ошибке
 */
async function sendPostRequest(url, formData) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': Cookies.get('csrftoken'),
      },
      body: JSON.stringify(formData),
    });

    const contentType = response.headers.get('Content-Type') || '';

    // Обработка файла
    if (contentType.includes('application/vnd.openxmlformats-officedocument')) {
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.match(/filename="?(.+?)"?$/)[1]
        : 'document.docx';

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);

      return { status: 'SUCCESS' };
    }
    // Обработка JSON
    else if (contentType.includes('application/json')) {
      const data = await response.json();
      if (response.ok) {
        return data;
      }
      throw new Error(data.message || 'Ошибка при выполнении запроса');
    }
    // Неизвестный тип ответа
    else {
      const text = await response.text();
      throw new Error(`Неизвестный тип контента: ${contentType}\n${text}`);
    }
  } catch (error) {
    console.error('Ошибка при выполнении POST-запроса:', error);
    showNotification(error.message || 'Произошла ошибка при выполнении запроса', 'error');
    return null;
  }
}

/**
 * Отправляет PATCH-запрос к серверу
 * @param {string} url - URL для запроса
 * @param {object} data - Данные для отправки
 * @returns {Promise<object>} Данные ответа
 * @throws {Error} Если запрос не удался
 */
async function sendPatchRequest(url, data) {
  if (!url) {
    throw new Error('Неверный URL: должен быть непустой строкой');
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Данные должны быть непустым объектом');
  }

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': Cookies.get('csrftoken'),
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Ошибка сервера: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Ошибка при отправке PATCH-запроса:', error);
    throw error;
  }
}