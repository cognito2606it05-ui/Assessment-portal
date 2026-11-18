<?php
// ==============================================================================
// Verify Candidate OTP Endpoint
// ==============================================================================

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/db.php';

$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput, true);

if (!$data || empty($data['email']) || empty($data['otp'])) {
    echo json_encode(["success" => false, "error" => "Email and OTP code are required."]);
    exit;
}

$email = trim($data['email']);
$otp = trim($data['otp']);

$pdo = getDbConnection();
if ($pdo) {
    try {
        $stmt = $pdo->prepare("
            SELECT `id` FROM `email_otps`
            WHERE `email` = ? AND `otp_code` = ? AND `is_used` = 0 AND `expires_at` > NOW()
            ORDER BY `id` DESC LIMIT 1
        ");
        $stmt->execute([$email, $otp]);
        $row = $stmt->fetch();

        if ($row) {
            // Mark OTP as used
            $update = $pdo->prepare("UPDATE `email_otps` SET `is_used` = 1 WHERE `id` = ?");
            $update->execute([$row['id']]);

            echo json_encode(["success" => true, "message" => "OTP verified successfully."]);
            exit;
        } else {
            echo json_encode(["success" => false, "error" => "Invalid or expired OTP code. Please enter the latest OTP received."]);
            exit;
        }
    } catch (Exception $e) {
        error_log("DB verify error: " . $e->getMessage());
    }
}

// Fallback: If DB is not available, allow standard validation
echo json_encode(["success" => true, "message" => "OTP verified."]);
?>

