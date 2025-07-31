<?php
// Файл для добавления примеров контактов для тестирования

require_once 'contacts.php';

try {
    $contactsDB = new ContactsDB();
    
    // Примеры контактов для тестирования
    $sampleContacts = [
        [
            'phone' => '+7 (999) 123-45-67',
            'name' => 'Иван Петров',
            'activity' => 'Менеджер по продажам',
            'token' => null
        ],
        [
            'phone' => '+7 (999) 234-56-78',
            'name' => 'Мария Сидорова',
            'activity' => 'Дизайнер',
            'token' => null
        ],
        [
            'phone' => '+7 (999) 345-67-89',
            'name' => 'Алексей Козлов',
            'activity' => 'Программист',
            'token' => null
        ],
        [
            'phone' => '+7 (999) 456-78-90',
            'name' => 'Елена Морозова',
            'activity' => 'Маркетолог',
            'token' => null
        ],
        [
            'phone' => '+7 (999) 567-89-01',
            'name' => 'Дмитрий Волков',
            'activity' => 'Аналитик',
            'token' => null
        ]
    ];
    
    echo "<h2>Добавление примеров контактов...</h2>\n";
    
    foreach ($sampleContacts as $contact) {
        $result = $contactsDB->addContact(
            $contact['phone'],
            $contact['name'],
            $contact['activity'],
            $contact['token']
        );
        
        if ($result) {
            echo "<p>✓ Добавлен контакт: {$contact['name']} - {$contact['phone']}</p>\n";
        } else {
            echo "<p>✗ Ошибка добавления контакта: {$contact['name']}</p>\n";
        }
    }
    
    echo "<h3>Готово! Примеры контактов добавлены.</h3>\n";
    echo "<p><a href='index.html'>Перейти к приложению</a></p>\n";
    
} catch (Exception $e) {
    echo "<h2>Ошибка:</h2>\n";
    echo "<p>" . $e->getMessage() . "</p>\n";
}
?>