const SERVER = 'http://127.0.0.1:8000'
const PERSONAL_DATA = `${SERVER}/worker/personal/`
const PERSONAL_DATA_UPDATE = `${SERVER}/worker/personal/update/`
const WORKER_DELETE = `${SERVER}/worker/delete/`
const WORKER_SEARCH = `${SERVER}/worker/search/`
const FIO = `${SERVER}/worker/personal/FIO/`
const FILTER = `${SERVER}/worker/filter`
const MED_DATA = `${SERVER}/worker/med/`
const EDUCATION_DATA = `${SERVER}/worker/education/`
const MED = `${SERVER}/med/`
const EDU = `${SERVER}/education/`
const MED_UPDATE = `${SERVER}/med/update/`
const MED_DELETE = `${SERVER}/med/delete/`
const EDU_UPDATE = `${SERVER}/education/update/`
const EDU_DELETE = `${SERVER}/education/delete/`
const NAPRAV = `${SERVER}/generate-naprav/`

function showNotification(message, type = 'error') {
  Swal.fire({
    text: message,
    icon: type === 'success' ? 'success' : 'error',
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: type === 'success' ? '#e6fffa' : '#ffe6e6',
    color: '#333',
    customClass: {
      popup: 'swal2-toast',
      title: 'swal2-title',
      content: 'swal2-content'
    }
  });
}

async function fetchNotifications() {
  const { status, notifications, count } = await sendGetRequest('/notifications')
  if (status == 'SUCCESS') {
    const notificationMenu = $('#notificationMenu');
    const notificationCount = $('#notificationCount');
    notificationMenu.empty();
    if (count > 0) {
      notifications.forEach(function (notification) {
        notificationMenu.append(
          `<a class="dropdown-item" href="#">${notification.message}</a>`
        );
      });
      notificationCount.text(count);
    } else {
      notificationMenu.append(
        '<div class="dropdown-item text-center">Нет новых уведомлений</div>'
      );
      notificationCount.text('0');
    }
  }
}

async function sendGetRequest(url) {
  if (!url) {
    return Promise.reject(new Error('URL не должен быть пустым'));
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
      return Promise.reject(showNotification(`HTTP ошибка! Статус: ${response.status}`, { cause: errorData }));
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      return Promise.reject(showNotification('Превышено время ожидания запроса'));
    }
    return Promise.reject(error);
  }
}


async function sendPostRequest(url, formData) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': Cookies.get('csrftoken')
      },
      body: JSON.stringify(formData),
    });

    const contentType = response.headers.get('Content-Type') || '';

    // Если это файл, скачиваем его
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

      return { 'status': "SUCCESS" }
    }
    // Если это JSON, обрабатываем как обычно
    else if (contentType.includes('application/json')) {
      const data = await response.json();

      if (response.ok) {
        return data;
      } else {
        throw new Error(data.message || 'Ошибка при выполнении запроса');
      }
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


async function sendPatchRequest(url, data) {
  try {
    // Проверка URL (теперь с выбросом ошибки)
    if (!url) {
      throw new Error('Неверный URL: должен быть непустой строкой');
    }

    // Проверка данных (теперь с выбросом ошибки)
    if (!data || typeof data !== 'object') {
      throw new Error('Данные должны быть непустым объектом');
    }

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': Cookies.get('csrftoken'),
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    // Клонируем ответ перед чтением
    const responseClone = response.clone();

    if (!response.ok) {
      const errorData = await responseClone.json().catch(() => ({}));
      throw new Error(
        `Ошибка сервера: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
      );
    }

    const responseData = await responseClone.json();
    return responseData;
  } catch (error) {
    console.error('Ошибка при отправке POST-запроса:', error);
    throw error; // Пробрасываем ошибку для обработки вызывающим кодом
  }
}

