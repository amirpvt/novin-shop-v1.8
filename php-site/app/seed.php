<?php

function default_settings(string $siteUrl = ''): array
{
    return [
        'site_name' => 'پخش سوسیس و کالباس نوین',
        'site_slogan' => 'توزیع عمده و خرده‌فروشی انواع سوسیس، کالباس و فرآورده‌های گوشتی با بهترین برندها',
        'phone_mobile' => '09300117977',
        'phone_fixed' => '02636640196',
        'address' => 'استان البرز، کرج، جاده ملارد، خیابان نیروگاه مپنا، شهرک ارم، بلوار ارم، روبروی آتشنشانی، خیابان پریسای شرقی، جنب حسینیه چهارده معصوم، پخش نوین',
        'hours' => '9 تا 21',
        'whatsapp' => '989300117977',
        'site_url' => $siteUrl,
        'zarinpal_merchant' => '',
        'zarinpal_sandbox' => '1',
        'pay_online' => '0',
        'pay_cod' => '1',
        'pay_card' => '1',
        'card_number' => '',
        'card_owner' => '',
        'card_bank' => '',
        'wholesale_open' => '1',
        'commission_percent' => '2',
        'designer_name' => 'امیرحسین تقی‌زاده',
        'designer_phone' => '09050127673',
    ];
}

function ensure_settings(PDO $pdo, string $driver, string $siteUrl = ''): void
{
    $sql = $driver === 'sqlite'
        ? 'INSERT OR IGNORE INTO settings (setting_key, setting_value) VALUES (?, ?)'
        : 'INSERT IGNORE INTO settings (setting_key, setting_value) VALUES (?, ?)';
    $st = $pdo->prepare($sql);
    foreach (default_settings($siteUrl) as $key => $value) {
        $st->execute([$key, $value]);
    }
}

function seed_catalog(PDO $pdo): void
{
    $count = (int) $pdo->query('SELECT COUNT(*) FROM categories')->fetchColumn();
    if ($count > 0) {
        return;
    }
    $now = date('Y-m-d H:i:s');
    $catSt = $pdo->prepare('INSERT INTO categories (name, slug, description, image, sort_order, is_active, is_featured, created_at) VALUES (?, ?, ?, ?, ?, 1, 1, ?)');
    $categories = [
        ['سوسیس', 'sausage', 'سوسیس آلمانی، دودی، مرغ و کوکتل', 'images/categories/sausage.jpg', 1],
        ['کالباس', 'kalbas', 'کالباس گوشت، مرغ، ژامبون و کم‌نمک', 'images/categories/calbas.jpg', 2],
        ['فرآورده های منجمد', 'frozen', 'ناگت، کتلت، برگر و سمبوسه', 'images/categories/frozen-products.jpg', 3],
        ['سس', 'sauce', 'انواع سس برای فست‌فود، رستوران و مصرف خانگی', 'images/categories/sauces.jpg', 4],
        ['ترشی، خیارشور و زیتون', 'pickles-olives', 'ترشیجات، خیارشور و زیتون مناسب سفارش‌های غذایی', 'images/categories/pickles-olives.jpg', 5],
        ['نوشیدنی ها', 'drinks', 'نوشیدنی‌های سرد و مکمل سفارش‌های غذایی', 'images/categories/drinks.jpg', 6],
        ['پنیر ها', 'cheese', 'انواع پنیر مناسب فست‌فود، رستوران و مصرف خانگی', 'images/categories/cheese.jpg', 7],
    ];
    foreach ($categories as $cat) {
        $catSt->execute([$cat[0], $cat[1], $cat[2], $cat[3], $cat[4], $now]);
    }
    $catIds = [];
    foreach ($pdo->query('SELECT id, slug FROM categories') as $row) {
        $catIds[$row['slug']] = (int) $row['id'];
    }

    $brandSt = $pdo->prepare('INSERT INTO brands (name, slug, description, logo, website, sort_order, is_active, is_featured, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)');
    $brands = [
        ['فرآورده های گوشتی گلچین', 'golchin', 'images/brands/golchin.jpg', 1, 1],
        ['202', '202', 'images/brands/202.jpg', 2, 1],
        ['لاله بناب', 'laleh-bonab', 'images/brands/laleh-bonab.jpg', 3, 1],
        ['سس 88', 'sauce88', 'images/brands/sauce88.jpg', 4, 1],
        ['شام ایرانی', 'shamirani', 'images/brands/shamirani.jpg', 5, 1],
        ['مهرام', 'mahram', 'images/brands/Mahram-Logo-1030x1030.jpg', 6, 1],
        ['تانیس', 'tanis', 'images/brands/Tanis-Logo.jpg', 7, 1],
        ['بهروز', 'behrooz', 'images/brands/Behrooz-Logo-1030x1030.jpg', 8, 1],
        ['امیدان', 'omidan', 'images/brands/Omidan-Logo.jpg', 9, 1],
        ['کوکاکولا', 'cocacola', 'images/brands/Cocacola-Logo.jpg', 10, 1],
        ['ساندیس', 'sandis', 'images/brands/Sandis-Logo.jpg', 11, 1],
        ['9595', '9595', '', 12, 0],
        ['آبعلی', 'abali', '', 13, 0],
        ['رودبار', 'rudbar', '', 14, 0],
        ['طبیعت', 'tabiat', '', 15, 0],
        ['فانتا', 'fanta', '', 16, 0],
        ['آرکا', 'arka', '', 17, 0],
        ['ممتاز', 'momtaz', '', 18, 0],
    ];
    foreach ($brands as $brand) {
        $brandSt->execute([$brand[0], $brand[1], 'نماینده پخش رسمی', $brand[2], '', $brand[3], $brand[4], $now]);
    }
    $brandIds = [];
    foreach ($pdo->query('SELECT id, slug FROM brands') as $row) {
        $brandIds[$row['slug']] = (int) $row['id'];
    }

    $productSt = $pdo->prepare('INSERT INTO products (
        category_id, brand_id, sku, name, slug, description, price, discount_price, barcode, stock, weight,
        unit, retail_unit, wholesale_unit, wholesale_min_quantity, tag, badge, image, alt_text, status,
        is_featured, available, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $optSt = $pdo->prepare('INSERT INTO product_wholesale_options (product_id, code, label, unit_price, is_active, sort_order) VALUES (?, ?, ?, ?, 1, ?)');

    $products = [
        ['پنیر پیتزای 9595', 'پنیر-پیتزای-9595', 'با کشسانی عالی و خوش طعم', 'cheese', '9595', 250000, 225000, 10, 1000, 'pack', 'pack', 'kg', 10, 'best', '', 'images/products/p25.jpg', 0, [['carton', 'کارتن', 180000]]],
        ['دلستر ساندیس طعم انگور', 'دلستر-ساندیس-طعم-انگور', 'بسیار خوشمزه و خنک', 'drinks', 'sandis', 75000, 67000, 10, 1000, 'piece', 'piece', 'kg', 10, 'new', 'fresh', 'images/products/p20.jpg', 0, []],
        ['دوغ آبعلی', 'دوغ-آبعلی', "دوغ یک و نیم لیتری گازدار\nخنک بنوشید", 'drinks', 'abali', 115000, 110000, 50, 1500, 'piece', 'piece', 'kg', 10, 'new', '', 'images/products/p22.jpg', 1, [['box', 'باکس', 80000], ['case', 'کیس', 69995]]],
        ['زیتون پرورده رودبار طعم شمال', 'زیتون-پرورده-رودبار-طعم-شمال', "بسیار خوش طعم و لذیذ\nطعم عالی زیتون پرورده شمال در هر لقمه", 'pickles-olives', 'rudbar', 1199999, 600000, 10, 1000, 'kg', 'kg', 'kg', 10, 'new', 'fresh', 'images/products/p19.jpg', 0, []],
        ['سس بهروز', 'سس-بهروز', 'بسیار خوش‌مزه، مناسب انواع فست‌فود و غذای سرد و گرم', 'sauce', 'behrooz', 278000, 247500, 10, 1000, 'piece', 'piece', 'kg', 10, '', '', 'images/products/p12.jpg', 0, []],
        ['سس مایونز بزرگ مهرام', 'سس-مایونز-بزرگ-مهرام', 'بسیار خوش‌مزه', 'sauce', 'mahram', 260000, 242300, 10, 1000, 'piece', 'piece', 'kg', 10, '', '', 'images/products/p13.jpg', 1, []],
        ['سوسیس آلمانی 40 درصد 202', 'سوسیس-آلمانی-40-202', 'سوسیس 40 درصد برند 202، خوشمزه و لذیذ', 'sausage', '202', 280000, 230000, 10, 1000, 'pack', 'pack', 'kg', 10, '', '', 'images/products/german-sausage-40-202.jpg', 1, []],
        ['سوسیس آلمانی 202', 'سوسیس-آلمانی-202', 'سوسیس با کیفیت از برند معتبر', 'sausage', '202', 350000, 325000, 10, 1000, 'kg', 'kg', 'kg', 10, 'best', '', 'images/products/german-sausage-202.jpg', 1, []],
        ['کالباس پپرونی 60 درصد امیدان', 'کالباس-پپرونی-امیدان', 'کالباس پپرونی 60 درصد امیدان، وزن 1 کیلو', 'kalbas', 'omidan', 765000, 732000, 10, 1000, 'kg', 'kg', 'kg', 10, '', '', 'images/products/p15.jpg', 0, []],
        ['کالباس خشک دانمارکی آرکا', 'کالباس-خشک-دانمارکی-آرکا', "کالباس خشک حاوی 60 درصد گوشت قرمز، ساخت ایران.\nنگهداری در دمای 1 تا 4 درجه.", 'kalbas', 'arka', 500000, null, 200, 1498, 'kg', 'kg', 'kg', 10, '', '', 'images/products/p24.jpg', 0, [['carton', 'کارتن', 370000]]],
        ['کالباس خشک ممتاز 70%', 'کالباس-خشک-ممتاز-70', 'کالباس خشک ممتاز 70 درصد', 'kalbas', 'momtaz', 550000, null, 10, 1000, 'piece', 'piece', 'kg', 10, 'new', '', 'images/products/p23.jpg', 0, [['box', 'باکس', 480000], ['carton', 'کارتن', 470000], ['pack', 'بسته', 460000], ['case', 'کیس', 450000]]],
        ['کنسرو خیارشور طبیعت', 'کنسرو-خیارشور-طبیعت', "بسیار خوش‌مزه و لذیذ\nمناسب سرو در کنار انواع غذاها", 'pickles-olives', 'tabiat', 360000, 334000, 10, 1000, 'pack', 'pack', 'kg', 10, 'best', 'hot', 'images/products/p18.jpg', 0, []],
        ['ناگت مرغ 70%', 'ناگت-مرغ-70', "آماده پخت\nطعم عالی و بی‌نظیر", 'frozen', '202', 690000, null, 50, 1000, 'pack', 'pack', 'kg', 10, 'new', 'fresh', 'images/products/p21.jpg', 0, []],
        ['نوشابه خانواده زرد فانتا', 'نوشابه-خانواده-زرد-فانتا', 'نگهداری عالی، خنک بنوشید. حجم 1.5 لیتر', 'drinks', 'fanta', 120000, 110000, 10, 1500, 'piece', 'piece', 'kg', 10, '', '', 'images/products/p17.jpg', 0, []],
        ['نوشابه خانواده مشکی کوکاکولا', 'نوشابه-خانواده-مشکی-کوکاکولا', "نگهداری عالی\nخنک بنوشید", 'drinks', 'cocacola', 120000, 109998, 10, 1500, 'piece', 'piece', 'kg', 10, 'new', 'fresh', 'images/products/p16.jpg', 1, []],
        ['همبرگر 75% گوشت تانیس', 'همبرگر-75-گوشت-تانیس', 'خوش‌مزه، لذیذ و طعم دلنشین. بسته 400 گرم', 'frozen', 'tanis', 510000, 499995, 10, 400, 'pack', 'pack', 'kg', 10, 'new', '', 'images/products/p10.jpg', 1, []],
        ['همبرگر 90 درصد گوشت قرمز 202', 'همبرگر-90-گوشت-202', "طعم ماندگار\nپخت آسان. 125 گرم", 'frozen', '202', 550000, 530000, 10, 125, 'pack', 'pack', 'kg', 10, 'best', 'premium', 'images/products/p9.jpg', 1, []],
    ];

    $order = 1;
    foreach ($products as $p) {
        $productSt->execute([
            $catIds[$p[3]] ?? 0,
            $brandIds[$p[4]] ?? null,
            '',
            $p[0],
            $p[1],
            $p[2],
            (int) $p[5],
            $p[6],
            '',
            (int) $p[7],
            (int) $p[8],
            (string) $p[9],
            (string) $p[10],
            (string) $p[11],
            (int) $p[12],
            (string) $p[13],
            (string) $p[14],
            (string) $p[15],
            $p[0],
            'published',
            !empty($p[16]) ? 1 : 0,
            (int) $p[7] > 0 ? 1 : 0,
            $order,
            $now,
            $now,
        ]);
        $productId = (int) $pdo->lastInsertId();
        $optOrder = 1;
        foreach (($p[17] ?? []) as $opt) {
            $optSt->execute([$productId, $opt[0], $opt[1], $opt[2], $optOrder]);
            $optOrder++;
        }
        $order++;
    }
}
