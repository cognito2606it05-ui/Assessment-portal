<?php
// ==============================================================================
// Candidate Registration & Work Preferences Endpoint
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

if (!$data || empty($data['email']) || empty($data['name'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Required candidate information is missing."]);
    exit;
}

$fullName = trim($data['name']);
$email = strtolower(trim($data['email']));
$isEmailVerified = !empty($data['isEmailVerified']);
$otpEntered = !empty($data['otp']) ? trim($data['otp']) : '';

// Mandatory OTP check
$pdo = getDbConnection();
if (!$isEmailVerified && !empty($otpEntered) && $pdo) {
    try {
        $chkOtp = $pdo->prepare("SELECT `id` FROM `email_otps` WHERE `email` = ? AND `otp_code` = ? AND `is_used` = 0 AND `expires_at` > NOW() ORDER BY `id` DESC LIMIT 1");
        $chkOtp->execute([$email, $otpEntered]);
        if ($chkRow = $chkOtp->fetch()) {
            $isEmailVerified = true;
            $updOtp = $pdo->prepare("UPDATE `email_otps` SET `is_used` = 1 WHERE `id` = ?");
            $updOtp->execute([$chkRow['id']]);
        }
    } catch (Exception $e) {}
}

if (!$isEmailVerified) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error" => "Registration Blocked: Email OTP verification is mandatory. Please click 'Send OTP' and enter your 6-digit verification code before registering."
    ]);
    exit;
}

$mobile = !empty($data['mobile']) ? trim($data['mobile']) : '';
$password = !empty($data['password']) ? trim($data['password']) : 'password123';
$passwordHash = password_hash($password, PASSWORD_BCRYPT);

// Registration ID generation
$registrationId = "COG-2026-" . strtoupper(substr(bin2hex(random_bytes(3)), 0, 5));

$qualification = !empty($data['qualification']) ? trim($data['qualification']) : 'Undergraduate';
$course = !empty($data['course']) ? trim($data['course']) : 'B.Tech';
$stream = !empty($data['stream']) ? trim($data['stream']) : 'Computer Science and Engineering';
$college = !empty($data['college']) ? trim($data['college']) : 'University';
$collegeDistrict = !empty($data['collegeDistrict']) ? trim($data['collegeDistrict']) : 'Andhra Pradesh';
$collegeType = !empty($data['collegeType']) ? trim($data['collegeType']) : 'Autonomous Engineering';
$gradYear = !empty($data['graduationYear']) ? intval($data['graduationYear']) : 2026;
$cgpa = !empty($data['cgpa']) ? trim($data['cgpa']) : 'N/A';
$currentSemester = !empty($data['currentSemester']) ? trim($data['currentSemester']) : 'Final Year';

$hasBacklogs = !empty($data['hasBacklogs']) ? 1 : 0;
$backlogsCount = !empty($data['backlogsCount']) ? intval($data['backlogsCount']) : 0;
$backlogSubjects = !empty($data['backlogSubjects']) ? trim($data['backlogSubjects']) : '';

$hasExamClash = !empty($data['hasExamClash']) ? 1 : 0;
$examDates = !empty($data['examDates']) ? trim($data['examDates']) : '';
$skills = !empty($data['skills']) ? trim($data['skills']) : 'Web Development, Problem Solving';
$domainInterest = !empty($data['domainInterest']) ? trim($data['domainInterest']) : 'Full Stack Engineering';

// 8 Work Preferences
$workPrefs = $data['workPreferences'] ?? [];
$dayShift = $workPrefs['dayShift'] ?? 'Yes';
$nightShift = $workPrefs['nightShift'] ?? 'Yes';
$preferredShift = $workPrefs['preferredShift'] ?? 'Both';
$relocate = $workPrefs['relocate'] ?? 'Yes';
$ownAccommodation = $workPrefs['ownAccommodation'] ?? 'Yes';
$manageTravelExpenses = $workPrefs['manageTravelExpenses'] ?? 'Yes';
$workFromOffice = $workPrefs['workFromOffice'] ?? 'Yes';
$technicalTraining = $workPrefs['technicalTraining'] ?? 'Yes';

$status = "Test Assigned";

$pdo = getDbConnection();
if ($pdo) {
    try {
        // 1. Strict Duplicate Check: Email
        $checkEmailStmt = $pdo->prepare("SELECT `id`, `registration_id` FROM `students` WHERE LOWER(`email`) = ? LIMIT 1");
        $checkEmailStmt->execute([$email]);
        if ($existingEmail = $checkEmailStmt->fetch()) {
            http_response_code(409);
            echo json_encode([
                "success" => false,
                "error" => "Duplicate Registration Blocked: An account with email address (" . htmlspecialchars($email) . ") is already registered under Registration ID " . $existingEmail['registration_id'] . ". Duplicate registrations are strictly forbidden. Please sign in directly."
            ]);
            exit;
        }

        // 2. Strict Duplicate Check: Mobile / Phone Number
        $cleanMobile = preg_replace('/\D/', '', $mobile);
        if (!empty($cleanMobile)) {
            $checkMobileStmt = $pdo->prepare("
                SELECT `id`, `registration_id`, `full_name` 
                FROM `students` 
                WHERE `mobile` = ? 
                   OR `mobile` = ? 
                   OR RIGHT(REPLACE(REPLACE(`mobile`, ' ', ''), '-', ''), 10) = RIGHT(?, 10)
                LIMIT 1
            ");
            $checkMobileStmt->execute([$mobile, $cleanMobile, $cleanMobile]);
            if ($existingMobile = $checkMobileStmt->fetch()) {
                http_response_code(409);
                echo json_encode([
                    "success" => false,
                    "error" => "Duplicate Registration Blocked: Mobile number (" . htmlspecialchars($mobile) . ") is already registered to candidate '" . htmlspecialchars($existingMobile['full_name']) . "' (" . $existingMobile['registration_id'] . "). Phone numbers must be unique across all applicants."
                ]);
                exit;
            }
        }

        $pdo->beginTransaction();

        $insertStmt = $pdo->prepare("
            INSERT INTO `students` (
                `registration_id`, `full_name`, `email`, `mobile`, `password_hash`,
                `qualification`, `course`, `stream`, `college`, `college_district`, `college_type`,
                `graduation_year`, `cgpa`, `current_semester`,
                `has_backlogs`, `backlogs_count`, `backlog_subjects`,
                `has_exam_clash`, `exam_dates`, `skills`, `domain_interest`, `status`, `is_blocked`, `is_active`
            ) VALUES (
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?, ?, ?, 0, 1
            )
        ");

        $insertStmt->execute([
            $registrationId, $fullName, $email, $mobile, $passwordHash,
            $qualification, $course, $stream, $college, $collegeDistrict, $collegeType,
            $gradYear, $cgpa, $currentSemester,
            $hasBacklogs, $backlogsCount, $backlogSubjects,
            $hasExamClash, $examDates, $skills, $domainInterest, $status
        ]);

        $newStudentId = $pdo->lastInsertId();

        // Insert Work Preferences
        $prefStmt = $pdo->prepare("
            INSERT INTO `student_work_preferences` (
                `student_id`, `day_shift`, `night_shift`, `preferred_shift`,
                `relocate`, `own_accommodation`, `manage_travel_expenses`,
                `work_from_office`, `technical_training`
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $prefStmt->execute([
            $newStudentId, $dayShift, $nightShift, $preferredShift,
            $relocate, $ownAccommodation, $manageTravelExpenses,
            $workFromOffice, $technicalTraining
        ]);

        // Assign Onboarding Tasks to Student
        try {
            $taskStmt = $pdo->prepare("
                INSERT INTO `student_task_assignments` (`task_id`, `student_id`, `status`)
                VALUES (1, ?, 'Assigned'), (2, ?, 'Assigned')
            ");
            $taskStmt->execute([$newStudentId, $newStudentId]);
        } catch (Exception $eTask) {
            // Non-fatal if tasks table is not yet seeded
        }

        // Initialize 10-Stage Result Approvals Tracker
        try {
            $pipelineStmt = $pdo->prepare("
                INSERT INTO `result_approvals` (
                    `student_id`, `stage_status`, `is_approved`, `is_published_to_student`
                ) VALUES (?, 'Exam Submitted', 0, 0)
            ");
            $pipelineStmt->execute([$newStudentId]);
        } catch (Exception $ePipe) {
            // Non-fatal if pipeline table is not yet seeded
        }

        // Welcome Notification
        try {
            $notifStmt = $pdo->prepare("
                INSERT INTO `notifications` (`student_id`, `title`, `message`, `type`)
                VALUES (?, 'Registration Confirmed', 'Welcome to Cognito Tech Hub & Quantex Assessment Portal. Your candidate profile has been registered.', 'info')
            ");
            $notifStmt->execute([$newStudentId]);
        } catch (Exception $eNotif) {
            // Non-fatal
        }

        $pdo->commit();

        echo json_encode([
            "success" => true,
            "message" => "Candidate registration completed successfully!",
            "student" => [
                "id" => $newStudentId,
                "registrationId" => $registrationId,
                "name" => $fullName,
                "email" => $email,
                "course" => $course,
                "stream" => $stream,
                "college" => $college,
                "status" => $status
            ]
        ]);
        exit;
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Registration DB Error: " . $e->getMessage());
        if ($e->getCode() == 23000 || strpos($e->getMessage(), 'Duplicate entry') !== false) {
            http_response_code(409);
            $dupMsg = "Duplicate Registration Blocked: This email address or phone number is already registered.";
            if (stripos($e->getMessage(), 'email') !== false) {
                $dupMsg = "Duplicate Registration Blocked: Email address (" . htmlspecialchars($email) . ") is already registered.";
            } elseif (stripos($e->getMessage(), 'mobile') !== false) {
                $dupMsg = "Duplicate Registration Blocked: Mobile number (" . htmlspecialchars($mobile) . ") is already registered.";
            }
            echo json_encode(["success" => false, "error" => $dupMsg]);
            exit;
        }
        http_response_code(500);
        echo json_encode(["success" => false, "error" => "Registration error: " . $e->getMessage()]);
        exit;
    }
}

// If database connection is unavailable, do NOT pretend success
echo json_encode([
    "success" => false,
    "error" => "Database connection unavailable. Please ensure your database is active on Hostinger."
]);
?>