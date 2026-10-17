<?php
require __DIR__ . '/app/bootstrap.php';
require __DIR__ . '/app/handlers.php';

try {
    dispatch();
} catch (RuntimeException $e) {
    app_log($e->getMessage());
    flash('error', $e->getMessage());
    remember_input();
    $back = (string) ($_POST['back'] ?? '');
    if ($back !== '') {
        redirect_back($back);
    }
    $path = function_exists('request_path') ? request_path() : '/';
    $fallback = [
        '/checkout' => 'checkout',
        '/login' => 'login',
        '/register' => 'register',
        '/contact' => 'contact',
        '/track' => 'track',
        '/account' => 'account',
        '/cart/add' => 'shop',
        '/cart/update' => 'cart',
        '/wholesale/add' => 'wholesale',
        '/wholesale/submit' => 'wholesale',
        '/admin/product' => 'admin/product',
        '/admin/categories' => 'admin/categories',
        '/admin/brands' => 'admin/brands',
        '/admin/user' => 'admin/users',
        '/admin/settings' => 'admin/settings',
        '/visitor/customer' => 'visitor',
        '/visitor/order' => 'visitor',
        '/visitor/draft' => 'visitor',
    ][$path] ?? '';
    if ($path === '/admin/product') {
        redirect('admin/product', ['id' => (int) ($_POST['id'] ?? 0)]);
    }
    redirect($fallback);
} catch (Throwable $e) {
    handle_exception($e);
}
