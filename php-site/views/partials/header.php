<?php
$siteName = setting('site_name', 'پخش نوین');
$user = current_user();
$display = $user['name'] ?? '';
$initial = $display !== '' ? mb_substr($display, 0, 1) : 'ن';
?>
<header class="site-header">
  <div class="topbar">
    <div class="container">
      <div><span class="gold">ارسال سریع</span> · <span class="green">تضمین تازگی</span></div>
      <div>
        <span class="muted-top">ساعات کاری: <?= e(setting('hours', '9 تا 21')) ?></span>
        · <a href="tel:<?= e(setting('phone_mobile')) ?>"><?= e(setting('phone_mobile')) ?></a>
      </div>
    </div>
  </div>
  <div class="container">
    <input class="nav-toggle" id="nav-toggle" type="checkbox">
    <div class="nav">
      <a class="brand" href="<?= e(url('')) ?>">
        <img src="<?= e(asset('images/logo.png')) ?>" alt="<?= e($siteName) ?>">
        <span>
          <strong>پخش <span>نوین</span></strong>
          <small>توزیع تخصصی</small>
        </span>
      </a>
      <form class="search" action="<?= e(url('shop')) ?>" method="get">
        <button type="submit" aria-label="جستجو">🔍</button>
        <input type="search" name="q" value="<?= e($_GET['q'] ?? '') ?>" placeholder="جستجوی سوسیس، کالباس...">
      </form>
      <div class="nav-actions">
        <details class="account">
          <summary>
            <span class="avatar"><?= e($initial) ?></span>
            <span class="tiny"><?= $user ? e($display) : 'ورود' ?></span>
          </summary>
          <div class="account-menu">
            <?php if ($user): ?>
              <div class="account-head">
                <strong><?= e($display) ?></strong>
                <div class="num"><?= e($user['phone']) ?></div>
                <span class="pill"><?= e(role_label($user['role'])) ?></span>
              </div>
              <a href="<?= e(url('account')) ?>">ویرایش اطلاعات</a>
              <a href="<?= e(url('orders')) ?>">سفارش‌های من</a>
              <?php if (in_array($user['role'], ['manager', 'admin'], true)): ?>
                <a href="<?= e(url('admin')) ?>">پنل مدیریت</a>
              <?php endif; ?>
              <?php if ($user['role'] === 'visitor'): ?>
                <a href="<?= e(url('visitor')) ?>">پنل ویزیتور</a>
              <?php endif; ?>
              <a href="<?= e(url('cart')) ?>">سبد خرید</a>
              <form method="post" action="<?= e(url('logout')) ?>"><?= csrf_field() ?>
                <button type="submit">خروج از حساب</button>
              </form>
            <?php else: ?>
              <a href="<?= e(url('login')) ?>">ورود</a>
              <a href="<?= e(url('register')) ?>">ثبت‌نام</a>
            <?php endif; ?>
          </div>
        </details>
        <a class="icon-btn dark" href="<?= e(url('cart')) ?>" aria-label="سبد خرید">🛒
          <?php if (cart_count() > 0): ?><span class="cart-badge"><?= (int) cart_count() ?></span><?php endif; ?>
        </a>
        <label class="burger" for="nav-toggle" aria-label="منو">☰</label>
        <a class="btn btn-primary btn-sm" href="<?= e(url('wholesale')) ?>">ثبت عمده</a>
      </div>
    </div>
    <nav class="nav-links" aria-label="منوی اصلی">
      <a class="<?= nav_active(['/']) ?>" href="<?= e(url('')) ?>">خانه</a>
      <a class="<?= nav_active(['/shop', '/product/*']) ?>" href="<?= e(url('shop')) ?>">فروشگاه</a>
      <a class="<?= nav_active(['/wholesale']) ?>" href="<?= e(url('wholesale')) ?>">سفارش عمده</a>
      <a class="<?= nav_active(['/about']) ?>" href="<?= e(url('about')) ?>">درباره ما</a>
      <a class="<?= nav_active(['/contact']) ?>" href="<?= e(url('contact')) ?>">تماس با ما</a>
      <a class="<?= nav_active(['/track']) ?>" href="<?= e(url('track')) ?>">پیگیری</a>
    </nav>
    <div class="drawer">
      <form class="search" style="display:block;max-width:none;margin-bottom:8px" action="<?= e(url('shop')) ?>" method="get">
        <input type="search" name="q" placeholder="جستجو در فروشگاه">
      </form>
      <a href="<?= e(url('')) ?>">خانه</a>
      <a href="<?= e(url('shop')) ?>">فروشگاه</a>
      <a href="<?= e(url('wholesale')) ?>">سفارش عمده</a>
      <a href="<?= e(url('about')) ?>">درباره ما</a>
      <a href="<?= e(url('contact')) ?>">تماس با ما</a>
      <a href="<?= e(url('track')) ?>">پیگیری سفارش</a>
      <?php if ($user): ?>
        <a href="<?= e(url('account')) ?>">حساب کاربری</a>
        <a href="<?= e(url('orders')) ?>">سفارش‌های من</a>
        <?php if (in_array($user['role'], ['manager', 'admin'], true)): ?><a href="<?= e(url('admin')) ?>">پنل مدیریت</a><?php endif; ?>
        <?php if ($user['role'] === 'visitor'): ?><a href="<?= e(url('visitor')) ?>">پنل ویزیتور</a><?php endif; ?>
        <form method="post" action="<?= e(url('logout')) ?>"><?= csrf_field() ?><button class="btn btn-ghost btn-block" type="submit">خروج</button></form>
      <?php else: ?>
        <a href="<?= e(url('login')) ?>">ورود / ثبت‌نام</a>
      <?php endif; ?>
    </div>
  </div>
</header>
