<?php
// ==============================================================================
// Security & Interruption API: Violations, Heartbeat & Session Integrity
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
    echo json_encode(["success" => true, "status" => "offline_mode"]);
    exit;
}

try {
    // 1. Initialize or get active exam session
    if ($action === 'init_session') {
        $studentId = intval($data['studentId'] ?? 0);
        $examId = intval($data['examId'] ?? 1);

        if (!$studentId) {
            echo json_encode(["success" => false, "error" => "Student ID required."]);
            exit;
        }

        // Check if there is an interrupted attempt
        $checkStmt = $pdo->prepare("SELECT * FROM `exam_attempts` WHERE `student_id` = ? AND `exam_id` = ? ORDER BY `id` DESC LIMIT 1");
        $checkStmt->execute([$studentId, $examId]);
        $existing = $checkStmt->fetch();

        if ($existing) {
            if ($existing['status'] === 'Completed') {
                echo json_encode(["success" => false, "error" => "You have already completed this examination."]);
                exit;
            }
            if ($existing['status'] === 'Cancelled' || $existing['status'] === 'Interrupted') {
                echo json_encode([
                    "success" => false,
                    "isInterrupted" => true,
                    "attemptId" => $existing['id'],
                    "reason" => $existing['interruption_reason'] ?: "Examination was interrupted or terminated due to security violations.",
                    "error" => "Examination is locked. Contact your examination administrator to obtain an Exam Recovery Code."
                ]);
                exit;
            }
            // If already in progress, return existing session token
            echo json_encode([
                "success" => true,
                "attemptId" => $existing['id'],
                "sessionToken" => $existing['session_token'],
                "durationLeft" => $existing['duration_seconds_left'],
                "violations" => $existing['violations_count']
            ]);
            exit;
        }

        // Create new attempt
        $sessionToken = "EXAM-" . bin2hex(random_bytes(16));
        $now = date('Y-m-d H:i:s');
        $initStmt = $pdo->prepare("
            INSERT INTO `exam_attempts` (`student_id`, `exam_id`, `session_token`, `start_time`, `duration_seconds_left`, `status`, `last_heartbeat`)
            VALUES (?, ?, ?, ?, 5400, 'In Progress', ?)
        ");
        $initStmt->execute([$studentId, $examId, $sessionToken, $now, $now]);
        $attemptId = $pdo->lastInsertId();

        $updStudent = $pdo->prepare("UPDATE `students` SET `status` = 'In Progress' WHERE `id` = ?");
        $updStudent->execute([$studentId]);

        echo json_encode([
            "success" => true,
            "attemptId" => $attemptId,
            "sessionToken" => $sessionToken,
            "durationLeft" => 5400,
            "violations" => 0
        ]);
        exit;
    }

    // 2. Record Security Violation (Tab Switch, Defocus, Fullscreen Exit, Screenshot, Copy/Paste)
    if ($action === 'record_violation') {
        $studentId = intval($data['studentId'] ?? 0);
        $attemptId = intval($data['attemptId'] ?? 0);
        $violationType = trim($data['type'] ?? 'Tab Switch');
        $details = trim($data['details'] ?? 'Candidate switched window focus.');

        if ($attemptId && $studentId) {
            // Get current violation count
            $stmt = $pdo->prepare("SELECT `violations_count` FROM `exam_attempts` WHERE `id` = ?");
            $stmt->execute([$attemptId]);
            $attempt = $stmt->fetch();
            $newCount = ($attempt ? intval($attempt['violations_count']) : 0) + 1;

            // Log violation
            $logStmt = $pdo->prepare("
                INSERT INTO `exam_violations` (`attempt_id`, `student_id`, `violation_type`, `details`, `strike_number`)
                VALUES (?, ?, ?, ?, ?)
            ");
            $logStmt->execute([$attemptId, $studentId, $violationType, $details, $newCount]);

            // If 3 strikes reached, mark attempt as Cancelled
            if ($newCount >= 3) {
                $termStmt = $pdo->prepare("
                    UPDATE `exam_attempts`
                    SET `violations_count` = ?, `status` = 'Cancelled', `interruption_reason` = 'Exceeded maximum permitted proctoring violations (3 strikes).'
                    WHERE `id` = ?
                ");
                $termStmt->execute([$newCount, $attemptId]);

                $updStud = $pdo->prepare("UPDATE `students` SET `status` = 'Cancelled' WHERE `id` = ?");
                $updStud->execute([$studentId]);

                echo json_encode([
                    "success" => true,
                    "strike" => $newCount,
                    "maxStrikes" => 3,
                    "terminated" => true,
                    "reason" => "Assessment terminated automatically: 3 proctoring violations recorded."
                ]);
                exit;
            } else {
                $updStmt = $pdo->prepare("UPDATE `exam_attempts` SET `violations_count` = ? WHERE `id` = ?");
                $updStmt->execute([$newCount, $attemptId]);

                echo json_encode([
                    "success" => true,
                    "strike" => $newCount,
                    "maxStrikes" => 3,
                    "terminated" => false
                ]);
                exit;
            }
        }
    }

    // 3. Heartbeat / Session Sync
    if ($action === 'heartbeat') {
        $attemptId = intval($data['attemptId'] ?? 0);
        $durationLeft = intval($data['durationLeft'] ?? 5400);

        if ($attemptId) {
            $stmt = $pdo->prepare("UPDATE `exam_attempts` SET `duration_seconds_left` = ?, `last_heartbeat` = NOW() WHERE `id` = ? AND `status` = 'In Progress'");
            $stmt->execute([$durationLeft, $attemptId]);
            echo json_encode(["success" => true]);
            exit;
        }
    }

    // 4. Record Interruption (Browser Closed, Refreshed, or Navigated away)
    if ($action === 'record_interruption') {
        $studentId = intval($data['studentId'] ?? 0);
        $attemptId = intval($data['attemptId'] ?? 0);
        $reason = trim($data['reason'] ?? 'Candidate closed or refreshed exam window without submitting.');

        if ($attemptId) {
            $stmt = $pdo->prepare("
                UPDATE `exam_attempts`
                SET `status` = 'Interrupted', `interruption_reason` = ?
                WHERE `id` = ? AND `status` = 'In Progress'
            ");
            $stmt->execute([$reason, $attemptId]);

            if ($studentId) {
                $upd = $pdo->prepare("UPDATE `students` SET `status` = 'Interrupted' WHERE `id` = ?");
                $upd->execute([$studentId]);
            }
            echo json_encode(["success" => true, "message" => "Exam marked as interrupted."]);
            exit;
        }
    }

    // 5. Offline Exam Answers Synchronization
    if ($action === 'sync_offline_answers') {
        $studentId = intval($data['studentId'] ?? 0);
        $answers = $data['answers'] ?? [];

        if ($studentId && is_array($answers)) {
            $stmt = $pdo->prepare("
                INSERT INTO `student_answers` (`attempt_id`, `student_id`, `section_id`, `question_id`, `selected_option`, `is_synced`)
                VALUES (1, ?, ?, ?, ?, 1)
                ON DUPLICATE KEY UPDATE `selected_option` = VALUES(`selected_option`), `is_synced` = 1
            ");
            foreach ($answers as $ans) {
                $sec = $ans['sectionKey'] ?? 'section1';
                $qid = $ans['questionId'] ?? 'q1';
                $val = is_scalar($ans['value']) ? strval($ans['value']) : json_encode($ans['value']);
                $stmt->execute([$studentId, $sec, $qid, $val]);
            }
            echo json_encode(["success" => true, "syncedCount" => count($answers)]);
            exit;
        }
    }

} catch (Exception $e) {
    error_log("Security API Error: " . $e->getMessage());
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
    exit;
}

echo json_encode(["success" => false, "error" => "Invalid security request."]);
?>
