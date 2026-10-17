<?php

if (PHP_VERSION_ID < 80000) {
    http_response_code(500);
    exit('این سایت به PHP 8.0 یا جدیدتر نیاز دارد. نسخه فعلی: ' . PHP_VERSION);
}

date_default_timezone_set('Asia/Tehran');
mb_internal_encoding('UTF-8');

require __DIR__ . '/helpers.php';
require __DIR__ . '/schema.php';
require __DIR__ . '/seed.php';
require __DIR__ . '/commerce.php';

ensure_dirs();

$cookiePath = base_path() !== '' ? base_path() : '/';
session_name('NOVINSESS');
if (is_dir(storage_path('sessions')) && is_writable(storage_path('sessions'))) {
    session_save_path(storage_path('sessions'));
}
session_set_cookie_params([
    'lifetime' => 0,
    'path' => $cookiePath,
    'secure' => request_is_https(),
    'httponly' => true,
    'samesite' => 'Lax',
]);
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Referrer-Policy: strict-origin-when-cross-origin');

if (is_installed()) {
    try {
        expire_stale_payments();
    } catch (Throwable $e) {
        app_log('expire payments: ' . $e->getMessage());
    }
}
