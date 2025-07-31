// Глобальные переменные
let allContacts = [];
let selectedContacts = new Set();
let currentSearchTerm = '';

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadContacts();
    setupEventListeners();
});

// Настройка обработчиков событий
function setupEventListeners() {
    // Форма добавления контакта
    document.getElementById('contactForm').addEventListener('submit', handleAddContact);
    
    // Поиск контактов
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.getElementById('massSearchInput').addEventListener('input', handleMassSearch);
    
    // Отправка сообщения выбранным контактам
    document.getElementById('sendToSelectedBtn').addEventListener('click', sendToSelectedContacts);
    
    // Автоматическое обновление списка контактов каждые 30 секунд
    setInterval(loadContacts, 30000);
}

// Переключение вкладок
function showTab(tabName) {
    // Скрыть все вкладки
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Убрать активный класс с кнопок
    document.querySelectorAll('.tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Показать выбранную вкладку
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    
    // Загрузить контакты при переходе на соответствующие вкладки
    if (tabName === 'contacts' || tabName === 'mass-send') {
        loadContacts();
        if (tabName === 'mass-send') {
            loadMassContacts();
        }
    }
}

// Загрузка всех контактов
async function loadContacts() {
    try {
        showLoading('contactsLoading', true);
        const response = await fetch('contacts.php');
        const data = await response.json();
        
        if (data.success) {
            allContacts = data.data;
            displayContacts(allContacts);
        } else {
            showError('Ошибка загрузки контактов: ' + (data.error || 'Неизвестная ошибка'));
        }
    } catch (error) {
        showError('Ошибка сети: ' + error.message);
    } finally {
        showLoading('contactsLoading', false);
    }
}

// Отображение контактов в списке
function displayContacts(contacts) {
    const container = document.getElementById('contactsList');
    
    if (contacts.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 20px; color: #6c757d;">Контакты не найдены</div>';
        return;
    }
    
    container.innerHTML = contacts.map(contact => `
        <div class="contact-card" data-id="${contact.id}">
            <div class="contact-name">${escapeHtml(contact.name)}</div>
            <div class="contact-phone">📞 ${escapeHtml(contact.phone)}</div>
            <div class="contact-activity">💼 ${escapeHtml(contact.activity)}</div>
            <div style="margin-top: 10px;">
                <button class="btn" onclick="editContact(${contact.id})" style="font-size: 12px; padding: 6px 12px;">Изменить</button>
                <button class="btn btn-danger" onclick="deleteContact(${contact.id})" style="font-size: 12px; padding: 6px 12px;">Удалить</button>
            </div>
            ${contact.token ? '<div style="color: #28a745; font-size: 12px; margin-top: 5px;">✓ Push-токен настроен</div>' : '<div style="color: #dc3545; font-size: 12px; margin-top: 5px;">⚠ Push-токен не настроен</div>'}
        </div>
    `).join('');
}

// Загрузка контактов для массовой отправки
async function loadMassContacts() {
    try {
        showLoading('massContactsLoading', true);
        const response = await fetch('contacts.php');
        const data = await response.json();
        
        if (data.success) {
            allContacts = data.data;
            displayMassContacts(allContacts);
        } else {
            showError('Ошибка загрузки контактов: ' + (data.error || 'Неизвестная ошибка'));
        }
    } catch (error) {
        showError('Ошибка сети: ' + error.message);
    } finally {
        showLoading('massContactsLoading', false);
    }
}

// Отображение контактов для массовой отправки
function displayMassContacts(contacts) {
    const container = document.getElementById('massContactsList');
    
    if (contacts.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 20px; color: #6c757d;">Контакты не найдены</div>';
        return;
    }
    
    container.innerHTML = contacts.map(contact => `
        <div class="contact-card ${selectedContacts.has(contact.id) ? 'selected' : ''}" 
             data-id="${contact.id}" onclick="toggleContactSelection(${contact.id})">
            <input type="checkbox" class="contact-checkbox" 
                   ${selectedContacts.has(contact.id) ? 'checked' : ''} 
                   onchange="toggleContactSelection(${contact.id})">
            <div class="contact-name">${escapeHtml(contact.name)}</div>
            <div class="contact-phone">📞 ${escapeHtml(contact.phone)}</div>
            <div class="contact-activity">💼 ${escapeHtml(contact.activity)}</div>
            ${contact.token ? '<div style="color: #28a745; font-size: 12px; margin-top: 5px;">✓ Push-токен настроен</div>' : '<div style="color: #dc3545; font-size: 12px; margin-top: 5px;">⚠ Push-токен не настроен</div>'}
        </div>
    `).join('');
    
    updateSelectedCount();
}

// Переключение выбора контакта
function toggleContactSelection(contactId) {
    if (selectedContacts.has(contactId)) {
        selectedContacts.delete(contactId);
    } else {
        selectedContacts.add(contactId);
    }
    
    // Обновить визуальное состояние
    const card = document.querySelector(`[data-id="${contactId}"]`);
    const checkbox = card.querySelector('.contact-checkbox');
    
    if (selectedContacts.has(contactId)) {
        card.classList.add('selected');
        checkbox.checked = true;
    } else {
        card.classList.remove('selected');
        checkbox.checked = false;
    }
    
    updateSelectedCount();
}

// Обновление счетчика выбранных контактов
function updateSelectedCount() {
    const countElement = document.getElementById('selectedCount');
    const countNumber = document.getElementById('countNumber');
    const messageForm = document.getElementById('messageForm');
    
    countNumber.textContent = selectedContacts.size;
    
    if (selectedContacts.size > 0) {
        countElement.style.display = 'inline-block';
        messageForm.style.display = 'block';
    } else {
        countElement.style.display = 'none';
        messageForm.style.display = 'none';
    }
}

// Очистка выбора
function clearSelection() {
    selectedContacts.clear();
    document.querySelectorAll('.contact-card').forEach(card => {
        card.classList.remove('selected');
        const checkbox = card.querySelector('.contact-checkbox');
        if (checkbox) checkbox.checked = false;
    });
    updateSelectedCount();
}

// Добавление нового контакта
async function handleAddContact(event) {
    event.preventDefault();
    
    const formData = {
        phone: document.getElementById('contactPhone').value.trim(),
        name: document.getElementById('contactName').value.trim(),
        activity: document.getElementById('contactActivity').value.trim(),
        token: document.getElementById('contactToken').value.trim() || null
    };
    
    try {
        const response = await fetch('contacts.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Контакт успешно добавлен!');
            document.getElementById('contactForm').reset();
            loadContacts();
        } else {
            showError('Ошибка добавления контакта: ' + (data.error || 'Неизвестная ошибка'));
        }
    } catch (error) {
        showError('Ошибка сети: ' + error.message);
    }
}

// Поиск контактов
async function handleSearch(event) {
    const searchTerm = event.target.value.trim();
    currentSearchTerm = searchTerm;
    
    if (searchTerm === '') {
        displayContacts(allContacts);
        return;
    }
    
    try {
        const response = await fetch(`contacts.php?search=${encodeURIComponent(searchTerm)}`);
        const data = await response.json();
        
        if (data.success) {
            displayContacts(data.data);
        } else {
            showError('Ошибка поиска: ' + (data.error || 'Неизвестная ошибка'));
        }
    } catch (error) {
        showError('Ошибка сети: ' + error.message);
    }
}

// Поиск контактов для массовой отправки
async function handleMassSearch(event) {
    const searchTerm = event.target.value.trim();
    
    if (searchTerm === '') {
        displayMassContacts(allContacts);
        return;
    }
    
    try {
        const response = await fetch(`contacts.php?search=${encodeURIComponent(searchTerm)}`);
        const data = await response.json();
        
        if (data.success) {
            displayMassContacts(data.data);
        } else {
            showError('Ошибка поиска: ' + (data.error || 'Неизвестная ошибка'));
        }
    } catch (error) {
        showError('Ошибка сети: ' + error.message);
    }
}

// Редактирование контакта
function editContact(contactId) {
    const contact = allContacts.find(c => c.id == contactId);
    if (!contact) return;
    
    document.getElementById('contactPhone').value = contact.phone;
    document.getElementById('contactName').value = contact.name;
    document.getElementById('contactActivity').value = contact.activity;
    document.getElementById('contactToken').value = contact.token || '';
    
    // Изменить кнопку на "Обновить"
    const form = document.getElementById('contactForm');
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Обновить контакт';
    submitBtn.onclick = function(e) {
        e.preventDefault();
        updateContact(contactId);
    };
    
    // Прокрутить к форме
    document.getElementById('contacts').scrollIntoView({ behavior: 'smooth' });
}

// Обновление контакта
async function updateContact(contactId) {
    const formData = {
        id: contactId,
        phone: document.getElementById('contactPhone').value.trim(),
        name: document.getElementById('contactName').value.trim(),
        activity: document.getElementById('contactActivity').value.trim(),
        token: document.getElementById('contactToken').value.trim() || null
    };
    
    try {
        const response = await fetch('contacts.php', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Контакт успешно обновлен!');
            resetContactForm();
            loadContacts();
        } else {
            showError('Ошибка обновления контакта: ' + (data.error || 'Неизвестная ошибка'));
        }
    } catch (error) {
        showError('Ошибка сети: ' + error.message);
    }
}

// Сброс формы контакта
function resetContactForm() {
    const form = document.getElementById('contactForm');
    form.reset();
    
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Добавить контакт';
    submitBtn.onclick = null;
}

// Удаление контакта
async function deleteContact(contactId) {
    if (!confirm('Вы уверены, что хотите удалить этот контакт?')) {
        return;
    }
    
    try {
        const response = await fetch('contacts.php', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: contactId })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Контакт успешно удален!');
            loadContacts();
        } else {
            showError('Ошибка удаления контакта: ' + (data.error || 'Неизвестная ошибка'));
        }
    } catch (error) {
        showError('Ошибка сети: ' + error.message);
    }
}

// Отправка сообщения выбранным контактам
async function sendToSelectedContacts() {
    if (selectedContacts.size === 0) {
        showError('Выберите хотя бы один контакт для отправки');
        return;
    }
    
    const messageData = {
        contact_ids: Array.from(selectedContacts),
        message: {
            title: document.getElementById('messageTitle').value.trim(),
            body: document.getElementById('messageBody').value.trim(),
            icon: document.getElementById('messageIcon').value.trim() || undefined,
            click_action: document.getElementById('messageAction').value.trim() || undefined
        }
    };
    
    if (!messageData.message.title || !messageData.message.body) {
        showError('Заполните заголовок и текст сообщения');
        return;
    }
    
    try {
        const sendBtn = document.getElementById('sendToSelectedBtn');
        sendBtn.disabled = true;
        sendBtn.textContent = 'Отправка...';
        
        const response = await fetch('send_to_contacts.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(messageData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSendResults(data);
            // Очистить форму после успешной отправки
            document.getElementById('messageTitle').value = '';
            document.getElementById('messageBody').value = '';
            document.getElementById('messageIcon').value = '';
            document.getElementById('messageAction').value = '';
            clearSelection();
        } else {
            showError('Ошибка отправки: ' + (data.error || 'Неизвестная ошибка'));
        }
    } catch (error) {
        showError('Ошибка сети: ' + error.message);
    } finally {
        const sendBtn = document.getElementById('sendToSelectedBtn');
        sendBtn.disabled = false;
        sendBtn.textContent = 'Отправить выбранным контактам';
    }
}

// Отображение результатов отправки
function showSendResults(data) {
    const resultsContainer = document.getElementById('sendResults');
    
    let html = `
        <div class="alert alert-success">
            <h4>Результаты отправки</h4>
            <p><strong>Всего контактов:</strong> ${data.total_contacts}</p>
            <p><strong>Успешно отправлено:</strong> ${data.sent_successfully}</p>
            <p><strong>Ошибки:</strong> ${data.failed}</p>
        </div>
    `;
    
    if (data.results && data.results.length > 0) {
        html += '<div style="margin-top: 15px;"><h5>Детальные результаты:</h5>';
        data.results.forEach(result => {
            const statusClass = result.status === 'sent' ? 'alert-success' : 'alert-error';
            const statusText = result.status === 'sent' ? '✓ Отправлено' : '✗ Ошибка';
            html += `
                <div class="alert ${statusClass}" style="margin-bottom: 5px; padding: 8px;">
                    <strong>${escapeHtml(result.contact)}:</strong> ${statusText}
                </div>
            `;
        });
        html += '</div>';
    }
    
    resultsContainer.innerHTML = html;
    
    // Прокрутить к результатам
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

// Вспомогательные функции
function showLoading(elementId, show) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = show ? 'block' : 'none';
    }
}

function showSuccess(message) {
    showAlert(message, 'success');
}

function showError(message) {
    showAlert(message, 'error');
}

function showAlert(message, type) {
    // Создать временное уведомление
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alert.style.position = 'fixed';
    alert.style.top = '20px';
    alert.style.right = '20px';
    alert.style.zIndex = '9999';
    alert.style.minWidth = '300px';
    
    document.body.appendChild(alert);
    
    // Удалить через 5 секунд
    setTimeout(() => {
        if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
        }
    }, 5000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}