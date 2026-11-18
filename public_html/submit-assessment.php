<?php
// ==============================================================================
// Assessment Submission Endpoint (3 Sections: Q&A&V 40M, Technical 20M, Coding 40M)
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

if (!$data || empty($data['email'])) {
    echo json_encode(["success" => false, "error" => "Student email is required."]);
    exit;
}

$email = strtolower(trim($data['email']));
$attemptId = intval($data['attemptId'] ?? 0);

// Section 1: Q&A&V (Aptitude, Analytical, Verbal) -> 40 Marks max
$s1 = floatval($data['section1Score'] ?? 0);
// Section 2: Technical Core (Branch Specific) -> 20 Marks max
$s2 = floatval($data['section2Score'] ?? 0);
// Section 3: Coding Sandbox (2 Problems × 20 Marks) -> 40 Marks max
$q1Score = intval($data['codingQ1Score'] ?? 0);
$q2Score = intval($data['codingQ2Score'] ?? 0);
$s3Coding = floatval($data['section3Score'] ?? ($q1Score + $q2Score));

$total = floatval($data['totalScore'] ?? ($s1 + $s2 + $s3Coding));
$max = floatval($data['maxScore'] ?? 100);
$percentage = $max > 0 ? round(($total / $max) * 100, 2) : 0;
$isPassed = $total >= 60 ? 1 : 0;

$violations = intval($data['violations'] ?? 0);
$violationDetails = !empty($data['violationDetails']) ? json_encode($data['violationDetails']) : null;

$q1Code = $data['codingQ1Code'] ?? '';
$q1Lang = $data['codingQ1Lang'] ?? 'python';
$q1CasesPassed = intval($data['codingQ1CasesPassed'] ?? ($q1Score === 20 ? 4 : 0));
$q1Executed = !empty($data['codingQ1Executed']) || ($q1CasesPassed === 4 && $q1Score === 20);

$q2Code = $data['codingQ2Code'] ?? '';
$q2Lang = $data['codingQ2Lang'] ?? 'python';
$q2CasesPassed = intval($data['codingQ2CasesPassed'] ?? ($q2Score === 20 ? 4 : 0));
$q2Executed = !empty($data['codingQ2Executed']) || ($q2CasesPassed === 4 && $q2Score === 20);

$codingProblemsExecuted = ($q1Executed ? 1 : 0) + ($q2Executed ? 1 : 0);

$answersJson = !empty($data['answers']) ? json_encode($data['answers']) : '';

$pdo = getDbConnection();
if ($pdo) {
    try {
        $findStmt = $pdo->prepare("SELECT `id`, `full_name`, `stream`, `college` FROM `students` WHERE LOWER(`email`) = ? LIMIT 1");
        $findStmt->execute([$email]);
        $student = $findStmt->fetch();

        if ($student) {
            $studentId = $student['id'];

            // 1. Insert or update `assessments` record
            $insStmt = $pdo->prepare("
                INSERT INTO `assessments` (
                    `student_id`, `student_email`, `section_1_score`, `section_2_score`,
                    `section_3_score`, `total_score`, `max_score`, `percentage`,
                    `proctoring_violations`, `violation_details`,
                    `coding_q1_code`, `coding_q1_lang`, `coding_q1_score`,
                    `coding_q2_code`, `coding_q2_lang`, `coding_q2_score`,
                    `answers_json`, `recruiter_status`
                ) VALUES (
                    ?, ?, ?, ?,
                    ?, ?, ?, ?,
                    ?, ?,
                    ?, ?, ?,
                    ?, ?, ?,
                    ?, ?
                )
                ON DUPLICATE KEY UPDATE
                    `section_1_score` = VALUES(`section_1_score`),
                    `section_2_score` = VALUES(`section_2_score`),
                    `section_3_score` = VALUES(`section_3_score`),
                    `total_score` = VALUES(`total_score`),
                    `max_score` = VALUES(`max_score`),
                    `percentage` = VALUES(`percentage`),
                    `proctoring_violations` = VALUES(`proctoring_violations`),
                    `violation_details` = VALUES(`violation_details`),
                    `coding_q1_code` = VALUES(`coding_q1_code`),
                    `coding_q1_lang` = VALUES(`coding_q1_lang`),
                    `coding_q1_score` = VALUES(`coding_q1_score`),
                    `coding_q2_code` = VALUES(`coding_q2_code`),
                    `coding_q2_lang` = VALUES(`coding_q2_lang`),
                    `coding_q2_score` = VALUES(`coding_q2_score`),
                    `answers_json` = VALUES(`answers_json`),
                    `recruiter_status` = VALUES(`recruiter_status`)
            ");

            $recruiterStatus = $isPassed ? 'Shortlisted' : 'Under Review';
            $insStmt->execute([
                $studentId, $email, $s1, $s2,
                $s3Coding, $total, $max, $percentage,
                $violations, $violationDetails,
                $q1Code, $q1Lang, $q1Score,
                $q2Code, $q2Lang, $q2Score,
                $answersJson, $recruiterStatus
            ]);

            // 2. Update `exam_attempts` table
            if ($attemptId) {
                $updAttempt = $pdo->prepare("
                    UPDATE `exam_attempts`
                    SET `status` = 'Completed',
                        `end_time` = NOW(),
                        `sec_1_score` = ?,
                        `sec_2_score` = ?,
                        `sec_3_score` = ?,
                        `total_score` = ?,
                        `percentage` = ?,
                        `is_passed` = ?,
                        `violations_count` = ?
                    WHERE `id` = ?
                ");
                $updAttempt->execute([$s1, $s2, $s3Coding, $total, $percentage, $isPassed, $violations, $attemptId]);
            } else {
                // Check if active attempt exists
                $updAttempt = $pdo->prepare("
                    UPDATE `exam_attempts`
                    SET `status` = 'Completed',
                        `end_time` = NOW(),
                        `sec_1_score` = ?,
                        `sec_2_score` = ?,
                        `sec_3_score` = ?,
                        `total_score` = ?,
                        `percentage` = ?,
                        `is_passed` = ?,
                        `violations_count` = ?
                    WHERE `student_id` = ? AND `status` = 'In Progress'
                ");
                $updAttempt->execute([$s1, $s2, $s3Coding, $total, $percentage, $isPassed, $violations, $studentId]);
            }

            // 3. Update student status to Completed
            $updStud = $pdo->prepare("UPDATE `students` SET `status` = 'Completed' WHERE `id` = ?");
            $updStud->execute([$studentId]);

            // 4. Update 10-Stage Pipeline Status (provisional, unpublished)
            try {
                $updPipe = $pdo->prepare("
                    INSERT INTO `result_approvals` (
                        `student_id`, `stage_status`, `section_1_score`, `section_2_score`, `section_3_score`, `total_score`, `is_approved`, `is_published_to_student`
                    ) VALUES (?, 'Exam Submitted', ?, ?, ?, ?, 0, 0)
                    ON DUPLICATE KEY UPDATE
                        `stage_status` = 'Exam Submitted',
                        `section_1_score` = VALUES(`section_1_score`),
                        `section_2_score` = VALUES(`section_2_score`),
                        `section_3_score` = VALUES(`section_3_score`),
                        `total_score` = VALUES(`total_score`),
                        `is_published_to_student` = 0
                ");
                $updPipe->execute([$studentId, $s1, $s2, $s3Coding, $total]);
            } catch (Exception $ePipe) {}

            // 5. Real-Time Sync to local candidates store if present
            $jsonStore = __DIR__ . '/registered_students.json';
            if (file_exists($jsonStore)) {
                try {
                    $rawJson = file_get_contents($jsonStore);
                    $cands = json_decode($rawJson, true);
                    if (is_array($cands)) {
                        foreach ($cands as &$c) {
                            if (isset($c['email']) && strtolower(trim($c['email'])) === $email) {
                                $c['status'] = 'Completed';
                                $c['testStatus'] = 'Completed';
                                $c['assessment'] = [
                                    'total_score' => $total,
                                    'section_1_score' => $s1,
                                    'section_2_score' => $s2,
                                    'section_3_score' => $s3Coding,
                                    'coding_q1_score' => $q1Score,
                                    'coding_q1_lang' => $q1Lang,
                                    'coding_q1_code' => $q1Code,
                                    'coding_q1_cases_passed' => $q1CasesPassed,
                                    'coding_q1_executed' => $q1Executed,
                                    'coding_q2_score' => $q2Score,
                                    'coding_q2_lang' => $q2Lang,
                                    'coding_q2_code' => $q2Code,
                                    'coding_q2_cases_passed' => $q2CasesPassed,
                                    'coding_q2_executed' => $q2Executed,
                                    'coding_problems_executed' => $codingProblemsExecuted,
                                    'answers' => $data['answers'] ?? null,
                                    'violations' => $violations,
                                    'submitted_at' => date('Y-m-d H:i:s')
                                ];
                                $c['testScore'] = $c['assessment'];
                            }
                        }
                        file_put_contents($jsonStore, json_encode($cands, JSON_PRETTY_PRINT));
                    }
                } catch (Exception $eJson) {}
            }

            echo json_encode([
                "success" => true,
                "message" => "Examination submitted and recorded successfully in database.",
                "totalScore" => $total,
                "percentage" => $percentage,
                "isPassed" => (bool)$isPassed,
                "sectionScores" => [
                    "section1" => $s1,
                    "section2" => $s2,
                    "section3" => $s3Coding
                ]
            ]);
            exit;
        }
    } catch (Exception $e) {
        error_log("Submit assessment error: " . $e->getMessage());
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
        exit;
    }
}

// Fallback response if DB not connected
echo json_encode([
    "success" => true,
    "message" => "Assessment submitted locally.",
    "totalScore" => $total,
    "percentage" => $percentage,
    "isPassed" => (bool)$isPassed
]);
?>