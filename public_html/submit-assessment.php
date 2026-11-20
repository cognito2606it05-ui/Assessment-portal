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

            // 1. Strict Upsert: Exactly ONE assessment row per student
            $chkAss = $pdo->prepare("SELECT id FROM `assessments` WHERE `student_id` = ? ORDER BY id DESC LIMIT 1");
            $chkAss->execute([$studentId]);
            $existingAss = $chkAss->fetch();

            $recruiterStatus = $isPassed ? 'Shortlisted' : 'Under Review';
            $assessmentId = null;

            if ($existingAss) {
                $assessmentId = (int)$existingAss['id'];
                $updStmt = $pdo->prepare("
                    UPDATE `assessments` SET
                        `student_email` = ?,
                        `section_1_score` = ?,
                        `section_2_score` = ?,
                        `section_3_score` = ?,
                        `total_score` = ?,
                        `max_score` = ?,
                        `percentage` = ?,
                        `proctoring_violations` = ?,
                        `violation_details` = ?,
                        `coding_q1_code` = ?,
                        `coding_q1_lang` = ?,
                        `coding_q1_score` = ?,
                        `coding_q2_code` = ?,
                        `coding_q2_lang` = ?,
                        `coding_q2_score` = ?,
                        `answers_json` = ?,
                        `recruiter_status` = ?,
                        `submitted_at` = NOW()
                    WHERE `id` = ?
                ");
                $updStmt->execute([
                    $email, $s1, $s2,
                    $s3Coding, $total, $max, $percentage,
                    $violations, $violationDetails,
                    $q1Code, $q1Lang, $q1Score,
                    $q2Code, $q2Lang, $q2Score,
                    $answersJson, $recruiterStatus,
                    $assessmentId
                ]);
            } else {
                $insStmt = $pdo->prepare("
                    INSERT INTO `assessments` (
                        `student_id`, `student_email`, `section_1_score`, `section_2_score`,
                        `section_3_score`, `total_score`, `max_score`, `percentage`,
                        `proctoring_violations`, `violation_details`,
                        `coding_q1_code`, `coding_q1_lang`, `coding_q1_score`,
                        `coding_q2_code`, `coding_q2_lang`, `coding_q2_score`,
                        `answers_json`, `recruiter_status`, `submitted_at`
                    ) VALUES (
                        ?, ?, ?, ?,
                        ?, ?, ?, ?,
                        ?, ?,
                        ?, ?, ?,
                        ?, ?, ?,
                        ?, ?, NOW()
                    )
                ");
                $insStmt->execute([
                    $studentId, $email, $s1, $s2,
                    $s3Coding, $total, $max, $percentage,
                    $violations, $violationDetails,
                    $q1Code, $q1Lang, $q1Score,
                    $q2Code, $q2Lang, $q2Score,
                    $answersJson, $recruiterStatus
                ]);
                $assessmentId = (int)$pdo->lastInsertId();
            }

            // Deduplicate: purge any stale duplicate assessment rows for this student
            try {
                $delDup = $pdo->prepare("DELETE FROM `assessments` WHERE `student_id` = ? AND `id` != ?");
                $delDup->execute([$studentId, $assessmentId]);
            } catch (Exception $eDup) {}

            // 2. Ensure Attempt in `exam_attempts` & retrieve attemptId
            if ($attemptId > 0) {
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
                $chkAtt = $pdo->prepare("SELECT id FROM `exam_attempts` WHERE `student_id` = ? ORDER BY id DESC LIMIT 1");
                $chkAtt->execute([$studentId]);
                $foundAtt = $chkAtt->fetch();
                if ($foundAtt) {
                    $attemptId = (int)$foundAtt['id'];
                    $pdo->prepare("
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
                    ")->execute([$s1, $s2, $s3Coding, $total, $percentage, $isPassed, $violations, $attemptId]);
                } else {
                    $insAtt = $pdo->prepare("
                        INSERT INTO `exam_attempts` (
                            `student_id`, `exam_id`, `status`, `start_time`, `end_time`,
                            `sec_1_score`, `sec_2_score`, `sec_3_score`, `total_score`,
                            `percentage`, `is_passed`, `violations_count`
                        ) VALUES (?, 1, 'Completed', NOW(), NOW(), ?, ?, ?, ?, ?, ?, ?)
                    ");
                    $insAtt->execute([$studentId, $s1, $s2, $s3Coding, $total, $percentage, $isPassed, $violations]);
                    $attemptId = (int)$pdo->lastInsertId();
                }
            }

            // 3. Save Question-by-Question Responses in `student_answers`
            if (!empty($data['answers']) && is_array($data['answers'])) {
                try {
                    $pdo->prepare("DELETE FROM `student_answers` WHERE `student_id` = ?")->execute([$studentId]);
                    $insAns = $pdo->prepare("
                        INSERT INTO `student_answers` (`attempt_id`, `student_id`, `section_id`, `question_id`, `selected_option`, `client_timestamp`)
                        VALUES (?, ?, ?, ?, ?, ?)
                    ");
                    $ansPayload = $data['answers'];
                    if (isset($ansPayload['section1']) && is_array($ansPayload['section1'])) {
                        foreach ($ansPayload['section1'] as $qKey => $val) {
                            $insAns->execute([$attemptId, $studentId, 'section1', (string)$qKey, (string)$val, time() * 1000]);
                        }
                    }
                    if (isset($ansPayload['section2']) && is_array($ansPayload['section2'])) {
                        foreach ($ansPayload['section2'] as $qKey => $val) {
                            $insAns->execute([$attemptId, $studentId, 'section2', (string)$qKey, (string)$val, time() * 1000]);
                        }
                    }
                } catch (Exception $eAns) {}
            }

            // 4. Save Candidate's Code into `coding_submissions`
            try {
                $pdo->prepare("DELETE FROM `coding_submissions` WHERE `attempt_id` = ?")->execute([$attemptId]);
                if (!empty($q1Code)) {
                    $pdo->prepare("
                        INSERT INTO `coding_submissions` (`attempt_id`, `question_id`, `language`, `source_code`, `passed_test_cases`, `total_test_cases`, `score_awarded`, `all_passed`)
                        VALUES (?, 1, ?, ?, ?, 4, ?, ?)
                    ")->execute([$attemptId, $q1Lang, $q1Code, $q1CasesPassed, $q1Score, $q1Score >= 20 ? 1 : 0]);
                }
                if (!empty($q2Code)) {
                    $pdo->prepare("
                        INSERT INTO `coding_submissions` (`attempt_id`, `question_id`, `language`, `source_code`, `passed_test_cases`, `total_test_cases`, `score_awarded`, `all_passed`)
                        VALUES (?, 2, ?, ?, ?, 4, ?, ?)
                    ")->execute([$attemptId, $q2Lang, $q2Code, $q2CasesPassed, $q2Score, $q2Score >= 20 ? 1 : 0]);
                }
            } catch (Exception $eCodeSub) {}

            // 5. Update `answer_sheet_evaluations`
            try {
                $pdo->prepare("
                    INSERT INTO `answer_sheet_evaluations` (
                        `assessment_id`, `student_id`, `evaluator_name`, `section_1_score`,
                        `section_2_score`, `section_3_score`, `total_score`, `evaluator_notes`, `evaluation_status`
                    ) VALUES (?, ?, 'Automated Evaluation Engine', ?, ?, ?, ?, 'Submitted in Real-Time', 'Completed')
                    ON DUPLICATE KEY UPDATE
                        `section_1_score` = VALUES(`section_1_score`),
                        `section_2_score` = VALUES(`section_2_score`),
                        `section_3_score` = VALUES(`section_3_score`),
                        `total_score` = VALUES(`total_score`),
                        `evaluation_status` = 'Completed'
                ")->execute([$assessmentId, $studentId, $s1, $s2, $s3Coding, $total]);
            } catch (Exception $eEval) {}

            // 6. Update student status to Completed
            $updStud = $pdo->prepare("UPDATE `students` SET `status` = 'Completed' WHERE `id` = ?");
            $updStud->execute([$studentId]);

            // 7. Update 10-Stage Pipeline Status (provisional, unpublished)
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