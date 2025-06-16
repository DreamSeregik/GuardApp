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

