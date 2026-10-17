<footer class="footer">
  <div class="container footer-grid">
    <div>
      <div class="brand">
        <img src="<?= e(asset('images/logo.png')) ?>" alt="">
        <strong style="color:#fff"><?= e(setting('site_name')) ?></strong>
      </div>
      <p><?= e(setting('site_slogan')) ?></p>
    </div>
    <div>
      <h3>دسترسی سریع</h3>
      <div><a href="<?= e(url('shop')) ?>">فروشگاه</a></div>
      <div><a href="<?= e(url('wholesale')) ?>">سفارش عمده</a></div>
      <div><a href="<?= e(url('about')) ?>">درباره ما</a></div>
      <div><a href="<?= e(url('contact')) ?>">تماس با ما</a></div>
      <div><a href="<?= e(url('track')) ?>">پیگیری سفارش</a></div>
    </div>
    <div>
      <h3>اطلاعات تماس</h3>
      <p><?= e(setting('address')) ?></p>
      <p>تلفن ثابت: <a class="num" href="tel:<?= e(setting('phone_fixed')) ?>"><?= e(setting('phone_fixed')) ?></a></p>
      <p>همراه: <a class="num" href="tel:<?= e(setting('phone_mobile')) ?>"><?= e(setting('phone_mobile')) ?></a></p>
    </div>
  </div>
  <div class="container legal">
    <span>© <?= date('Y') ?> <?= e(setting('site_name')) ?> — تمامی حقوق محفوظ است.</span>
    <span>طراح سایت: <?= e(setting('designer_name')) ?> | <a class="num" href="tel:<?= e(setting('designer_phone')) ?>"><?= e(setting('designer_phone')) ?></a></span>
  </div>
</footer>
