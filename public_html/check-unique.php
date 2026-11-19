<?php
// ==============================================================================
// Cognito Assessment Portal - Unique Email & Phone Verification Endpoint
// ==============================================================================

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/db.php';

$email = strtolower(trim($_GET['email'] ?? $_POST['email'] ?? ''));
$mobile = trim($_GET['mobile'] ?? $_POST['mobile'] ?? '');
$cleanMobile = preg_replace('/\D/', '', $mobile);

$emailExists = false;
$mobileExists = false;
$existingRegId = null;
$existingName = null;

$pdo = getDbConnection();
if ($pdo) {
    if (!empty($email)) {
        try {
            $stmt = $pdo->prepare("SELECT `id`, `registration_id`, `full_name` FROM `students` WHERE LOWER(`email`) = ? LIMIT 1");
            $stmt->execute([$email]);
            if ($row = $stmt->fetch()) {
                $emailExists = true;
                $existingRegId = $row['registration_id'];
                $existingName = $row['full_name'];
            }
        } catch (Exception $e) {}
    }

    if (!empty($cleanMobile)) {
        try {
            $stmt = $pdo->prepare("
                SELECT `id`, `registration_id`, `full_name` 
                FROM `students` 
                WHERE `mobile` = ? 
                   OR `mobile` = ? 
                   OR RIGHT(REPLACE(REPLACE(`mobile`, ' ', ''), '-', ''), 10) = RIGHT(?, 10)
                LIMIT 1
            ");
            $stmt->execute([$mobile, $cleanMobile, $cleanMobile]);
            if ($row = $stmt->fetch()) {
                $mobileExists = true;
                if (!$existingRegId) $existingRegId = $row['registration_id'];
                if (!$existingName) $existingName = $row['full_name'];
            }
        } catch (Exception $e) {}
    }
} else {
    // Local JSON store fallback
    $jsonPath = __DIR__ . '/registered_students.json';
    if (file_exists($jsonPath)) {
        $raw = file_get_contents($jsonPath);
        $data = json_decode($raw, true);
        if (is_array($data)) {
            foreach ($data as $st) {
                if ($email && !empty($st['email']) && strtolower(trim($st['email'])) === $email) {
                    $emailExists = true;
                    $existingRegId = $st['registrationId'] ?? null;
                    $existingName = $st['name'] ?? null;
                }
                if ($cleanMobile && !empty($st['mobile'])) {
                    $stClean = preg_replace('/\D/', '', $st['mobile']);
                    if ($stClean === $cleanMobile || (strlen($stClean) >= 10 && strlen($cleanMobile) >= 10 && substr($stClean, -10) === substr($cleanMobile, -10))) {
                        $mobileExists = true;
                        if (!$existingRegId) $existingRegId = $st['registrationId'] ?? null;
                        if (!$existingName) $existingName = $st['name'] ?? null;
                    }
                }
            }
        }
    }
}

echo json_encode([
    "success" => true,
    "emailExists" => $emailExists,
    "mobileExists" => $mobileExists,
    "existingRegistrationId" => $existingRegId,
    "existingName" => $existingName
]);
?>
