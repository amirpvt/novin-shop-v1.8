<section class="page">
  <div class="container" style="max-width:480px">
    <div class="panel stack">
      <h1 class="page-title"><?= $mode === 'register' ? 'ثبت‌نام' : 'ورود' ?></h1>
      <form class="stack" method="post" action="<?= e(url($mode === 'register' ? 'register' : 'login')) ?>">
        <?= csrf_field() ?>
        <div class="hp"><input name="website" tabindex="-1" autocomplete="off"></div>
        <?php if ($mode === 'register'): ?>
          <div class="field"><label>نام و نام خانوادگی</label><input name="name" required value="<?= e(old('name')) ?>"></div>
        <?php endif; ?>
        <div class="field"><label>شماره موبایل</label><input name="phone" required inputmode="tel" placeholder="0912..." value="<?= e(old('phone')) ?>"></div>
        <div class="field"><label>رمز عبور</label><input type="password" name="password" required minlength="<?= $mode === 'register' ? '6' : '1' ?>"></div>
        <?php if ($mode === 'register'): ?>
          <div class="field"><label>تکرار رمز</label><input type="password" name="password_confirm" required></div>
          <div class="field"><label>آدرس</label><textarea name="address" rows="2"><?= e(old('address')) ?></textarea></div>
        <?php endif; ?>
        <button class="btn btn-primary" type="submit"><?= $mode === 'register' ? 'ساخت حساب' : 'ورود' ?></button>
      </form>
      <?php if ($mode === 'register'): ?>
        <a href="<?= e(url('login')) ?>">حساب دارید؟ ورود</a>
      <?php else: ?>
        <a href="<?= e(url('register')) ?>">حساب ندارید؟ ثبت‌نام</a>
      <?php endif; ?>
    </div>
  </div>
</section>
