<?php
// ==============================================================================
// Cognito Assessment Portal - Complete Data Purge Runner
// Purges all candidate records, test attempts, submissions, and recovery logs
// Leaves admins, colleges, courses, questions, and system settings 100% intact
// Secret Key: Cognito@2026
// ==============================================================================

header("Content-Type: text/html; charset=UTF-8");
require_once __DIR__ . '/db.php';

$secretKey = "Cognito@2026";
$providedKey = $_GET['key'] ?? $_POST['key'] ?? '';

?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Cognito Assessment - Candidate Data Purge</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px 20px; }
    .card { max-width: 650px; margin: 0 auto; background: #1e293b; border-radius: 14px; border: 1px solid #334155; padding: 28px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
    h1 { color: #f87171; margin-top: 0; font-size: 22px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 12px; }
    .badge-ok { background: #065f46; color: #34d399; }
    .badge-err { background: #7f1d1d; color: #f87171; }
    .log-box { background: #090d16; border: 1px solid #334155; border-radius: 8px; padding: 14px; font-family: monospace; font-size: 12px; color: #94a3b8; max-height: 380px; overflow-y: auto; margin: 16px 0; }
    .log-ok { color: #34d399; }
    .log-err { color: #f87171; }
    a { color: #60a5fa; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Candidate Data Purge Runner</h1>
    <p style="color: #94a3b8; font-size: 14px;">Cognito Assessment Portal &bull; Fresh Start Reset</p>

    <?php if ($providedKey !== $secretKey): ?>
      <div style="background: #451a03; border: 1px solid #78350f; padding: 16px; border-radius: 8px; color: #fde68a;">
        <strong>Authorization Required:</strong> Please provide the valid security key to confirm candidate data purge:
        <br/><br/>
        <code>?key=Cognito@2026</code>
      </div>
    <?php else: ?>
      <?php
      // 1. Clear local registered_students.json if present
      $jsonPath = __DIR__ . '/registered_students.json';
      if (file_exists($jsonPath)) {
          file_put_contents($jsonPath, "[]\n");
          echo '<div class="log-ok">[OK] Cleared registered_students.json data store.</div>';
      }

      // 2. Clear MySQL database tables if connected
      $pdo = getDbConnection();
      if ($pdo) {
          echo '<div class="log-box">';
          $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
          $tablesToTruncate = [
              'exam_paper_snapshots',
              'exam_timing_overrides',
              'answer_sheet_evaluations',
              'result_approvals',
              'student_task_assignments',
              'exam_recovery_history',
              'exam_recovery_codes',
              'exam_violations',
              'coding_submissions',
              'student_answers',
              'offline_sync_logs',
              'exam_attempts',
              'assessments',
              'student_work_preferences',
              'email_otps',
              'notifications',
              'students'
          ];
          foreach ($tablesToTruncate as $t) {
              try {
                  $pdo->exec("TRUNCATE TABLE `{$t}`;");
                  echo '<div class="log-ok">[OK] Truncated table ' . $t . '</div>';
              } catch (PDOException $e) {
                  echo '<div class="log-err">[WARN] Could not truncate ' . $t . ': ' . htmlspecialchars($e->getMessage()) . '</div>';
              }
          }
          $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");
          echo '</div>';
          echo '<div style="margin: 16px 0;"><span class="badge badge-ok">ALL TEST DATA SUCCESSFULLY PURGED FROM HOSTINGER MYSQL</span></div>';
      } else {
          echo '<div style="margin: 16px 0;"><span class="badge badge-ok">LOCAL CANDIDATES PURGED (Local mode)</span></div>';
      }
      ?>
      <p style="color: #38bdf8; font-size: 14px;">The system has been completely reset to zero test candidates. You can now register a brand new user from scratch.</p>
    <?php endif; ?>

    <p style="text-align: center; margin-top: 24px; font-size: 13px;">
      <a href="./index.html">&larr; Return to Portal</a> &bull;
      <a href="./db-test.php">Check Database Status &rarr;</a>
    </p>
  </div>
</body>
</html>
