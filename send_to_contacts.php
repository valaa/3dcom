<?php
if ($_SERVER['REQUEST_METHOD'] != 'POST') {
    header('HTTP/1.1 400 Bad Request');
    exit;
}

header('Content-Type: application/json; charset=utf-8');

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['contact_ids']) || !isset($input['message'])) {
    echo json_encode(['success' => false, 'error' => 'Missing required parameters']);
    exit;
}

// Подключаемся к базе данных контактов
try {
    $db = new PDO('sqlite:contacts.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Получаем контакты по ID
    $placeholders = str_repeat('?,', count($input['contact_ids']) - 1) . '?';
    $sql = "SELECT * FROM contacts WHERE id IN ($placeholders) AND token IS NOT NULL AND token != ''";
    $stmt = $db->prepare($sql);
    $stmt->execute($input['contact_ids']);
    $contacts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($contacts)) {
        echo json_encode(['success' => false, 'error' => 'No contacts found with valid tokens']);
        exit;
    }
    
    $url = 'https://fcm.googleapis.com/fcm/send';
    $YOUR_API_KEY = 'AAAAaGQ_q2M:APA91bGCEOduj8HM6gP24w2LEnesqM2zkL_qx2PJUSBjjeGSdJhCrDoJf_WbT7wpQZrynHlESAoZ1VHX9Nro6W_tqpJ3Aw-A292SVe_4Ho7tJQCQxSezDCoJsnqXjoaouMYIwr34vZTs';
    
    $results = [];
    $successCount = 0;
    $failCount = 0;
    
    foreach ($contacts as $contact) {
        $request_body = [
            'to' => $contact['token'],
            'data' => [
                'title' => $input['message']['title'] ?? 'Сообщение',
                'body' => $input['message']['body'] ?? 'У вас новое сообщение',
                'icon' => $input['message']['icon'] ?? 'https://eralash.ru.rsz.io/sites/all/themes/eralash_v5/logo.png?width=40&height=40',
                'click_action' => $input['message']['click_action'] ?? '',
            ],
        ];
        
        $request_headers = [
            'Content-Type: application/json',
            'Authorization: key=' . $YOUR_API_KEY,
        ];
        
        $fields = json_encode($request_body);
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
        curl_setopt($ch, CURLOPT_HTTPHEADER, $request_headers);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $fields);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        $responseData = json_decode($response, true);
        
        if ($httpCode == 200 && isset($responseData['success']) && $responseData['success'] > 0) {
            $successCount++;
            $results[] = [
                'contact' => $contact['name'],
                'status' => 'sent',
                'response' => $responseData
            ];
        } else {
            $failCount++;
            $results[] = [
                'contact' => $contact['name'],
                'status' => 'failed',
                'response' => $responseData,
                'error' => $response
            ];
        }
    }
    
    echo json_encode([
        'success' => true,
        'total_contacts' => count($contacts),
        'sent_successfully' => $successCount,
        'failed' => $failCount,
        'results' => $results
    ]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>