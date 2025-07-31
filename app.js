
firebase.initializeApp({
    messagingSenderId: '448358493027'
});

var messaging = firebase.messaging();

// Ждем загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    const sendBtn = document.getElementById('send');
    if (sendBtn) {
        sendBtn.onclick = function() {
            if (isTokenSentToServer()) {
                send('/send.php');
                showNotificationStatus('Отправка уведомления...', 'info');
            } else {
                console.error('Token not sent to server.');
                showNotificationStatus('Ошибка: токен не отправлен на сервер', 'error');
            }
        };
    }
});

messaging.onMessage(function(payload) {
    console.log('Message received. ', payload);
    new Notification(payload.data.title, payload.data);
});

messaging.requestPermission()
    .then(function() {
        // Get Instance ID token. Initially this makes a network call, once retrieved
        // subsequent calls to getToken will return from cache.
        messaging.getToken()
            .then(function(currentToken) {
                console.log(currentToken);

                if (currentToken) {
                    // send token to the server if is isn't sent before
                    sendTokenToServer(currentToken);
                } else {
                    console.warn('No Instance ID token available. Request permission to generate one.');
                    setTokenSentToServer(false);
                }
            })
            .catch(function(err) {
                console.warn('An error occurred while retrieving token. ', err);
                setTokenSentToServer(false);
            });
    })
    .catch(function(err) {
        console.warn('Unable to get permission to notify.', err);
    });

function send(url, data) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);

    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.success !== undefined) {
                        if (response.success > 0) {
                            showNotificationStatus('Уведомление успешно отправлено!', 'success');
                        } else {
                            showNotificationStatus('Ошибка отправки уведомления', 'error');
                        }
                    } else {
                        showNotificationStatus('Уведомление отправлено', 'success');
                    }
                } catch (e) {
                    showNotificationStatus('Уведомление отправлено', 'success');
                }
            } else {
                showNotificationStatus('Ошибка сети при отправке уведомления', 'error');
            }
        }
    };

    if (data) {
        var params = '';
        for (var property in data) {
            if (data.hasOwnProperty(property)) {
                if (params != '') {
                    params += '&';
                }
                params += property + '=' + encodeURIComponent(data[property]);
            }
        }

        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.send(params);
    } else {
        xhr.send(null);
    }
}

function sendTokenToServer(currentToken) {
    // always send token for fix session expire
    if (true || !isTokenSentToServer()) {
        console.log('Sending token to server...');
        send('/register.php', {token: currentToken});
        setTokenSentToServer(true);
    } else {
        console.log('Token already sent to server so won\'t send it again unless it changes');
    }
}

function isTokenSentToServer() {
    return window.localStorage.getItem('sentToServer') == 1;
}

function setTokenSentToServer(sent) {
    window.localStorage.setItem('sentToServer', sent ? 1 : 0);
}

// Функция для отображения статуса уведомлений
function showNotificationStatus(message, type) {
    const statusElement = document.getElementById('notification-status');
    if (statusElement) {
        const alertClass = type === 'error' ? 'alert-error' : type === 'success' ? 'alert-success' : 'alert-info';
        statusElement.innerHTML = `<div class="alert ${alertClass}" style="margin-top: 15px;">${message}</div>`;
        
        // Убрать сообщение через 5 секунд, если это не ошибка
        if (type !== 'error') {
            setTimeout(() => {
                statusElement.innerHTML = '';
            }, 5000);
        }
    }
}
