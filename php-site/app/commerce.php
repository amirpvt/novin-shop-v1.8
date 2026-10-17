<?php

function product_select_sql(): string
{
    return 'SELECT p.*, c.name AS category_name, c.slug AS category_slug,
            b.name AS brand_name, b.slug AS brand_slug, b.logo AS brand_logo
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN brands b ON b.id = p.brand_id';
}

function find_product_by_slug(string $slug): ?array
{
    return one(product_select_sql() . ' WHERE p.slug = ?', [$slug]);
}

function find_product(int $id): ?array
{
    return one(product_select_sql() . ' WHERE p.id = ?', [$id]);
}

function products_by_ids(array $ids): array
{
    $ids = array_values(array_filter(array_map('intval', $ids)));
    if (!$ids) {
        return [];
    }
    $marks = implode(',', array_fill(0, count($ids), '?'));
    $rows = all_rows(product_select_sql() . " WHERE p.id IN ($marks)", $ids);
    $out = [];
    foreach ($rows as $row) {
        $out[(int) $row['id']] = $row;
    }
    return $out;
}

function attach_options(array $products): array
{
    if (!$products) {
        return [];
    }
    $ids = [];
    foreach ($products as $product) {
        $ids[] = (int) $product['id'];
    }
    $marks = implode(',', array_fill(0, count($ids), '?'));
    $options = all_rows("SELECT * FROM product_wholesale_options WHERE product_id IN ($marks) AND is_active = 1 ORDER BY sort_order, id", $ids);
    $grouped = [];
    foreach ($options as $option) {
        $grouped[(int) $option['product_id']][] = $option;
    }
    foreach ($products as &$product) {
        $product['options'] = $grouped[(int) $product['id']] ?? [];
    }
    unset($product);
    return $products;
}

function wholesale_price_for(array $product, ?array $option): int
{
    if ($option && (int) $option['unit_price'] > 0 && (int) ($option['is_active'] ?? 1) === 1) {
        return (int) $option['unit_price'];
    }
    return product_effective_price($product);
}

function cart_add(int $productId, int $qty): void
{
    $product = find_product($productId);
    if (!$product || !product_in_stock($product)) {
        throw new RuntimeException('این محصول الان قابل خرید نیست.');
    }
    $qty = max(1, min(999, $qty));
    $current = (int) ($_SESSION['cart'][$productId] ?? 0);
    $next = min(999, $current + $qty);
    if ($next > (int) $product['stock']) {
        throw new RuntimeException('موجودی «' . $product['name'] . '» فقط ' . (int) $product['stock'] . ' عدد است.');
    }
    $_SESSION['cart'][$productId] = $next;
}

function cart_set(int $productId, int $qty): void
{
    if ($qty <= 0) {
        unset($_SESSION['cart'][$productId]);
        return;
    }
    $product = find_product($productId);
    if (!$product) {
        unset($_SESSION['cart'][$productId]);
        return;
    }
    $_SESSION['cart'][$productId] = min(999, $qty, max(1, (int) $product['stock']));
}

function cart_resolved(): array
{
    $cart = $_SESSION['cart'] ?? [];
    if (!$cart) {
        return [];
    }
    $products = products_by_ids(array_keys($cart));
    $items = [];
    foreach ($cart as $id => $qty) {
        $product = $products[(int) $id] ?? null;
        if (!$product) {
            continue;
        }
        $qty = max(1, min(999, (int) $qty));
        $items[] = [
            'product_id' => (int) $product['id'],
            'name' => $product['name'],
            'price' => product_effective_price($product),
            'list_price' => (int) $product['price'],
            'qty' => $qty,
            'unit_label' => unit_label($product['retail_unit'] ?: $product['unit']),
            'image' => $product['image'],
            'stock' => (int) $product['stock'],
            'in_stock' => product_in_stock($product) && $qty <= (int) $product['stock'],
            'slug' => $product['slug'],
        ];
    }
    return $items;
}

function cart_total(array $items): int
{
    $total = 0;
    foreach ($items as $item) {
        $total += (int) $item['price'] * (int) $item['qty'];
    }
    return $total;
}

function wholesale_key(int $productId, int $optionId): string
{
    return $productId . '-' . $optionId;
}

function wholesale_add(int $productId, int $optionId, int $qty): void
{
    if (!wholesale_is_open()) {
        throw new RuntimeException('ثبت سفارش عمده فعلاً فقط برای مشتریان تاییدشده باز است. با فروشگاه تماس بگیرید.');
    }
    $product = find_product($productId);
    if (!$product || ($product['status'] ?? '') !== 'published' || !(int) $product['available']) {
        throw new RuntimeException('این محصول برای عمده موجود نیست.');
    }
    $options = attach_options([$product])[0]['options'] ?? [];
    $option = null;
    foreach ($options as $row) {
        if ((int) $row['id'] === $optionId) {
            $option = $row;
            break;
        }
    }
    if ($options && !$option) {
        $option = $options[0];
        $optionId = (int) $option['id'];
    }
    if (!$options) {
        $optionId = 0;
    }
    $min = max(1, (int) $product['wholesale_min_quantity']);
    $qty = max($min, min(9999, $qty));
    $key = wholesale_key($productId, $optionId);
    $_SESSION['wholesale'][$key] = [
        'product_id' => $productId,
        'option_id' => $optionId,
        'qty' => $qty,
    ];
}

function wholesale_resolved(): array
{
    $cart = $_SESSION['wholesale'] ?? [];
    if (!$cart) {
        return [];
    }
    $ids = [];
    foreach ($cart as $row) {
        $ids[] = (int) $row['product_id'];
    }
    $products = products_by_ids($ids);
    $products = attach_options(array_values($products));
    $byId = [];
    foreach ($products as $product) {
        $byId[(int) $product['id']] = $product;
    }
    $items = [];
    foreach ($cart as $row) {
        $product = $byId[(int) $row['product_id']] ?? null;
        if (!$product) {
            continue;
        }
        $option = null;
        foreach ($product['options'] as $opt) {
            if ((int) $opt['id'] === (int) $row['option_id']) {
                $option = $opt;
                break;
            }
        }
        $qty = max(1, (int) $row['qty']);
        $min = max(1, (int) $product['wholesale_min_quantity']);
        $items[] = [
            'key' => wholesale_key((int) $product['id'], $option ? (int) $option['id'] : 0),
            'product_id' => (int) $product['id'],
            'option_id' => $option ? (int) $option['id'] : 0,
            'name' => $product['name'],
            'option_label' => $option['label'] ?? '',
            'unit_label' => $option ? ($option['label'] ?: unit_label($product['wholesale_unit'])) : unit_label($product['wholesale_unit'] ?: $product['unit']),
            'unit_price' => wholesale_price_for($product, $option),
            'qty' => $qty,
            'min_qty' => $min,
            'image' => $product['image'],
            'below_min' => $qty < $min,
        ];
    }
    return $items;
}

function unique_code(PDO $pdo, string $table, string $column, string $prefix): string
{
    $allowed = [
        'orders' => 'order_number',
        'wholesale_requests' => 'request_number',
        'payments' => 'payment_number',
    ];
    if (($allowed[$table] ?? '') !== $column) {
        throw new RuntimeException('شناسه نامعتبر است.');
    }
    $st = $pdo->prepare("SELECT 1 FROM {$table} WHERE {$column} = ?");
    for ($i = 0; $i < 8; $i++) {
        $code = $prefix . random_int(10000000, 99999999);
        $st->execute([$code]);
        if (!$st->fetch()) {
            return $code;
        }
    }
    return $prefix . strtoupper(bin2hex(random_bytes(4)));
}

function create_user(PDO $pdo, array $data): int
{
    $phone = normalize_phone((string) ($data['phone'] ?? ''));
    if (!is_phone($phone)) {
        throw new RuntimeException('شماره تماس باید ۱۱ رقم و با صفر شروع شود.');
    }
    $name = trim((string) ($data['name'] ?? ''));
    if (mb_strlen($name) < 2) {
        throw new RuntimeException('نام را کامل وارد کنید.');
    }
    $password = (string) ($data['password'] ?? '');
    if (strlen($password) < 6) {
        throw new RuntimeException('رمز عبور باید حداقل ۶ کاراکتر باشد.');
    }
    $role = (string) ($data['role'] ?? 'customer');
    if (!in_array($role, ['manager', 'admin', 'visitor', 'customer'], true)) {
        $role = 'customer';
    }
    $exists = $pdo->prepare('SELECT id FROM users WHERE phone = ?');
    $exists->execute([$phone]);
    if ($exists->fetch()) {
        throw new RuntimeException('این شماره قبلاً ثبت شده است.');
    }
    $now = date('Y-m-d H:i:s');
    $st = $pdo->prepare('INSERT INTO users (name, phone, email, password_hash, role, address, city, postal_code, national_id, customer_type, is_active, is_wholesale_approved, notes, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $st->execute([
        $name,
        $phone,
        trim((string) ($data['email'] ?? '')),
        password_hash($password, PASSWORD_DEFAULT),
        $role,
        trim((string) ($data['address'] ?? '')),
        trim((string) ($data['city'] ?? '')),
        trim((string) ($data['postal_code'] ?? '')),
        trim((string) ($data['national_id'] ?? '')),
        in_array(($data['customer_type'] ?? 'retail'), ['retail', 'wholesale', 'both'], true) ? $data['customer_type'] : 'retail',
        !empty($data['is_active']) ? 1 : 0,
        !empty($data['is_wholesale_approved']) ? 1 : 0,
        trim((string) ($data['notes'] ?? '')),
        !empty($data['created_by']) ? (int) $data['created_by'] : null,
        $now,
        $now,
    ]);
    return (int) $pdo->lastInsertId();
}

function adjust_stock(PDO $pdo, array $items, int $direction): void
{
    $now = date('Y-m-d H:i:s');
    foreach ($items as $item) {
        $qty = (int) $item['qty'];
        $productId = (int) ($item['product_id'] ?? 0);
        if ($productId <= 0 || $qty <= 0) {
            continue;
        }
        if ($direction < 0) {
            $st = $pdo->prepare('UPDATE products SET stock = stock - ?, available = CASE WHEN stock - ? <= 0 THEN 0 ELSE available END, updated_at = ? WHERE id = ? AND stock >= ?');
            $st->execute([$qty, $qty, $now, $productId, $qty]);
            if ($st->rowCount() < 1) {
                throw new RuntimeException('موجودی «' . ($item['name'] ?? 'محصول') . '» کافی نیست.');
            }
        } else {
            $st = $pdo->prepare('UPDATE products SET stock = stock + ?, available = 1, updated_at = ? WHERE id = ?');
            $st->execute([$qty, $now, $productId]);
        }
    }
}

function create_order(PDO $pdo, array $data): array
{
    $items = $data['items'] ?? [];
    if (!$items) {
        throw new RuntimeException('سبد خرید خالی است.');
    }
    $ownTx = !$pdo->inTransaction();
    if ($ownTx) {
        $pdo->beginTransaction();
    }
    try {
        if (empty($data['stock_already_adjusted'])) {
            adjust_stock($pdo, $items, -1);
        }
        $number = unique_code($pdo, 'orders', 'order_number', 'ORD-');
        $token = bin2hex(random_bytes(16));
        $total = 0;
        foreach ($items as $item) {
            $total += (int) $item['price'] * (int) $item['qty'];
        }
        $now = date('Y-m-d H:i:s');
        $st = $pdo->prepare('INSERT INTO orders (user_id, visitor_id, order_number, public_token, name, phone, address, message, admin_note, order_status, payment_method, payment_status, total_amount, transaction_id, receipt_path, stock_adjusted, stock_restored, commission_paid, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 0, ?, ?)');
        $st->execute([
            !empty($data['user_id']) ? (int) $data['user_id'] : null,
            !empty($data['visitor_id']) ? (int) $data['visitor_id'] : null,
            $number,
            $token,
            mb_substr(trim((string) $data['name']), 0, 150),
            normalize_phone((string) $data['phone']),
            mb_substr(trim((string) ($data['address'] ?? '')), 0, 500),
            mb_substr(trim((string) ($data['message'] ?? '')), 0, 2000),
            trim((string) ($data['admin_note'] ?? '')),
            (string) ($data['order_status'] ?? 'PENDING'),
            (string) ($data['payment_method'] ?? 'cod'),
            (string) ($data['payment_status'] ?? 'UNPAID'),
            $total,
            (string) ($data['transaction_id'] ?? ''),
            '',
            $now,
            $now,
        ]);
        $orderId = (int) $pdo->lastInsertId();
        $itemSt = $pdo->prepare('INSERT INTO order_items (order_id, product_id, product_name, unit_label, price, quantity) VALUES (?, ?, ?, ?, ?, ?)');
        foreach ($items as $item) {
            $itemSt->execute([
                $orderId,
                (int) $item['product_id'],
                (string) $item['name'],
                (string) ($item['unit_label'] ?? ''),
                (int) $item['price'],
                (int) $item['qty'],
            ]);
        }
        if ($ownTx) {
            $pdo->commit();
        }
        return ['id' => $orderId, 'order_number' => $number, 'public_token' => $token, 'total' => $total];
    } catch (Throwable $e) {
        if ($ownTx && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

function create_wholesale_request(PDO $pdo, array $data): array
{
    $items = $data['items'] ?? [];
    if (!$items) {
        throw new RuntimeException('حداقل یک کالا برای سفارش عمده انتخاب کنید.');
    }
    $ownTx = !$pdo->inTransaction();
    if ($ownTx) {
        $pdo->beginTransaction();
    }
    try {
        $number = unique_code($pdo, 'wholesale_requests', 'request_number', 'WHS-');
        $token = bin2hex(random_bytes(16));
        $total = 0;
        foreach ($items as $item) {
            if (!empty($item['below_min'])) {
                throw new RuntimeException('مقدار «' . $item['name'] . '» از حداقل عمده کمتر است.');
            }
            $total += (int) $item['unit_price'] * (int) $item['qty'];
        }
        $now = date('Y-m-d H:i:s');
        $st = $pdo->prepare('INSERT INTO wholesale_requests (user_id, visitor_id, request_number, public_token, company_name, contact_person, phone, address, description, admin_note, status, total_amount, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $st->execute([
            !empty($data['user_id']) ? (int) $data['user_id'] : null,
            !empty($data['visitor_id']) ? (int) $data['visitor_id'] : null,
            $number,
            $token,
            trim((string) $data['company_name']),
            trim((string) $data['contact_person']),
            normalize_phone((string) $data['phone']),
            trim((string) ($data['address'] ?? '')),
            trim((string) ($data['description'] ?? '')),
            '',
            'NEW',
            $total,
            $now,
            $now,
        ]);
        $requestId = (int) $pdo->lastInsertId();
        $itemSt = $pdo->prepare('INSERT INTO wholesale_items (request_id, product_id, product_name, option_label, unit_label, unit_price, quantity, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        foreach ($items as $item) {
            $itemSt->execute([
                $requestId,
                (int) $item['product_id'],
                (string) $item['name'],
                (string) ($item['option_label'] ?? ''),
                (string) ($item['unit_label'] ?? ''),
                (int) $item['unit_price'],
                (int) $item['qty'],
                '',
            ]);
        }
        if ($ownTx) {
            $pdo->commit();
        }
        return ['id' => $requestId, 'request_number' => $number, 'public_token' => $token, 'total' => $total];
    } catch (Throwable $e) {
        if ($ownTx && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

function http_json(string $url, array $payload): array
{
    $body = json_encode($payload, JSON_UNESCAPED_UNICODE);
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json'],
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_CONNECTTIMEOUT => 10,
        ]);
        $raw = curl_exec($ch);
        $err = curl_error($ch);
        curl_close($ch);
        if ($raw === false) {
            throw new RuntimeException('اتصال به درگاه برقرار نشد: ' . $err);
        }
    } else {
        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Content-Type: application/json\r\nAccept: application/json\r\n",
                'content' => $body,
                'timeout' => 20,
            ],
        ]);
        $raw = @file_get_contents($url, false, $context);
        if ($raw === false) {
            throw new RuntimeException('اتصال به درگاه برقرار نشد. افزونه curl هاست را بررسی کنید.');
        }
    }
    $json = json_decode($raw, true);
    return is_array($json) ? $json : [];
}

function zarinpal_base(): string
{
    return setting('zarinpal_sandbox', '1') === '1' ? 'https://sandbox.zarinpal.com' : 'https://payment.zarinpal.com';
}

function zarinpal_merchant(): string
{
    $merchant = trim(setting('zarinpal_merchant', ''));
    if ($merchant === '' && setting('zarinpal_sandbox', '1') === '1') {
        return '00000000-0000-0000-0000-000000000000';
    }
    return $merchant;
}

function zarinpal_request(int $amount, string $callback, string $description, string $mobile): array
{
    $merchant = zarinpal_merchant();
    if ($merchant === '') {
        return ['ok' => false, 'message' => 'مرچنت زرین‌پال در تنظیمات وارد نشده است.'];
    }
    $json = http_json(zarinpal_base() . '/pg/v4/payment/request.json', [
        'merchant_id' => $merchant,
        'amount' => $amount,
        'currency' => 'IRT',
        'description' => $description,
        'callback_url' => $callback,
        'metadata' => ['mobile' => $mobile],
    ]);
    $code = (int) ($json['data']['code'] ?? 0);
    $authority = (string) ($json['data']['authority'] ?? '');
    if ($code === 100 && $authority !== '') {
        return ['ok' => true, 'authority' => $authority, 'url' => zarinpal_base() . '/pg/StartPay/' . rawurlencode($authority)];
    }
    $message = $json['errors']['message'] ?? ($json['data']['message'] ?? 'درگاه پرداخت پاسخ نداد.');
    if (is_array($message)) {
        $message = implode(' ', $message);
    }
    return ['ok' => false, 'message' => 'زرین‌پال: ' . $message];
}

function zarinpal_verify(int $amount, string $authority): array
{
    $json = http_json(zarinpal_base() . '/pg/v4/payment/verify.json', [
        'merchant_id' => zarinpal_merchant(),
        'amount' => $amount,
        'authority' => $authority,
    ]);
    $code = (int) ($json['data']['code'] ?? 0);
    if ($code === 100 || $code === 101) {
        return ['ok' => true, 'ref_id' => (string) ($json['data']['ref_id'] ?? '')];
    }
    $message = $json['errors']['message'] ?? ($json['data']['message'] ?? 'تایید پرداخت ناموفق بود.');
    if (is_array($message)) {
        $message = implode(' ', $message);
    }
    return ['ok' => false, 'message' => 'زرین‌پال: ' . $message];
}

function release_payment_stock(array $payment): void
{
    if (!(int) $payment['stock_held']) {
        return;
    }
    $payload = json_decode((string) $payment['payload'], true);
    $items = is_array($payload['items'] ?? null) ? $payload['items'] : [];
    if (!$items) {
        q('UPDATE payments SET stock_held = 0, updated_at = ? WHERE id = ?', [now(), (int) $payment['id']]);
        return;
    }
    $pdo = db();
    $own = !$pdo->inTransaction();
    if ($own) {
        $pdo->beginTransaction();
    }
    try {
        $locked = $pdo->prepare('SELECT * FROM payments WHERE id = ?');
        $locked->execute([(int) $payment['id']]);
        $fresh = $locked->fetch();
        if ($fresh && (int) $fresh['stock_held'] === 1) {
            adjust_stock($pdo, $items, 1);
            $upd = $pdo->prepare('UPDATE payments SET stock_held = 0, updated_at = ? WHERE id = ?');
            $upd->execute([now(), (int) $payment['id']]);
        }
        if ($own) {
            $pdo->commit();
        }
    } catch (Throwable $e) {
        if ($own && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

function expire_stale_payments(): void
{
    $cutoff = date('Y-m-d H:i:s', time() - 45 * 60);
    $rows = all_rows("SELECT * FROM payments WHERE status = 'PENDING' AND method = 'online' AND order_id IS NULL AND created_at < ? LIMIT 20", [$cutoff]);
    foreach ($rows as $row) {
        try {
            release_payment_stock($row);
            q("UPDATE payments SET status = 'FAILED', updated_at = ? WHERE id = ? AND status = 'PENDING'", [now(), (int) $row['id']]);
        } catch (Throwable $e) {
            app_log('expire payment ' . $row['id'] . ': ' . $e->getMessage());
        }
    }
}

function start_online_payment(array $customer, array $items): void
{
    $total = cart_total($items);
    if ($total < 1000) {
        throw new RuntimeException('حداقل مبلغ پرداخت آنلاین 1,000 تومان است.');
    }
    foreach ($items as $item) {
        if (empty($item['in_stock'])) {
            throw new RuntimeException('موجودی «' . $item['name'] . '» کافی نیست.');
        }
    }
    $pdo = db();
    $pdo->beginTransaction();
    $paymentId = 0;
    try {
        adjust_stock($pdo, $items, -1);
        $number = unique_code($pdo, 'payments', 'payment_number', 'PAY-');
        $now = now();
        $st = $pdo->prepare('INSERT INTO payments (kind, payment_number, user_id, amount, method, status, authority, transaction_id, payload, stock_held, order_id, wholesale_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NULL, NULL, ?, ?)');
        $st->execute([
            'retail',
            $number,
            !empty($customer['user_id']) ? (int) $customer['user_id'] : null,
            $total,
            'online',
            'PENDING',
            '',
            '',
            json_encode(['customer' => $customer, 'items' => $items], JSON_UNESCAPED_UNICODE),
            $now,
            $now,
        ]);
        $paymentId = (int) $pdo->lastInsertId();
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }

    try {
        $result = zarinpal_request($total, absolute_url('payment/callback'), 'پرداخت سفارش پخش نوین', (string) $customer['phone']);
    } catch (Throwable $e) {
        $result = ['ok' => false, 'message' => $e->getMessage()];
    }
    if (empty($result['ok'])) {
        $payment = one('SELECT * FROM payments WHERE id = ?', [$paymentId]);
        if ($payment) {
            release_payment_stock($payment);
            q("UPDATE payments SET status = 'FAILED', updated_at = ? WHERE id = ?", [now(), $paymentId]);
        }
        throw new RuntimeException($result['message'] ?? 'شروع پرداخت ناموفق بود.');
    }
    q('UPDATE payments SET authority = ?, updated_at = ? WHERE id = ?', [$result['authority'], now(), $paymentId]);
    header('Location: ' . $result['url']);
    exit;
}

function customer_from_post(bool $requireAddress = true): array
{
    $name = trim((string) ($_POST['name'] ?? ''));
    $phone = normalize_phone((string) ($_POST['phone'] ?? ''));
    $address = trim((string) ($_POST['address'] ?? ''));
    $message = trim((string) ($_POST['message'] ?? ''));
    if (mb_strlen($name) < 2) {
        throw new RuntimeException('نام و نام خانوادگی را وارد کنید.');
    }
    if (!is_phone($phone)) {
        throw new RuntimeException('شماره تماس معتبر نیست.');
    }
    if ($requireAddress && mb_strlen($address) < 8) {
        throw new RuntimeException('آدرس تحویل را کامل‌تر بنویسید.');
    }
    if (mb_strlen($message) > 2000 || mb_strlen($address) > 500) {
        throw new RuntimeException('متن واردشده بیش از حد طولانی است.');
    }
    $user = current_user();
    return [
        'name' => $name,
        'phone' => $phone,
        'address' => $address,
        'message' => $message,
        'user_id' => $user['id'] ?? null,
    ];
}

function can_view_order(array $order): bool
{
    $user = current_user();
    if ($user) {
        if (in_array($user['role'], ['manager', 'admin'], true)) {
            return true;
        }
        if ((int) $order['user_id'] === (int) $user['id']) {
            return true;
        }
        if ((int) $order['visitor_id'] === (int) $user['id']) {
            return true;
        }
    }
    $token = (string) ($_GET['t'] ?? $_POST['t'] ?? '');
    $known = (string) ($order['public_token'] ?? '');
    if ($token !== '' && $known !== '' && hash_equals($known, $token)) {
        return true;
    }
    $recent = $_SESSION['recent_orders'] ?? [];
    return is_array($recent) && in_array($order['order_number'], $recent, true);
}

function remember_order(string $number): void
{
    $recent = $_SESSION['recent_orders'] ?? [];
    if (!is_array($recent)) {
        $recent = [];
    }
    $recent[] = $number;
    $_SESSION['recent_orders'] = array_slice(array_unique($recent), -8);
}

function set_order_status(int $id, string $status, string $adminNote = '', ?string $paymentStatus = null): void
{
    if (!isset(order_status_options()[$status])) {
        throw new RuntimeException('وضعیت نامعتبر است.');
    }
    $order = one('SELECT * FROM orders WHERE id = ?', [$id]);
    if (!$order) {
        throw new RuntimeException('سفارش پیدا نشد.');
    }
    $pdo = db();
    $pdo->beginTransaction();
    try {
        $items = all_rows('SELECT * FROM order_items WHERE order_id = ?', [$id]);
        $stockItems = [];
        foreach ($items as $item) {
            $stockItems[] = [
                'product_id' => (int) $item['product_id'],
                'qty' => (int) $item['quantity'],
                'name' => $item['product_name'],
            ];
        }
        $restored = (int) $order['stock_restored'];
        if ($status === 'CANCELLED' && $order['order_status'] !== 'CANCELLED' && !$restored && (int) $order['stock_adjusted']) {
            adjust_stock($pdo, $stockItems, 1);
            $restored = 1;
        } elseif ($order['order_status'] === 'CANCELLED' && $status !== 'CANCELLED' && $restored) {
            adjust_stock($pdo, $stockItems, -1);
            $restored = 0;
        }
        $pay = $paymentStatus && isset(['UNPAID' => 1, 'PENDING' => 1, 'PAID' => 1, 'FAILED' => 1][$paymentStatus])
            ? $paymentStatus
            : $order['payment_status'];
        $st = $pdo->prepare('UPDATE orders SET order_status = ?, payment_status = ?, admin_note = ?, stock_restored = ?, updated_at = ? WHERE id = ?');
        $st->execute([$status, $pay, $adminNote, $restored, now(), $id]);
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

function shop_query(array $filters, bool $countOnly = false): array
{
    $where = ["p.status = 'published'"];
    $params = [];
    if ($filters['q'] !== '') {
        $like = like_value($filters['q']);
        $where[] = '(p.name LIKE ? ESCAPE \'\\\' OR p.description LIKE ? ESCAPE \'\\\' OR b.name LIKE ? ESCAPE \'\\\' OR c.name LIKE ? ESCAPE \'\\\')';
        array_push($params, $like, $like, $like, $like);
    }
    if ($filters['category'] !== '') {
        $where[] = 'c.slug = ?';
        $params[] = $filters['category'];
    }
    if ($filters['brand'] !== '') {
        $where[] = 'b.slug = ?';
        $params[] = $filters['brand'];
    }
    if ($filters['available']) {
        $where[] = 'p.available = 1 AND p.stock > 0';
    }
    if ($filters['min'] !== '') {
        $where[] = '(CASE WHEN p.discount_price IS NOT NULL AND p.discount_price > 0 AND p.discount_price < p.price THEN p.discount_price ELSE p.price END) >= ?';
        $params[] = (int) $filters['min'];
    }
    if ($filters['max'] !== '') {
        $where[] = '(CASE WHEN p.discount_price IS NOT NULL AND p.discount_price > 0 AND p.discount_price < p.price THEN p.discount_price ELSE p.price END) <= ?';
        $params[] = (int) $filters['max'];
    }
    $sqlWhere = implode(' AND ', $where);
    if ($countOnly) {
        $row = one('SELECT COUNT(*) AS c FROM products p LEFT JOIN categories c ON c.id = p.category_id LEFT JOIN brands b ON b.id = p.brand_id WHERE ' . $sqlWhere, $params);
        return ['count' => (int) ($row['c'] ?? 0)];
    }
    $sorts = [
        'newest' => 'p.id DESC',
        'price-asc' => 'effective_price ASC, p.id DESC',
        'price-desc' => 'effective_price DESC, p.id DESC',
        'name' => 'p.name ASC',
    ];
    $order = $sorts[$filters['sort']] ?? $sorts['newest'];
    $page = max(1, (int) $filters['page']);
    $perPage = 12;
    $offset = ($page - 1) * $perPage;
    $sql = 'SELECT p.*, c.name AS category_name, c.slug AS category_slug, b.name AS brand_name, b.slug AS brand_slug, b.logo AS brand_logo,
        (CASE WHEN p.discount_price IS NOT NULL AND p.discount_price > 0 AND p.discount_price < p.price THEN p.discount_price ELSE p.price END) AS effective_price
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN brands b ON b.id = p.brand_id
        WHERE ' . $sqlWhere . ' ORDER BY ' . $order . ' LIMIT ' . (int) $perPage . ' OFFSET ' . (int) $offset;
    return ['rows' => all_rows($sql, $params), 'page' => $page, 'per_page' => $perPage];
}

function shop_filters_from_request(): array
{
    $min = trim((string) ($_GET['min'] ?? ''));
    $max = trim((string) ($_GET['max'] ?? ''));
    $minN = $min === '' ? '' : (string) money_input($min);
    $maxN = $max === '' ? '' : (string) money_input($max);
    if ($minN !== '' && $maxN !== '' && (int) $minN > (int) $maxN) {
        [$minN, $maxN] = [$maxN, $minN];
    }
    $sort = (string) ($_GET['sort'] ?? 'newest');
    if (!in_array($sort, ['newest', 'price-asc', 'price-desc', 'name'], true)) {
        $sort = 'newest';
    }
    return [
        'q' => trim((string) ($_GET['q'] ?? '')),
        'category' => trim((string) ($_GET['category'] ?? '')),
        'brand' => trim((string) ($_GET['brand'] ?? '')),
        'available' => isset($_GET['available']) && $_GET['available'] !== '0' && $_GET['available'] !== '',
        'min' => $minN,
        'max' => $maxN,
        'sort' => $sort,
        'page' => max(1, (int) ($_GET['page'] ?? 1)),
    ];
}
