<?php
// ==============================================================================
// Database Connection Manager - PDO MySQL
// Database: u297467125_contest
// ==============================================================================

function getDbConnection() {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $dbHost = getenv('DB_HOST') ?: 'localhost';
    $dbName = getenv('DB_NAME') ?: 'u297467125_contest';
    $dbUser = getenv('DB_USER') ?: 'u297467125_contest';
    $dbPass = getenv('DB_PASS') ?: 'Satya@9890';

    // Check .env if present
    $possibleEnv = [
        __DIR__ . '/.env',
        __DIR__ . '/../.env',
        dirname(__DIR__) . '/.env'
    ];

    foreach ($possibleEnv as $envPath) {
        if (file_exists($envPath)) {
            $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                $line = trim($line);
                if ($line && strpos($line, '#') !== 0 && strpos($line, '=') !== false) {
                    list($k, $v) = explode('=', $line, 2);
                    $k = trim($k);
                    $v = trim($v);
                    if ($k === 'DB_HOST') $dbHost = $v;
                    if ($k === 'DB_NAME') $dbName = $v;
                    if ($k === 'DB_USER') $dbUser = $v;
                    if ($k === 'DB_PASS') $dbPass = $v;
                }
            }
            break;
        }
    }

    try {
        $dsn = "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
        ];
        $pdo = new PDO($dsn, $dbUser, $dbPass, $options);
        return $pdo;
    } catch (PDOException $e) {
        // Return null or throw
        error_log("Database connection error: " . $e->getMessage());
        return null;
    }
}
?>

