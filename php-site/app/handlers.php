<?php

require __DIR__ . '/handlers_admin.php';

function back_field(): string
{
    $qs = $_GET;
    unset($qs['r']);
    $target = request_path();
    if ($qs) {
        $target .= '?' . http_build_query($qs);
    }
    return '<input type="hidden" name="back" value="' . e($target) . '">';
}

function dispatch(): void
{
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $path = request_path();

    if ($method === 'POST' && $_POST === [] && $_FILES === [] && (int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) {
        flash('error', 'حجم اطلاعات ارسالی بیشتر از حد مجاز سرور است.');
        redirect($path === '/install' ? 'install' : '');
    }

    if ($path === '/install') {
        if ($method === 'POST') {
            verify_csrf();
        }
        handle_install($method);
        return;
    }
    if (!is_installed()) {
        redirect('install');
    }
    if ($method === 'POST') {
        verify_csrf();
    }

    $routes = [
        'GET' => [
            '/' => 'handle_home',
            '/shop' => 'handle_shop',
            '/cart' => 'handle_cart',
            '/checkout' => 'handle_checkout',
            '/wholesale' => 'handle_wholesale',
            '/about' => 'handle_about',
            '/contact' => 'handle_contact',
            '/track' => 'handle_track',
            '/login' => 'handle_login',
            '/register' => 'handle_register',
            '/account' => 'handle_account',
            '/orders' => 'handle_orders',
            '/payment/callback' => 'handle_payment_callback',
            '/sitemap.xml' => 'handle_sitemap',
            '/robots.txt' => 'handle_robots',
            '/visitor' => 'handle_visitor',
            '/admin' => 'handle_admin_home',
            '/admin/products' => 'handle_admin_products',
            '/admin/product' => 'handle_admin_product_form',
            '/admin/categories' => 'handle_admin_categories',
            '/admin/brands' => 'handle_admin_brands',
            '/admin/orders' => 'handle_admin_orders',
            '/admin/order' => 'handle_admin_order',
            '/admin/orders/export' => 'handle_admin_orders_export',
            '/admin/wholesale' => 'handle_admin_wholesale',
            '/admin/users' => 'handle_admin_users',
            '/admin/messages' => 'handle_admin_messages',
            '/admin/settings' => 'handle_admin_settings',
            '/admin/commissions' => 'handle_admin_commissions',
        ],
        'POST' => [
            '/cart/add' => 'handle_cart_add',
            '/cart/update' => 'handle_cart_update',
            '/cart/remove' => 'handle_cart_remove',
            '/cart/clear' => 'handle_cart_clear',
            '/checkout' => 'handle_checkout_post',
            '/wholesale/add' => 'handle_wholesale_add',
            '/wholesale/update' => 'handle_wholesale_update',
            '/wholesale/remove' => 'handle_wholesale_remove',
            '/wholesale/clear' => 'handle_wholesale_clear',
            '/wholesale/submit' => 'handle_wholesale_submit',
            '/contact' => 'handle_contact_post',
            '/track' => 'handle_track_post',
            '/login' => 'handle_login_post',
            '/register' => 'handle_register_post',
            '/logout' => 'handle_logout',
            '/account' => 'handle_account_post',
            '/order/receipt' => 'handle_receipt',
            '/visitor/customer' => 'handle_visitor_customer',
            '/visitor/draft' => 'handle_visitor_draft',
            '/visitor/order' => 'handle_visitor_order',
            '/admin/product' => 'handle_admin_product_save',
            '/admin/product/delete' => 'handle_admin_product_delete',
            '/admin/categories' => 'handle_admin_category_save',
            '/admin/brands' => 'handle_admin_brand_save',
            '/admin/order/status' => 'handle_admin_order_status',
            '/admin/wholesale/status' => 'handle_admin_wholesale_status',
            '/admin/user' => 'handle_admin_user_save',
            '/admin/message' => 'handle_admin_message',
            '/admin/settings' => 'handle_admin_settings_save',
            '/admin/commissions' => 'handle_admin_commission_pay',
        ],
    ];

    if (isset($routes[$method][$path])) {
        $routes[$method][$path]();
        return;
    }
    if ($method === 'GET' && preg_match('#^/product/([^/]+)$#u', $path, $m)) {
        handle_product($m[1]);
        return;
    }
    if ($method === 'GET' && preg_match('#^/order/([A-Za-z0-9\-]+)(/invoice)?$#', $path, $m)) {
        handle_order_show($m[1], ($m[2] ?? '') === '/invoice');
        return;
    }
    abort_404();
}

function handle_install(string $method): void
{
    if (is_installed()) {
        redirect('');
    }
    $errors = [];
    $missing = [];
    foreach (['pdo', 'mbstring', 'json'] as $ext) {
        if (!extension_loaded($ext)) {
            $missing[] = $ext;
        }
    }
    $writableProblems = [];
    foreach ([storage_path(), storage_path('sessions'), storage_path('logs'), base_dir() . '/uploads'] as $dir) {
        if (!is_dir($dir) || !is_writable($dir)) {
            $writableProblems[] = $dir;
        }
    }

    if ($method === 'POST' && !$missing && !$writableProblems) {
        $driver = (($_POST['driver'] ?? 'mysql') === 'sqlite') ? 'sqlite' : 'mysql';
        if ($driver === 'sqlite' && !extension_loaded('pdo_sqlite')) {
            $errors[] = 'افزونه pdo_sqlite فعال نیست. برای هاست اشتراکی MySQL را انتخاب کنید.';
        }
        if ($driver === 'mysql' && !extension_loaded('pdo_mysql')) {
            $errors[] = 'افزونه pdo_mysql فعال نیست. از پشتیبانی هاست بخواهید آن را روشن کند.';
        }
        $name = trim((string) ($_POST['admin_name'] ?? ''));
        $phone = normalize_phone((string) ($_POST['admin_phone'] ?? ''));
        $password = (string) ($_POST['admin_password'] ?? '');
        $password2 = (string) ($_POST['admin_password_confirm'] ?? '');
        if (mb_strlen($name) < 2) {
            $errors[] = 'نام مدیر را وارد کنید.';
        }
        if (!is_phone($phone)) {
            $errors[] = 'شماره مدیر باید ۱۱ رقم و با صفر باشد. مثال: 09120000000';
        }
        if (strlen($password) < 8) {
            $errors[] = 'رمز مدیر حداقل ۸ کاراکتر باشد.';
        }
        if (!hash_equals($password, $password2)) {
            $errors[] = 'تکرار رمز عبور یکسان نیست.';
        }
        $siteUrl = trim((string) ($_POST['site_url'] ?? ''));
        if ($siteUrl === '') {
            $siteUrl = detected_site_url();
        }
        if (!preg_match('#^https?://#i', $siteUrl)) {
            $errors[] = 'آدرس سایت باید با http:// یا https:// شروع شود.';
        }
        $cfg = [
            'installed' => true,
            'driver' => $driver,
            'db_host' => trim((string) ($_POST['db_host'] ?? 'localhost')) ?: 'localhost',
            'db_port' => trim((string) ($_POST['db_port'] ?? '3306')) ?: '3306',
            'db_name' => trim((string) ($_POST['db_name'] ?? '')),
            'db_user' => trim((string) ($_POST['db_user'] ?? '')),
            'db_pass' => (string) ($_POST['db_pass'] ?? ''),
            'sqlite_path' => storage_path('database.sqlite'),
            'pretty_urls' => true,
            'debug' => false,
        ];
        if ($driver === 'mysql' && ($cfg['db_name'] === '' || $cfg['db_user'] === '')) {
            $errors[] = 'نام دیتابیس و نام کاربری MySQL را وارد کنید.';
        }
        if (!$errors) {
            try {
                $pdo = connect_pdo($cfg);
                migrate($pdo, $driver);
                seed_catalog($pdo);
                ensure_settings($pdo, $driver, rtrim($siteUrl, '/'));
                $adminId = install_admin($pdo, $name, $phone, $password);
                write_config($cfg);
                session_regenerate_id(true);
                $_SESSION['user_id'] = $adminId;
                view('install_done', [
                    'title' => 'نصب انجام شد',
                    'robots' => 'noindex',
                    'admin_phone' => $phone,
                    'fallback' => base_path() . '/index.php?r=admin',
                ]);
                return;
            } catch (Throwable $e) {
                app_log('install: ' . $e->getMessage());
                $detail = $e instanceof PDOException
                    ? 'اتصال به دیتابیس یا ساخت جدول‌ها ناموفق بود. نام دیتابیس، کاربر، رمز و هاست را بررسی کنید. اگر localhost کار نکرد، 127.0.0.1 را امتحان کنید.'
                    : $e->getMessage();
                if ($e instanceof PDOException) {
                    $detail .= ' جزئیات فنی: ' . $e->getMessage();
                }
                $errors[] = $detail;
            }
        }
    }

    if ($method === 'POST' && $errors) {
        remember_input();
    }
    view('install', [
        '_layout' => '',
        'title' => 'نصب پخش نوین',
        'errors' => $errors,
        'missing' => $missing,
        'writable_problems' => $writableProblems,
        'site_url' => detected_site_url(),
    ]);
}

function install_admin(PDO $pdo, string $name, string $phone, string $password): int
{
    $st = $pdo->prepare('SELECT id FROM users WHERE phone = ?');
    $st->execute([$phone]);
    $existing = $st->fetch();
    if ($existing) {
        $upd = $pdo->prepare('UPDATE users SET name = ?, password_hash = ?, role = ?, is_active = 1, is_wholesale_approved = 1, updated_at = ? WHERE id = ?');
        $upd->execute([$name, password_hash($password, PASSWORD_DEFAULT), 'manager', now(), (int) $existing['id']]);
        return (int) $existing['id'];
    }
    return create_user($pdo, [
        'name' => $name,
        'phone' => $phone,
        'password' => $password,
        'role' => 'manager',
        'is_active' => 1,
        'is_wholesale_approved' => 1,
        'customer_type' => 'both',
    ]);
}

function handle_home(): void
{
    view('home', [
        'title' => setting('site_name'),
        'is_home' => true,
        'description' => setting('site_slogan'),
        'banners' => banner_images(),
        'brands' => all_rows('SELECT * FROM brands WHERE is_active = 1 AND is_featured = 1 ORDER BY sort_order, name'),
        'categories' => all_rows('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order, name'),
        'featured' => all_rows(product_select_sql() . " WHERE p.status = 'published' AND p.is_featured = 1 ORDER BY p.sort_order, p.id DESC LIMIT 8"),
    ]);
}

function handle_shop(): void
{
    $filters = shop_filters_from_request();
    $count = (int) shop_query($filters, true)['count'];
    $pages = max(1, (int) ceil($count / 12));
    if ($filters['page'] > $pages) {
        $filters['page'] = $pages;
    }
    $result = shop_query($filters);
    $activeCategory = $filters['category'] !== '' ? one('SELECT * FROM categories WHERE slug = ?', [$filters['category']]) : null;
    view('shop', [
        'title' => $activeCategory['name'] ?? 'فروشگاه',
        'description' => 'خرید سوسیس، کالباس و فرآورده‌های غذایی از پخش نوین',
        'filters' => $filters,
        'products' => $result['rows'],
        'count' => $count,
        'pages' => $pages,
        'categories' => all_rows('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order, name'),
        'brands' => all_rows('SELECT * FROM brands WHERE is_active = 1 ORDER BY sort_order, name'),
        'active_category' => $activeCategory,
    ]);
}

function handle_product(string $slug): void
{
    $product = find_product_by_slug($slug);
    if (!$product || ($product['status'] ?? '') !== 'published') {
        abort_404();
    }
    $product = attach_options([$product])[0];
    $related = all_rows(product_select_sql() . ' WHERE p.status = ? AND p.category_id = ? AND p.id <> ? ORDER BY p.is_featured DESC, p.id DESC LIMIT 4', ['published', (int) $product['category_id'], (int) $product['id']]);
    view('product', [
        'title' => $product['name'],
        'description' => mb_substr(trim(preg_replace('/\s+/u', ' ', (string) $product['description']) ?? $product['name']), 0, 160),
        'product' => $product,
        'related' => $related,
        'og_image' => media_url($product['image']),
    ]);
}

function handle_cart_add(): void
{
    cart_add((int) ($_POST['product_id'] ?? 0), qty_input($_POST['qty'] ?? 1));
    flash('success', 'به سبد خرید اضافه شد.');
    redirect_back('cart');
}

function handle_cart_update(): void
{
    $qty = $_POST['qty'] ?? [];
    if (!is_array($qty)) {
        $qty = [];
    }
    foreach ($qty as $id => $value) {
        cart_set((int) $id, (int) digits_to_en((string) $value));
    }
    flash('success', 'سبد خرید به‌روز شد.');
    redirect('cart');
}

function handle_cart_remove(): void
{
    unset($_SESSION['cart'][(int) ($_POST['product_id'] ?? 0)]);
    redirect_back('cart');
}

function handle_cart_clear(): void
{
    $_SESSION['cart'] = [];
    redirect('cart');
}

function handle_cart(): void
{
    view('cart', [
        'title' => 'سبد خرید',
        'robots' => 'noindex',
        'items' => cart_resolved(),
    ]);
}

function handle_checkout(): void
{
    $items = cart_resolved();
    if (!$items) {
        flash('error', 'سبد خرید خالی است.');
        redirect('shop');
    }
    $user = current_user();
    view('checkout', [
        'title' => 'تکمیل خرید',
        'robots' => 'noindex',
        'items' => $items,
        'methods' => enabled_payment_methods(),
        'user' => $user,
    ]);
}

function handle_checkout_post(): void
{
    $items = cart_resolved();
    if (!$items) {
        throw new RuntimeException('سبد خرید خالی است.');
    }
    foreach ($items as $item) {
        if (empty($item['in_stock'])) {
            throw new RuntimeException('موجودی «' . $item['name'] . '» کافی نیست.');
        }
    }
    $customer = customer_from_post(true);
    $method = (string) ($_POST['payment_method'] ?? '');
    $methods = enabled_payment_methods();
    if (!isset($methods[$method])) {
        throw new RuntimeException('روش پرداخت را انتخاب کنید.');
    }
    if ($method === 'online') {
        start_online_payment($customer, $items);
    }
    $order = create_order(db(), [
        'items' => $items,
        'name' => $customer['name'],
        'phone' => $customer['phone'],
        'address' => $customer['address'],
        'message' => $customer['message'],
        'user_id' => $customer['user_id'],
        'order_status' => 'PENDING',
        'payment_method' => $method,
        'payment_status' => $method === 'card' ? 'PENDING' : 'UNPAID',
    ]);
    $_SESSION['cart'] = [];
    remember_order($order['order_number']);
    flash('success', 'سفارش شما ثبت شد. شماره سفارش را نگه دارید.');
    redirect('order/' . $order['order_number'], ['t' => $order['public_token']]);
}

function handle_payment_callback(): void
{
    $authority = trim((string) ($_GET['Authority'] ?? ''));
    $status = (string) ($_GET['Status'] ?? '');
    if ($authority === '') {
        flash('error', 'بازگشت از درگاه نامعتبر بود.');
        redirect('checkout');
    }
    $payment = one('SELECT * FROM payments WHERE authority = ?', [$authority]);
    if (!$payment) {
        flash('error', 'پرداخت پیدا نشد. اگر پول از حساب کم شده با فروشگاه تماس بگیرید.');
        redirect('checkout');
    }
    if ($payment['status'] === 'SUCCESS' && !empty($payment['order_id'])) {
        redirect_paid_order((int) $payment['order_id']);
    }
    if ($status !== 'OK') {
        fail_online_payment($payment, 'پرداخت لغو شد یا توسط بانک تایید نشد.');
    }
    try {
        $verify = zarinpal_verify((int) $payment['amount'], $authority);
    } catch (Throwable $e) {
        app_log('verify: ' . $e->getMessage());
        flash('error', 'تایید پرداخت فعلاً ممکن نشد. اگر مبلغ کم شده، شماره پیگیری را به فروشگاه بدهید و دوباره این صفحه را باز نکنید تا موجودی دو بار کم نشود. کد Authority: ' . $authority);
        redirect('checkout');
    }
    if (empty($verify['ok'])) {
        fail_online_payment($payment, $verify['message'] ?? 'تایید پرداخت ناموفق بود.');
    }

    $pdo = db();
    $pdo->beginTransaction();
    try {
        $lock = $pdo->prepare("UPDATE payments SET status = 'PROCESSING', updated_at = ? WHERE id = ? AND status = 'PENDING'");
        $lock->execute([now(), (int) $payment['id']]);
        if ($lock->rowCount() < 1) {
            $fresh = $pdo->prepare('SELECT * FROM payments WHERE id = ?');
            $fresh->execute([(int) $payment['id']]);
            $payment = $fresh->fetch() ?: $payment;
            $pdo->commit();
            if (!empty($payment['order_id'])) {
                redirect_paid_order((int) $payment['order_id']);
            }
            flash('error', 'وضعیت پرداخت نامشخص است. با فروشگاه تماس بگیرید.');
            redirect('checkout');
        }
        $payload = json_decode((string) $payment['payload'], true) ?: [];
        $customer = $payload['customer'] ?? [];
        $order = create_order($pdo, [
            'items' => $payload['items'] ?? [],
            'stock_already_adjusted' => true,
            'name' => $customer['name'] ?? 'مشتری',
            'phone' => $customer['phone'] ?? '',
            'address' => $customer['address'] ?? '',
            'message' => $customer['message'] ?? '',
            'user_id' => $customer['user_id'] ?? $payment['user_id'],
            'order_status' => 'PAID_PENDING_REVIEW',
            'payment_method' => 'online',
            'payment_status' => 'PAID',
            'transaction_id' => $verify['ref_id'] ?? '',
        ]);
        $upd = $pdo->prepare("UPDATE payments SET status = 'SUCCESS', transaction_id = ?, order_id = ?, stock_held = 0, updated_at = ? WHERE id = ?");
        $upd->execute([$verify['ref_id'] ?? '', $order['id'], now(), (int) $payment['id']]);
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        app_log('callback create: ' . $e->getMessage());
        flash('error', 'پرداخت تایید شد اما ثبت سفارش کامل نشد. این کد را به فروشگاه بدهید: ' . ($verify['ref_id'] ?? $authority));
        redirect('checkout');
    }
    $_SESSION['cart'] = [];
    remember_order($order['order_number']);
    flash('success', 'پرداخت با موفقیت انجام شد.');
    redirect('order/' . $order['order_number'], ['t' => $order['public_token']]);
}

function redirect_paid_order(int $orderId): void
{
    $order = one('SELECT order_number, public_token FROM orders WHERE id = ?', [$orderId]);
    if (!$order) {
        flash('error', 'سفارش پرداخت‌شده پیدا نشد.');
        redirect('track');
    }
    remember_order($order['order_number']);
    redirect('order/' . $order['order_number'], ['t' => $order['public_token']]);
}

function fail_online_payment(array $payment, string $message): void
{
    try {
        release_payment_stock($payment);
    } catch (Throwable $e) {
        app_log('release stock: ' . $e->getMessage());
    }
    q("UPDATE payments SET status = 'FAILED', updated_at = ? WHERE id = ? AND status = 'PENDING'", [now(), (int) $payment['id']]);
    flash('error', $message);
    redirect('checkout');
}

function handle_wholesale(): void
{
    $products = attach_options(all_rows(product_select_sql() . " WHERE p.status = 'published' AND p.available = 1 ORDER BY p.sort_order, p.name"));
    $q = trim((string) ($_GET['q'] ?? ''));
    if ($q !== '') {
        $products = array_values(array_filter($products, function ($product) use ($q) {
            $hay = mb_strtolower($product['name'] . ' ' . ($product['brand_name'] ?? '') . ' ' . ($product['category_name'] ?? ''));
            return str_contains($hay, mb_strtolower($q));
        }));
    }
    $user = current_user();
    view('wholesale', [
        'title' => 'سفارش عمده',
        'description' => 'ثبت درخواست خرید عمده از پخش نوین',
        'products' => $products,
        'items' => wholesale_resolved(),
        'q' => $q,
        'open' => wholesale_is_open(),
        'user' => $user,
    ]);
}

function handle_wholesale_add(): void
{
    wholesale_add((int) ($_POST['product_id'] ?? 0), (int) ($_POST['option_id'] ?? 0), qty_input($_POST['qty'] ?? 10, 1, 9999));
    flash('success', 'به لیست عمده اضافه شد.');
    redirect_back('wholesale');
}

function handle_wholesale_update(): void
{
    $qty = $_POST['qty'] ?? [];
    if (!is_array($qty)) {
        redirect('wholesale');
    }
    foreach ($qty as $key => $value) {
        if (!isset($_SESSION['wholesale'][$key])) {
            continue;
        }
        $n = (int) digits_to_en((string) $value);
        if ($n <= 0) {
            unset($_SESSION['wholesale'][$key]);
        } else {
            $_SESSION['wholesale'][$key]['qty'] = min(9999, $n);
        }
    }
    redirect('wholesale');
}

function handle_wholesale_remove(): void
{
    $key = (string) ($_POST['key'] ?? '');
    unset($_SESSION['wholesale'][$key]);
    redirect('wholesale');
}

function handle_wholesale_clear(): void
{
    $_SESSION['wholesale'] = [];
    redirect('wholesale');
}

function handle_wholesale_submit(): void
{
    if (!wholesale_is_open()) {
        throw new RuntimeException('ثبت سفارش عمده برای حساب شما فعال نیست.');
    }
    $items = wholesale_resolved();
    if (!$items) {
        throw new RuntimeException('لیست عمده خالی است.');
    }
    $company = trim((string) ($_POST['company_name'] ?? ''));
    $contact = trim((string) ($_POST['contact_person'] ?? ''));
    $phone = normalize_phone((string) ($_POST['phone'] ?? ''));
    $address = trim((string) ($_POST['address'] ?? ''));
    $description = trim((string) ($_POST['description'] ?? ''));
    if (mb_strlen($company) < 2 || mb_strlen($contact) < 2) {
        throw new RuntimeException('نام فروشگاه و نام رابط را وارد کنید.');
    }
    if (!is_phone($phone)) {
        throw new RuntimeException('شماره تماس معتبر نیست.');
    }
    $user = current_user();
    $request = create_wholesale_request(db(), [
        'items' => $items,
        'company_name' => $company,
        'contact_person' => $contact,
        'phone' => $phone,
        'address' => $address,
        'description' => $description,
        'user_id' => $user['id'] ?? null,
    ]);
    $_SESSION['wholesale'] = [];
    $_SESSION['track_hit'] = ['type' => 'wholesale', 'id' => $request['id']];
    flash('success', 'درخواست عمده ثبت شد. شماره پیگیری: ' . $request['request_number']);
    redirect('track');
}

function handle_about(): void
{
    view('about', [
        'title' => 'درباره ما',
        'description' => 'درباره پخش سوسیس و کالباس نوین، سابقه توزیع و برندهای همکار',
        'brands' => all_rows('SELECT * FROM brands WHERE is_active = 1 ORDER BY is_featured DESC, sort_order, name'),
    ]);
}

function handle_contact(): void
{
    view('contact', [
        'title' => 'تماس با ما',
        'description' => 'آدرس، تلفن و فرم تماس پخش نوین در کرج',
    ]);
}

function handle_contact_post(): void
{
    if (honeypot_tripped()) {
        flash('success', 'پیام شما ثبت شد.');
        redirect('contact');
    }
    $name = trim((string) ($_POST['name'] ?? ''));
    $phone = normalize_phone((string) ($_POST['phone'] ?? ''));
    $subject = trim((string) ($_POST['subject'] ?? 'تماس با فروشگاه'));
    $body = trim((string) ($_POST['body'] ?? ''));
    if (mb_strlen($name) < 2 || mb_strlen($body) < 5) {
        throw new RuntimeException('نام و متن پیام را وارد کنید.');
    }
    if ($phone !== '' && !is_phone($phone)) {
        throw new RuntimeException('شماره تماس معتبر نیست.');
    }
    q('INSERT INTO messages (name, phone, subject, body, is_read, created_at) VALUES (?, ?, ?, ?, 0, ?)', [
        mb_substr($name, 0, 150),
        $phone,
        mb_substr($subject, 0, 160),
        mb_substr($body, 0, 4000),
        now(),
    ]);
    flash('success', 'پیام شما ثبت شد. به‌زودی پاسخ می‌دهیم.');
    redirect('contact');
}

function handle_track(): void
{
    $hit = $_SESSION['track_hit'] ?? null;
    $result = null;
    $items = [];
    $kind = '';
    if (is_array($hit) && !empty($hit['id'])) {
        if (($hit['type'] ?? '') === 'wholesale') {
            $result = one('SELECT * FROM wholesale_requests WHERE id = ?', [(int) $hit['id']]);
            $items = $result ? all_rows('SELECT * FROM wholesale_items WHERE request_id = ?', [(int) $result['id']]) : [];
            $kind = 'wholesale';
        } else {
            $result = one('SELECT * FROM orders WHERE id = ?', [(int) $hit['id']]);
            $items = $result ? all_rows('SELECT * FROM order_items WHERE order_id = ?', [(int) $result['id']]) : [];
            $kind = 'order';
        }
    }
    view('track', [
        'title' => 'پیگیری سفارش',
        'robots' => 'noindex',
        'result' => $result,
        'items' => $items,
        'kind' => $kind,
    ]);
}

function handle_track_post(): void
{
    $number = strtoupper(trim(digits_to_en((string) ($_POST['order_number'] ?? ''))));
    $phone = normalize_phone((string) ($_POST['phone'] ?? ''));
    if ($number === '' || !is_phone($phone)) {
        throw new RuntimeException('شماره سفارش و شماره تماسی که با آن ثبت شده را وارد کنید.');
    }
    if (str_starts_with($number, 'WHS')) {
        $row = one('SELECT id FROM wholesale_requests WHERE request_number = ? AND phone = ?', [$number, $phone]);
        $type = 'wholesale';
    } else {
        $row = one('SELECT id FROM orders WHERE order_number = ? AND phone = ?', [$number, $phone]);
        $type = 'order';
    }
    if (!$row) {
        throw new RuntimeException('سفارشی با این شماره و تلفن پیدا نشد.');
    }
    $_SESSION['track_hit'] = ['type' => $type, 'id' => (int) $row['id']];
    redirect('track');
}

function handle_login(): void
{
    if (current_user()) {
        redirect_for_role(current_user());
    }
    view('auth', ['title' => 'ورود', 'mode' => 'login', 'robots' => 'noindex']);
}

function handle_login_post(): void
{
    if (honeypot_tripped()) {
        flash('error', 'ورود انجام نشد.');
        redirect('login');
    }
    if (too_many_logins()) {
        throw new RuntimeException('تلاش‌های ورود زیاد بوده است. ۱۵ دقیقه بعد دوباره تلاش کنید.');
    }
    $phone = normalize_phone((string) ($_POST['phone'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');
    $user = one('SELECT * FROM users WHERE phone = ?', [$phone]);
    $hash = $user['password_hash'] ?? '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
    $ok = password_verify($password, $hash);
    if (!$user || !$ok) {
        register_login_failure();
        throw new RuntimeException('شماره یا رمز عبور نادرست است.');
    }
    if (!(int) $user['is_active']) {
        throw new RuntimeException('حساب کاربری غیرفعال است. با فروشگاه تماس بگیرید.');
    }
    clear_login_failures();
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['id'];
    $next = (string) ($_SESSION['after_login'] ?? '');
    unset($_SESSION['after_login']);
    if ($next !== '' && !str_contains($next, 'login') && !str_contains($next, 'register')) {
        header('Location: ' . safe_location($next, ''));
        exit;
    }
    redirect_for_role($user);
}

function handle_register(): void
{
    if (current_user()) {
        redirect('account');
    }
    view('auth', ['title' => 'ثبت‌نام', 'mode' => 'register', 'robots' => 'noindex']);
}

function handle_register_post(): void
{
    if (honeypot_tripped()) {
        flash('success', 'ثبت‌نام انجام شد.');
        redirect('login');
    }
    $password = (string) ($_POST['password'] ?? '');
    if (!hash_equals($password, (string) ($_POST['password_confirm'] ?? ''))) {
        throw new RuntimeException('تکرار رمز عبور یکسان نیست.');
    }
    $id = create_user(db(), [
        'name' => $_POST['name'] ?? '',
        'phone' => $_POST['phone'] ?? '',
        'password' => $password,
        'address' => $_POST['address'] ?? '',
        'role' => 'customer',
        'is_active' => 1,
        'customer_type' => 'retail',
    ]);
    session_regenerate_id(true);
    $_SESSION['user_id'] = $id;
    flash('success', 'حساب شما ساخته شد.');
    redirect('account');
}

function handle_logout(): void
{
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'] ?? '', (bool) $p['secure'], true);
    }
    session_destroy();
    redirect('');
}

function redirect_for_role(array $user): void
{
    if (in_array($user['role'], ['manager', 'admin'], true)) {
        redirect('admin');
    }
    if ($user['role'] === 'visitor') {
        redirect('visitor');
    }
    redirect('account');
}

function handle_account(): void
{
    $user = require_login();
    view('account', ['title' => 'حساب کاربری', 'robots' => 'noindex', 'account' => $user]);
}

function handle_account_post(): void
{
    $user = require_login();
    $name = trim((string) ($_POST['name'] ?? ''));
    $phone = normalize_phone((string) ($_POST['phone'] ?? ''));
    $address = trim((string) ($_POST['address'] ?? ''));
    $city = trim((string) ($_POST['city'] ?? ''));
    $postal = trim((string) ($_POST['postal_code'] ?? ''));
    if (mb_strlen($name) < 2 || !is_phone($phone)) {
        throw new RuntimeException('نام و شماره تماس معتبر وارد کنید.');
    }
    $dup = one('SELECT id FROM users WHERE phone = ? AND id <> ?', [$phone, (int) $user['id']]);
    if ($dup) {
        throw new RuntimeException('این شماره برای حساب دیگری ثبت شده است.');
    }
    $password = (string) ($_POST['password'] ?? '');
    if ($password !== '') {
        if (strlen($password) < 6 || !hash_equals($password, (string) ($_POST['password_confirm'] ?? ''))) {
            throw new RuntimeException('رمز جدید حداقل ۶ کاراکتر و با تکرارش یکسان باشد.');
        }
        q('UPDATE users SET name = ?, phone = ?, address = ?, city = ?, postal_code = ?, password_hash = ?, updated_at = ? WHERE id = ?', [
            $name, $phone, $address, $city, $postal, password_hash($password, PASSWORD_DEFAULT), now(), (int) $user['id'],
        ]);
    } else {
        q('UPDATE users SET name = ?, phone = ?, address = ?, city = ?, postal_code = ?, updated_at = ? WHERE id = ?', [
            $name, $phone, $address, $city, $postal, now(), (int) $user['id'],
        ]);
    }
    flash('success', 'اطلاعات حساب ذخیره شد.');
    redirect('account');
}

function handle_orders(): void
{
    $user = require_login();
    view('orders', [
        'title' => 'سفارش‌های من',
        'robots' => 'noindex',
        'orders' => all_rows('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC', [(int) $user['id']]),
        'requests' => all_rows('SELECT * FROM wholesale_requests WHERE user_id = ? ORDER BY id DESC', [(int) $user['id']]),
    ]);
}

function handle_order_show(string $number, bool $invoice): void
{
    $order = one('SELECT * FROM orders WHERE order_number = ?', [$number]);
    if (!$order || !can_view_order($order)) {
        abort_404();
    }
    view('order', [
        'title' => $invoice ? 'فاکتور ' . $order['order_number'] : 'سفارش ' . $order['order_number'],
        'robots' => 'noindex',
        'order' => $order,
        'items' => all_rows('SELECT * FROM order_items WHERE order_id = ?', [(int) $order['id']]),
        'invoice' => $invoice,
        '_layout' => $invoice ? 'print' : 'layout',
    ]);
}

function handle_receipt(): void
{
    $number = strtoupper(trim((string) ($_POST['order_number'] ?? '')));
    $order = one('SELECT * FROM orders WHERE order_number = ?', [$number]);
    if (!$order || !can_view_order($order)) {
        throw new RuntimeException('دسترسی به این سفارش ندارید.');
    }
    if ($order['payment_method'] !== 'card') {
        throw new RuntimeException('این سفارش کارت‌به‌کارت نیست.');
    }
    $path = store_upload('receipt', 'receipts');
    if (!$path) {
        throw new RuntimeException('تصویر رسید را انتخاب کنید.');
    }
    if ($order['receipt_path']) {
        delete_upload($order['receipt_path']);
    }
    q('UPDATE orders SET receipt_path = ?, payment_status = ?, updated_at = ? WHERE id = ?', [$path, 'PENDING', now(), (int) $order['id']]);
    flash('success', 'رسید پرداخت ارسال شد. بعد از بررسی، وضعیت سفارش به‌روز می‌شود.');
    redirect('order/' . $order['order_number'], ['t' => $order['public_token']]);
}

function handle_sitemap(): void
{
    $urls = [absolute_url(''), absolute_url('shop'), absolute_url('about'), absolute_url('contact'), absolute_url('wholesale'), absolute_url('track')];
    foreach (all_rows("SELECT slug FROM products WHERE status = 'published'") as $row) {
        $urls[] = absolute_url('product/' . $row['slug']);
    }
    header('Content-Type: application/xml; charset=UTF-8');
    echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
    echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
    foreach ($urls as $url) {
        echo '  <url><loc>' . e($url) . '</loc></url>' . "\n";
    }
    echo '</urlset>';
    exit;
}

function handle_robots(): void
{
    header('Content-Type: text/plain; charset=UTF-8');
    echo "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /account\nDisallow: /cart\nDisallow: /checkout\nDisallow: /install\nSitemap: " . absolute_url('sitemap.xml') . "\n";
    exit;
}

function handle_visitor(): void
{
    $user = require_role(['visitor', 'manager', 'admin']);
    $customers = $user['role'] === 'visitor'
        ? all_rows('SELECT * FROM users WHERE role = ? AND created_by = ? ORDER BY id DESC', ['customer', (int) $user['id']])
        : all_rows("SELECT * FROM users WHERE role = 'customer' ORDER BY id DESC LIMIT 100");
    $orders = $user['role'] === 'visitor'
        ? all_rows('SELECT * FROM orders WHERE visitor_id = ? ORDER BY id DESC LIMIT 30', [(int) $user['id']])
        : all_rows('SELECT * FROM orders WHERE visitor_id IS NOT NULL ORDER BY id DESC LIMIT 30');
    $percent = (float) setting('commission_percent', '2');
    $base = 0;
    foreach ($orders as $order) {
        if (!in_array($order['order_status'], ['CANCELLED', 'PENDING'], true)) {
            $base += (int) $order['total_amount'];
        }
    }
    view('visitor', [
        'title' => 'پنل ویزیتور',
        'robots' => 'noindex',
        '_layout' => 'admin/layout',
        'panel' => 'visitor',
        'customers' => $customers,
        'orders' => $orders,
        'draft' => visitor_draft_items(),
        'products' => all_rows(product_select_sql() . " WHERE p.status = 'published' AND p.available = 1 AND p.stock > 0 ORDER BY p.name"),
        'commission' => (int) round($base * $percent / 100),
        'percent' => $percent,
    ]);
}

function visitor_draft_items(): array
{
    $draft = $_SESSION['visitor_draft'] ?? [];
    if (!$draft) {
        return [];
    }
    $products = products_by_ids(array_keys($draft));
    $items = [];
    foreach ($draft as $id => $qty) {
        $product = $products[(int) $id] ?? null;
        if (!$product) {
            continue;
        }
        $items[] = [
            'product_id' => (int) $product['id'],
            'name' => $product['name'],
            'qty' => (int) $qty,
            'price' => product_effective_price($product),
            'unit_label' => unit_label($product['retail_unit'] ?: $product['unit']),
            'in_stock' => product_in_stock($product) && (int) $qty <= (int) $product['stock'],
        ];
    }
    return $items;
}

function handle_visitor_customer(): void
{
    $user = require_role(['visitor', 'manager']);
    $password = (string) ($_POST['password'] ?? '');
    if (strlen($password) < 6) {
        $password = bin2hex(random_bytes(4));
    }
    $id = create_user(db(), [
        'name' => $_POST['name'] ?? '',
        'phone' => $_POST['phone'] ?? '',
        'password' => $password,
        'address' => $_POST['address'] ?? '',
        'city' => $_POST['city'] ?? '',
        'role' => 'customer',
        'customer_type' => 'both',
        'is_active' => 1,
        'is_wholesale_approved' => !empty($_POST['is_wholesale_approved']) ? 1 : 0,
        'created_by' => (int) $user['id'],
        'notes' => 'ثبت توسط ' . $user['name'],
    ]);
    flash('success', 'مشتری ثبت شد.');
    redirect('visitor', ['customer' => $id]);
}

function handle_visitor_draft(): void
{
    require_role(['visitor', 'manager', 'admin']);
    $action = (string) ($_POST['draft_action'] ?? 'add');
    $id = (int) ($_POST['product_id'] ?? 0);
    if ($action === 'clear') {
        $_SESSION['visitor_draft'] = [];
    } elseif ($action === 'remove') {
        unset($_SESSION['visitor_draft'][$id]);
    } else {
        $product = find_product($id);
        if (!$product || !product_in_stock($product)) {
            throw new RuntimeException('محصول قابل فروش نیست.');
        }
        $qty = qty_input($_POST['qty'] ?? 1);
        $_SESSION['visitor_draft'][$id] = min(999, (int) ($_SESSION['visitor_draft'][$id] ?? 0) + $qty);
    }
    redirect('visitor');
}

function handle_visitor_order(): void
{
    $user = require_role(['visitor', 'manager', 'admin']);
    $items = visitor_draft_items();
    if (!$items) {
        throw new RuntimeException('اول کالاها را به پیش‌نویس سفارش اضافه کنید.');
    }
    foreach ($items as $item) {
        if (empty($item['in_stock'])) {
            throw new RuntimeException('موجودی «' . $item['name'] . '» کافی نیست.');
        }
    }
    $customerId = (int) ($_POST['customer_id'] ?? 0);
    if ($user['role'] === 'visitor') {
        $customer = one('SELECT * FROM users WHERE id = ? AND created_by = ?', [$customerId, (int) $user['id']]);
    } else {
        $customer = one('SELECT * FROM users WHERE id = ?', [$customerId]);
    }
    if (!$customer) {
        throw new RuntimeException('مشتری را انتخاب کنید.');
    }
    $method = ($_POST['payment_method'] ?? '') === 'visitor_credit' ? 'visitor_credit' : 'visitor_cash';
    $order = create_order(db(), [
        'items' => $items,
        'name' => $customer['name'],
        'phone' => $customer['phone'],
        'address' => trim((string) ($_POST['address'] ?? $customer['address'])),
        'message' => trim((string) ($_POST['message'] ?? '')),
        'user_id' => (int) $customer['id'],
        'visitor_id' => (int) $user['id'],
        'order_status' => $method === 'visitor_cash' ? 'CONFIRMED' : 'PENDING',
        'payment_method' => $method,
        'payment_status' => $method === 'visitor_cash' ? 'PAID' : 'UNPAID',
    ]);
    $_SESSION['visitor_draft'] = [];
    remember_order($order['order_number']);
    flash('success', 'سفارش ویزیتور ثبت شد: ' . $order['order_number']);
    redirect('order/' . $order['order_number']);
}
