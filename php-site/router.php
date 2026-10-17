<?php
// روتر سرور داخلی PHP برای تست محلی: php -S 0.0.0.0:8080 -t php-site php-site/router.php
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$file = __DIR__ . $path;
if ($path !== '/' && is_file($file)) {
    return false;
}
$_SERVER['SCRIPT_NAME'] = '/index.php';
require __DIR__ . '/index.php';
