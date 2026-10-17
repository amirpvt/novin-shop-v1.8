<?php

function base_dir(): string
{
    return dirname(__DIR__);
}

function storage_path(string $path = ''): string
{
    $root = base_dir() . '/storage';
    return $path === '' ? $root : $root . '/' . ltrim($path, '/');
}

function ensure_dirs(): void
{
    $dirs = [
        storage_path(),
        storage_path('sessions'),
        storage_path('logs'),
        base_dir() . '/uploads',
        base_dir() . '/uploads/products',
        base_dir() . '/uploads/receipts',
        base_dir() . '/uploads/brands',
        base_dir() . '/uploads/categories',
    ];
    foreach ($dirs as $dir) {
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
    }
}

function &config_state(): array
{
    static $state = ['loaded' => false, 'cfg' => []];
    return $state;
}

function config(string $key, $default = null)
{
    $state = &config_state();
    if (!$state['loaded']) {
        $file = storage_path('config.php');
        $cfg = is_file($file) ? require $file : [];
        $state['cfg'] = is_array($cfg) ? $cfg : [];
        $state['loaded'] = true;
    }
    return $state['cfg'][$key] ?? $default;
}

function reload_config(): void
{
    $state = &config_state();
    $state['loaded'] = false;
    $state['cfg'] = [];
}

function is_installed(): bool
{
    return (bool) config('installed', false) && is_file(storage_path('config.php'));
}

function write_config(array $cfg): void
{
    $php = "<?php\nreturn " . var_export($cfg, true) . ";\n";
    $file = storage_path('config.php');
    if (file_put_contents($file, $php, LOCK_EX) === false) {
        throw new RuntimeException('نوشتن فایل تنظیمات ممکن نشد. دسترسی پوشه storage را روی ۷۵۵ یا ۷۷۵ بگذارید.');
    }
    @chmod($file, 0640);
    reload_config();
}

function base_path(): string
{
    $script = str_replace('\\', '/', $_SERVER['SCRIPT_NAME'] ?? '/index.php');
    $dir = rtrim(dirname($script), '/');
    if ($dir === '' || $dir === '.' || $dir === '/' || $dir === '\\') {
        return '';
    }
    return $dir;
}

function request_is_https(): bool
{
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
        return true;
    }
    if ((string) ($_SERVER['SERVER_PORT'] ?? '') === '443') {
        return true;
    }
    return strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https';
}

function url(string $path = '', array $query = []): string
{
    $path = trim($path, '/');
    $segments = $path === '' ? [] : array_map('rawurlencode', explode('/', $path));
    $encoded = implode('/', $segments);
    $base = base_path();
    $pretty = (bool) config('pretty_urls', true);
    if (!$pretty) {
        $q = $query;
        if ($path !== '') {
            $q = ['r' => $path] + $q;
        }
        $u = $base . '/index.php';
        return $q ? $u . '?' . http_build_query($q) : $u;
    }
    $u = $base . '/' . $encoded;
    if ($u === '') {
        $u = '/';
    }
    if ($query) {
        $u .= (str_contains($u, '?') ? '&' : '?') . http_build_query($query);
    }
    return $u;
}

function asset(string $path): string
{
    $rel = ltrim($path, '/');
    $parts = $rel === '' ? [] : array_map('rawurlencode', explode('/', $rel));
    $full = base_dir() . '/' . $rel;
    $v = is_file($full) ? (string) filemtime($full) : '1';
    return base_path() . '/' . implode('/', $parts) . '?v=' . $v;
}

function absolute_url(string $path = ''): string
{
    $site = rtrim((string) (is_installed() ? setting('site_url', '') : ''), '/');
    $https = request_is_https();
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    if ($site === '') {
        $site = ($https ? 'https' : 'http') . '://' . $host . base_path();
    } elseif ($https && str_starts_with($site, 'http://')) {
        $site = 'https://' . substr($site, 7);
    }
    $path = trim($path, '/');
    return $path === '' ? $site . '/' : $site . '/' . implode('/', array_map('rawurlencode', explode('/', $path)));
}

function request_path(): string
{
    if (isset($_GET['r']) && $_GET['r'] !== '') {
        $path = '/' . ltrim((string) $_GET['r'], '/');
    } else {
        $uri = rawurldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');
        $base = base_path();
        if ($base !== '' && str_starts_with($uri, $base)) {
            $uri = substr($uri, strlen($base)) ?: '/';
        }
        $path = '/' . trim($uri, '/');
        if ($path === '/index.php') {
            $path = '/';
        }
    }
    $path = preg_replace('#/+#', '/', $path) ?: '/';
    if ($path !== '/') {
        $path = rtrim($path, '/');
    }
    return $path === '' ? '/' : $path;
}

function redirect(string $path, array $query = []): void
{
    header('Location: ' . url($path, $query));
    exit;
}

function safe_location(string $target, string $fallback = ''): string
{
    $target = trim($target);
    if ($target === '' || strlen($target) > 400 || str_contains($target, '://') || str_starts_with($target, '//') || str_contains($target, "\n") || str_contains($target, "\r")) {
        return url($fallback);
    }
    if ($target[0] !== '/') {
        $target = '/' . $target;
    }
    $base = base_path();
    if ($base !== '' && str_starts_with($target, $base)) {
        $target = substr($target, strlen($base)) ?: '/';
    }
    $parts = parse_url($target);
    $path = ltrim((string) ($parts['path'] ?? ''), '/');
    if (str_contains($path, '..')) {
        return url($fallback);
    }
    $query = [];
    if (!empty($parts['query'])) {
        parse_str($parts['query'], $query);
    }
    return url($path, is_array($query) ? $query : []);
}

function redirect_back(string $fallback = ''): void
{
    $target = (string) ($_POST['back'] ?? $fallback);
    header('Location: ' . safe_location($target, $fallback));
    exit;
}

function e($value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function nl($value): string
{
    return nl2br(e($value), false);
}

function now(): string
{
    return date('Y-m-d H:i:s');
}

function digits_to_en(string $value): string
{
    return strtr($value, [
        '۰' => '0', '۱' => '1', '۲' => '2', '۳' => '3', '۴' => '4',
        '۵' => '5', '۶' => '6', '۷' => '7', '۸' => '8', '۹' => '9',
        '٠' => '0', '١' => '1', '٢' => '2', '٣' => '3', '٤' => '4',
        '٥' => '5', '٦' => '6', '٧' => '7', '٨' => '8', '٩' => '9',
    ]);
}

function money($amount): string
{
    return number_format((int) $amount, 0, '.', ',') . ' تومان';
}

function money_input($value): int
{
    $value = digits_to_en(trim((string) $value));
    $value = str_replace([',', ' ', '٬', '،'], '', $value);
    if ($value === '' || !preg_match('/^\d+$/', $value)) {
        return 0;
    }
    return (int) $value;
}

function qty_input($value, int $min = 1, int $max = 999): int
{
    $raw = preg_replace('/[^\d]/', '', digits_to_en((string) $value));
    $n = (int) $raw;
    if ($n < $min) {
        return $min;
    }
    return min($max, $n);
}

function normalize_phone(string $phone): string
{
    $phone = digits_to_en($phone);
    $phone = preg_replace('/[^\d+]/', '', $phone) ?? '';
    if (str_starts_with($phone, '+98')) {
        $phone = '0' . substr($phone, 3);
    } elseif (str_starts_with($phone, '0098')) {
        $phone = '0' . substr($phone, 4);
    } elseif (str_starts_with($phone, '98') && strlen($phone) >= 12) {
        $phone = '0' . substr($phone, 2);
    } elseif (str_starts_with($phone, '9') && strlen($phone) === 10) {
        $phone = '0' . $phone;
    }
    return $phone;
}

function is_phone(string $phone): bool
{
    return (bool) preg_match('/^0\d{10}$/', $phone);
}

function slugify(string $text): string
{
    $text = trim($text);
    $text = preg_replace('/\s+/u', '-', $text) ?? '';
    $text = preg_replace('/[^\p{L}\p{N}\-]+/u', '', $text) ?? '';
    $text = trim($text, '-');
    if ($text === '') {
        return 'item-' . bin2hex(random_bytes(3));
    }
    return mb_substr($text, 0, 160);
}

function unit_options(): array
{
    return [
        'kg' => 'کیلوگرم',
        'pack' => 'بسته',
        'piece' => 'عدد',
        'carton' => 'کارتن',
        'box' => 'باکس',
    ];
}

function unit_label(?string $unit): string
{
    $unit = trim((string) $unit);
    return unit_options()[$unit] ?? ($unit !== '' ? $unit : 'عدد');
}

function tag_label(?string $tag): string
{
    return [
        'new' => 'جدید',
        'best' => 'پرفروش',
        'discount' => 'تخفیف',
        'special' => 'ویژه',
    ][$tag] ?? (string) $tag;
}

function badge_label(?string $badge): string
{
    return [
        'fresh' => 'تازه',
        'hot' => 'محبوب',
        'premium' => 'پریمیوم',
    ][$badge] ?? (string) $badge;
}

function order_status_options(): array
{
    return [
        'PENDING' => 'در انتظار بررسی',
        'PAID_PENDING_REVIEW' => 'پرداخت شده / در انتظار بررسی',
        'CONFIRMED' => 'تایید شده',
        'PREPARING' => 'در حال آماده‌سازی',
        'SHIPPED' => 'ارسال شده',
        'DELIVERED' => 'تحویل شده',
        'CANCELLED' => 'لغو شده',
    ];
}

function order_status_label(?string $status): string
{
    return order_status_options()[$status] ?? (string) $status;
}

function wholesale_status_options(): array
{
    return [
        'NEW' => 'درخواست جدید',
        'QUOTED' => 'پیش‌فاکتور صادر شده',
        'CONVERTED' => 'تبدیل به سفارش شده',
        'REJECTED' => 'رد شده',
    ];
}

function wholesale_status_label(?string $status): string
{
    return wholesale_status_options()[$status] ?? (string) $status;
}

function payment_method_label(?string $method): string
{
    return [
        'online' => 'پرداخت آنلاین',
        'cod' => 'پرداخت در محل',
        'card' => 'کارت به کارت',
        'visitor_cash' => 'نقد ویزیتور',
        'visitor_credit' => 'نسیه ویزیتور',
    ][$method] ?? (string) $method;
}

function payment_status_label(?string $status): string
{
    return [
        'UNPAID' => 'پرداخت نشده',
        'PENDING' => 'در انتظار تایید پرداخت',
        'PAID' => 'پرداخت شده',
        'FAILED' => 'ناموفق',
    ][$status] ?? (string) $status;
}

function role_label(?string $role): string
{
    return [
        'manager' => 'مدیر کل',
        'admin' => 'ادمین فروشگاه',
        'visitor' => 'ویزیتور',
        'customer' => 'مشتری',
    ][$role] ?? 'کاربر';
}

function gregorian_to_jalali(int $gy, int $gm, int $gd): array
{
    $gDays = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    $gy2 = ($gm > 2) ? ($gy + 1) : $gy;
    $days = 355666 + (365 * $gy) + intdiv($gy2 + 3, 4) - intdiv($gy2 + 99, 100) + intdiv($gy2 + 399, 400) + $gd + $gDays[$gm - 1];
    $jy = -1595 + (33 * intdiv($days, 12053));
    $days %= 12053;
    $jy += 4 * intdiv($days, 1461);
    $days %= 1461;
    if ($days > 365) {
        $jy += intdiv($days - 1, 365);
        $days = ($days - 1) % 365;
    }
    if ($days < 186) {
        $jm = 1 + intdiv($days, 31);
        $jd = 1 + ($days % 31);
    } else {
        $jm = 7 + intdiv($days - 186, 30);
        $jd = 1 + (($days - 186) % 30);
    }
    return [$jy, $jm, $jd];
}

function fa_date(?string $dt, bool $withTime = true): string
{
    if (!$dt) {
        return '';
    }
    $ts = strtotime($dt);
    if (!$ts) {
        return (string) $dt;
    }
    [$jy, $jm, $jd] = gregorian_to_jalali((int) date('Y', $ts), (int) date('n', $ts), (int) date('j', $ts));
    $date = sprintf('%04d/%02d/%02d', $jy, $jm, $jd);
    return $withTime ? $date . ' ' . date('H:i', $ts) : $date;
}

function csrf_token(): string
{
    if (empty($_SESSION['csrf']) || !is_string($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function csrf_field(): string
{
    return '<input type="hidden" name="csrf" value="' . e(csrf_token()) . '">';
}

function verify_csrf(): void
{
    $sent = (string) ($_POST['csrf'] ?? '');
    $known = (string) ($_SESSION['csrf'] ?? '');
    if ($known === '' || $sent === '' || !hash_equals($known, $sent)) {
        throw new RuntimeException('درخواست نامعتبر است. صفحه را یک‌بار تازه کنید و دوباره تلاش کنید.');
    }
}

function flash(string $type, string $message): void
{
    $_SESSION['_flash'][] = ['type' => $type, 'message' => $message];
}

function pull_flashes(): array
{
    $items = $_SESSION['_flash'] ?? [];
    unset($_SESSION['_flash']);
    return is_array($items) ? $items : [];
}

function remember_input(?array $src = null): void
{
    $data = $src ?? $_POST;
    unset($data['password'], $data['password_confirm'], $data['csrf']);
    $data['_posted'] = '1';
    $_SESSION['_old'] = $data;
}

function clear_old(): void
{
    unset($_SESSION['_old']);
}

function old(string $key, $default = '')
{
    return $_SESSION['_old'][$key] ?? $default;
}

function field_value(string $key, ?array $model = null, $default = '', bool $checkbox = false)
{
    $old = $_SESSION['_old'] ?? null;
    if (is_array($old) && !empty($old['_posted'])) {
        if ($checkbox) {
            return isset($old[$key]) ? $old[$key] : '0';
        }
        return $old[$key] ?? $default;
    }
    if ($model && array_key_exists($key, $model)) {
        return $model[$key];
    }
    return $default;
}

function selected($a, $b): string
{
    return (string) $a === (string) $b ? 'selected' : '';
}

function checked($cond): string
{
    return $cond ? 'checked' : '';
}

function pdo_options(): array
{
    return [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    if (!is_installed()) {
        throw new RuntimeException('سایت هنوز نصب نشده است.');
    }
    $driver = (string) config('driver', 'mysql');
    if ($driver === 'sqlite') {
        $path = (string) config('sqlite_path');
        $pdo = new PDO('sqlite:' . $path, null, null, pdo_options());
        $pdo->exec('PRAGMA foreign_keys = ON');
        $pdo->exec('PRAGMA busy_timeout = 5000');
        return $pdo;
    }
    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
        config('db_host', 'localhost'),
        config('db_port', '3306'),
        config('db_name', '')
    );
    $options = pdo_options();
    if (defined('PDO::MYSQL_ATTR_INIT_COMMAND')) {
        $options[PDO::MYSQL_ATTR_INIT_COMMAND] = 'SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci';
    }
    $pdo = new PDO($dsn, (string) config('db_user', ''), (string) config('db_pass', ''), $options);
    return $pdo;
}

function connect_pdo(array $cfg): PDO
{
    if (($cfg['driver'] ?? '') === 'sqlite') {
        $pdo = new PDO('sqlite:' . $cfg['sqlite_path'], null, null, pdo_options());
        $pdo->exec('PRAGMA foreign_keys = ON');
        $pdo->exec('PRAGMA busy_timeout = 5000');
        return $pdo;
    }
    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $cfg['db_host'], $cfg['db_port'], $cfg['db_name']);
    $options = pdo_options();
    if (defined('PDO::MYSQL_ATTR_INIT_COMMAND')) {
        $options[PDO::MYSQL_ATTR_INIT_COMMAND] = 'SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci';
    }
    return new PDO($dsn, $cfg['db_user'], $cfg['db_pass'], $options);
}

function q(string $sql, array $params = []): PDOStatement
{
    $st = db()->prepare($sql);
    $st->execute($params);
    return $st;
}

function one(string $sql, array $params = []): ?array
{
    $row = q($sql, $params)->fetch();
    return $row ?: null;
}

function all_rows(string $sql, array $params = []): array
{
    return q($sql, $params)->fetchAll() ?: [];
}

function &settings_cache(): array
{
    static $cache = ['loaded' => false, 'data' => []];
    return $cache;
}

function setting(string $key, string $default = ''): string
{
    if (!is_installed()) {
        return $default;
    }
    $cache = &settings_cache();
    if (!$cache['loaded']) {
        $cache['data'] = [];
        foreach (all_rows('SELECT setting_key, setting_value FROM settings') as $row) {
            $cache['data'][$row['setting_key']] = (string) $row['setting_value'];
        }
        $cache['loaded'] = true;
    }
    return $cache['data'][$key] ?? $default;
}

function clear_settings_cache(): void
{
    $cache = &settings_cache();
    $cache['loaded'] = false;
    $cache['data'] = [];
}

function set_setting(string $key, string $value): void
{
    if (config('driver') === 'sqlite') {
        q('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value', [$key, $value]);
    } else {
        q('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)', [$key, $value]);
    }
    clear_settings_cache();
}

function current_user(): ?array
{
    static $loaded = false;
    static $user = null;
    if ($loaded) {
        return $user;
    }
    $loaded = true;
    $id = $_SESSION['user_id'] ?? null;
    if (!$id || !is_installed()) {
        return $user = null;
    }
    $user = one('SELECT * FROM users WHERE id = ?', [(int) $id]);
    if (!$user || !(int) $user['is_active']) {
        unset($_SESSION['user_id']);
        return $user = null;
    }
    return $user;
}

function refresh_user_cache(): void
{
    // current_user is static; login happens then redirect, so a new request reloads it.
}

function require_login(): array
{
    $user = current_user();
    if (!$user) {
        flash('error', 'برای ادامه وارد حساب کاربری شوید.');
        $_SESSION['after_login'] = request_path();
        redirect('login');
    }
    return $user;
}

function require_role(array $roles): array
{
    $user = require_login();
    if (!in_array($user['role'], $roles, true)) {
        abort_403();
    }
    return $user;
}

function require_staff(): array
{
    return require_role(['manager', 'admin']);
}

function require_manager(): array
{
    return require_role(['manager']);
}

function abort_404(): void
{
    http_response_code(404);
    view('404', ['title' => 'صفحه پیدا نشد', 'robots' => 'noindex']);
    exit;
}

function abort_403(): void
{
    http_response_code(403);
    view('403', ['title' => 'دسترسی ندارید', 'robots' => 'noindex']);
    exit;
}

function render_template(string $name, array $data): string
{
    $file = base_dir() . '/views/' . $name . '.php';
    if (!is_file($file)) {
        throw new RuntimeException('قالب پیدا نشد.');
    }
    extract($data, EXTR_SKIP);
    ob_start();
    include $file;
    return (string) ob_get_clean();
}

function view(string $template, array $data = []): void
{
    $layout = array_key_exists('_layout', $data) ? (string) $data['_layout'] : 'layout';
    unset($data['_layout']);
    if ($layout === '') {
        echo render_template($template, $data);
        clear_old();
        return;
    }
    $content = render_template($template, $data);
    echo render_template($layout, $data + ['content' => $content]);
    clear_old();
}

function app_log(string $message): void
{
    $dir = storage_path('logs');
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    @file_put_contents($dir . '/app.log', date('c') . ' ' . $message . "\n", FILE_APPEND);
}

function handle_exception(Throwable $e): void
{
    app_log($e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine() . "\n" . $e->getTraceAsString());
    http_response_code(500);
    $debug = (bool) config('debug', false);
    echo '<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><title>خطا</title><body style="font-family:tahoma,sans-serif;background:#fdfbf7;color:#3f2d23;text-align:center;padding:48px">';
    echo '<h1>مشکلی در سایت پیش آمد</h1><p>چند لحظه بعد دوباره تلاش کنید. اگر تکرار شد با پشتیبانی هاست یا مدیر سایت تماس بگیرید.</p>';
    if ($debug) {
        echo '<pre style="text-align:left;direction:ltr;white-space:pre-wrap">' . e($e->getMessage()) . '</pre>';
    }
    echo '</body></html>';
    exit;
}

function media_url(?string $path): string
{
    $path = trim((string) $path);
    if ($path === '' || str_contains($path, '..')) {
        return asset('images/logo.png');
    }
    if (preg_match('#^https?://#i', $path)) {
        return $path;
    }
    $rel = ltrim($path, '/');
    if (!is_file(base_dir() . '/' . $rel)) {
        return asset('images/logo.png');
    }
    return asset($rel);
}

function banner_images(): array
{
    $dir = base_dir() . '/images/banners';
    if (!is_dir($dir)) {
        return [];
    }
    $files = array_merge(
        glob($dir . '/*.jpg') ?: [],
        glob($dir . '/*.jpeg') ?: [],
        glob($dir . '/*.png') ?: [],
        glob($dir . '/*.webp') ?: []
    );
    natsort($files);
    $out = [];
    foreach ($files as $file) {
        $out[] = 'images/banners/' . basename($file);
    }
    return $out;
}

function product_effective_price(array $product): int
{
    $price = (int) $product['price'];
    $discount = $product['discount_price'] ?? null;
    if ($discount !== null && $discount !== '' && (int) $discount > 0 && (int) $discount < $price) {
        return (int) $discount;
    }
    return $price;
}

function product_has_discount(array $product): bool
{
    return product_effective_price($product) < (int) $product['price'];
}

function product_discount_percent(array $product): int
{
    $price = (int) $product['price'];
    if ($price <= 0 || !product_has_discount($product)) {
        return 0;
    }
    return (int) round((($price - product_effective_price($product)) / $price) * 100);
}

function product_in_stock(array $product): bool
{
    return (int) ($product['available'] ?? 0) === 1
        && (int) ($product['stock'] ?? 0) > 0
        && (($product['status'] ?? 'published') === 'published');
}

function like_value(string $value): string
{
    $value = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $value);
    return '%' . $value . '%';
}

function store_upload(string $field, string $folder): ?string
{
    if (empty($_FILES[$field]) || (int) ($_FILES[$field]['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }
    $file = $_FILES[$field];
    if ((int) $file['error'] !== UPLOAD_ERR_OK) {
        throw new RuntimeException('آپلود فایل ناموفق بود. حجم را کمتر کنید یا تنظیمات هاست را بررسی کنید.');
    }
    if ((int) $file['size'] > 4 * 1024 * 1024) {
        throw new RuntimeException('حجم تصویر باید کمتر از ۴ مگابایت باشد.');
    }
    if (!is_uploaded_file($file['tmp_name'])) {
        throw new RuntimeException('فایل آپلود معتبر نیست.');
    }
    $mime = 'application/octet-stream';
    if (function_exists('finfo_open')) {
        $fi = finfo_open(FILEINFO_MIME_TYPE);
        if ($fi) {
            $detected = finfo_file($fi, $file['tmp_name']);
            finfo_close($fi);
            if (is_string($detected) && $detected !== '') {
                $mime = $detected;
            }
        }
    }
    $map = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
    if (!isset($map[$mime])) {
        throw new RuntimeException('فقط تصویر JPG، PNG، WEBP یا GIF مجاز است.');
    }
    $name = date('Ymd') . '-' . bin2hex(random_bytes(8)) . '.' . $map[$mime];
    $dir = base_dir() . '/uploads/' . $folder;
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        throw new RuntimeException('پوشه آپلود قابل نوشتن نیست.');
    }
    $dest = $dir . '/' . $name;
    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        throw new RuntimeException('ذخیره تصویر ممکن نشد.');
    }
    resize_image($dest, $mime);
    return 'uploads/' . $folder . '/' . $name;
}

function delete_upload(?string $path): void
{
    $path = (string) $path;
    if ($path === '' || str_contains($path, '..') || !str_starts_with($path, 'uploads/')) {
        return;
    }
    $full = base_dir() . '/' . $path;
    if (is_file($full)) {
        @unlink($full);
    }
}

function resize_image(string $path, string $mime, int $max = 1600): void
{
    if (!function_exists('imagecreatetruecolor')) {
        return;
    }
    $src = false;
    if ($mime === 'image/jpeg' && function_exists('imagecreatefromjpeg')) {
        $src = @imagecreatefromjpeg($path);
    } elseif ($mime === 'image/png' && function_exists('imagecreatefrompng')) {
        $src = @imagecreatefrompng($path);
    } elseif ($mime === 'image/webp' && function_exists('imagecreatefromwebp')) {
        $src = @imagecreatefromwebp($path);
    } elseif ($mime === 'image/gif' && function_exists('imagecreatefromgif')) {
        $src = @imagecreatefromgif($path);
    }
    if (!$src) {
        return;
    }
    $w = imagesx($src);
    $h = imagesy($src);
    if ($w <= 0 || $h <= 0 || ($w <= $max && $h <= $max)) {
        imagedestroy($src);
        return;
    }
    $scale = min($max / $w, $max / $h);
    $nw = max(1, (int) round($w * $scale));
    $nh = max(1, (int) round($h * $scale));
    $dst = imagecreatetruecolor($nw, $nh);
    if (in_array($mime, ['image/png', 'image/gif', 'image/webp'], true)) {
        imagealphablending($dst, false);
        imagesavealpha($dst, true);
        $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
        imagefilledrectangle($dst, 0, 0, $nw, $nh, $transparent);
    }
    imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);
    if ($mime === 'image/jpeg') {
        imagejpeg($dst, $path, 84);
    } elseif ($mime === 'image/png') {
        imagepng($dst, $path, 6);
    } elseif ($mime === 'image/webp' && function_exists('imagewebp')) {
        imagewebp($dst, $path, 84);
    } elseif ($mime === 'image/gif') {
        imagegif($dst, $path);
    }
    imagedestroy($src);
    imagedestroy($dst);
}

function too_many_logins(): bool
{
    $row = login_attempt_row();
    return (int) $row['count'] >= 8 && (int) $row['until'] > time();
}

function login_attempt_row(): array
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $file = storage_path('login-attempts.json');
    $data = [];
    if (is_file($file)) {
        $data = json_decode((string) file_get_contents($file), true) ?: [];
    }
    return $data[$ip] ?? ['count' => 0, 'until' => 0];
}

function register_login_failure(): void
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $file = storage_path('login-attempts.json');
    $fh = fopen($file, 'c+');
    if (!$fh) {
        return;
    }
    flock($fh, LOCK_EX);
    $raw = stream_get_contents($fh) ?: '';
    $data = json_decode($raw, true) ?: [];
    $row = $data[$ip] ?? ['count' => 0, 'until' => 0];
    if ((int) $row['until'] < time()) {
        $row = ['count' => 0, 'until' => time() + 900];
    }
    $row['count'] = (int) $row['count'] + 1;
    $row['until'] = time() + 900;
    $data[$ip] = $row;
    if (count($data) > 300) {
        $data = array_slice($data, -200, null, true);
    }
    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, json_encode($data));
    fflush($fh);
    flock($fh, LOCK_UN);
    fclose($fh);
}

function clear_login_failures(): void
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $file = storage_path('login-attempts.json');
    if (!is_file($file)) {
        return;
    }
    $fh = fopen($file, 'c+');
    if (!$fh) {
        return;
    }
    flock($fh, LOCK_EX);
    $data = json_decode(stream_get_contents($fh) ?: '', true) ?: [];
    unset($data[$ip]);
    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, json_encode($data));
    fflush($fh);
    flock($fh, LOCK_UN);
    fclose($fh);
}

function honeypot_tripped(): bool
{
    return trim((string) ($_POST['website'] ?? '')) !== '';
}

function nav_active(array $paths): string
{
    $cur = request_path();
    foreach ($paths as $path) {
        if ($path === $cur) {
            return 'is-active';
        }
        if (str_ends_with($path, '*') && str_starts_with($cur, rtrim($path, '*'))) {
            return 'is-active';
        }
    }
    return '';
}

function cart_count(): int
{
    $n = 0;
    foreach (($_SESSION['cart'] ?? []) as $qty) {
        $n += (int) $qty;
    }
    return $n;
}

function wholesale_count(): int
{
    return count($_SESSION['wholesale'] ?? []);
}

function online_payment_ready(): bool
{
    if (setting('pay_online', '0') !== '1') {
        return false;
    }
    $merchant = trim(setting('zarinpal_merchant', ''));
    if ($merchant !== '') {
        return true;
    }
    return setting('zarinpal_sandbox', '1') === '1';
}

function enabled_payment_methods(): array
{
    $methods = [];
    if (online_payment_ready()) {
        $methods['online'] = 'پرداخت آنلاین زرین‌پال';
    }
    if (setting('pay_card', '1') === '1' && trim(setting('card_number', '')) !== '') {
        $methods['card'] = 'کارت به کارت';
    }
    if (setting('pay_cod', '1') === '1') {
        $methods['cod'] = 'پرداخت در محل';
    }
    return $methods;
}

function wholesale_is_open(): bool
{
    if (setting('wholesale_open', '1') === '1') {
        return true;
    }
    $user = current_user();
    return $user && (int) $user['is_wholesale_approved'] === 1;
}

function detected_site_url(): string
{
    $https = request_is_https();
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    return ($https ? 'https' : 'http') . '://' . $host . base_path();
}

function paginate_links(int $page, int $pages, array $query, string $path): string
{
    if ($pages <= 1) {
        return '';
    }
    $html = '<nav class="pager" aria-label="صفحه‌بندی">';
    $start = max(1, $page - 2);
    $end = min($pages, $page + 2);
    if ($page > 1) {
        $query['page'] = $page - 1;
        $html .= '<a href="' . e(url($path, $query)) . '">قبلی</a>';
    }
    for ($i = $start; $i <= $end; $i++) {
        $query['page'] = $i;
        $html .= '<a class="' . ($i === $page ? 'is-active' : '') . '" href="' . e(url($path, $query)) . '">' . $i . '</a>';
    }
    if ($page < $pages) {
        $query['page'] = $page + 1;
        $html .= '<a href="' . e(url($path, $query)) . '">بعدی</a>';
    }
    $html .= '</nav>';
    return $html;
}
