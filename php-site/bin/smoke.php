<?php
/**
 * رندر صفحه‌های اصلی و گرفتن هشدارهای PHP.
 * php php-site/bin/smoke.php
 */
$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['HTTP_HOST'] = 'localhost';
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REQUEST_URI'] = '/';
$_SERVER['HTTPS'] = 'off';

require dirname(__DIR__) . '/app/bootstrap.php';
require dirname(__DIR__) . '/app/handlers.php';

if (is_file(storage_path('config.php'))) {
    fwrite(STDOUT, "SKIP config.php already exists\n");
    exit(0);
}

set_error_handler(static function (int $severity, string $message, string $file, int $line): bool {
    if (!(error_reporting() & $severity)) {
        return false;
    }
    throw new ErrorException($message, 0, $severity, $file, $line);
});

$dbFile = storage_path('smoke.sqlite');
@unlink($dbFile);
$cfg = [
    'installed' => true,
    'driver' => 'sqlite',
    'db_host' => 'localhost',
    'db_port' => '3306',
    'db_name' => '',
    'db_user' => '',
    'db_pass' => '',
    'sqlite_path' => $dbFile,
    'pretty_urls' => true,
    'debug' => true,
];
$pdo = connect_pdo($cfg);
migrate($pdo, 'sqlite');
seed_catalog($pdo);
ensure_settings($pdo, 'sqlite', 'http://localhost');
$adminId = install_admin($pdo, 'مدیر تست', '09120000000', 'test-pass-123');
write_config($cfg);
$_SESSION['user_id'] = $adminId;

$failed = 0;
$current = '';
register_shutdown_function(static function () use (&$current, &$failed, $dbFile): void {
    $err = error_get_last();
    if ($err && in_array($err['type'], [E_ERROR, E_PARSE, E_COMPILE_ERROR], true)) {
        fwrite(STDOUT, "FATAL during $current {$err['message']} {$err['file']}:{$err['line']}\n");
    }
    @unlink($dbFile);
    @unlink(storage_path('config.php'));
});

function run_page(string $name, callable $fn): void
{
    global $failed, $current;
    $current = $name;
    fwrite(STDOUT, "PAGE $name\n");
    try {
        ob_start();
        $fn();
        $html = (string) ob_get_clean();
    } catch (Throwable $e) {
        while (ob_get_level() > 0) {
            ob_end_clean();
        }
        $failed++;
        fwrite(STDOUT, "FAIL $name {$e->getMessage()} @ {$e->getFile()}:{$e->getLine()}\n");
        return;
    }
    if (strlen($html) < 80 || !str_contains($html, '<')) {
        $failed++;
        fwrite(STDOUT, "FAIL $name short output\n");
        return;
    }
    if (preg_match('/\\b(Warning|Notice|Deprecated|Fatal error):/u', $html)) {
        $failed++;
        fwrite(STDOUT, "FAIL $name warning in html\n");
        return;
    }
    fwrite(STDOUT, "OK $name " . strlen($html) . "\n");
}

run_page('home', 'handle_home');
$_GET = ['q' => 'سس%', 'sort' => 'price-asc', 'available' => '1', 'min' => '1000', 'max' => '900000'];
run_page('shop-search', 'handle_shop');
$_GET = ['category' => 'sausage'];
run_page('shop-cat', 'handle_shop');
$_GET = [];
run_page('product', static function (): void {
    handle_product('پنیر-پیتزای-9595');
});
run_page('cart-empty', 'handle_cart');
cart_add((int) find_product_by_slug('پنیر-پیتزای-9595')['id'], 1);
$resolved = cart_resolved();
if (($resolved[0]['price'] ?? 0) !== 225000) {
    $failed++;
    fwrite(STDOUT, "FAIL cart price " . ($resolved[0]['price'] ?? 'none') . "\n");
} else {
    fwrite(STDOUT, "OK cart price\n");
}
run_page('cart', 'handle_cart');
run_page('checkout', 'handle_checkout');
run_page('wholesale', 'handle_wholesale');
run_page('about', 'handle_about');
run_page('contact', 'handle_contact');
run_page('track', 'handle_track');
run_page('login', static function (): void {
    view('auth', ['title' => 'ورود', 'mode' => 'login', 'robots' => 'noindex']);
});
run_page('register', static function (): void {
    view('auth', ['title' => 'ثبت‌نام', 'mode' => 'register', 'robots' => 'noindex']);
});
run_page('account', 'handle_account');
run_page('orders', 'handle_orders');
run_page('admin', 'handle_admin_home');
run_page('products', 'handle_admin_products');
$_GET = [];
run_page('product-new', 'handle_admin_product_form');
$_GET = ['id' => (string) find_product_by_slug('پنیر-پیتزای-9595')['id']];
run_page('product-edit', 'handle_admin_product_form');
$_GET = [];
run_page('categories', 'handle_admin_categories');
run_page('brands', 'handle_admin_brands');
run_page('admin-orders', 'handle_admin_orders');
run_page('users', 'handle_admin_users');
run_page('messages', 'handle_admin_messages');
run_page('settings', 'handle_admin_settings');
run_page('commissions', 'handle_admin_commissions');
run_page('visitor', 'handle_visitor');
run_page('wholesale-admin', 'handle_admin_wholesale');

$order = create_order(db(), [
    'items' => $resolved,
    'name' => 'مدیر تست',
    'phone' => '09120000000',
    'address' => 'کرج، تست',
    'order_status' => 'PENDING',
    'payment_method' => 'cod',
    'payment_status' => 'UNPAID',
    'user_id' => $adminId,
]);
if ($order['total'] !== 225000) {
    $failed++;
    fwrite(STDOUT, "FAIL checkout total {$order['total']}\n");
} else {
    fwrite(STDOUT, "OK checkout total\n");
}
$_GET = ['id' => (string) $order['id']];
run_page('admin-order', 'handle_admin_order');
$_GET = ['t' => $order['public_token']];
run_page('order', static function () use ($order): void {
    handle_order_show($order['order_number'], false);
});
run_page('invoice', static function () use ($order): void {
    handle_order_show($order['order_number'], true);
});

run_page('install-view', static function (): void {
    view('install', [
        '_layout' => '',
        'errors' => [],
        'missing' => [],
        'writable_problems' => [],
        'site_url' => 'http://localhost',
    ]);
});
run_page('404', static function (): void {
    view('404', ['title' => 'صفحه پیدا نشد', 'robots' => 'noindex']);
});

if ($failed > 0) {
    fwrite(STDOUT, "$failed failed\n");
    exit(1);
}
fwrite(STDOUT, "smoke passed\n");
