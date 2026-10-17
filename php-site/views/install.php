<!doctype html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>نصب پخش نوین</title>
  <link rel="stylesheet" href="<?= e(asset('assets/css/app.css')) ?>">
</head>
<body>
  <div class="install-wrap">
    <div class="brand" style="margin-bottom:16px">
      <img src="<?= e(asset('images/logo.png')) ?>" alt="">
      <strong>نصب پخش نوین</strong>
    </div>
    <div class="panel stack">
      <p>این صفحه فقط یک بار اجرا می‌شود. قبلش در پنل هاست یک دیتابیس MySQL بسازید و کاربر را به آن وصل کنید.</p>
      <?php if (!is_file(base_dir() . '/images/logo.png')): ?>
        <div class="alert alert-error">پوشه تصاویر پیدا نشد. قبل از ادامه، محتوای public/images را داخل همین سایت کپی کنید تا فایل images/logo.png وجود داشته باشد. اگر images یک میانبر است، آن را پاک کنید و پوشه واقعی را جایگزین کنید.</div>
      <?php endif; ?>
      <?php foreach ($missing as $ext): ?>
        <div class="alert alert-error">افزونه PHP لازم فعال نیست: <?= e($ext) ?></div>
      <?php endforeach; ?>
      <?php foreach ($writable_problems as $dir): ?>
        <div class="alert alert-error">این پوشه قابل نوشتن نیست: <?= e($dir) ?></div>
      <?php endforeach; ?>
      <?php foreach ($errors as $error): ?>
        <div class="alert alert-error"><?= e($error) ?></div>
      <?php endforeach; ?>
      <form class="stack" method="post" action="<?= e(basename($_SERVER['SCRIPT_NAME'] ?? '') === 'install.php' ? (base_path() . '/install.php') : url('install')) ?>">
        <?= csrf_field() ?>
        <div class="field">
          <label>نوع دیتابیس</label>
          <select name="driver">
            <option value="mysql">MySQL / MariaDB — هاست اشتراکی</option>
            <option value="sqlite">SQLite — فقط تست روی کامپیوتر خودتان</option>
          </select>
        </div>
        <div class="form-grid two">
          <div class="field"><label>هاست دیتابیس</label><input name="db_host" value="<?= e(old('db_host', 'localhost')) ?>"></div>
          <div class="field"><label>پورت</label><input name="db_port" value="<?= e(old('db_port', '3306')) ?>"></div>
        </div>
        <div class="field"><label>نام دیتابیس</label><input name="db_name" value="<?= e(old('db_name')) ?>" placeholder="مثلا novin_shop"></div>
        <div class="form-grid two">
          <div class="field"><label>کاربر دیتابیس</label><input name="db_user" value="<?= e(old('db_user')) ?>"></div>
          <div class="field"><label>رمز دیتابیس</label><input type="password" name="db_pass" value=""></div>
        </div>
        <p class="help">اگر اتصال با localhost خطا داد، 127.0.0.1 را امتحان کنید. رمز دیتابیس را در چت یا جای عمومی نفرستید.</p>
        <div class="field"><label>آدرس سایت</label><input name="site_url" value="<?= e(old('site_url', $site_url)) ?>"></div>
        <hr>
        <div class="field"><label>نام مدیر</label><input name="admin_name" required value="<?= e(old('admin_name')) ?>"></div>
        <div class="field"><label>موبایل مدیر</label><input name="admin_phone" required placeholder="0912..." value="<?= e(old('admin_phone')) ?>"></div>
        <div class="form-grid two">
          <div class="field"><label>رمز مدیر</label><input type="password" name="admin_password" required minlength="8"></div>
          <div class="field"><label>تکرار رمز</label><input type="password" name="admin_password_confirm" required minlength="8"></div>
        </div>
        <button class="btn btn-primary" type="submit">ساخت فروشگاه</button>
      </form>
    </div>
  </div>
</body>
</html>
