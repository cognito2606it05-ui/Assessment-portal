<?php
// ==============================================================================
// Real-Time Resend OTP Dispatcher & MySQL Storage
// Domain: contest.cognitoinsights.tech
// Verified Sender: noreply@cognitoinsights.tech
// ==============================================================================

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Method not allowed. Use POST."]);
    exit;
}

require_once __DIR__ . '/db.php';

$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput, true);

if (!$data || empty($data['email']) || empty($data['otp'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Email and OTP code are required."]);
    exit;
}

$toEmail = trim($data['email']);
$otpCode = trim($data['otp']);
$candidateName = !empty($data['name']) ? trim($data['name']) : "Candidate";

// Resend Configuration (Loaded from .env / environment)
$apiKey = getenv('RESEND_API_KEY') ?: '';
if (empty($apiKey) && file_exists(__DIR__ . '/.env')) {
    $envLines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($envLines as $line) {
        $line = trim($line);
        if ($line && strpos($line, '#') !== 0 && strpos($line, '=') !== false) {
            list($k, $v) = explode('=', $line, 2);
            if (trim($k) === 'RESEND_API_KEY') {
                $apiKey = trim($v);
                break;
            }
        }
    }
}
$senderEmail = getenv('RESEND_SENDER_EMAIL') ?: "noreply@cognitoinsights.tech";
$senderName = getenv('RESEND_SENDER_NAME') ?: "Cognito Tech Hub";

$emailHtml = <<<HTML
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 24px; margin: 0;">
  <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 28px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
    <div style="text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 20px;">
      <h2 style="color: #1e3a8a; margin: 0; font-size: 22px; font-weight: 800;">COGNITO TECH HUB</h2>
      <p style="color: #4f46e5; font-size: 13px; font-weight: 600; margin: 4px 0 0 0;">In Partnership with Quantex Recruitment &bull; GET Hiring 2026</p>
    </div>
    <p style="color: #1e293b; font-size: 14px;">Hello <strong>{$candidateName}</strong>,</p>
    <p style="color: #475569; font-size: 13px; line-height: 1.6;">
      Thank you for registering on the Cognito Tech Hub Assessment Portal conducted by Quantex. To verify your email address and activate your examination, please enter the One-Time Password (OTP) below:
    </p>
    <div style="background-color: #eff6ff; border: 2px dashed #2563eb; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
      <div style="font-size: 11px; font-weight: bold; color: #1d4ed8; letter-spacing: 1.5px; margin-bottom: 6px; text-transform: uppercase;">Your Verification OTP Code</div>
      <div style="font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #1e40af; font-family: monospace;">{$otpCode}</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 6px;">Valid for 10 minutes &bull; Do not share with anyone</div>
    </div>
    <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
      Once verified, you will proceed through the proctored assessment sections (Aptitude, Core Technical, Architecture Case Study, 2 Coding Challenges, and Behavioral Evaluation).
    </p>
    <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; font-size: 11px; color: #94a3b8; text-align: center;">
      Automated verification dispatched via Resend API &bull; cognitoinsights.tech
    </div>
  </div>
</body>
</html>
HTML;

$payload = json_encode([
    "from" => "{$senderName} <{$senderEmail}>",
    "to" => [$toEmail],
    "subject" => "Cognito Assessment Portal - Verification OTP: {$otpCode}",
    "html" => $emailHtml
]);

// Call Resend API via cURL
$resMessageId = null;
$resError = null;

if (function_exists('curl_init')) {
    $ch = curl_init("https://api.resend.com/emails");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer {$apiKey}",
        "Content-Type: application/json"
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);

    if ($curlErr) {
        $resError = "cURL error: " . $curlErr;
    } else {
        $resData = json_decode($response, true);
        if ($httpCode >= 200 && $httpCode < 300 && !empty($resData['id'])) {
            $resMessageId = $resData['id'];
        } else {
            $resError = !empty($resData['message']) ? $resData['message'] : "Failed to dispatch email via Resend.";
        }
    }
} else {
    // Stream context fallback if curl is not installed
    $opts = [
        "http" => [
            "method" => "POST",
            "header" => "Authorization: Bearer {$apiKey}\r\nContent-Type: application/json\r\n",
            "content" => $payload,
            "timeout" => 15,
            "ignore_errors" => true
        ]
    ];
    $context = stream_context_create($opts);
    $response = @file_get_contents("https://api.resend.com/emails", false, $context);
    $resData = json_decode($response, true);
    if (!empty($resData['id'])) {
        $resMessageId = $resData['id'];
    } else {
        $resError = !empty($resData['message']) ? $resData['message'] : "Resend HTTP stream error.";
    }
}

// Save OTP into MySQL database
$pdo = getDbConnection();
if ($pdo) {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO `email_otps` (`email`, `otp_code`, `candidate_name`, `resend_message_id`, `expires_at`)
            VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))
        ");
        $stmt->execute([$toEmail, $otpCode, $candidateName, $resMessageId]);
    } catch (Exception $dbErr) {
        error_log("Failed to log OTP in database: " . $dbErr->getMessage());
    }
}

if ($resMessageId) {
    echo json_encode([
        "success" => true,
        "id" => $resMessageId,
        "message" => "Real-time OTP email dispatched via Resend to {$toEmail}"
    ]);
} else {
    echo json_encode([
        "success" => false,
        "error" => $resError ?: "Resend delivery failed. Please check your recipient email address."
    ]);
}
?>
