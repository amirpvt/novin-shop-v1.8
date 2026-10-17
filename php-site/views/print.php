<?php $siteName = setting('site_name', 'پخش نوین'); ?>
<!doctype html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= e($title ?? 'فاکتور') ?></title>
  <link rel="stylesheet" href="<?= e(asset('assets/css/app.css')) ?>">
</head>
<body>
  <main class="container page"><?= $content ?></main>
</body>
</html>
