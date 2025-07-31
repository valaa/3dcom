// contacts.js

// Структура контакта: {id, name, phone, type}
const CONTACTS_KEY = 'contactsList';

function getContacts() {
  return JSON.parse(localStorage.getItem(CONTACTS_KEY) || '[]');
}

function saveContacts(contacts) {
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
}

function renderContacts(filter = '') {
  const list = document.getElementById('contactsList');
  list.innerHTML = '';
  const contacts = getContacts();
  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(filter.toLowerCase()) ||
    c.phone.toLowerCase().includes(filter.toLowerCase()) ||
    c.type.toLowerCase().includes(filter.toLowerCase())
  );
  filtered.forEach(contact => {
    const li = document.createElement('li');
    li.innerHTML = `<label><input type="checkbox" class="contact-checkbox" value="${contact.id}"> <b>${contact.name}</b> (${contact.phone}) — ${contact.type}</label>`;
    list.appendChild(li);
  });
}

document.getElementById('addContactForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const name = document.getElementById('contactName').value.trim();
  const phone = document.getElementById('contactPhone').value.trim();
  const type = document.getElementById('contactType').value.trim();
  if (!name || !phone || !type) return;
  const contacts = getContacts();
  contacts.push({
    id: Date.now().toString(),
    name,
    phone,
    type
  });
  saveContacts(contacts);
  renderContacts(document.getElementById('searchContact').value);
  this.reset();
});

document.getElementById('searchContact').addEventListener('input', function() {
  renderContacts(this.value);
});

document.getElementById('sendMessageToContacts').addEventListener('click', function() {
  const checkboxes = document.querySelectorAll('.contact-checkbox:checked');
  if (checkboxes.length === 0) {
    alert('Выберите хотя бы один контакт!');
    return;
  }
  const contacts = getContacts();
  const selected = Array.from(checkboxes).map(cb => contacts.find(c => c.id === cb.value));
  // Здесь можно реализовать отправку сообщения выбранным контактам
  alert('Сообщение будет отправлено контактам:\n' + selected.map(c => `${c.name} (${c.phone})`).join('\n'));
  // TODO: интеграция с сервером для реальной отправки
});

// Первичная отрисовка
renderContacts();