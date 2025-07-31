<?php
header('Content-Type: application/json; charset=utf-8');

class ContactsDB {
    private $db;
    
    public function __construct() {
        $this->db = new PDO('sqlite:contacts.db');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->createTable();
    }
    
    private function createTable() {
        $sql = "CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone VARCHAR(20) NOT NULL,
            name VARCHAR(100) NOT NULL,
            activity VARCHAR(200) NOT NULL,
            token VARCHAR(500),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )";
        $this->db->exec($sql);
    }
    
    public function addContact($phone, $name, $activity, $token = null) {
        $sql = "INSERT INTO contacts (phone, name, activity, token) VALUES (?, ?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([$phone, $name, $activity, $token]);
    }
    
    public function getAllContacts() {
        $sql = "SELECT * FROM contacts ORDER BY name";
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function searchContacts($search) {
        $sql = "SELECT * FROM contacts WHERE 
                name LIKE ? OR 
                phone LIKE ? OR 
                activity LIKE ? 
                ORDER BY name";
        $stmt = $this->db->prepare($sql);
        $searchTerm = '%' . $search . '%';
        $stmt->execute([$searchTerm, $searchTerm, $searchTerm]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function getContactById($id) {
        $sql = "SELECT * FROM contacts WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    public function updateContact($id, $phone, $name, $activity, $token = null) {
        $sql = "UPDATE contacts SET phone = ?, name = ?, activity = ?, token = ? WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([$phone, $name, $activity, $token, $id]);
    }
    
    public function deleteContact($id) {
        $sql = "DELETE FROM contacts WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([$id]);
    }
    
    public function getContactsByIds($ids) {
        if (empty($ids)) return [];
        $placeholders = str_repeat('?,', count($ids) - 1) . '?';
        $sql = "SELECT * FROM contacts WHERE id IN ($placeholders)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($ids);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

// API endpoints
$contactsDB = new ContactsDB();
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['search'])) {
                $contacts = $contactsDB->searchContacts($_GET['search']);
            } elseif (isset($_GET['id'])) {
                $contacts = $contactsDB->getContactById($_GET['id']);
            } else {
                $contacts = $contactsDB->getAllContacts();
            }
            echo json_encode(['success' => true, 'data' => $contacts]);
            break;
            
        case 'POST':
            if (isset($input['ids'])) {
                // Получить контакты по массиву ID
                $contacts = $contactsDB->getContactsByIds($input['ids']);
                echo json_encode(['success' => true, 'data' => $contacts]);
            } else {
                // Добавить новый контакт
                $result = $contactsDB->addContact(
                    $input['phone'], 
                    $input['name'], 
                    $input['activity'],
                    $input['token'] ?? null
                );
                echo json_encode(['success' => $result]);
            }
            break;
            
        case 'PUT':
            $result = $contactsDB->updateContact(
                $input['id'],
                $input['phone'], 
                $input['name'], 
                $input['activity'],
                $input['token'] ?? null
            );
            echo json_encode(['success' => $result]);
            break;
            
        case 'DELETE':
            $id = $input['id'] ?? $_GET['id'];
            $result = $contactsDB->deleteContact($id);
            echo json_encode(['success' => $result]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>