<section class="page">
  <div class="container">
    <div class="crumbs"><a href="<?= e(url('')) ?>">خانه</a> / تماس با ما</div>
    <div class="band">
      <h1 class="page-title">تماس با ما</h1>
      <p>برای ثبت سفارش، پیگیری خرید یا همکاری عمده با ما در ارتباط باشید.</p>
      <div class="btn-row" style="justify-content:flex-start">
        <a class="btn btn-primary" href="tel:<?= e(setting('phone_mobile')) ?>">تماس با همراه</a>
        <a class="btn btn-ghost" href="tel:<?= e(setting('phone_fixed')) ?>">تلفن ثابت</a>
        <?php if (setting('whatsapp')): ?><a class="btn btn-gold" href="https://wa.me/<?= e(setting('whatsapp')) ?>">واتساپ</a><?php endif; ?>
      </div>
    </div>
    <div class="split" style="margin-top:18px">
      <div class="panel">
        <h2>آدرس</h2>
        <p><?= e(setting('address')) ?></p>
        <p>ساعات کاری: <?= e(setting('hours')) ?></p>
      </div>
      <form class="panel stack" method="post" action="<?= e(url('contact')) ?>">
        <?= csrf_field() ?>
        <div class="hp"><input name="website" tabindex="-1" autocomplete="off"></div>
        <div class="field"><label>نام</label><input name="name" required value="<?= e(old('name')) ?>"></div>
        <div class="field"><label>تلفن</label><input name="phone" value="<?= e(old('phone')) ?>"></div>
        <div class="field"><label>موضوع</label><input name="subject" value="<?= e(old('subject', 'سفارش / همکاری')) ?>"></div>
        <div class="field"><label>پیام</label><textarea name="body" rows="4" required><?= e(old('body')) ?></textarea></div>
        <button class="btn btn-primary" type="submit">ارسال پیام</button>
      </form>
    </div>
  </div>
</section>
