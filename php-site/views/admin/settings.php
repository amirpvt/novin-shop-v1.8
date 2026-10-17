<div class="admin-top"><h1>تنظیمات فروشگاه</h1></div>
<form class="panel stack" method="post" action="<?= e(url('admin/settings')) ?>">
  <?= csrf_field() ?>
  <h2>اطلاعات تماس</h2>
  <div class="form-grid two">
    <div class="field"><label>نام سایت</label><input name="site_name" value="<?= e(setting('site_name')) ?>"></div>
    <div class="field"><label>آدرس سایت</label><input name="site_url" value="<?= e(setting('site_url')) ?>"></div>
  </div>
  <div class="field"><label>شعار</label><textarea name="site_slogan" rows="2"><?= e(setting('site_slogan')) ?></textarea></div>
  <div class="form-grid two">
    <div class="field"><label>موبایل</label><input name="phone_mobile" value="<?= e(setting('phone_mobile')) ?>"></div>
    <div class="field"><label>تلفن ثابت</label><input name="phone_fixed" value="<?= e(setting('phone_fixed')) ?>"></div>
  </div>
  <div class="field"><label>آدرس</label><textarea name="address" rows="3"><?= e(setting('address')) ?></textarea></div>
  <div class="form-grid two">
    <div class="field"><label>ساعات کاری</label><input name="hours" value="<?= e(setting('hours')) ?>"></div>
    <div class="field"><label>واتساپ بدون صفر، با ۹۸</label><input name="whatsapp" value="<?= e(setting('whatsapp')) ?>"></div>
  </div>
  <h2>پرداخت</h2>
  <label><input type="checkbox" name="pay_cod" value="1" <?= checked(setting('pay_cod') === '1') ?>> پرداخت در محل</label>
  <label><input type="checkbox" name="pay_card" value="1" <?= checked(setting('pay_card') === '1') ?>> کارت به کارت</label>
  <div class="form-grid two">
    <div class="field"><label>شماره کارت</label><input name="card_number" value="<?= e(setting('card_number')) ?>"></div>
    <div class="field"><label>صاحب کارت</label><input name="card_owner" value="<?= e(setting('card_owner')) ?>"></div>
  </div>
  <div class="field"><label>بانک</label><input name="card_bank" value="<?= e(setting('card_bank')) ?>"></div>
  <label><input type="checkbox" name="pay_online" value="1" <?= checked(setting('pay_online') === '1') ?>> پرداخت آنلاین زرین‌پال</label>
  <label><input type="checkbox" name="zarinpal_sandbox" value="1" <?= checked(setting('zarinpal_sandbox') === '1') ?>> حالت آزمایشی زرین‌پال</label>
  <div class="field"><label>مرچنت زرین‌پال</label><input name="zarinpal_merchant" value="<?= e(setting('zarinpal_merchant')) ?>" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"></div>
  <h2>عمده و ویزیتور</h2>
  <label><input type="checkbox" name="wholesale_open" value="1" <?= checked(setting('wholesale_open') === '1') ?>> ثبت عمده برای همه باز باشد</label>
  <div class="field"><label>درصد پورسانت ویزیتور</label><input name="commission_percent" value="<?= e(setting('commission_percent')) ?>"></div>
  <button class="btn btn-primary" type="submit">ذخیره تنظیمات</button>
</form>
