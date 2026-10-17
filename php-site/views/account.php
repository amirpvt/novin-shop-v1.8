<section class="page">
  <div class="container" style="max-width:680px">
    <h1 class="page-title">حساب کاربری</h1>
    <form class="panel stack" method="post" action="<?= e(url('account')) ?>">
      <?= csrf_field() ?>
      <div class="field"><label>نام</label><input name="name" required value="<?= e($account['name']) ?>"></div>
      <div class="field"><label>موبایل</label><input name="phone" required value="<?= e($account['phone']) ?>"></div>
      <div class="field"><label>شهر</label><input name="city" value="<?= e($account['city']) ?>"></div>
      <div class="field"><label>کد پستی</label><input name="postal_code" value="<?= e($account['postal_code']) ?>"></div>
      <div class="field"><label>آدرس</label><textarea name="address" rows="3"><?= e($account['address']) ?></textarea></div>
      <div class="field"><label>رمز جدید (اختیاری)</label><input type="password" name="password"></div>
      <div class="field"><label>تکرار رمز جدید</label><input type="password" name="password_confirm"></div>
      <button class="btn btn-primary" type="submit">ذخیره</button>
    </form>
  </div>
</section>
