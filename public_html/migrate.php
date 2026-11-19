<?php
// ==============================================================================
// Cognito Tech Hub - Automated Database Migration Runner
// Execute via: https://contest.cognitoinsights.tech/migrate.php?key=Cognito@2026
// ==============================================================================

header("Content-Type: text/html; charset=UTF-8");
require_once __DIR__ . '/db.php';

$secretKey = "Cognito@2026";
$providedKey = isset($_GET['key']) ? $_GET['key'] : (isset($_POST['key']) ? $_POST['key'] : '');

?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Cognito Assessment - Database Migration</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px 20px; }
    .card { max-width: 750px; margin: 0 auto; background: #1e293b; border-radius: 14px; border: 1px solid #334155; padding: 28px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
    h1 { color: #60a5fa; margin-top: 0; font-size: 22px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 12px; }
    .badge-ok { background: #065f46; color: #34d399; }
    .badge-err { background: #7f1d1d; color: #f87171; }
    .log-box { background: #090d16; border: 1px solid #334155; border-radius: 8px; padding: 14px; font-family: monospace; font-size: 12px; color: #94a3b8; max-height: 380px; overflow-y: auto; margin: 16px 0; }
    .log-ok { color: #34d399; }
    .log-err { color: #f87171; }
    .log-info { color: #38bdf8; }
    a { color: #60a5fa; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Database Migration Runner</h1>
    <p style="color: #94a3b8; font-size: 14px;">Cognito Assessment Portal &bull; Hostinger MySQL Synchronization</p>

    <?php if ($providedKey !== $secretKey): ?>
      <div style="background: #451a03; border: 1px solid #78350f; padding: 16px; border-radius: 8px; color: #fde68a;">
        <strong>Authorization Required:</strong> Please provide the valid migration key.
        <br/><br/>
        <code>?key=Cognito@2026</code>
      </div>
    <?php else: ?>
      <?php
      $pdo = getDbConnection();
      if (!$pdo) {
          echo '<div style="background: #7f1d1d; padding: 16px; border-radius: 8px; color: #fecaca;"><strong>Error:</strong> Failed to connect to MySQL database. Verify Hostinger DB credentials in db.php.</div>';
      } else {
          echo '<div style="margin-bottom: 16px;"><span class="badge badge-ok">CONNECTED TO HOSTINGER MYSQL</span></div>';
          
          $sqlFile = __DIR__ . '/final_database.sql';
          if (!file_exists($sqlFile)) {
              $sqlFile = __DIR__ . '/database.sql';
          }

          if (!file_exists($sqlFile)) {
              echo '<div class="badge badge-err">SQL file not found on server!</div>';
          } else {
              $rawSql = file_get_contents($sqlFile);
              
              echo '<div class="log-box">';
              echo '<div class="log-info">[INFO] Loaded SQL file (' . round(strlen($rawSql)/1024, 2) . ' KB)...</div>';

              // Disable foreign keys and set utf8mb4
              $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
              $pdo->exec("SET NAMES utf8mb4;");

              // Split SQL by semicolons at end of line
              $queries = preg_split('/;\s*[\r\n]+/', $rawSql);
              $successCount = 0;
              $errorCount = 0;

              foreach ($queries as $q) {
                  $trimmed = trim($q);
                  if (empty($trimmed) || strpos($trimmed, '--') === 0 || strpos($trimmed, '/*') === 0) {
                      continue;
                  }

                  try {
                      $pdo->exec($trimmed);
                      $successCount++;
                  } catch (PDOException $e) {
                      $errorCount++;
                      echo '<div class="log-err">[WARN] ' . htmlspecialchars($e->getMessage()) . '</div>';
                  }
              }

                            // Explicit check & insertion for requested colleges
              $guaranteedCollegesSql = "
              INSERT INTO `colleges` (`name`, `code`, `district`, `type`, `qualification_level`, `is_active`)
              VALUES 
              ('Adarsh College of Engineering, Chebrolu, Kakinada', 'AP175', 'Kakinada', 'Affiliated Engineering', 'UG,PG', 1),
              ('Kakinada Institute of Technology and Science (KITS), Divili', 'AP176', 'Kakinada', 'Affiliated Engineering', 'UG,PG', 1),
              ('KKR & KSR Institute of Technology & Sciences (KITS Autonomous), Guntur', 'AP177', 'Guntur', 'Autonomous Engineering', 'UG,PG', 1),
              ('Chebrolu Engineering College, Chebrolu', 'AP054', 'Guntur', 'Affiliated Engineering', 'UG,PG', 1)
              ON DUPLICATE KEY UPDATE `is_active` = 1;
              ";
              try {
                  $pdo->exec($guaranteedCollegesSql);
                  echo '<div class="log-ok">[OK] Ensured Adarsh College, KITS Divili, and Chebrolu Engineering College are active in database.</div>';
              } catch (PDOException $e) {
                  // ignored
              }

                            // Enforce unique phone number constraint on students table
              try {
                  $pdo->exec("ALTER TABLE `students` ADD UNIQUE KEY `uq_student_mobile` (`mobile`);");
                  echo '<div class="log-ok">[OK] Ensured unique mobile phone constraint on students table.</div>';
              } catch (PDOException $e) {
                  // ignored if key already exists
              }

              $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

              echo '<div class="log-ok">[SUCCESS] Migration completed! ' . $successCount . ' queries executed successfully (' . $errorCount . ' warnings/errors).</div>';
              echo '</div>';

              // Table summary
              $stmt = $pdo->query("SHOW TABLES");
              $allTables = [];
              while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
                  $allTables[] = $row[0];
              }

              echo '<p style="color: #34d399; font-weight: bold;">Database now contains ' . count($allTables) . ' tables:</p>';
              echo '<div style="display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0;">';
              foreach ($allTables as $t) {
                  $cnt = $pdo->query("SELECT COUNT(*) FROM `{$t}`")->fetchColumn();
                  echo '<span style="background: #0f172a; border: 1px solid #334155; padding: 4px 8px; border-radius: 6px; font-size: 11px;"><code>' . htmlspecialchars($t) . '</code> (' . $cnt . ')</span>';
              }
              echo '</div>';
          }
      }
      ?>
    <?php endif; ?>

    <p style="text-align: center; margin-top: 24px; font-size: 13px;">
      <a href="./db-test.php">&larr; Check Database Health Status</a> &bull;
      <a href="./index.html">Return to Portal &rarr;</a>
    </p>
  </div>
</body>
</html>

