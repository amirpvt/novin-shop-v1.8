<?php

function handle_admin_home(): void
{
    $user = require_staff();
    $today = date('Y-m-d') . ' 00:00:00';
    view('admin/dashboard', [
        'title' => 'داشبورد',
        'robots' => 'noindex',
        '_layout' => 'admin/layout',
        'panel' => 'admin',
        'stats' => [
            'products' => (int) (one('SELECT COUNT(*) AS c FROM products')['c'] ?? 0),
            'low_stock' => (int) (one('SELECT COUNT(*) AS c FROM products WHERE stock <= 5 AND status = ?', ['published'])['c'] ?? 0),
            'orders_today' => (int) (one('SELECT COUNT(*) AS c FROM orders WHERE created_at >= ?', [$today])['c'] ?? 0),
            'sales_today' => (int) (one("SELECT COALESCE(SUM(total_amount),0) AS c FROM orders WHERE created_at >= ? AND order_status <> 'CANCELLED'", [$today])['c'] ?? 0),
            'pending_orders' => (int) (one("SELECT COUNT(*) AS c FROM orders WHERE order_status IN ('PENDING','PAID_PENDING_REVIEW')")['c'] ?? 0),
            'new_wholesale' => (int) (one("SELECT COUNT(*) AS c FROM wholesale_requests WHERE status = 'NEW'")['c'] ?? 0),
            'unread' => (int) (one('SELECT COUNT(*) AS c FROM messages WHERE is_read = 0')['c'] ?? 0),
        ],
        'recent_orders' => all_rows('SELECT * FROM orders ORDER BY id DESC LIMIT 8'),
        'low_products' => all_rows('SELECT id, name, stock FROM products WHERE stock <= 5 AND status = ? ORDER BY stock ASC, name LIMIT 8', ['published']),
        'me' => $user,
    ]);
}

function handle_admin_products(): void
{
    require_staff();
    $q = trim((string) ($_GET['q'] ?? ''));
    $params = [];
    $sql = product_select_sql();
    if ($q !== '') {
        $sql .= " WHERE p.name LIKE ? ESCAPE '\\' OR p.sku LIKE ? ESCAPE '\\'";
        $like = like_value($q);
        $params = [$like, $like];
    }
    $sql .= ' ORDER BY p.id DESC LIMIT 200';
    view('admin/products', [
        'title' => 'محصولات',
        'robots' => 'noindex',
        '_layout' => 'admin/layout',
        'panel' => 'admin',
        'products' => all_rows($sql, $params),
        'q' => $q,
    ]);
}

function handle_admin_product_form(): void
{
    require_staff();
    $id = (int) ($_GET['id'] ?? 0);
    $product = $id ? find_product($id) : null;
    if ($id && !$product) {
        abort_404();
    }
    if ($product) {
        $product = attach_options([$product])[0];
    }
    view('admin/product_form', [
        'title' => $product ? 'ویرایش محصول' : 'محصول جدید',
        'robots' => 'noindex',
        '_layout' => 'admin/layout',
        'panel' => 'admin',
        'product' => $product,
        'categories' => all_rows('SELECT * FROM categories ORDER BY sort_order, name'),
        'brands' => all_rows('SELECT * FROM brands ORDER BY name'),
    ]);
}

function handle_admin_product_save(): void
{
    require_staff();
    $id = (int) ($_POST['id'] ?? 0);
    $existing = $id ? one('SELECT * FROM products WHERE id = ?', [$id]) : null;
    if ($id && !$existing) {
        throw new RuntimeException('محصول پیدا نشد.');
    }
    $name = trim((string) ($_POST['name'] ?? ''));
    if (mb_strlen($name) < 2) {
        throw new RuntimeException('نام محصول لازم است.');
    }
    $categoryId = (int) ($_POST['category_id'] ?? 0);
    if (!one('SELECT id FROM categories WHERE id = ?', [$categoryId])) {
        throw new RuntimeException('دسته‌بندی را انتخاب کنید.');
    }
    $brandId = (int) ($_POST['brand_id'] ?? 0);
    if ($brandId && !one('SELECT id FROM brands WHERE id = ?', [$brandId])) {
        $brandId = 0;
    }
    $price = money_input($_POST['price'] ?? 0);
    if ($price <= 0) {
        throw new RuntimeException('قیمت باید بیشتر از صفر باشد.');
    }
    $discountRaw = trim((string) ($_POST['discount_price'] ?? ''));
    $discount = $discountRaw === '' ? null : money_input($discountRaw);
    if ($discount !== null && ($discount <= 0 || $discount >= $price)) {
        throw new RuntimeException('قیمت تخفیف باید کمتر از قیمت اصلی باشد، یا خالی بماند.');
    }
    $units = array_keys(unit_options());
    $retail = (string) ($_POST['retail_unit'] ?? 'pack');
    $wholesaleUnit = (string) ($_POST['wholesale_unit'] ?? 'kg');
    if (!in_array($retail, $units, true) || !in_array($wholesaleUnit, $units, true)) {
        throw new RuntimeException('واحد نامعتبر است.');
    }
    $slugInput = trim((string) ($_POST['slug'] ?? ''));
    $slug = slugify($slugInput !== '' ? $slugInput : $name);
    $dup = one('SELECT id FROM products WHERE slug = ? AND id <> ?', [$slug, $id]);
    if ($dup) {
        $slug .= '-' . ($id ?: random_int(2, 99));
    }
    $stock = min(1000000, money_input($_POST['stock'] ?? 0));
    $available = isset($_POST['available']) && $stock > 0 ? 1 : 0;
    $status = (($_POST['status'] ?? '') === 'draft') ? 'draft' : 'published';
    $tag = (string) ($_POST['tag'] ?? '');
    if (!in_array($tag, ['', 'new', 'best', 'discount', 'special'], true)) {
        $tag = '';
    }
    $badge = (string) ($_POST['badge'] ?? '');
    if (!in_array($badge, ['', 'fresh', 'hot', 'premium'], true)) {
        $badge = '';
    }
    $minQtyRaw = trim((string) ($_POST['wholesale_min_quantity'] ?? ''));
    $minQty = $minQtyRaw === '' ? 10 : max(1, money_input($minQtyRaw));
    $image = (string) ($existing['image'] ?? '');
    $uploaded = store_upload('image', 'products');
    if ($uploaded) {
        if (str_starts_with($image, 'uploads/')) {
            delete_upload($image);
        }
        $image = $uploaded;
    }
    if (!empty($_POST['remove_image'])) {
        delete_upload($image);
        $image = '';
    }
    $now = now();
    $data = [
        $categoryId,
        $brandId ?: null,
        mb_substr(trim((string) ($_POST['sku'] ?? '')), 0, 50),
        $name,
        $slug,
        mb_substr(trim((string) ($_POST['description'] ?? '')), 0, 5000),
        $price,
        $discount,
        mb_substr(trim((string) ($_POST['barcode'] ?? '')), 0, 50),
        $stock,
        min(100000, money_input($_POST['weight'] ?? 0)),
        $retail,
        $retail,
        $wholesaleUnit,
        $minQty,
        $tag,
        $badge,
        $image,
        $name,
        $status,
        isset($_POST['is_featured']) ? 1 : 0,
        $available,
        money_input($_POST['sort_order'] ?? 0),
        $now,
    ];
    $pdo = db();
    $pdo->beginTransaction();
    try {
        if ($id) {
            $st = $pdo->prepare('UPDATE products SET category_id=?, brand_id=?, sku=?, name=?, slug=?, description=?, price=?, discount_price=?, barcode=?, stock=?, weight=?, unit=?, retail_unit=?, wholesale_unit=?, wholesale_min_quantity=?, tag=?, badge=?, image=?, alt_text=?, status=?, is_featured=?, available=?, sort_order=?, updated_at=? WHERE id=?');
            $st->execute(array_merge($data, [$id]));
            $productId = $id;
        } else {
            $st = $pdo->prepare('INSERT INTO products (category_id, brand_id, sku, name, slug, description, price, discount_price, barcode, stock, weight, unit, retail_unit, wholesale_unit, wholesale_min_quantity, tag, badge, image, alt_text, status, is_featured, available, sort_order, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
            $st->execute(array_merge($data, [$now]));
            $productId = (int) $pdo->lastInsertId();
        }
        $del = $pdo->prepare('DELETE FROM product_wholesale_options WHERE product_id = ?');
        $del->execute([$productId]);
        $labels = $_POST['opt_label'] ?? [];
        $codes = $_POST['opt_code'] ?? [];
        $prices = $_POST['opt_price'] ?? [];
        if (!is_array($labels)) {
            $labels = [];
        }
        $opt = $pdo->prepare('INSERT INTO product_wholesale_options (product_id, code, label, unit_price, is_active, sort_order) VALUES (?, ?, ?, ?, 1, ?)');
        $used = [];
        $sort = 1;
        foreach ($labels as $i => $label) {
            $label = trim((string) $label);
            $priceOpt = money_input($prices[$i] ?? 0);
            if ($label === '' || $priceOpt <= 0) {
                continue;
            }
            $code = slugify((string) ($codes[$i] ?? ''));
            if ($code === '' || str_starts_with($code, 'item-')) {
                $code = 'opt-' . $sort;
            }
            if (isset($used[$code])) {
                $code .= '-' . $sort;
            }
            $used[$code] = true;
            $opt->execute([$productId, mb_substr($code, 0, 40), mb_substr($label, 0, 80), $priceOpt, $sort]);
            $sort++;
            if ($sort > 12) {
                break;
            }
        }
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
    flash('success', 'محصول ذخیره شد.');
    redirect('admin/product', ['id' => $productId]);
}

function handle_admin_product_delete(): void
{
    require_staff();
    $id = (int) ($_POST['id'] ?? 0);
    $used = one('SELECT id FROM order_items WHERE product_id = ? LIMIT 1', [$id]);
    $used2 = one('SELECT id FROM wholesale_items WHERE product_id = ? LIMIT 1', [$id]);
    if ($used || $used2) {
        q('UPDATE products SET status = ?, available = 0, updated_at = ? WHERE id = ?', ['draft', now(), $id]);
        flash('success', 'این محصول در سفارش‌ها استفاده شده و حذف نشد؛ غیرفعال شد.');
        redirect('admin/products');
    }
    $product = one('SELECT image FROM products WHERE id = ?', [$id]);
    q('DELETE FROM product_wholesale_options WHERE product_id = ?', [$id]);
    q('DELETE FROM products WHERE id = ?', [$id]);
    if ($product) {
        delete_upload($product['image']);
    }
    flash('success', 'محصول حذف شد.');
    redirect('admin/products');
}

function handle_admin_categories(): void
{
    require_staff();
    $edit = null;
    if (!empty($_GET['id'])) {
        $edit = one('SELECT * FROM categories WHERE id = ?', [(int) $_GET['id']]);
    }
    view('admin/categories', [
        'title' => 'دسته‌بندی‌ها',
        'robots' => 'noindex',
        '_layout' => 'admin/layout',
        'panel' => 'admin',
        'categories' => all_rows('SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS product_count FROM categories c ORDER BY sort_order, name'),
        'edit' => $edit,
    ]);
}

function handle_admin_category_save(): void
{
    require_staff();
    $id = (int) ($_POST['id'] ?? 0);
    if (($_POST['do'] ?? '') === 'delete') {
        $used = one('SELECT id FROM products WHERE category_id = ? LIMIT 1', [$id]);
        if ($used) {
            throw new RuntimeException('این دسته محصول دارد و قابل حذف نیست. اول محصولات را جابه‌جا کنید.');
        }
        $row = one('SELECT image FROM categories WHERE id = ?', [$id]);
        q('DELETE FROM categories WHERE id = ?', [$id]);
        if ($row) {
            delete_upload($row['image']);
        }
        flash('success', 'دسته حذف شد.');
        redirect('admin/categories');
    }
    $name = trim((string) ($_POST['name'] ?? ''));
    if (mb_strlen($name) < 2) {
        throw new RuntimeException('نام دسته لازم است.');
    }
    $slug = slugify(trim((string) ($_POST['slug'] ?? '')) ?: $name);
    $dup = one('SELECT id FROM categories WHERE slug = ? AND id <> ?', [$slug, $id]);
    if ($dup) {
        $slug .= '-' . random_int(2, 99);
    }
    $existing = $id ? one('SELECT * FROM categories WHERE id = ?', [$id]) : null;
    $image = (string) ($existing['image'] ?? '');
    $uploaded = store_upload('image', 'categories');
    if ($uploaded) {
        delete_upload($image);
        $image = $uploaded;
    }
    $active = isset($_POST['is_active']) ? 1 : 0;
    $featured = isset($_POST['is_featured']) ? 1 : 0;
    $sort = money_input($_POST['sort_order'] ?? 0);
    $desc = mb_substr(trim((string) ($_POST['description'] ?? '')), 0, 1000);
    if ($id && $existing) {
        q('UPDATE categories SET name=?, slug=?, description=?, image=?, sort_order=?, is_active=?, is_featured=? WHERE id=?', [$name, $slug, $desc, $image, $sort, $active, $featured, $id]);
    } else {
        q('INSERT INTO categories (name, slug, description, image, sort_order, is_active, is_featured, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [$name, $slug, $desc, $image, $sort, $active, $featured, now()]);
    }
    flash('success', 'دسته‌بندی ذخیره شد.');
    redirect('admin/categories');
}

function handle_admin_brands(): void
{
    require_staff();
    $edit = !empty($_GET['id']) ? one('SELECT * FROM brands WHERE id = ?', [(int) $_GET['id']]) : null;
    view('admin/brands', [
        'title' => 'برندها',
        'robots' => 'noindex',
        '_layout' => 'admin/layout',
        'panel' => 'admin',
        'brands' => all_rows('SELECT * FROM brands ORDER BY sort_order, name'),
        'edit' => $edit,
    ]);
}

function handle_admin_brand_save(): void
{
    require_staff();
    $id = (int) ($_POST['id'] ?? 0);
    if (($_POST['do'] ?? '') === 'delete') {
        $used = one('SELECT id FROM products WHERE brand_id = ? LIMIT 1', [$id]);
        if ($used) {
            throw new RuntimeException('این برند روی محصولات استفاده شده و قابل حذف نیست.');
        }
        $row = one('SELECT logo FROM brands WHERE id = ?', [$id]);
        q('DELETE FROM brands WHERE id = ?', [$id]);
        if ($row) {
            delete_upload($row['logo']);
        }
        flash('success', 'برند حذف شد.');
        redirect('admin/brands');
    }
    $name = trim((string) ($_POST['name'] ?? ''));
    if (mb_strlen($name) < 1) {
        throw new RuntimeException('نام برند لازم است.');
    }
    $slug = slugify(trim((string) ($_POST['slug'] ?? '')) ?: $name);
    $dup = one('SELECT id FROM brands WHERE (slug = ? OR name = ?) AND id <> ?', [$slug, $name, $id]);
    if ($dup) {
        throw new RuntimeException('برند یا اسلاگ تکراری است.');
    }
    $website = trim((string) ($_POST['website'] ?? ''));
    if ($website !== '' && !preg_match('#^https?://#i', $website)) {
        throw new RuntimeException('آدرس وب‌سایت باید با http شروع شود.');
    }
    $existing = $id ? one('SELECT * FROM brands WHERE id = ?', [$id]) : null;
    $logo = (string) ($existing['logo'] ?? '');
    $uploaded = store_upload('logo', 'brands');
    if ($uploaded) {
        delete_upload($logo);
        $logo = $uploaded;
    }
    $desc = mb_substr(trim((string) ($_POST['description'] ?? '')), 0, 1000);
    $sort = money_input($_POST['sort_order'] ?? 0);
    $active = isset($_POST['is_active']) ? 1 : 0;
    $featured = isset($_POST['is_featured']) ? 1 : 0;
    if ($id && $existing) {
        q('UPDATE brands SET name=?, slug=?, description=?, logo=?, website=?, sort_order=?, is_active=?, is_featured=? WHERE id=?', [$name, $slug, $desc, $logo, $website, $sort, $active, $featured, $id]);
    } else {
        q('INSERT INTO brands (name, slug, description, logo, website, sort_order, is_active, is_featured, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [$name, $slug, $desc, $logo, $website, $sort, $active, $featured, now()]);
    }
    flash('success', 'برند ذخیره شد.');
    redirect('admin/brands');
}

function handle_admin_orders(): void
{
    require_staff();
    $status = (string) ($_GET['status'] ?? '');
    $q = trim((string) ($_GET['q'] ?? ''));
    $where = [];
    $params = [];
    if (isset(order_status_options()[$status])) {
        $where[] = 'order_status = ?';
        $params[] = $status;
    }
    if ($q !== '') {
        $where[] = '(order_number LIKE ? ESCAPE \'\\\' OR name LIKE ? ESCAPE \'\\\' OR phone LIKE ? ESCAPE \'\\\')';
        $like = like_value($q);
        array_push($params, $like, $like, $like);
    }
    $sql = 'SELECT * FROM orders' . ($where ? ' WHERE ' . implode(' AND ', $where) : '') . ' ORDER BY id DESC LIMIT 200';
    view('admin/orders', [
        'title' => 'سفارش‌های خرده',
        'robots' => 'noindex',
        '_layout' => 'admin/layout',
        'panel' => 'admin',
        'orders' => all_rows($sql, $params),
        'status' => $status,
        'q' => $q,
    ]);
}

function handle_admin_order(): void
{
    require_staff();
    $id = (int) ($_GET['id'] ?? 0);
    $order = one('SELECT * FROM orders WHERE id = ?', [$id]);
    if (!$order) {
        abort_404();
    }
    view('admin/order', [
        'title' => $order['order_number'],
        'robots' => 'noindex',
        '_layout' => 'admin/layout',
        'panel' => 'admin',
        'order' => $order,
        'items' => all_rows('SELECT * FROM order_items WHERE order_id = ?', [$id]),
    ]);
}

function handle_admin_order_status(): void
{
    require_staff();
    $id = (int) ($_POST['id'] ?? 0);
    set_order_status($id, (string) ($_POST['order_status'] ?? ''), trim((string) ($_POST['admin_note'] ?? '')), (string) ($_POST['payment_status'] ?? ''));
    flash('success', 'وضعیت سفارش ذخیره شد.');
    redirect('admin/order', ['id' => $id]);
}

function handle_admin_orders_export(): void
{
    require_staff();
    $rows = all_rows('SELECT * FROM orders ORDER BY id DESC LIMIT 1000');
    $grouped = [];
    foreach (all_rows('SELECT order_id, product_name, quantity FROM order_items') as $item) {
        $grouped[(int) $item['order_id']][] = $item['product_name'] . ' x' . $item['quantity'];
    }
    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="novin-orders.csv"');
    echo "\xEF\xBB\xBF";
    $out = fopen('php://output', 'w');
    fputcsv($out, ['order_number', 'date', 'name', 'phone', 'status', 'payment', 'total', 'items']);
    foreach ($rows as $row) {
        fputcsv($out, [
            $row['order_number'],
            $row['created_at'],
            $row['name'],
            $row['phone'],
            order_status_label($row['order_status']),
            payment_method_label($row['payment_method']),
            $row['total_amount'],
            implode(' | ', $grouped[(int) $row['id']] ?? []),
        ]);
    }
    fclose($out);
    exit;
}

function handle_admin_wholesale(): void
{
    require_staff();
    $id = (int) ($_GET['id'] ?? 0);
    $current = $id ? one('SELECT * FROM wholesale_requests WHERE id = ?', [$id]) : null;
    view('admin/wholesale', [
        'title' => 'درخواست‌های عمده',
        'robots' => 'noindex',
        '_layout' => 'admin/layout',
        'panel' => 'admin',
        'requests' => all_rows('SELECT * FROM wholesale_requests ORDER BY id DESC LIMIT 200'),
        'current' => $current,
        'items' => $current ? all_rows('SELECT * FROM wholesale_items WHERE request_id = ?', [(int) $current['id']]) : [],
    ]);
}

function handle_admin_wholesale_status(): void
{
    require_staff();
    $id = (int) ($_POST['id'] ?? 0);
    $status = (string) ($_POST['status'] ?? '');
    if (!isset(wholesale_status_options()[$status])) {
        throw new RuntimeException('وضعیت نامعتبر است.');
    }
    q('UPDATE wholesale_requests SET status = ?, admin_note = ?, updated_at = ? WHERE id = ?', [
        $status,
        trim((string) ($_POST['admin_note'] ?? '')),
        now(),
        $id,
    ]);
    flash('success', 'وضعیت درخواست عمده ذخیره شد.');
    redirect('admin/wholesale', ['id' => $id]);
}

function handle_admin_users(): void
{
    require_manager();
    $edit = !empty($_GET['id']) ? one('SELECT * FROM users WHERE id = ?', [(int) $_GET['id']]) : null;
    $q = trim((string) ($_GET['q'] ?? ''));
    $params = [];
    $sql = 'SELECT * FROM users';
    if ($q !== '') {
        $sql .= " WHERE name LIKE ? ESCAPE '\\' OR phone LIKE ? ESCAPE '\\'";
        $like = like_value($q);
        $params = [$like, $like];
    }
    $sql .= ' ORDER BY id DESC LIMIT 200';
    view('admin/users', [
        'title' => 'کاربران',
        'robots' => 'noindex',
        '_layout' => 'admin/layout',
        'panel' => 'admin',
        'users' => all_rows($sql, $params),
        'edit' => $edit,
        'q' => $q,
    ]);
}

function handle_admin_user_save(): void
{
    $me = require_manager();
    $id = (int) ($_POST['id'] ?? 0);
    $name = trim((string) ($_POST['name'] ?? ''));
    $phone = normalize_phone((string) ($_POST['phone'] ?? ''));
    $role = (string) ($_POST['role'] ?? 'customer');
    if (!in_array($role, ['manager', 'admin', 'visitor', 'customer'], true)) {
        $role = 'customer';
    }
    if (mb_strlen($name) < 2 || !is_phone($phone)) {
        throw new RuntimeException('نام و شماره معتبر وارد کنید.');
    }
    $active = isset($_POST['is_active']) ? 1 : 0;
    $approved = isset($_POST['is_wholesale_approved']) ? 1 : 0;
    if ($id === (int) $me['id'] && ($role !== 'manager' || !$active)) {
        throw new RuntimeException('نمی‌توانید نقش یا وضعیت خودتان را طوری تغییر دهید که از مدیریت خارج شوید.');
    }
    $dup = one('SELECT id FROM users WHERE phone = ? AND id <> ?', [$phone, $id]);
    if ($dup) {
        throw new RuntimeException('این شماره قبلاً ثبت شده است.');
    }
    $type = (string) ($_POST['customer_type'] ?? 'retail');
    if (!in_array($type, ['retail', 'wholesale', 'both'], true)) {
        $type = 'retail';
    }
    $password = (string) ($_POST['password'] ?? '');
    if ($id) {
        if ($password !== '' && strlen($password) < 6) {
            throw new RuntimeException('رمز جدید حداقل ۶ کاراکتر باشد.');
        }
        if ($password !== '') {
            q('UPDATE users SET name=?, phone=?, role=?, address=?, city=?, customer_type=?, is_active=?, is_wholesale_approved=?, notes=?, password_hash=?, updated_at=? WHERE id=?', [
                $name, $phone, $role, trim((string) ($_POST['address'] ?? '')), trim((string) ($_POST['city'] ?? '')), $type, $active, $approved, trim((string) ($_POST['notes'] ?? '')), password_hash($password, PASSWORD_DEFAULT), now(), $id,
            ]);
        } else {
            q('UPDATE users SET name=?, phone=?, role=?, address=?, city=?, customer_type=?, is_active=?, is_wholesale_approved=?, notes=?, updated_at=? WHERE id=?', [
                $name, $phone, $role, trim((string) ($_POST['address'] ?? '')), trim((string) ($_POST['city'] ?? '')), $type, $active, $approved, trim((string) ($_POST['notes'] ?? '')), now(), $id,
            ]);
        }
    } else {
        if (strlen($password) < 6) {
            throw new RuntimeException('برای کاربر جدید رمز حداقل ۶ کاراکتر لازم است.');
        }
        create_user(db(), [
            'name' => $name,
            'phone' => $phone,
            'password' => $password,
            'role' => $role,
            'address' => $_POST['address'] ?? '',
            'city' => $_POST['city'] ?? '',
            'customer_type' => $type,
            'is_active' => $active,
            'is_wholesale_approved' => $approved,
            'notes' => $_POST['notes'] ?? '',
            'created_by' => (int) $me['id'],
        ]);
    }
    flash('success', 'کاربر ذخیره شد.');
    redirect('admin/users');
}

function handle_admin_messages(): void
{
    require_staff();
    view('admin/messages', [
        'title' => 'پیام‌ها',
        'robots' => 'noindex',
        '_layout' => 'admin/layout',
        'panel' => 'admin',
        'messages' => all_rows('SELECT * FROM messages ORDER BY id DESC LIMIT 200'),
    ]);
}

function handle_admin_message(): void
{
    require_staff();
    $id = (int) ($_POST['id'] ?? 0);
    if (($_POST['do'] ?? '') === 'delete') {
        q('DELETE FROM messages WHERE id = ?', [$id]);
    } else {
        q('UPDATE messages SET is_read = 1 WHERE id = ?', [$id]);
    }
    redirect('admin/messages');
}

function handle_admin_settings(): void
{
    require_manager();
    view('admin/settings', [
        'title' => 'تنظیمات',
        'robots' => 'noindex',
        '_layout' => 'admin/layout',
        'panel' => 'admin',
    ]);
}

function handle_admin_settings_save(): void
{
    require_manager();
    $keys = [
        'site_name', 'site_slogan', 'phone_mobile', 'phone_fixed', 'address', 'hours', 'whatsapp', 'site_url',
        'zarinpal_merchant', 'card_number', 'card_owner', 'card_bank', 'commission_percent',
    ];
    foreach ($keys as $key) {
        $value = trim((string) ($_POST[$key] ?? ''));
        if ($key === 'site_url' && $value !== '' && !preg_match('#^https?://#i', $value)) {
            throw new RuntimeException('آدرس سایت باید با http:// یا https:// شروع شود.');
        }
        if ($key === 'commission_percent') {
            $value = (string) max(0, min(100, (int) money_input($value)));
        }
        set_setting($key, $value);
    }
    set_setting('zarinpal_sandbox', isset($_POST['zarinpal_sandbox']) ? '1' : '0');
    set_setting('pay_online', isset($_POST['pay_online']) ? '1' : '0');
    set_setting('pay_cod', isset($_POST['pay_cod']) ? '1' : '0');
    set_setting('pay_card', isset($_POST['pay_card']) ? '1' : '0');
    set_setting('wholesale_open', isset($_POST['wholesale_open']) ? '1' : '0');
    flash('success', 'تنظیمات ذخیره شد.');
    redirect('admin/settings');
}

function handle_admin_commissions(): void
{
    require_manager();
    $percent = (float) setting('commission_percent', '2');
    $visitors = all_rows("SELECT u.id, u.name, u.phone,
            COUNT(o.id) AS orders_count,
            COALESCE(SUM(CASE WHEN o.order_status NOT IN ('CANCELLED','PENDING') THEN o.total_amount ELSE 0 END), 0) AS sales,
            COALESCE(SUM(CASE WHEN o.commission_paid = 0 AND o.order_status NOT IN ('CANCELLED','PENDING') THEN o.total_amount ELSE 0 END), 0) AS unpaid_base
        FROM users u
        LEFT JOIN orders o ON o.visitor_id = u.id
        WHERE u.role = 'visitor'
        GROUP BY u.id, u.name, u.phone
        ORDER BY sales DESC");
    view('admin/commissions', [
        'title' => 'پورسانت ویزیتورها',
        'robots' => 'noindex',
        '_layout' => 'admin/layout',
        'panel' => 'admin',
        'visitors' => $visitors,
        'percent' => $percent,
    ]);
}

function handle_admin_commission_pay(): void
{
    require_manager();
    $id = (int) ($_POST['visitor_id'] ?? 0);
    q("UPDATE orders SET commission_paid = 1, updated_at = ? WHERE visitor_id = ? AND commission_paid = 0 AND order_status NOT IN ('CANCELLED','PENDING')", [now(), $id]);
    flash('success', 'پورسانت این ویزیتور تسویه شد.');
    redirect('admin/commissions');
}
