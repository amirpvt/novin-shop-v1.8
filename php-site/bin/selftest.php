<?php
/**
 * تست محلی بدون وب‌سرور:
 * php php-site/bin/selftest.php
 * اگر storage/config.php وجود داشته باشد، تست اجرا نمی‌شود تا نصب واقعی خراب نشود.
 */
$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['HTTP_HOST'] = 'localhost';
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REQUEST_URI'] = '/';

require dirname(__DIR__) . '/app/bootstrap.php';

if (is_file(storage_path('config.php'))) {
    fwrite(STDOUT, "SKIP config.php already exists\n");
    exit(0);
}

$dbFile = storage_path('selftest.sqlite');
if (is_file($dbFile)) {
    unlink($dbFile);
}

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
write_config($cfg);

$failed = 0;
function check(bool $cond, string $message): void
{
    global $failed;
    if ($cond) {
        fwrite(STDOUT, "OK  $message\n");
        return;
    }
    $failed++;
    fwrite(STDOUT, "FAIL $message\n");
}

$count = (int) (one('SELECT COUNT(*) AS c FROM products')['c'] ?? 0);
check($count === 17, "seeded 17 products, got $count");

$pizza = find_product_by_slug('پنیر-پیتزای-9595');
check($pizza !== null, 'pizza product exists');
check($pizza && product_effective_price($pizza) === 225000, 'discount price is used');
check($pizza && product_discount_percent($pizza) === 10, 'discount percent is 10');

$opts = attach_options([$pizza])[0]['options'] ?? [];
check(count($opts) === 1 && (int) $opts[0]['unit_price'] === 180000, 'wholesale carton price');

$before = (int) $pizza['stock'];
$order = create_order(db(), [
    'items' => [[
        'product_id' => (int) $pizza['id'],
        'name' => $pizza['name'],
        'price' => 1,
        'qty' => 2,
        'unit_label' => 'بسته',
    ]],
    'name' => 'مشتری تست',
    'phone' => '09120000000',
    'address' => 'کرج، تست نصب فروشگاه',
    'order_status' => 'PENDING',
    'payment_method' => 'cod',
    'payment_status' => 'UNPAID',
]);
check(str_starts_with($order['order_number'], 'ORD-'), 'order number prefix');
check($order['total'] === 2, 'server stores the price it is given by checkout, not a hidden client field');
$after = (int) (one('SELECT stock FROM products WHERE id = ?', [(int) $pizza['id']])['stock'] ?? -1);
check($after === $before - 2, "stock decreased $before -> $after");

set_order_status((int) $order['id'], 'CANCELLED', 'تست');
$restored = (int) (one('SELECT stock FROM products WHERE id = ?', [(int) $pizza['id']])['stock'] ?? -1);
check($restored === $before, "cancel restores stock, now $restored");

$items = [[
    'product_id' => (int) $pizza['id'],
    'name' => $pizza['name'],
    'option_label' => 'کارتن',
    'unit_label' => 'کارتن',
    'unit_price' => 180000,
    'qty' => 10,
    'below_min' => false,
]];
$req = create_wholesale_request(db(), [
    'items' => $items,
    'company_name' => 'فروشگاه تست',
    'contact_person' => 'علی تست',
    'phone' => '09121111111',
    'address' => 'کرج',
]);
check($req['total'] === 1800000, 'wholesale total');
check(str_starts_with($req['request_number'], 'WHS-'), 'wholesale number');

$phone = normalize_phone('+989120000000');
check($phone === '09120000000', 'phone normalize');
check(is_phone('02636640196'), 'landline accepted');
check(!is_phone('123'), 'short phone rejected');
check(slugify('سس مایونز') === 'سس-مایونز', 'persian slug');

[$jy, $jm, $jd] = gregorian_to_jalali(2024, 3, 20);
check($jy === 1403 && $jm === 1 && $jd === 1, "jalali 2024-03-20 => $jy/$jm/$jd");

if (is_file($dbFile)) {
    unlink($dbFile);
}
if (is_file(storage_path('config.php'))) {
    unlink(storage_path('config.php'));
}
reload_config();

if ($failed > 0) {
    fwrite(STDOUT, "$failed failed\n");
    exit(1);
}
fwrite(STDOUT, "all checks passed\n");
