<?php
// ==============================================================================
// Admin Management, Evaluation, Timing Controls & Pipeline API
// Master Prompt V2: Enterprise Assessment Management
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

$action = $_GET['action'] ?? 'list';
$pdo = getDbConnection();

if (!$pdo) {
    echo json_encode(["success" => false, "error" => "Database connection unavailable."]);
    exit;
}

// Safe Query Helpers (resilient against missing/unseeded tables)
function safeCount($pdo, $sql, $default = 0) {
    try {
        $stmt = $pdo->query($sql);
        $val = $stmt ? $stmt->fetchColumn() : false;
        return $val !== false ? (int)$val : $default;
    } catch (Exception $e) {
        return $default;
    }
}

function safeQueryFetchAll($pdo, $sql, $default = []) {
    try {
        $stmt = $pdo->query($sql);
        return $stmt ? $stmt->fetchAll() : $default;
    } catch (Exception $e) {
        return $default;
    }
}

function safeQueryFetch($pdo, $sql, $default = []) {
    try {
        $stmt = $pdo->query($sql);
        $res = $stmt ? $stmt->fetch() : null;
        return $res ?: $default;
    } catch (Exception $e) {
        return $default;
    }
}

// Helper: Log Admin Audit
function logAudit($pdo, $adminId, $adminEmail, $action, $targetType, $targetId, $details) {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO `audit_logs` (`admin_id`, `admin_email`, `action`, `target_type`, `target_id`, `details`, `ip_address`)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $stmt->execute([$adminId, $adminEmail, $action, $targetType, $targetId, $details, $ip]);
    } catch (Exception $e) {}
}

try {
    // --------------------------------------------------------------------------
    // 1. DASHBOARD OVERVIEW & LIVE AGGREGATES
    // --------------------------------------------------------------------------
    if ($action === 'dashboard_stats') {
        // Total students
        $totalStudents = safeCount($pdo, "SELECT COUNT(*) FROM `students`");
        $activeStudents = safeCount($pdo, "SELECT COUNT(*) FROM `students` WHERE `is_active` = 1 AND `is_blocked` = 0");
        $blockedStudents = safeCount($pdo, "SELECT COUNT(*) FROM `students` WHERE `is_blocked` = 1");

        // Exam aggregates
        $totalExams = safeCount($pdo, "SELECT COUNT(*) FROM `exams`", 1);
        $upcomingExams = safeCount($pdo, "SELECT COUNT(*) FROM `exams` WHERE `status` = 'Upcoming'", 0);
        $ongoingExams = safeCount($pdo, "SELECT COUNT(*) FROM `exams` WHERE `status` = 'Ongoing'", 1);
        $completedAttempts = safeCount($pdo, "SELECT COUNT(*) FROM `exam_attempts` WHERE `status` = 'Completed'", 0);
        $interruptedAttempts = safeCount($pdo, "SELECT COUNT(*) FROM `exam_attempts` WHERE `status` IN ('Interrupted', 'Cancelled')", 0);

        // Assessment reviews & results pipeline
        $pendingReviews = safeCount($pdo, "SELECT COUNT(*) FROM `assessments` WHERE `recruiter_status` = 'Under Review' OR `recruiter_status` IS NULL", 0);
        $pendingApprovals = safeCount($pdo, "SELECT COUNT(*) FROM `result_approvals` WHERE `is_published_to_student` = 0", 0);
        $resultsAnnounced = safeCount($pdo, "SELECT COUNT(*) FROM `result_approvals` WHERE `is_published_to_student` = 1", 0);

        // Marks statistics
        $scoreStats = safeQueryFetch($pdo, "
            SELECT 
                COALESCE(AVG(`total_score`), 0) as avg_marks,
                COALESCE(MAX(`total_score`), 0) as highest_marks,
                COALESCE(MIN(`total_score`), 0) as lowest_marks,
                COUNT(*) as assessed_count,
                SUM(CASE WHEN `total_score` >= 40 THEN 1 ELSE 0 END) as passed_count,
                SUM(CASE WHEN `total_score` < 40 THEN 1 ELSE 0 END) as failed_count
            FROM `assessments`
        ", [
            'avg_marks' => 0,
            'highest_marks' => 0,
            'lowest_marks' => 0,
            'assessed_count' => 0,
            'passed_count' => 0,
            'failed_count' => 0
        ]);

        // Branch-wise distribution
        $branchStats = safeQueryFetchAll($pdo, "
            SELECT `stream`, COUNT(*) as student_count 
            FROM `students` 
            GROUP BY `stream` 
            ORDER BY student_count DESC 
            LIMIT 10
        ");

        // College-wise distribution
        $collegeStats = safeQueryFetchAll($pdo, "
            SELECT `college`, COUNT(*) as student_count 
            FROM `students` 
            GROUP BY `college` 
            ORDER BY student_count DESC 
            LIMIT 10
        ");

        echo json_encode([
            "success" => true,
            "stats" => [
                "totalStudents" => $totalStudents,
                "activeStudents" => $activeStudents,
                "blockedStudents" => $blockedStudents,
                "totalExams" => $totalExams,
                "upcomingExams" => $upcomingExams,
                "ongoingExams" => $ongoingExams,
                "completedAttempts" => $completedAttempts,
                "interruptedAttempts" => $interruptedAttempts,
                "pendingReviews" => $pendingReviews,
                "pendingApprovals" => $pendingApprovals,
                "resultsAnnounced" => $resultsAnnounced,
                "averageMarks" => round((float)($scoreStats['avg_marks'] ?? 0), 2),
                "highestMarks" => round((float)($scoreStats['highest_marks'] ?? 0), 2),
                "lowestMarks" => round((float)($scoreStats['lowest_marks'] ?? 0), 2),
                "assessedCount" => (int)($scoreStats['assessed_count'] ?? 0),
                "passedCount" => (int)($scoreStats['passed_count'] ?? 0),
                "failedCount" => (int)($scoreStats['failed_count'] ?? 0),
                "branchStats" => $branchStats,
                "collegeStats" => $collegeStats
            ]
        ]);
        exit;
    }

    // --------------------------------------------------------------------------
    // 2. CANDIDATES & STUDENT MANAGEMENT WITH WORK PREFERENCES & FILTERS
    // --------------------------------------------------------------------------
    if ($action === 'list' || $action === 'candidates') {
        $filterCourse = trim($_GET['course'] ?? '');
        $filterStream = trim($_GET['stream'] ?? '');
        $filterDistrict = trim($_GET['district'] ?? '');
        $filterStatus = trim($_GET['status'] ?? '');
        $search = trim($_GET['search'] ?? '');

        $query = "
            SELECT
                s.*,
                wp.day_shift,
                wp.night_shift,
                wp.preferred_shift,
                wp.relocate,
                wp.own_accommodation,
                wp.manage_travel_expenses,
                wp.work_from_office,
                wp.technical_training,
                a.id as assessment_id,
                a.section_1_score,
                a.section_2_score,
                a.section_3_score,
                a.total_score,
                a.max_score,
                a.percentage,
                a.proctoring_violations,
                a.violation_details,
                a.coding_q1_code,
                a.coding_q1_lang,
                a.coding_q1_score,
                a.coding_q2_code,
                a.coding_q2_lang,
                a.coding_q2_score,
                a.recruiter_status,
                a.recruiter_notes,
                a.submitted_at,
                r.stage_status as result_pipeline_stage,
                r.is_published_to_student,
                (SELECT COUNT(*) FROM `exam_violations` v WHERE v.student_id = s.id) as total_strikes,
                (SELECT COUNT(*) FROM `student_task_assignments` sta WHERE sta.student_id = s.id AND sta.status = 'Completed') as tasks_completed,
                (SELECT COUNT(*) FROM `student_task_assignments` sta WHERE sta.student_id = s.id) as tasks_total
            FROM `students` s
            LEFT JOIN `student_work_preferences` wp ON s.id = wp.student_id
            LEFT JOIN `assessments` a ON s.id = a.student_id
            LEFT JOIN `result_approvals` r ON s.id = r.student_id
            WHERE 1=1
        ";

        $params = [];
        if ($filterCourse) {
            $query .= " AND s.course = ?";
            $params[] = $filterCourse;
        }
        if ($filterStream) {
            $query .= " AND s.stream = ?";
            $params[] = $filterStream;
        }
        if ($filterDistrict) {
            $query .= " AND s.college_district = ?";
            $params[] = $filterDistrict;
        }
        if ($filterStatus) {
            $query .= " AND s.status = ?";
            $params[] = $filterStatus;
        }
        if ($search) {
            $query .= " AND (s.full_name LIKE ? OR s.email LIKE ? OR s.registration_id LIKE ? OR s.college LIKE ?)";
            $term = "%{$search}%";
            $params[] = $term;
            $params[] = $term;
            $params[] = $term;
            $params[] = $term;
        }

        $query .= " ORDER BY s.id DESC";

        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $dedupMap = [];
        foreach ($rows as $r) {
            $sid = (int)$r['id'];
            $candAssessment = !empty($r['assessment_id']) ? [
                "id" => (int)$r['assessment_id'],
                "section1Score" => (float)$r['section_1_score'],
                "section2Score" => (float)$r['section_2_score'],
                "section3Score" => (float)$r['section_3_score'],
                "totalScore" => (float)$r['total_score'],
                "maxScore" => (float)$r['max_score'],
                "percentage" => (float)$r['percentage'],
                "violations" => (int)$r['proctoring_violations'],
                "violationDetails" => $r['violation_details'],
                "codingQ1Score" => (float)$r['coding_q1_score'],
                "codingQ2Score" => (float)$r['coding_q2_score'],
                "codingQ1Lang" => $r['coding_q1_lang'],
                "codingQ2Lang" => $r['coding_q2_lang'],
                "recruiterStatus" => $r['recruiter_status'],
                "recruiterNotes" => $r['recruiter_notes'],
                "submittedAt" => $r['submitted_at']
            ] : null;

            if (!isset($dedupMap[$sid])) {
                $dedupMap[$sid] = [
                    "id" => $sid,
                    "registrationId" => $r['registration_id'] ?? ('COG-2026-' . str_pad($r['id'], 5, '0', STR_PAD_LEFT)),
                    "name" => $r['full_name'],
                    "email" => $r['email'],
                    "mobile" => $r['mobile'],
                    "qualification" => $r['qualification'] ?? 'Undergraduate',
                    "college" => $r['college'],
                    "collegeDistrict" => $r['college_district'] ?? 'Andhra Pradesh',
                    "collegeType" => $r['college_type'] ?? 'Autonomous Engineering',
                    "course" => $r['course'],
                    "stream" => $r['stream'],
                    "graduationYear" => $r['graduation_year'],
                    "cgpa" => $r['cgpa'],
                    "currentSemester" => $r['current_semester'] ?? 'Final Year',
                    "hasBacklogs" => (bool)$r['has_backlogs'],
                    "backlogsCount" => (int)$r['backlogs_count'],
                    "backlogSubjects" => $r['backlog_subjects'],
                    "hasExamClash" => (bool)$r['has_exam_clash'],
                    "examDates" => $r['exam_dates'],
                    "skills" => $r['skills'] ?? '',
                    "domainInterest" => $r['domain_interest'] ?? '',
                    "status" => $r['status'],
                    "isBlocked" => (bool)$r['is_blocked'],
                    "isActive" => (bool)$r['is_active'],
                    "totalStrikes" => (int)($r['total_strikes'] ?? 0),
                    "tasksCompleted" => (int)($r['tasks_completed'] ?? 0),
                    "tasksTotal" => (int)($r['tasks_total'] ?? 0),
                    "createdAt" => $r['created_at'],
                    "resultPipelineStage" => $r['result_pipeline_stage'] ?? 'Registered',
                    "isPublished" => (bool)$r['is_published_to_student'],
                    "workPreferences" => [
                        "dayShift" => $r['day_shift'] ?? 'Yes',
                        "nightShift" => $r['night_shift'] ?? 'Yes',
                        "preferredShift" => $r['preferred_shift'] ?? 'Both',
                        "relocate" => $r['relocate'] ?? 'Yes',
                        "ownAccommodation" => $r['own_accommodation'] ?? 'Yes',
                        "manageTravelExpenses" => $r['manage_travel_expenses'] ?? 'Yes',
                        "workFromOffice" => $r['work_from_office'] ?? 'Yes',
                        "technicalTraining" => $r['technical_training'] ?? 'Yes'
                    ],
                    "assessment" => $candAssessment
                ];
            } else {
                if (empty($dedupMap[$sid]['assessment']) && $candAssessment !== null) {
                    $dedupMap[$sid]['assessment'] = $candAssessment;
                }
            }
        }

        echo json_encode(["success" => true, "candidates" => array_values($dedupMap)]);
        exit;
    }

    // --------------------------------------------------------------------------
    // 3. CANDIDATE ACTIONS: BLOCK / UNBLOCK / PASSWORD RESET
    // --------------------------------------------------------------------------
    if ($action === 'toggle_block_candidate') {
        $raw = file_get_contents("php://input");
        $data = json_decode($raw, true);
        $studentId = intval($data['studentId'] ?? 0);
        $block = !empty($data['block']) ? 1 : 0;

        if ($studentId) {
            $stmt = $pdo->prepare("UPDATE `students` SET `is_blocked` = ? WHERE `id` = ?");
            $stmt->execute([$block, $studentId]);
            $actionLabel = $block ? "Blocked Candidate" : "Unblocked Candidate";
            logAudit($pdo, 1, 'admin@cognitoinsights.tech', $actionLabel, 'student', $studentId, "Set is_blocked = $block");
            echo json_encode(["success" => true, "message" => "Candidate " . ($block ? "blocked" : "unblocked") . " successfully."]);
            exit;
        }
    }

    if ($action === 'reset_candidate_password') {
        $raw = file_get_contents("php://input");
        $data = json_decode($raw, true);
        $studentId = intval($data['studentId'] ?? 0);
        $newPassword = trim($data['newPassword'] ?? 'Student@2026');

        if ($studentId && $newPassword) {
            $hash = password_hash($newPassword, PASSWORD_BCRYPT);
            $stmt = $pdo->prepare("UPDATE `students` SET `password_hash` = ? WHERE `id` = ?");
            $stmt->execute([$hash, $studentId]);
            logAudit($pdo, 1, 'admin@cognitoinsights.tech', 'Password Reset', 'student', $studentId, 'Admin reset student password');
            echo json_encode(["success" => true, "message" => "Candidate password reset successfully to: " . $newPassword]);
            exit;
        }
    }

    // --------------------------------------------------------------------------
    // 4. TASK ASSIGNMENT MODULE (Module 5)
    // --------------------------------------------------------------------------
    if ($action === 'list_tasks') {
        $stmt = $pdo->query("
            SELECT t.*,
                (SELECT COUNT(*) FROM `student_task_assignments` sta WHERE sta.task_id = t.id) as total_assigned,
                (SELECT COUNT(*) FROM `student_task_assignments` sta WHERE sta.task_id = t.id AND sta.status = 'Completed') as total_completed
            FROM `student_tasks` t
            ORDER BY t.id DESC
        ");
        $tasks = $stmt->fetchAll();
        echo json_encode(["success" => true, "tasks" => $tasks]);
        exit;
    }

    if ($action === 'create_task') {
        $raw = file_get_contents("php://input");
        $data = json_decode($raw, true);
        $title = trim($data['title'] ?? '');
        $description = trim($data['description'] ?? '');
        $taskType = trim($data['taskType'] ?? 'Technical Assignment');
        $priority = trim($data['priority'] ?? 'Medium');
        $dueDate = trim($data['dueDate'] ?? date('Y-m-d H:i:s', strtotime('+7 days')));
        $targetType = trim($data['targetType'] ?? 'all');
        $targetValue = trim($data['targetValue'] ?? '');
        $instructions = trim($data['instructions'] ?? '');

        if ($title && $description) {
            $stmt = $pdo->prepare("
                INSERT INTO `student_tasks` (`title`, `description`, `task_type`, `priority`, `due_date`, `target_type`, `target_value`, `instructions`, `status`)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Assigned')
            ");
            $stmt->execute([$title, $description, $taskType, $priority, $dueDate, $targetType, $targetValue, $instructions]);
            $taskId = $pdo->lastInsertId();

            // Auto-assign to eligible students
            $studQuery = "SELECT `id` FROM `students` WHERE `is_blocked` = 0";
            if ($targetType === 'course' && $targetValue) {
                $studQuery .= " AND `course` = " . $pdo->quote($targetValue);
            } elseif ($targetType === 'branch' && $targetValue) {
                $studQuery .= " AND `stream` = " . $pdo->quote($targetValue);
            } elseif ($targetType === 'college' && $targetValue) {
                $studQuery .= " AND `college` = " . $pdo->quote($targetValue);
            }
            $students = $pdo->query($studQuery)->fetchAll();
            $assignStmt = $pdo->prepare("INSERT INTO `student_task_assignments` (`task_id`, `student_id`, `status`) VALUES (?, ?, 'Assigned') ON DUPLICATE KEY UPDATE `status` = 'Assigned'");
            foreach ($students as $st) {
                $assignStmt->execute([$taskId, $st['id']]);
            }

            logAudit($pdo, 1, 'admin@cognitoinsights.tech', 'Create Task', 'task', $taskId, "Created task: $title");
            echo json_encode(["success" => true, "message" => "Task created and assigned to " . count($students) . " students.", "taskId" => $taskId]);
            exit;
        }
    }

    // --------------------------------------------------------------------------
    // 5. EXAM TIMING CONTROLS (Server-Authoritative Override)
    // --------------------------------------------------------------------------
    if ($action === 'timing_controls') {
        $sub = $_GET['sub'] ?? 'list';
        if ($sub === 'list') {
            $stmt = $pdo->query("
                SELECT 
                    a.id as attempt_id, a.student_id, a.start_time, a.duration_seconds_left,
                    a.status as attempt_status, a.tab_switch_count, a.violations_count,
                    s.registration_id, s.full_name as student_name, s.email as student_email,
                    s.college, s.course, s.stream
                FROM `exam_attempts` a
                JOIN `students` s ON a.student_id = s.id
                WHERE a.status IN ('In Progress', 'Interrupted')
                ORDER BY a.id DESC
            ");
            $activeAttempts = $stmt->fetchAll();
            echo json_encode(["success" => true, "attempts" => $activeAttempts]);
            exit;
        }

        if ($sub === 'apply') {
            $raw = file_get_contents("php://input");
            $data = json_decode($raw, true);
            $attemptId = intval($data['attemptId'] ?? 0);
            $studentId = intval($data['studentId'] ?? 0);
            $actionType = trim($data['actionType'] ?? 'extend_time');
            $extraMinutes = intval($data['extraMinutes'] ?? 0);
            $reason = trim($data['reason'] ?? 'Admin timing adjustment');

            $extraSeconds = $extraMinutes * 60;

            if ($attemptId) {
                if ($actionType === 'extend_time' || $actionType === 'grant_extra_time') {
                    $upd = $pdo->prepare("UPDATE `exam_attempts` SET `duration_seconds_left` = `duration_seconds_left` + ? WHERE `id` = ?");
                    $upd->execute([$extraSeconds, $attemptId]);
                } elseif ($actionType === 'reduce_time') {
                    $upd = $pdo->prepare("UPDATE `exam_attempts` SET `duration_seconds_left` = GREATEST(60, `duration_seconds_left` - ?) WHERE `id` = ?");
                    $upd->execute([$extraSeconds, $attemptId]);
                } elseif ($actionType === 'pause_exam') {
                    $upd = $pdo->prepare("UPDATE `exam_attempts` SET `status` = 'Interrupted', `interruption_reason` = ? WHERE `id` = ?");
                    $upd->execute(["Admin Paused: $reason", $attemptId]);
                } elseif ($actionType === 'resume_exam') {
                    $upd = $pdo->prepare("UPDATE `exam_attempts` SET `status` = 'In Progress' WHERE `id` = ?");
                    $upd->execute([$attemptId]);
                }

                // Log timing override
                $ovr = $pdo->prepare("
                    INSERT INTO `exam_timing_overrides` (`attempt_id`, `student_id`, `action_type`, `extra_seconds`, `reason`)
                    VALUES (?, ?, ?, ?, ?)
                ");
                $ovr->execute([$attemptId, $studentId, $actionType, $extraSeconds, $reason]);

                logAudit($pdo, 1, 'admin@cognitoinsights.tech', 'Timing Override', 'attempt', $attemptId, "$actionType: $extraMinutes mins - $reason");
                echo json_encode(["success" => true, "message" => "Timing action ($actionType) executed successfully."]);
                exit;
            }
        }
    }

    // --------------------------------------------------------------------------
    // 6. ANSWER SHEET MANAGEMENT & MARKS OVERRIDE (Module 10 & 13)
    // --------------------------------------------------------------------------
    if ($action === 'answer_sheets') {
        $sub = $_GET['sub'] ?? 'list';
        if ($sub === 'list') {
            $stmt = $pdo->query("
                SELECT 
                    a.id as assessment_id, a.student_id, a.student_email,
                    a.section_1_score, a.section_2_score, a.section_3_score, a.total_score, a.max_score, a.percentage,
                    a.proctoring_violations, a.recruiter_status, a.recruiter_notes, a.submitted_at,
                    a.coding_q1_code, a.coding_q1_lang, a.coding_q1_score,
                    a.coding_q2_code, a.coding_q2_lang, a.coding_q2_score,
                    a.answers_json,
                    s.registration_id, s.full_name as student_name, s.college, s.course, s.stream
                FROM `assessments` a
                INNER JOIN (
                    SELECT student_id, MAX(id) as max_id
                    FROM `assessments`
                    GROUP BY student_id
                ) latest ON a.id = latest.max_id
                JOIN `students` s ON a.student_id = s.id
                ORDER BY a.id DESC
            ");
            $sheets = $stmt->fetchAll();
            $dedupSheets = [];
            $seenSid = [];
            foreach ($sheets as $sh) {
                $sid = (int)$sh['student_id'];
                if (isset($seenSid[$sid])) continue;
                $seenSid[$sid] = true;

                $hasQ1 = !empty($sh['coding_q1_code']);
                $hasQ2 = !empty($sh['coding_q2_code']);
                $q1Sc = (float)($sh['coding_q1_score'] ?? 0);
                $q2Sc = (float)($sh['coding_q2_score'] ?? 0);

                $sh['coding_q1_cases_passed'] = $hasQ1 ? ($q1Sc >= 20 ? 4 : round(($q1Sc / 20) * 4)) : 0;
                $sh['coding_q1_executed'] = $hasQ1 && $q1Sc >= 20;
                $sh['coding_q2_cases_passed'] = $hasQ2 ? ($q2Sc >= 20 ? 4 : round(($q2Sc / 20) * 4)) : 0;
                $sh['coding_q2_executed'] = $hasQ2 && $q2Sc >= 20;
                $sh['coding_problems_executed'] = ($sh['coding_q1_executed'] ? 1 : 0) + ($sh['coding_q2_executed'] ? 1 : 0);

                $dedupSheets[] = $sh;
            }
            echo json_encode(["success" => true, "answerSheets" => $dedupSheets]);
            exit;
        }

        if ($sub === 'get') {
            $assessmentId = intval($_GET['id'] ?? 0);
            $stmt = $pdo->prepare("
                SELECT a.*, s.registration_id, s.full_name, s.college, s.course, s.stream
                FROM `assessments` a
                JOIN `students` s ON a.student_id = s.id
                WHERE a.id = ?
            ");
            $stmt->execute([$assessmentId]);
            $sheet = $stmt->fetch();
            echo json_encode(["success" => true, "sheet" => $sheet]);
            exit;
        }

        if ($sub === 'override_marks') {
            $raw = file_get_contents("php://input");
            $data = json_decode($raw, true);
            $assessmentId = intval($data['assessmentId'] ?? 0);
            $studentId = intval($data['studentId'] ?? 0);
            $sec1 = floatval($data['sec1Score'] ?? 0);
            $sec2 = floatval($data['sec2Score'] ?? 0);
            $sec3 = floatval($data['sec3Score'] ?? 0);
            $notes = trim($data['evaluatorNotes'] ?? 'Manual marks override');

            $newTotal = $sec1 + $sec2 + $sec3;
            $newPct = round(($newTotal / 100.0) * 100.0, 2);

            $stmt = $pdo->prepare("
                UPDATE `assessments` 
                SET `section_1_score` = ?, `section_2_score` = ?, `section_3_score` = ?, `total_score` = ?, `percentage` = ?, `recruiter_notes` = ?
                WHERE `id` = ?
            ");
            $stmt->execute([$sec1, $sec2, $sec3, $newTotal, $newPct, $notes, $assessmentId]);

            // Sync with result_approvals
            $syncRes = $pdo->prepare("
                UPDATE `result_approvals`
                SET `section_1_score` = ?, `section_2_score` = ?, `section_3_score` = ?, `total_score` = ?, `remarks` = ?
                WHERE `student_id` = ?
            ");
            $syncRes->execute([$sec1, $sec2, $sec3, $newTotal, $notes, $studentId]);

            logAudit($pdo, 1, 'admin@cognitoinsights.tech', 'Marks Override', 'assessment', $assessmentId, "Overrode marks to Total: $newTotal ($notes)");
            echo json_encode(["success" => true, "message" => "Marks updated to $newTotal / 100.", "newTotal" => $newTotal, "percentage" => $newPct]);
            exit;
        }
    }

    // --------------------------------------------------------------------------
    // 7. ADMIN-ONLY LIVE RANKING & LEADERBOARD (Module 12)
    // --------------------------------------------------------------------------
    if ($action === 'rankings') {
        // Run automated deduplication to ensure exactly ONE assessment per student in MySQL
        try {
            $pdo->exec("
                UPDATE `assessments` a_target
                JOIN `assessments` a_source ON a_target.student_id = a_source.student_id
                SET a_target.answers_json = a_source.answers_json
                WHERE (a_target.answers_json IS NULL OR a_target.answers_json = '') 
                  AND (a_source.answers_json IS NOT NULL AND a_source.answers_json != '')
            ");
            $pdo->exec("
                UPDATE `assessments` a_target
                JOIN `assessments` a_source ON a_target.student_id = a_source.student_id
                SET a_target.coding_q1_code = a_source.coding_q1_code
                WHERE (a_target.coding_q1_code IS NULL OR a_target.coding_q1_code = '') 
                  AND (a_source.coding_q1_code IS NOT NULL AND a_source.coding_q1_code != '')
            ");
            $pdo->exec("
                UPDATE `assessments` a_target
                JOIN `assessments` a_source ON a_target.student_id = a_source.student_id
                SET a_target.coding_q2_code = a_source.coding_q2_code
                WHERE (a_target.coding_q2_code IS NULL OR a_target.coding_q2_code = '') 
                  AND (a_source.coding_q2_code IS NOT NULL AND a_source.coding_q2_code != '')
            ");
            $pdo->exec("
                DELETE a1 FROM `assessments` a1
                INNER JOIN `assessments` a2 
                WHERE a1.student_id = a2.student_id AND a1.id < a2.id
            ");
            $pdo->exec("
                DELETE r1 FROM `result_approvals` r1
                INNER JOIN `result_approvals` r2 
                WHERE r1.student_id = r2.student_id AND r1.id < r2.id
            ");
        } catch (Exception $eDedup) {}

        $rankedRows = safeQueryFetchAll($pdo, "
            SELECT 
                a.id as assessment_id, a.student_id,
                s.registration_id, s.full_name as student_name, s.college, s.course, s.stream,
                a.section_1_score, a.section_2_score, a.section_3_score, a.total_score, a.percentage,
                a.proctoring_violations, a.recruiter_status, a.submitted_at
            FROM `assessments` a
            INNER JOIN (
                SELECT student_id, MAX(id) as max_id
                FROM `assessments`
                GROUP BY student_id
            ) latest ON a.id = latest.max_id
            JOIN `students` s ON a.student_id = s.id
            ORDER BY a.total_score DESC, a.percentage DESC, a.submitted_at ASC
        ");

        $rankings = [];
        $seenStudents = [];
        $uniqueRows = [];
        foreach ($rankedRows as $r) {
            $sid = (int)$r['student_id'];
            if (!isset($seenStudents[$sid])) {
                $seenStudents[$sid] = true;
                $uniqueRows[] = $r;
            }
        }

        $totalCandidates = count($uniqueRows);
        $rank = 1;

        foreach ($uniqueRows as $r) {
            $percentile = $totalCandidates > 1 ? round((($totalCandidates - $rank) / ($totalCandidates - 1)) * 100, 1) : 100.0;
            $rankings[] = [
                "rank" => $rank,
                "studentId" => (int)$r['student_id'],
                "registrationId" => $r['registration_id'],
                "name" => $r['student_name'],
                "college" => $r['college'],
                "course" => $r['course'],
                "stream" => $r['stream'],
                "sec1Score" => (float)$r['section_1_score'],
                "sec2Score" => (float)$r['section_2_score'],
                "sec3Score" => (float)$r['section_3_score'],
                "totalScore" => (float)$r['total_score'],
                "percentage" => (float)$r['percentage'],
                "percentile" => $percentile,
                "violations" => (int)$r['proctoring_violations'],
                "status" => $r['recruiter_status'] ?: 'Evaluated',
                "submittedAt" => $r['submitted_at']
            ];
            $rank++;
        }

        echo json_encode(["success" => true, "rankings" => $rankings, "totalAssessed" => $totalCandidates]);
        exit;
    }

    // CSV EXPORT OF RANKINGS (Admin-Only Download)
    if ($action === 'export_rankings_csv') {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename=Cognito_Quantex_Rankings_' . date('Y-m-d') . '.csv');

        $out = fopen('php://output', 'w');
        fputcsv($out, ['Rank', 'Registration ID', 'Candidate Name', 'College', 'Course', 'Branch', 'Sec 1 (Q&A&V: 40M)', 'Sec 2 (Core: 20M)', 'Sec 3 (Coding: 40M)', 'Total Marks (100M)', 'Percentage (%)', 'Violations', 'Recruiter Status', 'Submitted At']);

        $stmt = $pdo->query("
            SELECT 
                s.registration_id, s.full_name, s.college, s.course, s.stream,
                a.section_1_score, a.section_2_score, a.section_3_score, a.total_score, a.percentage,
                a.proctoring_violations, a.recruiter_status, a.submitted_at
            FROM `assessments` a
            JOIN `students` s ON a.student_id = s.id
            ORDER BY a.total_score DESC, a.percentage DESC
        ");
        $rank = 1;
        while ($r = $stmt->fetch()) {
            fputcsv($out, [
                $rank++,
                $r['registration_id'],
                $r['full_name'],
                $r['college'],
                $r['course'],
                $r['stream'],
                $r['section_1_score'],
                $r['section_2_score'],
                $r['section_3_score'],
                $r['total_score'],
                $r['percentage'] . '%',
                $r['proctoring_violations'],
                $r['recruiter_status'] ?: 'Evaluated',
                $r['submitted_at']
            ]);
        }
        fclose($out);
        exit;
    }

    // --------------------------------------------------------------------------
    // 8. 10-STAGE RESULT APPROVAL & ANNOUNCEMENT PIPELINE (Module 13 & 14)
    // --------------------------------------------------------------------------
    if ($action === 'results_pipeline') {
        $sub = $_GET['sub'] ?? 'list';
        if ($sub === 'list') {
            $list = safeQueryFetchAll($pdo, "
                SELECT 
                    r.*, s.registration_id, s.full_name as student_name, s.email as student_email,
                    s.college, s.course, s.stream, a.total_score as live_total_score
                FROM `result_approvals` r
                JOIN `students` s ON r.student_id = s.id
                LEFT JOIN `assessments` a ON s.id = a.student_id
                ORDER BY r.id DESC
            ");
            echo json_encode(["success" => true, "pipelineList" => $list]);
            exit;
        }

        if ($sub === 'advance_stage') {
            $raw = file_get_contents("php://input");
            $data = json_decode($raw, true);
            $pipelineId = intval($data['pipelineId'] ?? 0);
            $newStage = trim($data['newStage'] ?? '');

            if ($pipelineId && $newStage) {
                $stmt = $pdo->prepare("UPDATE `result_approvals` SET `stage_status` = ? WHERE `id` = ?");
                $stmt->execute([$newStage, $pipelineId]);
                logAudit($pdo, 1, 'admin@cognitoinsights.tech', 'Advance Pipeline', 'pipeline', $pipelineId, "Advanced to stage: $newStage");
                echo json_encode(["success" => true, "message" => "Stage advanced to: $newStage"]);
                exit;
            }
        }

        if ($sub === 'publish_results') {
            $raw = file_get_contents("php://input");
            $data = json_decode($raw, true);
            $publish = !empty($data['publish']) ? 1 : 0;
            $studentId = intval($data['studentId'] ?? 0);

            if ($studentId) {
                $stmt = $pdo->prepare("
                    UPDATE `result_approvals` 
                    SET `is_published_to_student` = ?, `stage_status` = ?, `announcement_time` = NOW() 
                    WHERE `student_id` = ?
                ");
                $stage = $publish ? 'Published to Student Portal' : 'Results Approved';
                $stmt->execute([$publish, $stage, $studentId]);
            } else {
                // Bulk publish all
                $stage = $publish ? 'Published to Student Portal' : 'Results Approved';
                $pdo->exec("UPDATE `result_approvals` SET `is_published_to_student` = $publish, `stage_status` = '$stage', `announcement_time` = NOW()");
            }

            logAudit($pdo, 1, 'admin@cognitoinsights.tech', 'Publish Results', 'result_approvals', $studentId ?: 'ALL', "Publish toggle = $publish");
            echo json_encode(["success" => true, "message" => $publish ? "Results officially published to Student Portal." : "Results unpublished from Student Portal."]);
            exit;
        }
    }

    // --------------------------------------------------------------------------
    // 9. EXAM RECOVERY: Interrupted attempts & recovery code generation
    // --------------------------------------------------------------------------
    if ($action === 'recovery_attempts') {
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

        $codeStmt = $pdo->query("
            SELECT r.*, s.full_name as student_name, s.email as student_email
            FROM `exam_recovery_codes` r
            JOIN `students` s ON r.student_id = s.id
            ORDER BY r.id DESC LIMIT 30
        ");
        $codes = $codeStmt->fetchAll();

        echo json_encode([
            "success" => true,
            "attempts" => $attempts,
            "codes" => $codes
        ]);
        exit;
    }

    // --------------------------------------------------------------------------
    // 10. AUDIT LOGS & SYSTEM SETTINGS
    // --------------------------------------------------------------------------
    if ($action === 'audit_logs') {
        $stmt = $pdo->query("SELECT * FROM `audit_logs` ORDER BY `id` DESC LIMIT 100");
        $logs = $stmt->fetchAll();
        echo json_encode(["success" => true, "logs" => $logs]);
        exit;
    }

    if ($action === 'system_settings') {
        $stmt = $pdo->query("SELECT * FROM `system_settings` ORDER BY `id` ASC");
        $settings = $stmt->fetchAll();
        echo json_encode(["success" => true, "settings" => $settings]);
        exit;
    }

    if ($action === 'update_setting') {
        $raw = file_get_contents("php://input");
        $data = json_decode($raw, true);
        $key = trim($data['key'] ?? '');
        $val = trim($data['val'] ?? '');

        if ($key) {
            $stmt = $pdo->prepare("INSERT INTO `system_settings` (`setting_key`, `setting_value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `setting_value` = ?");
            $stmt->execute([$key, $val, $val]);
            logAudit($pdo, 1, 'admin@cognitoinsights.tech', 'Update Setting', 'system_setting', $key, "Set $key = $val");
            echo json_encode(["success" => true, "message" => "Setting saved: $key"]);
            exit;
        }
    }

    // ==========================================================================
    // MODULE 2: STUDENT MANAGEMENT CRUD (Add, Edit, Delete, Bulk Import, Export)
    // ==========================================================================
    if ($action === 'add_student') {
        $raw = file_get_contents("php://input");
        $data = json_decode($raw, true) ?: $_POST;
        
        $name = trim($data['name'] ?? '');
        $email = trim(strtolower($data['email'] ?? ''));
        $mobile = trim($data['mobile'] ?? '');
        $qualification = trim($data['qualification'] ?? 'B.Tech');
        $course = trim($data['course'] ?? 'Engineering');
        $stream = trim($data['stream'] ?? 'Computer Science and Engineering');
        $college = trim($data['college'] ?? 'Aditya Engineering College');
        $district = trim($data['district'] ?? 'Kakinada');
        $cgpa = trim($data['cgpa'] ?? '8.0');
        $passingYear = intval($data['passingYear'] ?? 2026);
        $password = trim($data['password'] ?? 'Student@2026');
        $status = trim($data['status'] ?? 'Test Assigned');

        if (!$name || !$email || !$mobile) {
            echo json_encode(["success" => false, "error" => "Name, Email, and Mobile are required."]);
            exit;
        }

        $chk = $pdo->prepare("SELECT `id` FROM `students` WHERE `email` = ?");
        $chk->execute([$email]);
        if ($chk->fetch()) {
            echo json_encode(["success" => false, "error" => "A candidate with this email ($email) already exists."]);
            exit;
        }

        $regId = 'COG-2026-' . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 5));
        $hash = password_hash($password, PASSWORD_BCRYPT);

        $stmt = $pdo->prepare("
            INSERT INTO `students` (`registration_id`, `full_name`, `email`, `mobile`, `password_hash`, `qualification`, `course`, `stream`, `college`, `college_district`, `cgpa`, `graduation_year`, `status`, `is_verified`, `is_active`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
        ");
        $stmt->execute([$regId, $name, $email, $mobile, $hash, $qualification, $course, $stream, $college, $district, $cgpa, $passingYear, $status]);
        $studentId = $pdo->lastInsertId();

        $prefStmt = $pdo->prepare("
            INSERT INTO `student_work_preferences` (`student_id`, `day_shift`, `night_shift`, `preferred_shift`, `relocate`, `own_accommodation`, `manage_travel_expenses`, `work_from_office`, `technical_training`)
            VALUES (?, 'Yes', 'Yes', 'Both', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes')
        ");
        $prefStmt->execute([$studentId]);

        logAudit($pdo, 1, 'admin@cognitoinsights.tech', 'Add Student', 'student', $studentId, "Added student: $name ($regId)");
        echo json_encode(["success" => true, "message" => "Student registered successfully.", "studentId" => $studentId, "registrationId" => $regId]);
        exit;
    }

    if ($action === 'edit_student') {
        $raw = file_get_contents("php://input");
        $data = json_decode($raw, true) ?: $_POST;
        $studentId = intval($data['studentId'] ?? 0);
        $name = trim($data['name'] ?? '');
        $mobile = trim($data['mobile'] ?? '');
        $qualification = trim($data['qualification'] ?? '');
        $course = trim($data['course'] ?? '');
        $stream = trim($data['stream'] ?? '');
        $college = trim($data['college'] ?? '');
        $district = trim($data['district'] ?? '');
        $cgpa = trim($data['cgpa'] ?? '');
        $passingYear = intval($data['passingYear'] ?? 2026);
        $status = trim($data['status'] ?? 'Test Assigned');

        if ($studentId && $name) {
            $stmt = $pdo->prepare("
                UPDATE `students` 
                SET `full_name` = ?, `mobile` = ?, `qualification` = ?, `course` = ?, `stream` = ?, `college` = ?, `college_district` = ?, `cgpa` = ?, `graduation_year` = ?, `status` = ?
                WHERE `id` = ?
            ");
            $stmt->execute([$name, $mobile, $qualification, $course, $stream, $college, $district, $cgpa, $passingYear, $status, $studentId]);
            logAudit($pdo, 1, 'admin@cognitoinsights.tech', 'Edit Student', 'student', $studentId, "Updated profile: $name");
            echo json_encode(["success" => true, "message" => "Student profile updated successfully."]);
            exit;
        }
        echo json_encode(["success" => false, "error" => "Invalid student ID or name."]);
        exit;
    }

    if ($action === 'delete_student') {
        $raw = file_get_contents("php://input");
        $data = json_decode($raw, true) ?: $_POST;
        $studentId = intval($data['studentId'] ?? 0);
        $permanent = !empty($data['permanent']);

        if ($studentId) {
            if ($permanent) {
                $stmt = $pdo->prepare("DELETE FROM `students` WHERE `id` = ?");
                $stmt->execute([$studentId]);
                logAudit($pdo, 1, 'admin@cognitoinsights.tech', 'Delete Student (Permanent)', 'student', $studentId, "Permanently deleted candidate #$studentId");
                echo json_encode(["success" => true, "message" => "Candidate record permanently deleted."]);
            } else {
                $stmt = $pdo->prepare("UPDATE `students` SET `is_active` = 0, `status` = 'Cancelled' WHERE `id` = ?");
                $stmt->execute([$studentId]);
                logAudit($pdo, 1, 'admin@cognitoinsights.tech', 'Deactivate Student', 'student', $studentId, "Deactivated candidate #$studentId");
                echo json_encode(["success" => true, "message" => "Candidate deactivated safely."]);
            }
            exit;
        }
        echo json_encode(["success" => false, "error" => "Invalid student ID."]);
        exit;
    }

    if ($action === 'bulk_import_students') {
        $raw = file_get_contents("php://input");
        $data = json_decode($raw, true);
        $records = $data['students'] ?? [];
        $imported = 0;
        $skipped = 0;

        $checkStmt = $pdo->prepare("SELECT `id` FROM `students` WHERE `email` = ?");
        $insertStmt = $pdo->prepare("
            INSERT INTO `students` (`registration_id`, `full_name`, `email`, `mobile`, `password_hash`, `qualification`, `course`, `stream`, `college`, `college_district`, `cgpa`, `graduation_year`, `status`, `is_verified`, `is_active`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Test Assigned', 1, 1)
        ");
        $prefStmt = $pdo->prepare("
            INSERT INTO `student_work_preferences` (`student_id`, `day_shift`, `night_shift`, `preferred_shift`, `relocate`, `own_accommodation`, `manage_travel_expenses`, `work_from_office`, `technical_training`)
            VALUES (?, 'Yes', 'Yes', 'Both', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes')
        ");

        $defaultHash = password_hash('Student@2026', PASSWORD_BCRYPT);

        foreach ($records as $r) {
            $email = trim(strtolower($r['email'] ?? ''));
            $name = trim($r['name'] ?? '');
            if (!$email || !$name) { $skipped++; continue; }

            $checkStmt->execute([$email]);
            if ($checkStmt->fetch()) {
                $skipped++;
                continue;
            }

            $regId = 'COG-2026-' . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 5));
            $mobile = trim($r['mobile'] ?? '9876543210');
            $qual = trim($r['qualification'] ?? 'B.Tech');
            $course = trim($r['course'] ?? 'Engineering');
            $stream = trim($r['stream'] ?? 'Computer Science and Engineering');
            $college = trim($r['college'] ?? 'Aditya Engineering College');
            $district = trim($r['district'] ?? 'Kakinada');
            $cgpa = trim($r['cgpa'] ?? '8.0');
            $year = intval($r['passingYear'] ?? 2026);

            $insertStmt->execute([$regId, $name, $email, $mobile, $defaultHash, $qual, $course, $stream, $college, $district, $cgpa, $year]);
            $newId = $pdo->lastInsertId();
            $prefStmt->execute([$newId]);
            $imported++;
        }

        logAudit($pdo, 1, 'admin@cognitoinsights.tech', 'Bulk Import Students', 'students', 'BULK', "Imported: $imported, Skipped duplicates: $skipped");
        echo json_encode(["success" => true, "message" => "Bulk import complete. $imported candidate(s) imported, $skipped duplicate(s) skipped.", "imported" => $imported, "skipped" => $skipped]);
        exit;
    }

    if ($action === 'export_students_csv') {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename=Cognito_Quantex_Students_' . date('Y-m-d') . '.csv');

        $out = fopen('php://output', 'w');
        fputcsv($out, ['ID', 'Registration ID', 'Full Name', 'Email', 'Mobile', 'Qualification', 'Course', 'Branch', 'College', 'District', 'CGPA', 'Graduation Year', 'Status', 'Active', 'Created At']);

        $stmt = $pdo->query("SELECT * FROM `students` ORDER BY `id` DESC");
        while ($r = $stmt->fetch()) {
            fputcsv($out, [
                $r['id'],
                $r['registration_id'],
                $r['full_name'],
                $r['email'],
                $r['mobile'],
                $r['qualification'],
                $r['course'],
                $r['stream'],
                $r['college'],
                $r['college_district'],
                $r['cgpa'],
                $r['graduation_year'],
                $r['status'],
                $r['is_active'] ? 'Active' : 'Inactive',
                $r['created_at']
            ]);
        }
        fclose($out);
        exit;
    }

    // ==========================================================================
    // MODULE 3: ACADEMICS & INSTITUTIONS CRUD (Colleges, Courses, Branches)
    // ==========================================================================
    if ($action === 'list_colleges') {
        $stmt = $pdo->query("
            SELECT c.*, 
                   (SELECT COUNT(*) FROM `students` s WHERE s.college = c.name) as student_count
            FROM `colleges` c 
            ORDER BY c.district ASC, c.name ASC
        ");
        $colleges = $stmt->fetchAll();
        echo json_encode(["success" => true, "colleges" => $colleges]);
        exit;
    }

    if ($action === 'add_college') {
        $raw = file_get_contents("php://input");
        $data = json_decode($raw, true) ?: $_POST;
        $name = trim($data['name'] ?? '');
        $code = trim($data['code'] ?? '');
        $district = trim($data['district'] ?? 'Kakinada');
        $type = trim($data['type'] ?? 'Autonomous Engineering');

        if ($name) {
            $stmt = $pdo->prepare("INSERT INTO `colleges` (`name`, `code`, `district`, `type`, `is_active`) VALUES (?, ?, ?, ?, 1)");
            $stmt->execute([$name, $code, $district, $type]);
            $newId = $pdo->lastInsertId();
            logAudit($pdo, 1, 'admin@cognitoinsights.tech', 'Add College', 'college', $newId, "Added college: $name ($district)");
            echo json_encode(["success" => true, "message" => "College added successfully.", "collegeId" => $newId]);
            exit;
        }
        echo json_encode(["success" => false, "error" => "College name is required."]);
        exit;
    }

    if ($action === 'edit_college') {
        $raw = file_get_contents("php://input");
        $data = json_decode($raw, true) ?: $_POST;
        $collegeId = intval($data['collegeId'] ?? 0);
        $name = trim($data['name'] ?? '');
        $code = trim($data['code'] ?? '');
        $district = trim($data['district'] ?? '');
        $type = trim($data['type'] ?? '');
        $isActive = isset($data['isActive']) ? (int)$data['isActive'] : 1;

        if ($collegeId && $name) {
            $stmt = $pdo->prepare("UPDATE `colleges` SET `name` = ?, `code` = ?, `district` = ?, `type` = ?, `is_active` = ? WHERE `id` = ?");
            $stmt->execute([$name, $code, $district, $type, $isActive, $collegeId]);
            logAudit($pdo, 1, 'admin@cognitoinsights.tech', 'Edit College', 'college', $collegeId, "Updated college: $name");
            echo json_encode(["success" => true, "message" => "College updated successfully."]);
            exit;
        }
        echo json_encode(["success" => false, "error" => "Invalid college ID or name."]);
        exit;
    }

    if ($action === 'toggle_college_status') {
        $raw = file_get_contents("php://input");
        $data = json_decode($raw, true) ?: $_POST;
        $collegeId = intval($data['collegeId'] ?? 0);
        $status = !empty($data['status']) ? 1 : 0;

        if ($collegeId) {
            $stmt = $pdo->prepare("UPDATE `colleges` SET `is_active` = ? WHERE `id` = ?");
            $stmt->execute([$status, $collegeId]);
            logAudit($pdo, 1, 'admin@cognitoinsights.tech', 'Toggle College Status', 'college', $collegeId, "Set is_active = $status");
            echo json_encode(["success" => true, "message" => "College status updated."]);
            exit;
        }
    }

    if ($action === 'list_courses_branches') {
        $courses = safeQueryFetchAll($pdo, "SELECT * FROM `courses` ORDER BY `id` ASC");
        $branches = safeQueryFetchAll($pdo, "SELECT cb.*, c.name as course_name FROM `course_branches` cb LEFT JOIN `courses` c ON cb.course_name = c.name ORDER BY cb.course_name ASC, cb.branch_name ASC");
        echo json_encode(["success" => true, "courses" => $courses, "branches" => $branches]);
        exit;
    }

    if ($action === 'add_branch') {
        $raw = file_get_contents("php://input");
        $data = json_decode($raw, true) ?: $_POST;
        $courseName = trim($data['courseName'] ?? 'B.Tech');
        $branchName = trim($data['branchName'] ?? '');
        $branchCode = trim($data['branchCode'] ?? '');

        if ($courseName && $branchName) {
            $stmt = $pdo->prepare("INSERT INTO `course_branches` (`course_name`, `branch_name`, `branch_code`) VALUES (?, ?, ?)");
            $stmt->execute([$courseName, $branchName, $branchCode]);
            $newId = $pdo->lastInsertId();
            logAudit($pdo, 1, 'admin@cognitoinsights.tech', 'Add Branch', 'branch', $newId, "Added branch: $branchName to $courseName");
            echo json_encode(["success" => true, "message" => "Branch added successfully.", "branchId" => $newId]);
            exit;
        }
        echo json_encode(["success" => false, "error" => "Course and Branch names are required."]);
        exit;
    }

    if ($action === 'delete_branch') {
        $raw = file_get_contents("php://input");
        $data = json_decode($raw, true) ?: $_POST;
        $branchId = intval($data['branchId'] ?? 0);

        if ($branchId) {
            $stmt = $pdo->prepare("DELETE FROM `course_branches` WHERE `id` = ?");
            $stmt->execute([$branchId]);
            logAudit($pdo, 1, 'admin@cognitoinsights.tech', 'Delete Branch', 'branch', $branchId, "Deleted branch #$branchId");
            echo json_encode(["success" => true, "message" => "Branch deleted successfully."]);
            exit;
        }
    }

    // ==========================================================================
    // MODULE 4: EXAMINATION MANAGEMENT & SCHEDULING CRUD
    // ==========================================================================
    if ($action === 'list_exams') {
        $exams = safeQueryFetchAll($pdo, "
            SELECT e.*,
                   (SELECT COUNT(*) FROM `exam_attempts` a WHERE a.exam_id = e.id) as total_attempts,
                   (SELECT COUNT(*) FROM `exam_attempts` a WHERE a.exam_id = e.id AND a.status = 'Completed') as completed_attempts
            FROM `exams` e 
            ORDER BY e.id DESC
        ");
        echo json_encode(["success" => true, "exams" => $exams]);
        exit;
    }

    if ($action === 'create_exam') {
        $raw = file_get_contents("php://input");
        $data = json_decode($raw, true) ?: $_POST;
        $title = trim($data['title'] ?? '');
        $description = trim($data['description'] ?? '');
        $course = trim($data['course'] ?? 'ALL');
        $branch = trim($data['branch'] ?? 'ALL');
        $college = trim($data['college'] ?? 'ALL');
        $batch = trim($data['batch'] ?? '2026');
        $duration = intval($data['durationMinutes'] ?? 90);
        $totalMarks = intval($data['totalMarks'] ?? 100);
        $passMarks = intval($data['passMarks'] ?? 40);
        $tabSwitchLimit = intval($data['tabSwitchLimit'] ?? 3);
        $minScreenWidth = intval($data['minScreenWidth'] ?? 1280);
        $startDate = trim($data['startDate'] ?? date('Y-m-d 09:00:00'));
        $endDate = trim($data['endDate'] ?? date('Y-m-d 18:00:00', strtotime('+30 days')));

        if ($title) {
            $stmt = $pdo->prepare("
                INSERT INTO `exams` (`title`, `description`, `course`, `branch`, `college`, `batch`, `start_date`, `end_date`, `total_duration_minutes`, `total_marks`, `passing_marks`, `tab_switch_limit`, `min_screen_width`, `status`, `is_active`)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Ongoing', 1)
            ");
            $stmt->execute([$title, $description, $course, $branch, $college, $batch, $startDate, $endDate, $duration, $totalMarks, $passMarks, $tabSwitchLimit, $minScreenWidth]);
            $examId = $pdo->lastInsertId();
            logAudit($pdo, 1, 'admin@cognitoinsights.tech', 'Create Exam', 'exam', $examId, "Created assessment: $title");
            echo json_encode(["success" => true, "message" => "Examination created successfully.", "examId" => $examId]);
            exit;
        }
        echo json_encode(["success" => false, "error" => "Exam title is required."]);
        exit;
    }

    if ($action === 'delete_task') {
        $raw = file_get_contents("php://input");
        $data = json_decode($raw, true) ?: $_POST;
        $taskId = intval($data['taskId'] ?? 0);

        if ($taskId) {
            $stmt = $pdo->prepare("DELETE FROM `student_tasks` WHERE `id` = ?");
            $stmt->execute([$taskId]);
            logAudit($pdo, 1, 'admin@cognitoinsights.tech', 'Delete Task', 'task', $taskId, "Deleted task #$taskId");
            echo json_encode(["success" => true, "message" => "Task deleted successfully."]);
            exit;
        }
    }

    // ==========================================================================
    // MODULE 5: QUESTION BANK CRUD
    // ==========================================================================
    if ($action === 'list_questions') {
        $mcqs = safeQueryFetchAll($pdo, "SELECT * FROM `questions` ORDER BY `id` ASC");
        $coding = safeQueryFetchAll($pdo, "SELECT cq.*, (SELECT COUNT(*) FROM `coding_test_cases` ctc WHERE ctc.question_id = cq.id) as test_case_count FROM `coding_questions` cq ORDER BY cq.id ASC");
        echo json_encode(["success" => true, "mcqs" => $mcqs, "coding" => $coding]);
        exit;
    }

    if ($action === 'add_question') {
        $raw = file_get_contents("php://input");
        $data = json_decode($raw, true) ?: $_POST;
        $qText = trim($data['questionText'] ?? '');
        $optA = trim($data['optionA'] ?? '');
        $optB = trim($data['optionB'] ?? '');
        $optC = trim($data['optionC'] ?? '');
        $optD = trim($data['optionD'] ?? '');
        $correct = trim($data['correctOption'] ?? 'A');
        $subject = trim($data['subject'] ?? 'Aptitude & Verbal');
        $topic = trim($data['topic'] ?? 'Logical Reasoning');
        $difficulty = trim($data['difficulty'] ?? 'Medium');
        $marks = intval($data['marks'] ?? 1);

        if ($qText && $optA && $optB) {
            $stmt = $pdo->prepare("
                INSERT INTO `questions` (`question_text`, `option_a`, `option_b`, `option_c`, `option_d`, `correct_option`, `subject`, `topic`, `difficulty`, `marks`)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$qText, $optA, $optB, $optC, $optD, $correct, $subject, $topic, $difficulty, $marks]);
            $qId = $pdo->lastInsertId();
            logAudit($pdo, 1, 'admin@cognitoinsights.tech', 'Add Question', 'question', $qId, "Added MCQ to $subject");
            echo json_encode(["success" => true, "message" => "Question added successfully.", "questionId" => $qId]);
            exit;
        }
        echo json_encode(["success" => false, "error" => "Question text and options are required."]);
        exit;
    }

    if ($action === 'delete_question') {
        $raw = file_get_contents("php://input");
        $data = json_decode($raw, true) ?: $_POST;
        $questionId = intval($data['questionId'] ?? 0);

        if ($questionId) {
            $stmt = $pdo->prepare("DELETE FROM `questions` WHERE `id` = ?");
            $stmt->execute([$questionId]);
            logAudit($pdo, 1, 'admin@cognitoinsights.tech', 'Delete Question', 'question', $questionId, "Deleted question #$questionId");
            echo json_encode(["success" => true, "message" => "Question deleted successfully."]);
            exit;
        }
    }

    if ($action === 'bulk_import_questions') {
        $raw = file_get_contents("php://input");
        $data = json_decode($raw, true) ?: $_POST;
        $questions = $data['questions'] ?? [];
        $imported = 0;
        $skipped = 0;

        if (!empty($questions) && is_array($questions)) {
            $stmt = $pdo->prepare("
                INSERT INTO `questions` (`question_text`, `option_a`, `option_b`, `option_c`, `option_d`, `correct_option`, `subject`, `topic`, `difficulty`, `marks`)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            foreach ($questions as $q) {
                $qText = trim($q['questionText'] ?? $q['question'] ?? '');
                $optA = trim($q['optionA'] ?? ($q['options'][0] ?? ''));
                $optB = trim($q['optionB'] ?? ($q['options'][1] ?? ''));
                $optC = trim($q['optionC'] ?? ($q['options'][2] ?? ''));
                $optD = trim($q['optionD'] ?? ($q['options'][3] ?? ''));
                $correct = strtoupper(trim($q['correctOption'] ?? $q['answer'] ?? 'A'));
                if (is_numeric($correct)) {
                    $correct = chr(65 + intval($correct));
                }
                $subject = trim($q['subject'] ?? 'Quantitative Aptitude');
                $topic = trim($q['topic'] ?? 'General');
                $difficulty = trim($q['difficulty'] ?? 'Medium');
                $marks = intval($q['marks'] ?? 1);

                if ($qText && $optA && $optB) {
                    try {
                        $stmt->execute([$qText, $optA, $optB, $optC, $optD, $correct, $subject, $topic, $difficulty, $marks]);
                        $imported++;
                    } catch (Exception $e) {
                        $skipped++;
                    }
                } else {
                    $skipped++;
                }
            }

            logAudit($pdo, 1, 'admin@cognitoinsights.tech', 'Bulk Import Questions', 'question', 0, "Bulk imported $imported questions ($skipped skipped)");
            echo json_encode([
                "success" => true,
                "message" => "Successfully imported $imported questions into the Question Bank.",
                "imported" => $imported,
                "skipped" => $skipped
            ]);
            exit;
        }

        echo json_encode(["success" => false, "error" => "No valid question records provided for import."]);
        exit;
    }

    // ==========================================================================
    // MODULE 6: RANDOM PAPER GENERATOR
    // ==========================================================================
    if ($action === 'generate_random_paper') {
        $sec1Count = intval($_GET['sec1'] ?? 40);
        $sec2Count = intval($_GET['sec2'] ?? 20);

        $sec1Questions = safeQueryFetchAll($pdo, "SELECT `id`, `question_text`, `subject`, `topic`, `difficulty`, `marks` FROM `questions` WHERE `subject` LIKE '%Aptitude%' OR `subject` LIKE '%Verbal%' ORDER BY RAND() LIMIT $sec1Count");
        $sec2Questions = safeQueryFetchAll($pdo, "SELECT `id`, `question_text`, `subject`, `topic`, `difficulty`, `marks` FROM `questions` WHERE `subject` LIKE '%Technical%' OR `subject` LIKE '%Core%' ORDER BY RAND() LIMIT $sec2Count");
        $sec3Questions = safeQueryFetchAll($pdo, "SELECT `id`, `title`, `difficulty`, `marks` FROM `coding_questions` ORDER BY RAND() LIMIT 2");

        $paperHash = strtoupper(hash('sha256', uniqid(mt_rand(), true)));

        echo json_encode([
            "success" => true,
            "paperHash" => substr($paperHash, 0, 16),
            "section1" => $sec1Questions,
            "section2" => $sec2Questions,
            "section3" => $sec3Questions,
            "totalQuestions" => count($sec1Questions) + count($sec2Questions) + count($sec3Questions)
        ]);
        exit;
    }

    if ($action === 'save_paper_snapshot') {
        $raw = file_get_contents("php://input");
        $data = json_decode($raw, true);
        $examId = intval($data['examId'] ?? 1);
        $studentId = intval($data['studentId'] ?? 1);
        $hash = trim($data['paperHash'] ?? substr(md5(time()), 0, 16));
        $sec1Qids = trim($data['sec1Qids'] ?? '');
        $sec2Qids = trim($data['sec2Qids'] ?? '');
        $sec3Qids = trim($data['sec3Qids'] ?? '');
        $json = json_encode($data['questionData'] ?? []);

        $stmt = $pdo->prepare("
            INSERT INTO `exam_paper_snapshots` (`exam_id`, `student_id`, `paper_hash`, `question_ids_json`, `section_1_qids`, `section_2_qids`, `section_3_qids`, `is_locked`)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1)
            ON DUPLICATE KEY UPDATE `paper_hash` = VALUES(`paper_hash`), `is_locked` = 1
        ");
        $stmt->execute([$examId, $studentId, $hash, $json, $sec1Qids, $sec2Qids, $sec3Qids]);
        logAudit($pdo, 1, 'admin@cognitoinsights.tech', 'Lock Paper Snapshot', 'paper_snapshot', $hash, "Locked paper snapshot for exam #$examId");
        echo json_encode(["success" => true, "message" => "Paper snapshot locked and associated with exam."]);
        exit;
    }

    // ==========================================================================
    // MODULE 7 & 9: LIVE MONITORING & SESSION RECOVERY
    // ==========================================================================
    if ($action === 'terminate_session') {
        $raw = file_get_contents("php://input");
        $data = json_decode($raw, true) ?: $_POST;
        $attemptId = intval($data['attemptId'] ?? 0);
        $studentId = intval($data['studentId'] ?? 0);
        $reason = trim($data['reason'] ?? 'Admin terminated: Proctoring malpractice');

        if ($attemptId && $studentId) {
            $pdo->prepare("UPDATE `exam_attempts` SET `status` = 'Cancelled', `interruption_reason` = ? WHERE `id` = ?")->execute([$reason, $attemptId]);
            $pdo->prepare("UPDATE `students` SET `status` = 'Cancelled' WHERE `id` = ?")->execute([$studentId]);
            $pdo->prepare("INSERT INTO `exam_violations` (`attempt_id`, `student_id`, `violation_type`, `details`) VALUES (?, ?, 'Session Terminated by Admin', ?)")->execute([$attemptId, $studentId, $reason]);
            logAudit($pdo, 1, 'admin@cognitoinsights.tech', 'Terminate Session', 'attempt', $attemptId, "Terminated candidate #$studentId: $reason");
            echo json_encode(["success" => true, "message" => "Candidate session terminated and marked as Cancelled."]);
            exit;
        }
    }

    if ($action === 'authorize_recovery') {
        $raw = file_get_contents("php://input");
        $data = json_decode($raw, true) ?: $_POST;
        $studentId = intval($data['studentId'] ?? 0);
        $reason = trim($data['reason'] ?? 'Recruiter authorized resume');

        if ($studentId) {
            $recoveryCode = str_pad(mt_rand(100000, 999999), 6, '0', STR_PAD_LEFT);
            $expiresAt = date('Y-m-d H:i:s', strtotime('+2 hours'));

            $pdo->prepare("INSERT INTO `exam_recovery_codes` (`student_id`, `recovery_code`, `reason`, `expires_at`, `is_used`) VALUES (?, ?, ?, ?, 0)")->execute([$studentId, $recoveryCode, $reason, $expiresAt]);
            $pdo->prepare("UPDATE `students` SET `status` = 'Test Assigned' WHERE `id` = ?")->execute([$studentId]);
            $pdo->prepare("UPDATE `exam_attempts` SET `status` = 'In Progress', `duration_seconds_left` = GREATEST(1800, `duration_seconds_left`) WHERE `student_id` = ? AND `status` IN ('Interrupted', 'Cancelled')")->execute([$studentId]);
            
            logAudit($pdo, 1, 'admin@cognitoinsights.tech', 'Authorize Recovery', 'student', $studentId, "Generated recovery code $recoveryCode: $reason");
            echo json_encode(["success" => true, "message" => "Recovery authorized. Candidate unlocked to resume exam.", "recoveryCode" => $recoveryCode]);
            exit;
        }
    }

    // ==========================================================================
    // MODULE 11: BROADCAST & TARGETED NOTIFICATIONS
    // ==========================================================================
    if ($action === 'list_notifications') {
        $notifs = safeQueryFetchAll($pdo, "SELECT * FROM `notifications` ORDER BY `id` DESC LIMIT 50");
        echo json_encode(["success" => true, "notifications" => $notifs]);
        exit;
    }

    if ($action === 'create_notification') {
        $raw = file_get_contents("php://input");
        $data = json_decode($raw, true) ?: $_POST;
        $title = trim($data['title'] ?? '');
        $message = trim($data['message'] ?? '');
        $targetType = trim($data['targetType'] ?? 'all');
        $targetValue = trim($data['targetValue'] ?? '');
        $priority = trim($data['priority'] ?? 'Normal');

        if ($title && $message) {
            $stmt = $pdo->prepare("INSERT INTO `notifications` (`title`, `message`, `target_type`, `target_value`, `priority`, `created_by`) VALUES (?, ?, ?, ?, ?, 'Lead Recruiter')");
            $stmt->execute([$title, $message, $targetType, $targetValue, $priority]);
            $nId = $pdo->lastInsertId();
            logAudit($pdo, 1, 'admin@cognitoinsights.tech', 'Create Notification', 'notification', $nId, "Broadcast: $title ($targetType)");
            echo json_encode(["success" => true, "message" => "Notification dispatched successfully.", "notificationId" => $nId]);
            exit;
        }
        echo json_encode(["success" => false, "error" => "Title and Message are required."]);
        exit;
    }

    if ($action === 'delete_notification') {
        $raw = file_get_contents("php://input");
        $data = json_decode($raw, true) ?: $_POST;
        $id = intval($data['notificationId'] ?? 0);
        if ($id) {
            $pdo->prepare("DELETE FROM `notifications` WHERE `id` = ?")->execute([$id]);
            logAudit($pdo, 1, 'admin@cognitoinsights.tech', 'Delete Notification', 'notification', $id, "Deleted notification #$id");
            echo json_encode(["success" => true, "message" => "Notification removed."]);
            exit;
        }
    }

    // ==========================================================================
    // MODULE 12: REPORTS & ANALYTICS
    // ==========================================================================
    if ($action === 'generate_report') {
        $reportType = trim($_GET['type'] ?? 'overview');
        
        if ($reportType === 'colleges') {
            $data = safeQueryFetchAll($pdo, "
                SELECT s.college, s.college_district, COUNT(*) as enrolled,
                       SUM(CASE WHEN s.status = 'Completed' THEN 1 ELSE 0 END) as completed,
                       SUM(CASE WHEN a.total_score >= 40 THEN 1 ELSE 0 END) as passed,
                       ROUND(COALESCE(AVG(a.total_score), 0), 1) as avg_score,
                       COALESCE(MAX(a.total_score), 0) as top_score
                FROM `students` s
                LEFT JOIN `assessments` a ON s.id = a.student_id
                GROUP BY s.college, s.college_district
                ORDER BY enrolled DESC
            ");
            echo json_encode(["success" => true, "report" => $data]);
            exit;
        }

        if ($reportType === 'branches') {
            $data = safeQueryFetchAll($pdo, "
                SELECT s.stream, s.course, COUNT(*) as enrolled,
                       SUM(CASE WHEN s.status = 'Completed' THEN 1 ELSE 0 END) as completed,
                       ROUND(COALESCE(AVG(a.total_score), 0), 1) as avg_score,
                       COALESCE(MAX(a.total_score), 0) as top_score
                FROM `students` s
                LEFT JOIN `assessments` a ON s.id = a.student_id
                GROUP BY s.stream, s.course
                ORDER BY enrolled DESC
            ");
            echo json_encode(["success" => true, "report" => $data]);
            exit;
        }

        if ($reportType === 'attendance') {
            $data = safeQueryFetchAll($pdo, "
                SELECT s.status, COUNT(*) as count,
                       ROUND((COUNT(*) / (SELECT COUNT(*) FROM `students`)) * 100, 1) as percentage
                FROM `students` s
                GROUP BY s.status
            ");
            echo json_encode(["success" => true, "report" => $data]);
            exit;
        }
    }

    // ==========================================================================
    // MODULE 13: ADMINISTRATION & SETTINGS
    // ==========================================================================
    if ($action === 'list_admin_users') {
        $admins = safeQueryFetchAll($pdo, "SELECT `id`, `name`, `email`, `role`, `status`, `created_at` FROM `admins` ORDER BY `id` ASC");
        echo json_encode(["success" => true, "admins" => $admins]);
        exit;
    }

    if ($action === 'create_admin_user') {
        $raw = file_get_contents("php://input");
        $data = json_decode($raw, true) ?: $_POST;
        $name = trim($data['name'] ?? '');
        $email = trim(strtolower($data['email'] ?? ''));
        $password = trim($data['password'] ?? 'Admin@2026');
        $role = trim($data['role'] ?? 'exam_admin');

        if ($name && $email && $password) {
            $chk = $pdo->prepare("SELECT `id` FROM `admins` WHERE `email` = ?");
            $chk->execute([$email]);
            if ($chk->fetch()) {
                echo json_encode(["success" => false, "error" => "An administrator with this email already exists."]);
                exit;
            }
            $hash = password_hash($password, PASSWORD_BCRYPT);
            $stmt = $pdo->prepare("INSERT INTO `admins` (`name`, `email`, `password_hash`, `role`, `status`) VALUES (?, ?, ?, ?, 'active')");
            $stmt->execute([$name, $email, $hash, $role]);
            $newId = $pdo->lastInsertId();
            logAudit($pdo, 1, 'admin@cognitoinsights.tech', 'Create Admin', 'admin', $newId, "Created admin user: $name ($email, $role)");
            echo json_encode(["success" => true, "message" => "Admin user created successfully.", "adminId" => $newId]);
            exit;
        }
        echo json_encode(["success" => false, "error" => "Name, Email, and Password are required."]);
        exit;
    }

    if ($action === 'delete_admin_user') {
        $raw = file_get_contents("php://input");
        $data = json_decode($raw, true) ?: $_POST;
        $adminId = intval($data['adminId'] ?? 0);

        if ($adminId === 1) {
            echo json_encode(["success" => false, "error" => "Primary Super Admin account (#1) cannot be deleted."]);
            exit;
        }

        if ($adminId) {
            $stmt = $pdo->prepare("DELETE FROM `admins` WHERE `id` = ?");
            $stmt->execute([$adminId]);
            logAudit($pdo, 1, 'admin@cognitoinsights.tech', 'Delete Admin', 'admin', $adminId, "Deleted admin user #$adminId");
            echo json_encode(["success" => true, "message" => "Admin user removed."]);
            exit;
        }
    }

    if ($action === 'export_database_backup') {
        header('Content-Type: application/json; charset=utf-8');
        header('Content-Disposition: attachment; filename=Cognito_Quantex_DB_Backup_' . date('Y-m-d_His') . '.json');

        $backup = [
            "database" => "u297467125_contest",
            "export_timestamp" => date('Y-m-d H:i:s'),
            "students" => safeQueryFetchAll($pdo, "SELECT * FROM `students`"),
            "student_work_preferences" => safeQueryFetchAll($pdo, "SELECT * FROM `student_work_preferences`"),
            "assessments" => safeQueryFetchAll($pdo, "SELECT * FROM `assessments`"),
            "exams" => safeQueryFetchAll($pdo, "SELECT * FROM `exams`"),
            "colleges" => safeQueryFetchAll($pdo, "SELECT * FROM `colleges`"),
            "system_settings" => safeQueryFetchAll($pdo, "SELECT * FROM `system_settings`")
        ];

        echo json_encode($backup, JSON_PRETTY_PRINT);
        exit;
    }


    // --------------------------------------------------------------------------
    // 11. CLEAR ALL CANDIDATE DATA
    // --------------------------------------------------------------------------
    if ($action === 'clear_all_students') {
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
        $pdo->exec("TRUNCATE TABLE `exam_paper_snapshots`");
        $pdo->exec("TRUNCATE TABLE `exam_timing_overrides`");
        $pdo->exec("TRUNCATE TABLE `answer_sheet_evaluations`");
        $pdo->exec("TRUNCATE TABLE `result_approvals`");
        $pdo->exec("TRUNCATE TABLE `student_task_assignments`");
        $pdo->exec("TRUNCATE TABLE `exam_recovery_history`");
        $pdo->exec("TRUNCATE TABLE `exam_recovery_codes`");
        $pdo->exec("TRUNCATE TABLE `exam_violations`");
        $pdo->exec("TRUNCATE TABLE `coding_submissions`");
        $pdo->exec("TRUNCATE TABLE `student_answers`");
        $pdo->exec("TRUNCATE TABLE `offline_sync_logs`");
        $pdo->exec("TRUNCATE TABLE `exam_attempts`");
        $pdo->exec("TRUNCATE TABLE `assessments`");
        $pdo->exec("TRUNCATE TABLE `student_work_preferences`");
        $pdo->exec("TRUNCATE TABLE `email_otps`");
        $pdo->exec("TRUNCATE TABLE `notifications`");
        $pdo->exec("TRUNCATE TABLE `students`");
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

        logAudit($pdo, 1, 'admin@cognitoinsights.tech', 'Purge Data', 'all', 'all', 'Truncated all student and exam tables');
        echo json_encode(["success" => true, "message" => "All student registrations, exam attempts, submissions, and recovery logs have been purged."]);
        exit;
    }

} catch (Exception $e) {
    error_log("Admin API Error: " . $e->getMessage());
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
    exit;
}

echo json_encode(["success" => false, "error" => "Invalid admin action."]);
?>