<?php
// ==============================================================================
// Database Connection & Schema Health Check
// Visit: https://contest.cognitoinsights.tech/db-test.php
// ==============================================================================

header("Content-Type: text/html; charset=UTF-8");
require_once __DIR__ . '/db.php';

$pdo = getDbConnection();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Cognito Assessment - Database Health Check</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px 20px; }
    .card { max-width: 650px; margin: 0 auto; background: #1e293b; border-radius: 14px; border: 1px solid #334155; padding: 28px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
    h1 { color: #60a5fa; margin-top: 0; font-size: 22px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 12px; }
    .badge-ok { background: #065f46; color: #34d399; }
    .badge-err { background: #7f1d1d; color: #f87171; }
    .item { margin: 16px 0; padding: 12px; border-radius: 8px; background: #0f172a; border: 1px solid #334155; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
    th, td { text-align: left; padding: 8px; border-bottom: 1px solid #334155; }
    th { color: #94a3b8; }
    a { color: #60a5fa; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Database Connection & Schema Status</h1>
    <p style="color: #94a3b8; font-size: 14px;">Cognito Assessment Portal &bull; Hostinger MySQL Diagnostic</p>

    <div class="item">
      <strong>Database Host:</strong> <code>localhost</code><br/>
      <strong>Database Name:</strong> <code>u297467125_contest</code><br/>
      <strong>Database User:</strong> <code>u297467125_contest</code>
    </div>

    <div class="item">
      <strong>Connection Status:</strong>
      <?php if ($pdo): ?>
        <span class="badge badge-ok">CONNECTED SUCCESSFULLY</span>
      <?php else: ?>
        <span class="badge badge-err">CONNECTION FAILED</span>
        <p style="color: #f87171; font-size: 12px; margin: 8px 0 0 0;">Unable to connect with password. Please check your MySQL database password in Hostinger hPanel.</p>
      <?php endif; ?>
    </div>

    <?php if ($pdo): ?>
      <div class="item">
        <strong>Tables in Database:</strong>
        <?php
        $tables = ['admins', 'students', 'email_otps', 'assessments'];
        $found = [];
        $stmt = $pdo->query("SHOW TABLES");
        while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
            $found[] = $row[0];
        }
        ?>
        <table>
          <thead>
            <tr>
              <th>Table Name</th>
              <th>Status</th>
              <th>Records</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($tables as $t): ?>
              <tr>
                <td><code><?= htmlspecialchars($t) ?></code></td>
                <td>
                  <?php if (in_array($t, $found)): ?>
                    <span class="badge badge-ok">Present</span>
                  <?php else: ?>
                    <span class="badge badge-err">Missing</span>
                  <?php endif; ?>
                </td>
                <td>
                  <?php
                  if (in_array($t, $found)) {
                      $c = $pdo->query("SELECT COUNT(*) FROM `{$t}`")->fetchColumn();
                      echo $c . " rows";
                  } else {
                      echo "-";
                  }
                  ?>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>

        <?php if (count(array_intersect($tables, $found)) < count($tables)): ?>
          <p style="color: #f59e0b; font-size: 12px; margin: 12px 0 0 0;">
            Some tables are missing. Please import the file <strong>database.sql</strong> in your <strong>phpMyAdmin</strong> to create all tables.
          </p>
        <?php else: ?>
          <p style="color: #34d399; font-size: 12px; margin: 12px 0 0 0;">
            All 4 tables are present and ready!
          </p>
        <?php endif; ?>
      </div>
    <?php endif; ?>

    <p style="text-align: center; margin-top: 24px; font-size: 13px;">
      <a href="./index.html">&larr; Return to Assessment Portal</a>
    </p>
  </div>
</body>
</html>

