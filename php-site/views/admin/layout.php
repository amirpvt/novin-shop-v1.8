<?php
$siteName = setting('site_name', 'پخش نوین');
$user = current_user();
$panel = $panel ?? 'admin';
$items = $panel === 'visitor'
  ? [['visitor', 'پنل ویزیتور'], ['orders', 'سفارش‌های من']]
  : [
      ['admin', 'داشبورد'],
      ['admin/products', 'محصولات'],
      ['admin/categories', 'دسته‌ها'],
      ['admin/brands', 'برندها'],
      ['admin/orders', 'سفارش خرده'],
      ['admin/wholesale', 'سفارش عمده'],
      ['admin/messages', 'پیام‌ها'],
    ];
if ($user && $panel === 'visitor' && in_array($user['role'], ['manager', 'admin'], true)) {
    $items[] = ['admin', 'بازگشت به مدیریت'];
}
if ($user && $user['role'] === 'manager' && $panel !== 'visitor') {
    $items[] = ['admin/users', 'کاربران'];
    $items[] = ['admin/commissions', 'پورسانت'];
    $items[] = ['admin/settings', 'تنظیمات'];
}
?>
<!doctype html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= e(($title ?? 'پنل') . ' | ' . $siteName) ?></title>
  <meta name="robots" content="noindex">
  <link rel="stylesheet" href="<?= e(asset('assets/css/app.css')) ?>">
</head>
<body>
  <div class="admin-shell">
    <aside class="side">
      <a class="brand" href="<?= e(url('')) ?>">
        <img src="<?= e(asset('images/logo.png')) ?>" alt="">
        <strong><?= e($siteName) ?></strong>
      </a>
      <div class="tiny" style="margin:8px 12px 14px"><?= e($user['name'] ?? '') ?> · <?= e(role_label($user['role'] ?? '')) ?></div>
      <?php foreach ($items as $item): ?>
        <a class="<?= nav_active(['/' . $item[0]]) ?>" href="<?= e(url($item[0])) ?>"><?= e($item[1]) ?></a>
      <?php endforeach; ?>
      <a href="<?= e(url('')) ?>">مشاهده سایت</a>
      <form method="post" action="<?= e(url('logout')) ?>"><?= csrf_field() ?><button class="btn btn-ghost btn-block" style="margin-top:12px" type="submit">خروج</button></form>
    </aside>
    <div class="admin-main">
      <?php foreach (pull_flashes() as $flash): ?>
        <div class="alert alert-<?= $flash['type'] === 'error' ? 'error' : 'success' ?>"><?= e($flash['message']) ?></div>
      <?php endforeach; ?>
      <?php if (setting('zarinpal_sandbox') === '1' && setting('pay_online') === '1'): ?>
        <div class="alert alert-info">درگاه زرین‌پال روی حالت آزمایشی است. برای دریافت پول واقعی، مرچنت اصلی را وارد و حالت آزمایشی را خاموش کنید.</div>
      <?php endif; ?>
      <?= $content ?>
    </div>
  </div>
  <script src="<?= e(asset('assets/js/app.js')) ?>"></script>
</body>
</html>
