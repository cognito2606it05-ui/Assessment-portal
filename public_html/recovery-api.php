<?php
// ==============================================================================
// Admin-Controlled Exam Recovery API (Code Generation & Authorization)
// ==============================================================================

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/db.php';

$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput, true);
$action = $_GET['action'] ?? ($data['action'] ?? '');

$pdo = getDbConnection();

if (!$pdo) {
    echo json_encode(["success" => false, "error" => "Database connection unavailable for recovery."]);
    exit;
}

try {
    // --------------------------------------------------------------------------
    // ACTION 1: ADMIN - List all interrupted or cancelled attempts needing recovery
    // --------------------------------------------------------------------------
    if ($action === 'list_interrupted') {
        $stmt = $pdo->query("
            SELECT
                a.id as attempt_id,
                a.student_id,
                a.start_time,
                a.duration_seconds_left,
                a.status as attempt_status,
                a.interruption_reason,
                a.violations_count,
                s.registration_id,
                s.full_name as student_name,
                s.email as student_email,
                s.college,
                s.course,
                s.stream,
                (SELECT COUNT(*) FROM `exam_violations` v WHERE v.attempt_id = a.id) as total_violations
            FROM `exam_attempts` a
            JOIN `students` s ON a.student_id = s.id
            WHERE a.status IN ('Interrupted', 'Cancelled')
            ORDER BY a.id DESC
        ");
        $attempts = $stmt->fetchAll();

        // Also fetch active recovery codes
        $codeStmt = $pdo->query("
            SELECT r.*, s.full_name as student_name, s.email as student_email
            FROM `exam_recovery_codes` r
            JOIN `students` s ON r.student_id = s.id
            ORDER BY r.id DESC LIMIT 50
        ");
        $codes = $codeStmt->fetchAll();

        echo json_encode([
            "success" => true,
            "interruptedAttempts" => $attempts,
            "recoveryCodes" => $codes
        ]);
        exit;
    }

    // --------------------------------------------------------------------------
    // ACTION 2: ADMIN - Generate secure recovery code
    // --------------------------------------------------------------------------
    if ($action === 'generate_code') {
        $attemptId = intval($data['attemptId'] ?? 0);
        $studentId = intval($data['studentId'] ?? 0);
        $adminName = trim($data['adminName'] ?? 'Lead Recruiter');
        $reason = trim($data['reason'] ?? 'Candidate experienced hardware/network interruption. Authorized to resume exam.');
        $validityHours = intval($data['validityHours'] ?? 2);
        $permittedUses = intval($data['permittedUses'] ?? 1);

        if (!$attemptId || !$studentId) {
            echo json_encode(["success" => false, "error" => "Attempt ID and Student ID are required."]);
            exit;
        }

        // Generate 8-character cryptographic recovery code: e.g. REC-89F2A1
        $codeSuffix = strtoupper(bin2hex(random_bytes(3)));
        $plainCode = "REC-" . $codeSuffix;
        $codeHash = password_hash($plainCode, PASSWORD_BCRYPT);
        $plainPrefix = substr($plainCode, 0, 7) . "...";

        $expiresAt = date('Y-m-d H:i:s', strtotime("+{$validityHours} hours"));

        // Deactivate previous active recovery codes for this attempt
        $deactivateStmt = $pdo->prepare("UPDATE `exam_recovery_codes` SET `is_active` = 0 WHERE `attempt_id` = ?");
        $deactivateStmt->execute([$attemptId]);

        // Insert new recovery code
        $insertStmt = $pdo->prepare("
            INSERT INTO `exam_recovery_codes` (
                `attempt_id`, `student_id`, `code_hash`, `plain_prefix`,
                `generated_by_admin`, `reason`, `permitted_uses`, `is_active`, `expires_at`
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
        ");
        $insertStmt->execute([
            $attemptId, $studentId, $codeHash, $plainPrefix,
            $adminName, $reason, $permittedUses, $expiresAt
        ]);
        $recoveryCodeId = $pdo->lastInsertId();

        // Audit Log in History
        $histStmt = $pdo->prepare("
            INSERT INTO `exam_recovery_history` (`recovery_code_id`, `attempt_id`, `student_id`, `action`, `admin_name`, `notes`)
            VALUES (?, ?, ?, 'GENERATED', ?, ?)
        ");
        $histStmt->execute([$recoveryCodeId, $attemptId, $studentId, $adminName, $reason]);

        echo json_encode([
            "success" => true,
            "message" => "Recovery access code generated successfully.",
            "recoveryCode" => $plainCode, // Displayed once to admin to share with candidate
            "expiresAt" => $expiresAt,
            "permittedUses" => $permittedUses
        ]);
        exit;
    }

    // --------------------------------------------------------------------------
    // ACTION 3: CANDIDATE - Redeem recovery code to resume interrupted exam
    // --------------------------------------------------------------------------
    if ($action === 'verify_and_resume') {
        $studentEmail = strtolower(trim($data['email'] ?? ''));
        $enteredCode = strtoupper(trim($data['recoveryCode'] ?? ''));

        if (!$studentEmail || !$enteredCode) {
            echo json_encode(["success" => false, "error" => "Please enter your registered email and the Recovery Access Code."]);
            exit;
        }

        // Find candidate
        $studStmt = $pdo->prepare("SELECT * FROM `students` WHERE LOWER(`email`) = ? LIMIT 1");
        $studStmt->execute([$studentEmail]);
        $student = $studStmt->fetch();

        if (!$student) {
            echo json_encode(["success" => false, "error" => "No candidate account found with this email."]);
            exit;
        }

        // Fetch candidate's active recovery codes
        $codeStmt = $pdo->prepare("
            SELECT r.*, a.duration_seconds_left, a.status as attempt_status
            FROM `exam_recovery_codes` r
            JOIN `exam_attempts` a ON r.attempt_id = a.id
            WHERE r.student_id = ? AND r.is_active = 1
            ORDER BY r.id DESC
        ");
        $codeStmt->execute([$student['id']]);
        $activeCodes = $codeStmt->fetchAll();

        if (empty($activeCodes)) {
            echo json_encode([
                "success" => false,
                "error" => "No active recovery code found for your account. Please contact your exam administrator."
            ]);
            exit;
        }

        $matchedCode = null;
        foreach ($activeCodes as $ac) {
            // Check expiry
            if (strtotime($ac['expires_at']) < time()) {
                continue;
            }
            // Check usage limit
            if (intval($ac['used_count']) >= intval($ac['permitted_uses'])) {
                continue;
            }
            // Check code hash
            if (password_verify($enteredCode, $ac['code_hash']) || $enteredCode === $ac['code_hash']) {
                $matchedCode = $ac;
                break;
            }
        }

        if (!$matchedCode) {
            echo json_encode([
                "success" => false,
                "error" => "Invalid or expired recovery code. Please check code or request a new one from administrator."
            ]);
            exit;
        }

        // Code is valid! Reauthorize exam attempt
        $pdo->beginTransaction();

        $newUsedCount = intval($matchedCode['used_count']) + 1;
        $isActive = ($newUsedCount < intval($matchedCode['permitted_uses'])) ? 1 : 0;

        $updCode = $pdo->prepare("UPDATE `exam_recovery_codes` SET `used_count` = ?, `is_active` = ? WHERE `id` = ?");
        $updCode->execute([$newUsedCount, $isActive, $matchedCode['id']]);

        // Restore attempt to 'In Progress'
        $updAttempt = $pdo->prepare("
            UPDATE `exam_attempts`
            SET `status` = 'In Progress', `interruption_reason` = NULL, `last_heartbeat` = NOW()
            WHERE `id` = ?
        ");
        $updAttempt->execute([$matchedCode['attempt_id']]);

        // Restore student status to 'In Progress'
        $updStudent = $pdo->prepare("UPDATE `students` SET `status` = 'In Progress' WHERE `id` = ?");
        $updStudent->execute([$student['id']]);

        // Audit log
        $hist = $pdo->prepare("
            INSERT INTO `exam_recovery_history` (`recovery_code_id`, `attempt_id`, `student_id`, `action`, `admin_name`, `ip_address`, `notes`)
            VALUES (?, ?, ?, 'USED', ?, ?, 'Candidate successfully validated recovery code and resumed assessment.')
        ");
        $hist->execute([
            $matchedCode['id'],
            $matchedCode['attempt_id'],
            $student['id'],
            $matchedCode['generated_by_admin'],
            $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'
        ]);

        $pdo->commit();

        echo json_encode([
            "success" => true,
            "message" => "Examination reauthorized! You can now resume your assessment.",
            "attemptId" => $matchedCode['attempt_id'],
            "durationLeft" => max(intval($matchedCode['duration_seconds_left']), 600) // Ensure at least 10 minutes left
        ]);
        exit;
    }

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Recovery API Error: " . $e->getMessage());
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
    exit;
}

echo json_encode(["success" => false, "error" => "Invalid recovery request."]);
?>
