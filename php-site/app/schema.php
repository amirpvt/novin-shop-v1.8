<?php

function migrate(PDO $pdo, string $driver): void
{
    $id = $driver === 'sqlite'
        ? 'INTEGER PRIMARY KEY AUTOINCREMENT'
        : 'INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY';
    $engine = $driver === 'mysql' ? ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' : '';
    $int = $driver === 'sqlite' ? 'INTEGER' : 'INT';
    $uint = $driver === 'sqlite' ? 'INTEGER' : 'INT UNSIGNED';
    $dt = $driver === 'sqlite' ? 'TEXT' : 'DATETIME';

    $statements = [
        "CREATE TABLE IF NOT EXISTS users (
            id $id,
            name VARCHAR(150) NOT NULL,
            phone VARCHAR(20) NOT NULL,
            email VARCHAR(190) NOT NULL DEFAULT '',
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(20) NOT NULL DEFAULT 'customer',
            address TEXT,
            city VARCHAR(100) NOT NULL DEFAULT '',
            postal_code VARCHAR(20) NOT NULL DEFAULT '',
            national_id VARCHAR(20) NOT NULL DEFAULT '',
            customer_type VARCHAR(20) NOT NULL DEFAULT 'retail',
            is_active $int NOT NULL DEFAULT 1,
            is_wholesale_approved $int NOT NULL DEFAULT 0,
            notes TEXT,
            created_by $uint NULL,
            created_at $dt NOT NULL,
            updated_at $dt NOT NULL,
            UNIQUE (phone)
        )$engine",
        "CREATE TABLE IF NOT EXISTS categories (
            id $id,
            name VARCHAR(120) NOT NULL,
            slug VARCHAR(160) NOT NULL,
            description TEXT,
            image VARCHAR(255) NOT NULL DEFAULT '',
            sort_order $int NOT NULL DEFAULT 0,
            is_active $int NOT NULL DEFAULT 1,
            is_featured $int NOT NULL DEFAULT 0,
            created_at $dt NOT NULL,
            UNIQUE (slug)
        )$engine",
        "CREATE TABLE IF NOT EXISTS brands (
            id $id,
            name VARCHAR(120) NOT NULL,
            slug VARCHAR(160) NOT NULL,
            description TEXT,
            logo VARCHAR(255) NOT NULL DEFAULT '',
            website VARCHAR(255) NOT NULL DEFAULT '',
            sort_order $int NOT NULL DEFAULT 0,
            is_active $int NOT NULL DEFAULT 1,
            is_featured $int NOT NULL DEFAULT 0,
            created_at $dt NOT NULL,
            UNIQUE (slug),
            UNIQUE (name)
        )$engine",
        "CREATE TABLE IF NOT EXISTS products (
            id $id,
            category_id $uint NOT NULL,
            brand_id $uint NULL,
            sku VARCHAR(50) NOT NULL DEFAULT '',
            name VARCHAR(180) NOT NULL,
            slug VARCHAR(190) NOT NULL,
            description TEXT,
            price $int NOT NULL DEFAULT 0,
            discount_price $int NULL,
            barcode VARCHAR(50) NOT NULL DEFAULT '',
            stock $int NOT NULL DEFAULT 0,
            weight $int NOT NULL DEFAULT 0,
            unit VARCHAR(20) NOT NULL DEFAULT 'pack',
            retail_unit VARCHAR(20) NOT NULL DEFAULT 'pack',
            wholesale_unit VARCHAR(20) NOT NULL DEFAULT 'kg',
            wholesale_min_quantity $int NOT NULL DEFAULT 10,
            tag VARCHAR(20) NOT NULL DEFAULT '',
            badge VARCHAR(20) NOT NULL DEFAULT '',
            image VARCHAR(255) NOT NULL DEFAULT '',
            alt_text VARCHAR(255) NOT NULL DEFAULT '',
            status VARCHAR(20) NOT NULL DEFAULT 'published',
            is_featured $int NOT NULL DEFAULT 0,
            available $int NOT NULL DEFAULT 1,
            sort_order $int NOT NULL DEFAULT 0,
            created_at $dt NOT NULL,
            updated_at $dt NOT NULL,
            UNIQUE (slug)
        )$engine",
        "CREATE TABLE IF NOT EXISTS product_wholesale_options (
            id $id,
            product_id $uint NOT NULL,
            code VARCHAR(40) NOT NULL,
            label VARCHAR(80) NOT NULL,
            unit_price $int NOT NULL DEFAULT 0,
            is_active $int NOT NULL DEFAULT 1,
            sort_order $int NOT NULL DEFAULT 0,
            UNIQUE (product_id, code)
        )$engine",
        "CREATE TABLE IF NOT EXISTS orders (
            id $id,
            user_id $uint NULL,
            visitor_id $uint NULL,
            order_number VARCHAR(24) NOT NULL,
            public_token VARCHAR(64) NOT NULL DEFAULT '',
            name VARCHAR(150) NOT NULL,
            phone VARCHAR(20) NOT NULL,
            address VARCHAR(500) NOT NULL DEFAULT '',
            message TEXT,
            admin_note TEXT,
            order_status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
            payment_method VARCHAR(32) NOT NULL DEFAULT 'cod',
            payment_status VARCHAR(20) NOT NULL DEFAULT 'UNPAID',
            total_amount $int NOT NULL DEFAULT 0,
            transaction_id VARCHAR(64) NOT NULL DEFAULT '',
            receipt_path VARCHAR(255) NOT NULL DEFAULT '',
            stock_adjusted $int NOT NULL DEFAULT 0,
            stock_restored $int NOT NULL DEFAULT 0,
            commission_paid $int NOT NULL DEFAULT 0,
            created_at $dt NOT NULL,
            updated_at $dt NOT NULL,
            UNIQUE (order_number)
        )$engine",
        "CREATE TABLE IF NOT EXISTS order_items (
            id $id,
            order_id $uint NOT NULL,
            product_id $uint NULL,
            product_name VARCHAR(180) NOT NULL,
            unit_label VARCHAR(40) NOT NULL DEFAULT '',
            price $int NOT NULL DEFAULT 0,
            quantity $int NOT NULL DEFAULT 1
        )$engine",
        "CREATE TABLE IF NOT EXISTS wholesale_requests (
            id $id,
            user_id $uint NULL,
            visitor_id $uint NULL,
            request_number VARCHAR(24) NOT NULL,
            public_token VARCHAR(64) NOT NULL DEFAULT '',
            company_name VARCHAR(150) NOT NULL,
            contact_person VARCHAR(150) NOT NULL,
            phone VARCHAR(20) NOT NULL,
            address VARCHAR(500) NOT NULL DEFAULT '',
            description TEXT,
            admin_note TEXT,
            status VARCHAR(20) NOT NULL DEFAULT 'NEW',
            total_amount $int NOT NULL DEFAULT 0,
            created_at $dt NOT NULL,
            updated_at $dt NOT NULL,
            UNIQUE (request_number)
        )$engine",
        "CREATE TABLE IF NOT EXISTS wholesale_items (
            id $id,
            request_id $uint NOT NULL,
            product_id $uint NULL,
            product_name VARCHAR(180) NOT NULL,
            option_label VARCHAR(80) NOT NULL DEFAULT '',
            unit_label VARCHAR(40) NOT NULL DEFAULT '',
            unit_price $int NOT NULL DEFAULT 0,
            quantity $int NOT NULL DEFAULT 1,
            notes TEXT
        )$engine",
        "CREATE TABLE IF NOT EXISTS payments (
            id $id,
            kind VARCHAR(20) NOT NULL DEFAULT 'retail',
            payment_number VARCHAR(24) NOT NULL,
            user_id $uint NULL,
            amount $int NOT NULL DEFAULT 0,
            method VARCHAR(32) NOT NULL DEFAULT 'online',
            status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
            authority VARCHAR(80) NOT NULL DEFAULT '',
            transaction_id VARCHAR(64) NOT NULL DEFAULT '',
            payload TEXT,
            stock_held $int NOT NULL DEFAULT 0,
            order_id $uint NULL,
            wholesale_id $uint NULL,
            created_at $dt NOT NULL,
            updated_at $dt NOT NULL,
            UNIQUE (payment_number)
        )$engine",
        "CREATE TABLE IF NOT EXISTS messages (
            id $id,
            name VARCHAR(150) NOT NULL,
            phone VARCHAR(20) NOT NULL DEFAULT '',
            subject VARCHAR(160) NOT NULL DEFAULT '',
            body TEXT,
            is_read $int NOT NULL DEFAULT 0,
            created_at $dt NOT NULL
        )$engine",
        "CREATE TABLE IF NOT EXISTS settings (
            setting_key VARCHAR(80) NOT NULL PRIMARY KEY,
            setting_value TEXT
        )$engine",
    ];

    foreach ($statements as $sql) {
        $pdo->exec($sql);
    }

    $indexes = [
        'CREATE INDEX IF NOT EXISTS idx_products_public ON products (status, available, sort_order)',
        'CREATE INDEX IF NOT EXISTS idx_products_category ON products (category_id)',
        'CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders (phone)',
        'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (order_status, created_at)',
        'CREATE INDEX IF NOT EXISTS idx_orders_user ON orders (user_id)',
        'CREATE INDEX IF NOT EXISTS idx_wholesale_phone ON wholesale_requests (phone)',
        'CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (status, created_at)',
        'CREATE INDEX IF NOT EXISTS idx_payments_authority ON payments (authority)',
        'CREATE INDEX IF NOT EXISTS idx_users_role ON users (role)',
    ];
    foreach ($indexes as $sql) {
        try {
            $pdo->exec($sql);
        } catch (Throwable $e) {
            // MySQL 5.7 عبارت IF NOT EXISTS را برای ایندکس نمی‌شناسد.
            $plain = preg_replace('/\s+IF NOT EXISTS/i', '', $sql, 1);
            try {
                $pdo->exec($plain);
            } catch (Throwable $ignored) {
                // ایندکس تکراری مانع نصب نیست.
            }
        }
    }
}
