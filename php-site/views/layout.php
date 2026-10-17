<?php
$siteName = setting('site_name', 'پخش نوین');
$pageTitle = $title ?? $siteName;
$fullTitle = (!empty($is_home) || $pageTitle === $siteName) ? $siteName . ' | توزیع عمده و خرده' : $pageTitle . ' | ' . $siteName;
$desc = $description ?? setting('site_slogan');
$og = $og_image ?? asset('images/logo.png');
$user = current_user();
?>
<!doctype html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= e($fullTitle) ?></title>
  <meta name="description" content="<?= e($desc) ?>">
  <?php if (!empty($robots)): ?><meta name="robots" content="<?= e($robots) ?>"><?php endif; ?>
  <link rel="icon" href="<?= e(asset('images/logo.png')) ?>">
  <meta property="og:title" content="<?= e($fullTitle) ?>">
  <meta property="og:description" content="<?= e($desc) ?>">
  <meta property="og:image" content="<?= e($og) ?>">
  <meta property="og:locale" content="fa_IR">
  <meta property="og:type" content="website">
  <meta name="theme-color" content="#dc2626">
  <link rel="stylesheet" href="<?= e(asset('assets/css/app.css')) ?>">
</head>
<body>
  <a class="skip" href="#main">رفتن به محتوا</a>
  <?php require base_dir() . '/views/partials/header.php'; ?>
  <?php if (!is_file(base_dir() . '/images/logo.png')): ?>
    <div class="container"><div class="alert alert-error">تصاویر سایت آپلود نشده‌اند. پوشه images باید کنار index.php باشد و فایل logo.png داخلش باشد.</div></div>
  <?php endif; ?>
  <div class="container"><?php foreach (pull_flashes() as $flash): ?>
    <div class="alert alert-<?= e($flash['type'] === 'error' ? 'error' : ($flash['type'] === 'info' ? 'info' : 'success')) ?>"><?= e($flash['message']) ?></div>
  <?php endforeach; ?></div>
  <main id="main"><?= $content ?></main>
  <?php require base_dir() . '/views/partials/footer.php'; ?>
  <a class="fab" href="tel:<?= e(setting('phone_mobile')) ?>">تماس</a>
  <script src="<?= e(asset('assets/js/app.js')) ?>"></script>
</body>
</html>
